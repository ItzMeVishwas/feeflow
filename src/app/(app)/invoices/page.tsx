"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { ReminderDialog } from "@/components/reminder-dialog"
import { RecordPaymentDialog } from "@/components/record-payment-dialog"
import { formatDate, formatINR, formatMonth } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { Invoice } from "@/lib/store"
import {
  amountDue,
  deriveStatus,
  isPartPaid,
  toIsoDate,
  type DisplayStatus,
} from "@/lib/invoice-status"

// "part-paid" is a filter only. It cuts across Due and Overdue.
type Filter = "all" | DisplayStatus | "part-paid"

type RowItem = { invoice: Invoice; studentName: string; status: DisplayStatus }

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "due", label: "Due" },
  { value: "overdue", label: "Overdue" },
  { value: "part-paid", label: "Part paid" },
  { value: "paid", label: "Paid" },
]

const STATUS_LABEL: Record<DisplayStatus, string> = {
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
}

// Chip colours. Idle is a soft tint, selected is solid. The label always carries the meaning.
const CHIP_CLASS: Record<Filter, { idle: string; active: string }> = {
  all: {
    idle: "bg-foreground/5 text-foreground hover:bg-foreground/10",
    active: "bg-foreground text-background",
  },
  due: {
    idle: "bg-[var(--amber)]/15 text-foreground hover:bg-[var(--amber)]/25",
    active: "bg-[var(--amber)] text-[#1A1206]",
  },
  overdue: {
    idle: "bg-[var(--coral)]/15 text-foreground hover:bg-[var(--coral)]/25",
    active: "bg-[var(--coral)] text-[#1A1206]",
  },
  "part-paid": {
    idle: "bg-[var(--amber)]/15 text-foreground hover:bg-[var(--amber)]/25",
    active: "bg-[var(--amber)] text-[#1A1206]",
  },
  paid: {
    idle: "bg-[var(--mint)]/15 text-foreground hover:bg-[var(--mint)]/25",
    active: "bg-[var(--mint)] text-[#0E1726]",
  },
}

// Status pill tints, same palette as the chips.
const PILL_CLASS: Record<DisplayStatus | "part-paid", string> = {
  paid: "bg-[var(--mint)]/20 text-foreground",
  due: "bg-[var(--amber)]/20 text-foreground",
  overdue: "bg-[var(--coral)]/20 text-foreground",
  "part-paid": "bg-[var(--amber)]/20 text-foreground",
}

const amberButtonClass =
  "bg-[var(--amber)] text-[#1A1206] hover:bg-[var(--amber)]/90 focus-visible:ring-2 focus-visible:ring-[var(--amber)]"

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

function matchesFilter(invoice: Invoice, status: DisplayStatus, filter: Filter) {
  if (filter === "all") return true
  if (filter === "part-paid") return isPartPaid(invoice)
  return status === filter
}

export default function InvoicesPage() {
  // Zustand persist reads localStorage on the client only, so the server HTML
  // would not match the first client render. Wait for mount before showing data.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  const students = useStore((s) => s.students)
  const invoices = useStore((s) => s.invoices)
  const addInvoice = useStore((s) => s.addInvoice)
  const upiId = useStore((s) => s.settings.upiId)

  const [filter, setFilter] = useState<Filter>("all")
  const [message, setMessage] = useState("")
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)

  const today = toIsoDate(new Date())
  const currentMonth = today.slice(0, 7) // "YYYY-MM"
  // "all" or a "YYYY-MM" month. Starts on the current month.
  const [month, setMonth] = useState<string>(currentMonth)

  const studentNames = useMemo(
    () => new Map(students.map((s) => [s.id, s.name])),
    [students],
  )

  const rows = useMemo(
    () =>
      invoices
        .map((invoice) => ({
          invoice,
          studentName: studentNames.get(invoice.studentId) ?? "Unknown student",
          status: deriveStatus(invoice, today),
        }))
        .sort((a, b) => {
          // Newest month first, then student name A-Z.
          if (a.invoice.month !== b.invoice.month) {
            return a.invoice.month < b.invoice.month ? 1 : -1
          }
          return a.studentName.localeCompare(b.studentName)
        }),
    [invoices, studentNames, today],
  )

  // Months that have invoices, plus the current month, newest first.
  const monthOptions = useMemo(() => {
    const months = new Set(invoices.map((i) => i.month))
    months.add(currentMonth)
    return [...months].sort().reverse()
  }, [invoices, currentMonth])

  const monthRows = useMemo(
    () => (month === "all" ? rows : rows.filter((row) => row.invoice.month === month)),
    [rows, month],
  )

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      all: monthRows.length,
      paid: 0,
      due: 0,
      overdue: 0,
      "part-paid": 0,
    }
    for (const row of monthRows) {
      c[row.status]++
      if (isPartPaid(row.invoice)) c["part-paid"]++
    }
    return c
  }, [monthRows])

  const visibleRows = monthRows.filter((row) =>
    matchesFilter(row.invoice, row.status, filter),
  )

  function handleGenerate() {
    const activeStudents = students.filter((s) => s.active)
    if (activeStudents.length === 0) {
      setMessage("No active students. Add a student and mark them active first.")
      return
    }

    // Snapshot of existing invoices, keyed by student + month. Each invoice created
    // in this loop is added to the same Set, so one click never makes duplicates.
    const existing = new Set(
      useStore.getState().invoices.map((i) => `${i.studentId}|${i.month}`),
    )

    let created = 0
    let skipped = 0
    for (const student of activeStudents) {
      const key = `${student.id}|${currentMonth}`
      if (existing.has(key)) {
        skipped++
        continue
      }
      addInvoice({
        studentId: student.id,
        amount: student.monthlyFee,
        month: currentMonth,
        dueDate: `${currentMonth}-10`, // due on the 10th of the current month
        status: "unpaid",
        paidDate: null,
        remindersSent: 0,
      })
      existing.add(key)
      created++
    }

    setMessage(
      `Created ${created} ${created === 1 ? "invoice" : "invoices"}, skipped ${skipped} that already existed.`,
    )
  }

  function renderInvoiceRow({ invoice, studentName, status }: RowItem) {
    const monthLabel = formatMonth(invoice.month)
    const due = amountDue(invoice)

    return (
      <li
        key={invoice.id}
        className="glass flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--amber)]/20 text-sm font-semibold text-foreground"
          >
            {initialsOf(studentName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{studentName}</p>
            <p className="text-sm text-muted-foreground">{monthLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-end">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="tabular-nums text-foreground">{formatINR(invoice.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount due</p>
            <p
              className={
                status === "overdue"
                  ? "font-medium tabular-nums text-[var(--coral)]"
                  : "tabular-nums text-foreground"
              }
            >
              {formatINR(due)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due date</p>
            <p className="text-foreground">{formatDate(invoice.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Reminders sent</p>
            <p className="tabular-nums text-foreground">{invoice.remindersSent}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-xl px-2.5 py-1 text-xs font-medium ${PILL_CLASS[status]}`}
            >
              {STATUS_LABEL[status]}
            </span>
            {status !== "paid" && isPartPaid(invoice) ? (
              <span
                className={`rounded-xl px-2.5 py-1 text-xs font-medium ${PILL_CLASS["part-paid"]}`}
              >
                Part paid
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status === "overdue" ? (
            <Button
              variant="outline"
              size="sm"
              aria-label={`Remind ${studentName} about the ${monthLabel} invoice`}
              onClick={() => setReminderInvoice(invoice)}
            >
              Remind
            </Button>
          ) : null}
          {status !== "paid" ? (
            <Button
              size="sm"
              className={amberButtonClass}
              aria-label={`Record payment for ${studentName}'s ${monthLabel} invoice`}
              onClick={() => {
                setPaymentInvoice(invoice)
                setPaymentOpen(true)
              }}
            >
              Record payment
            </Button>
          ) : null}
        </div>
      </li>
    )
  }

  function renderBody() {
    if (invoices.length === 0) {
      return (
        <div className="glass flex flex-col items-center gap-2 rounded-2xl p-6 text-center">
          <p className="font-medium text-foreground">No invoices yet.</p>
          <p className="text-sm text-muted-foreground">
            Generate this month&apos;s invoices to bill your students from your active students.
          </p>
        </div>
      )
    }

    if (visibleRows.length === 0) {
      const text =
        filter === "all"
          ? `No invoices for ${formatMonth(month)} yet. Generate this month's invoices to bill your students.`
          : "No invoices match this filter. Choose All to see every invoice."
      return <p className="glass rounded-2xl p-6 text-center text-muted-foreground">{text}</p>
    }

    return (
      <ul role="list" className="flex flex-col gap-3">
        {visibleRows.map(renderInvoiceRow)}
      </ul>
    )
  }

  if (!mounted) {
    return (
      <p className="glass rounded-2xl p-6 text-center text-muted-foreground">
        Loading invoices…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Invoices
          </h1>
          <p className="text-sm text-muted-foreground">
            Bill your students each month and track what is still owed.
          </p>
        </div>
        <Button className={amberButtonClass} onClick={handleGenerate}>
          Generate this month&apos;s invoices
        </Button>
      </div>

      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter invoices" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const pressed = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                aria-pressed={pressed}
                onClick={() => setFilter(f.value)}
                className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${FOCUS_RING} ${
                  pressed ? CHIP_CLASS[f.value].active : CHIP_CLASS[f.value].idle
                }`}
              >
                {f.label}{" "}
                <span className="tabular-nums">{counts[f.value]}</span>
              </button>
            )
          })}
        </div>

        <select
          aria-label="Filter by month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className={`rounded-xl border border-input bg-transparent px-3 py-1.5 text-sm text-foreground ${FOCUS_RING}`}
        >
          <option value="all">All months</option>
          {monthOptions.map((m) => (
            <option key={m} value={m}>
              {formatMonth(m)}
            </option>
          ))}
        </select>
      </div>

      {renderBody()}

      {reminderInvoice && (
        <ReminderDialog
          invoice={reminderInvoice}
          student={students.find((s) => s.id === reminderInvoice.studentId)}
          upiId={upiId}
          open
          onClose={() => setReminderInvoice(null)}
        />
      )}

      <RecordPaymentDialog
        invoice={paymentInvoice}
        student={students.find((s) => s.id === paymentInvoice?.studentId)}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
    </div>
  )
}
