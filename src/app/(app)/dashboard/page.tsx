"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { CollectionsCard } from "@/components/collections-card"
import { OnTimeRateCard } from "@/components/on-time-rate-card"
import { Progress } from "@/components/ui/progress"
import { ReminderDialog } from "@/components/reminder-dialog"
import { RunwayChart } from "@/components/runway-chart"
import { TiltCard } from "@/components/tilt-card"
import { TodayRail } from "@/components/today-rail"
import { formatDate, formatINR } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { Invoice, Student } from "@/lib/store"
import { daysLate, deriveStatus, toIsoDate } from "@/lib/invoice-status"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

const BUCKETS: { label: string; test: (days: number) => boolean }[] = [
  { label: "0–15 days", test: (days) => days <= 15 },
  { label: "16–30 days", test: (days) => days >= 16 && days <= 30 },
  { label: "30+ days", test: (days) => days > 30 },
]

type OwedRow = {
  invoice: Invoice
  studentName: string
  parentName: string
  days: number
}

// Whole rupees for dashboard numbers. formatINR keeps paise for the detail tables.
const wholeINR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})
const formatWholeINR = (amount: number): string => wholeINR.format(amount)

// Percentage of total, 0 when total is 0 (avoids divide-by-zero).
function share(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0
}

function OwedTable({
  rows,
  showRemind,
  onRemind,
}: {
  rows: OwedRow[]
  showRemind: boolean
  onRemind: (invoiceId: string) => void
}) {
  return (
    <div className="glass overflow-x-auto rounded-2xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Student</th>
            <th scope="col" className="px-4 py-3 font-medium">Parent</th>
            <th scope="col" className="px-4 py-3 font-medium">Amount</th>
            <th scope="col" className="px-4 py-3 font-medium">Days late</th>
            <th scope="col" className="px-4 py-3 font-medium">Reminders sent</th>
            <th scope="col" className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(({ invoice, studentName, parentName, days }) => (
            <tr key={invoice.id}>
              <td className="px-4 py-3 text-foreground">{studentName}</td>
              <td className="px-4 py-3 text-muted-foreground">{parentName}</td>
              <td className="px-4 py-3 tabular-nums text-foreground">
                {formatINR(invoice.amount)}
              </td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">{days}</td>
              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                {invoice.remindersSent}
              </td>
              <td className="px-4 py-3">
                {showRemind && (
                  <Button type="button" onClick={() => onRemind(invoice.id)}>
                    Remind
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OwedCards({
  rows,
  showRemind,
  onRemind,
}: {
  rows: OwedRow[]
  showRemind: boolean
  onRemind: (invoiceId: string) => void
}) {
  return (
    <ul className="space-y-3">
      {rows.map(({ invoice, studentName, parentName, days }) => (
        <li key={invoice.id} className="glass rounded-2xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words font-medium text-foreground">{studentName}</p>
              <p className="break-words text-sm text-muted-foreground">{parentName}</p>
            </div>
            <p className="shrink-0 tabular-nums text-foreground">{formatINR(invoice.amount)}</p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-sm tabular-nums text-muted-foreground">
              {days > 0
                ? `${days} ${days === 1 ? "day" : "days"} late`
                : `Due ${formatDate(invoice.dueDate)}`}
            </p>
            {showRemind && (
              <Button type="button" onClick={() => onRemind(invoice.id)}>
                Remind
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

export default function DashboardPage() {
  // Zustand persist reads localStorage on the client only, so the server HTML
  // would not match the first client render. Wait for mount before showing data.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  const students = useStore((s) => s.students)
  const invoices = useStore((s) => s.invoices)
  const upiId = useStore((s) => s.settings.upiId)
  const [remindInvoiceId, setRemindInvoiceId] = useState<string | null>(null)

  const today = toIsoDate(new Date())
  const currentMonth = today.slice(0, 7) // "YYYY-MM"

  const studentById = useMemo(
    () => new Map<string, Student>(students.map((s) => [s.id, s])),
    [students],
  )

  const stats = useMemo(() => {
    let totalOutstanding = 0
    let overdueAmount = 0
    let collectedThisMonth = 0
    let expectedThisMonth = 0
    for (const inv of invoices) {
      if (inv.status !== "paid") totalOutstanding += inv.amount
      // "Expected this month" = unpaid invoices whose due date falls in the current month.
      if (inv.status !== "paid" && inv.dueDate.startsWith(currentMonth)) {
        expectedThisMonth += inv.amount
      }
      if (deriveStatus(inv, today) === "overdue") overdueAmount += inv.amount
      if (
        inv.status === "paid" &&
        inv.paidDate !== null &&
        inv.paidDate.startsWith(currentMonth)
      ) {
        collectedThisMonth += inv.amount
      }
    }
    return { totalOutstanding, overdueAmount, collectedThisMonth, expectedThisMonth }
  }, [invoices, today, currentMonth])

  const owedRows = useMemo(() => {
    const rows: OwedRow[] = invoices
      .filter((inv) => deriveStatus(inv, today) === "overdue")
      .map((invoice) => {
        const student = studentById.get(invoice.studentId)
        return {
          invoice,
          studentName: student?.name ?? "Unknown student",
          parentName: student?.parentName ?? "",
          days: daysLate(invoice.dueDate, today),
        }
      })
    rows.sort((a, b) => {
      if (a.days !== b.days) return b.days - a.days
      return a.studentName.localeCompare(b.studentName)
    })
    return rows
  }, [invoices, studentById, today])

  // Overdue money split into the same day buckets as the tables.
  const aging = useMemo(() => {
    const amounts = BUCKETS.map((bucket) =>
      owedRows
        .filter((row) => bucket.test(row.days))
        .reduce((sum, row) => sum + row.invoice.amount, 0),
    )
    return { amounts, total: amounts.reduce((sum, amount) => sum + amount, 0) }
  }, [owedRows])

  // Distinct parents with overdue invoices. Uses phone, falls back to parent name.
  const overdueParentCount = useMemo(() => {
    const parents = new Set<string>()
    for (const row of owedRows) {
      const student = studentById.get(row.invoice.studentId)
      const key =
        (student?.parentPhone ?? "").trim() || (student?.parentName ?? "").trim()
      if (key) parents.add(key)
    }
    return parents.size
  }, [owedRows, studentById])

  const groups = useMemo(
    () =>
      BUCKETS.map((bucket) => ({
        label: bucket.label,
        rows: owedRows.filter((row) => bucket.test(row.days)),
      })).filter((group) => group.rows.length > 0),
    [owedRows],
  )

  const upcomingRows = useMemo(() => {
    const rows: OwedRow[] = invoices
      .filter((inv) => deriveStatus(inv, today) === "due")
      .map((invoice) => {
        const student = studentById.get(invoice.studentId)
        return {
          invoice,
          studentName: student?.name ?? "Unknown student",
          parentName: student?.parentName ?? "",
          days: daysLate(invoice.dueDate, today),
        }
      })
    rows.sort((a, b) => a.invoice.dueDate.localeCompare(b.invoice.dueDate))
    return rows
  }, [invoices, studentById, today])

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === remindInvoiceId) ?? null,
    [invoices, remindInvoiceId],
  )

  if (!mounted) {
    return <p className="text-sm text-muted-foreground">Loading dashboard…</p>
  }

  return (
    <div className="space-y-8">
      <section aria-label="Overview" className="grid items-stretch gap-4 lg:grid-cols-3">
        <div className="h-full space-y-4 lg:col-span-2">
          <TiltCard className="rounded-3xl">
            <RunwayChart />
          </TiltCard>
          <div className="grid gap-4 sm:grid-cols-2">
            <OnTimeRateCard />
            <CollectionsCard />
          </div>
        </div>
        <div className="h-full">
          <TodayRail />
        </div>
      </section>

      <section aria-label="Summary" className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Total outstanding</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            <AnimatedNumber value={stats.totalOutstanding} format={formatWholeINR} />
          </p>
          <p className="mt-4 text-xs text-muted-foreground">Overdue, by days late</p>
          <div
            aria-hidden="true"
            className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full bg-[var(--amber)]/40"
              style={{ width: `${share(aging.amounts[0], aging.total)}%` }}
            />
            <div
              className="h-full bg-[var(--amber)]"
              style={{ width: `${share(aging.amounts[1], aging.total)}%` }}
            />
            <div
              className="h-full bg-[var(--overdue)]"
              style={{ width: `${share(aging.amounts[2], aging.total)}%` }}
            />
          </div>
          <ul className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
            <li>
              <span className="block">0 to 15 days</span>
              <span className="tabular-nums text-foreground">
                {formatWholeINR(aging.amounts[0])}
              </span>
            </li>
            <li>
              <span className="block">16 to 30 days</span>
              <span className="tabular-nums text-foreground">
                {formatWholeINR(aging.amounts[1])}
              </span>
            </li>
            <li>
              <span className="block">30+ days</span>
              <span className="tabular-nums text-foreground">
                {formatWholeINR(aging.amounts[2])}
              </span>
            </li>
          </ul>
        </div>

        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Collected this month</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            <AnimatedNumber value={stats.collectedThisMonth} format={formatWholeINR} />
          </p>
          <Progress
            value={Math.min(100, share(stats.collectedThisMonth, stats.expectedThisMonth))}
            aria-label="Collected against expected this month"
            className="mt-4"
          />
          <p className="mt-2 text-sm text-muted-foreground">
            Of {formatWholeINR(stats.expectedThisMonth)} expected
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Expected this month: invoices due this month
          </p>
        </div>

        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">Overdue amount</p>
          <p className="mt-1 text-2xl font-semibold text-overdue-text">
            <AnimatedNumber value={stats.overdueAmount} format={formatWholeINR} />
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {overdueParentCount} {overdueParentCount === 1 ? "parent" : "parents"}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Who owes me</h2>

        {owedRows.length === 0 && upcomingRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unpaid invoices. Nothing is owed right now.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">{group.label}</h3>
              <div className="hidden md:block">
                <OwedTable rows={group.rows} showRemind onRemind={setRemindInvoiceId} />
              </div>
              <div className="md:hidden">
                <OwedCards rows={group.rows} showRemind onRemind={setRemindInvoiceId} />
              </div>
            </div>
          ))
        )}

        {upcomingRows.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Upcoming</h3>
            <div className="hidden md:block">
              <OwedTable rows={upcomingRows} showRemind={false} onRemind={setRemindInvoiceId} />
            </div>
            <div className="md:hidden">
              <OwedCards rows={upcomingRows} showRemind={false} onRemind={setRemindInvoiceId} />
            </div>
          </div>
        )}

        {selectedInvoice && (
          <ReminderDialog
            invoice={selectedInvoice}
            student={studentById.get(selectedInvoice.studentId)}
            upiId={upiId}
            open
            onClose={() => setRemindInvoiceId(null)}
          />
        )}
      </section>

    </div>
  )
}
