"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { PageHeader } from "@/components/page-header"
import { summarizeMonth } from "@/lib/calendar"
import { formatINR } from "@/lib/format"
import { amountDue, daysLate, toIsoDate } from "@/lib/invoice-status"
import { useStore } from "@/lib/store"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

const monthLongFormatter = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })
const monthNameFormatter = new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "UTC" })

type MonthView = { year: number; month0: number } // month0 is 0-based

const cardClass =
  "rounded-3xl border border-[#E6EBF2] bg-white p-6 shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)] dark:border-white/10 dark:bg-[#121E36]"
const focusClass =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"
const primaryButtonClass = `inline-flex h-11 items-center justify-center rounded-xl bg-[#0B2A55] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#133A72] ${focusClass}`
const secondaryButtonClass = `inline-flex h-11 items-center justify-center rounded-xl border border-[#DCE3EE] bg-white px-5 text-sm font-semibold text-[#0B2A55] transition-colors hover:bg-[#F4F7FB] dark:border-white/10 dark:bg-transparent dark:text-[#E6ECF5] ${focusClass}`

export default function ReportPage() {
  // Zustand persist reads localStorage on the client only, so the server HTML
  // would not match the first client render. Wait for mount before showing data.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  const store = useStore((s) => s)

  const today = toIsoDate(new Date())
  const todayYear = Number(today.slice(0, 4))
  const todayMonth0 = Number(today.slice(5, 7)) - 1

  const [view, setView] = useState<MonthView>(() => ({ year: todayYear, month0: todayMonth0 }))

  const prefix = `${view.year}-${String(view.month0 + 1).padStart(2, "0")}`
  const monthDate = new Date(Date.UTC(view.year, view.month0, 1))
  const monthLabel = monthLongFormatter.format(monthDate)
  const monthName = monthNameFormatter.format(monthDate)

  // Expected and received use the same rule as the calendar page (src/lib/calendar.ts).
  const summary = useMemo(
    () => summarizeMonth(store, view.year, view.month0),
    [store, view.year, view.month0],
  )
  const { expected, received } = summary
  const rate = expected > 0 ? Math.round((received / expected) * 100) : 0

  // Top 3 students with unpaid, past-due invoices in the chosen month, by amount owed.
  const lateParents = useMemo(() => {
    const students = new Map(store.students.map((s) => [s.id, s]))
    const byStudent = new Map<string, { studentId: string; owed: number; days: number }>()
    for (const invoice of store.invoices) {
      if (invoice.dueDate.slice(0, 7) !== prefix) continue
      if (invoice.status === "paid" || invoice.dueDate >= today) continue
      const owed = amountDue(invoice)
      if (owed <= 0) continue
      const days = daysLate(invoice.dueDate, today)
      const row = byStudent.get(invoice.studentId)
      if (row) {
        row.owed += owed
        row.days = Math.max(row.days, days)
      } else {
        byStudent.set(invoice.studentId, { studentId: invoice.studentId, owed, days })
      }
    }
    return [...byStudent.values()]
      .sort((a, b) => b.owed - a.owed)
      .slice(0, 3)
      .map((row) => {
        const student = students.get(row.studentId)
        return {
          studentId: row.studentId,
          studentName: student?.name ?? "Unknown student",
          parentName: student?.parentName ?? "",
          owed: Math.round(row.owed * 100) / 100,
          days: row.days,
        }
      })
  }, [store, prefix, today])

  // Bills have no paid date in the store yet, so bills paid cannot be measured.
  const billsPaid = null as number | null

  const summaryLine =
    expected === 0
      ? `No fees were due in ${monthName}.`
      : `You collected ${rate}% of fees in ${monthName}.`
  const shareText = `${summaryLine} Expected ${formatINR(expected)}, received ${formatINR(received)}.`
  const shareHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`

  function shiftMonth(delta: number) {
    setView((v) => {
      // Date.UTC handles month overflow, e.g. month -1 becomes December of the previous year.
      const d = new Date(Date.UTC(v.year, v.month0 + delta, 1))
      return { year: d.getUTCFullYear(), month0: d.getUTCMonth() }
    })
  }

  if (!mounted) {
    return <p className={`${cardClass} text-center text-[#5E6E87] dark:text-[#93A3BC]`}>Loading report…</p>
  }

  const circumference = 2 * Math.PI * 52

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Report"
        description="A monthly view of fees collected, late payments, and profit."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
            className={`${secondaryButtonClass} px-4`}
          >
            Previous
          </button>
          <p className="min-w-[10rem] text-center text-base font-bold text-[#0A1F3D] tabular-nums dark:text-[#E6ECF5]">
            {monthLabel}
          </p>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
            className={`${secondaryButtonClass} px-4`}
          >
            Next
          </button>
        </div>
      </div>

      <section className={`${cardClass} flex flex-col items-center gap-6 sm:flex-row`} aria-labelledby="report-summary">
        <div
          role="img"
          aria-label={`Collection rate ${rate} percent`}
          className="relative size-40 shrink-0"
        >
          <svg viewBox="0 0 120 120" className="size-full" aria-hidden="true">
            <circle cx="60" cy="60" r="52" fill="none" stroke="#E6EBF2" strokeWidth="12" />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#0B2A55"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - rate / 100)}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <p className="absolute inset-0 flex items-center justify-center text-3xl font-extrabold tabular-nums text-[#0A1F3D] dark:text-[#E6ECF5]">
            {rate}%
          </p>
        </div>

        <div className="flex w-full flex-col gap-4 text-center sm:text-left">
          <div>
            <h2 id="report-summary" className="font-heading text-xl font-extrabold leading-snug text-[#0A1F3D] dark:text-[#E6ECF5]">
              {summaryLine}
            </h2>
            <p className="mt-1 text-sm text-[#5E6E87] dark:text-[#93A3BC]">Collection rate for {monthLabel}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#F4F7FB] p-3 dark:bg-white/5">
              <dt className="text-xs font-medium text-[#5E6E87] dark:text-[#93A3BC]">Expected</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums text-[#0A1F3D] dark:text-[#E6ECF5]">{formatINR(expected, { wholeRupees: true })}</dd>
            </div>
            <div className="rounded-2xl bg-[#F4F7FB] p-3 dark:bg-white/5">
              <dt className="text-xs font-medium text-[#5E6E87] dark:text-[#93A3BC]">Received</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums text-[#0A1F3D] dark:text-[#E6ECF5]">{formatINR(received, { wholeRupees: true })}</dd>
            </div>
          </dl>
          <div className="flex flex-wrap justify-center gap-3 print:hidden sm:justify-start">
            <button type="button" onClick={() => window.print()} className={secondaryButtonClass}>
              Print
            </button>
            <a
              href={shareHref}
              target="_blank"
              rel="noopener noreferrer"
              className={primaryButtonClass}
            >
              Share on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className={cardClass} aria-labelledby="late-parents-heading">
          <h2 id="late-parents-heading" className="font-heading text-base font-extrabold text-[#0A1F3D] dark:text-[#E6ECF5]">
            Top late parents
          </h2>
          {lateParents.length === 0 ? (
            <p className="mt-3 text-sm text-[#5E6E87] dark:text-[#93A3BC]">No late parents this month.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-3">
              {lateParents.map((row, index) => (
                <li key={row.studentId} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0A1F3D] dark:text-[#E6ECF5]">
                      {index + 1}. {row.parentName || row.studentName}
                    </p>
                    <p className="truncate text-xs text-[#5E6E87] dark:text-[#93A3BC]">
                      {row.studentName}, {row.days} {row.days === 1 ? "day" : "days"} late
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-[#0A1F3D] dark:text-[#E6ECF5]">
                    {formatINR(row.owed, { wholeRupees: true })}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={cardClass} aria-labelledby="bills-heading">
          <h2 id="bills-heading" className="font-heading text-base font-extrabold text-[#0A1F3D] dark:text-[#E6ECF5]">
            Bills and profit
          </h2>
          <dl className="mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-[#5E6E87] dark:text-[#93A3BC]">Bills paid</dt>
              <dd className="text-sm font-semibold text-[#0A1F3D] dark:text-[#E6ECF5]">
                {billsPaid === null ? "Not tracked yet" : formatINR(billsPaid, { wholeRupees: true })}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-sm text-[#5E6E87] dark:text-[#93A3BC]">Profit</dt>
              <dd className="text-sm font-semibold tabular-nums text-[#0A1F3D] dark:text-[#E6ECF5]">
                {billsPaid === null
                  ? "Profit needs bill payment dates"
                  : formatINR(received - billsPaid, { wholeRupees: true })}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  )
}
