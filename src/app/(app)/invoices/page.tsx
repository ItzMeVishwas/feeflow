"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { StatusPill } from "@/components/status-pill"
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
    idle: "bg-[#0A1F3D]/5 text-[#0A1F3D] hover:bg-[#0A1F3D]/10",
    active: "bg-[#0B2A55] text-white",
  },
  due: {
    idle: "bg-[#D98E04]/10 text-[#0A1F3D] hover:bg-[#D98E04]/20",
    active: "bg-[#D98E04] text-[#0A1F3D]",
  },
  overdue: {
    idle: "bg-[#D93F3F]/10 text-[#0A1F3D] hover:bg-[#D93F3F]/20",
    active: "bg-[#D93F3F] text-white",
  },
  "part-paid": {
    idle: "bg-[#D98E04]/10 text-[#0A1F3D] hover:bg-[#D98E04]/20",
    active: "bg-[#D98E04] text-[#0A1F3D]",
  },
  paid: {
    idle: "bg-[#12A150]/10 text-[#0A1F3D] hover:bg-[#12A150]/20",
    active: "bg-[#12A150] text-white",
  },
}

// Primary action colour: navy with white text.
const primaryButtonClass =
  "rounded-xl bg-[#0B2A55] font-semibold text-white hover:bg-[#133A72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"

// White content card: 1px border, 24px radius, soft two-part shadow.
const cardClass =
  "rounded-3xl border border-[#E6EBF2] bg-white shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)] dark:border-white/10 dark:bg-[#121E36]"

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"

// Focus ring for the promise controls.
const OUTLINE_FOCUS = FOCUS_RING

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
  const setPromisedDate = useStore((s) => s.setPromisedDate)
  const upiId = useStore((s) => s.settings.upiId)

  const [filter, setFilter] = useState<Filter>("all")
  const [message, setMessage] = useState("")
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null)
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  // The "Promise a date" form is open for at most one invoice at a time.
  const [promiseInvoiceId, setPromiseInvoiceId] = useState<string | null>(null)
  const [promiseDraft, setPromiseDraft] = useState("")
  const [promiseError, setPromiseError] = useState("")

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

  function openPromiseForm(invoice: Invoice) {
    setPromiseInvoiceId(invoice.id)
    setPromiseDraft(invoice.promisedDate ?? "")
    setPromiseError("")
  }

  function closePromiseForm() {
    setPromiseInvoiceId(null)
    setPromiseDraft("")
    setPromiseError("")
  }

  function savePromise(invoiceId: string) {
    if (!promiseDraft) {
      setPromiseError("Pick a date.")
      return
    }
    // ISO dates (YYYY-MM-DD) sort correctly as plain strings.
    if (promiseDraft < today) {
      setPromiseError("Pick today or a later date.")
      return
    }
    setPromisedDate(invoiceId, promiseDraft)
    closePromiseForm()
  }

  function renderInvoiceRow({ invoice, studentName, status }: RowItem) {
    const monthLabel = formatMonth(invoice.month)
    const due = amountDue(invoice)
    const promiseOpen = promiseInvoiceId === invoice.id

    return (
      <li
        key={invoice.id}
        className={`flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-[#F6F8FB] sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
          promiseOpen ? "sm:flex-wrap" : ""
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B2A55]/10 text-sm font-semibold text-[#0B2A55]"
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
                  ? "font-medium tabular-nums text-[#D93F3F]"
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
            <StatusPill tone={status}>{STATUS_LABEL[status]}</StatusPill>
            {status !== "paid" && isPartPaid(invoice) ? (
              <StatusPill tone="due">Part paid</StatusPill>
            ) : null}
            {status !== "paid" && invoice.promisedDate ? (
              <StatusPill tone="neutral">
                Promised {formatDate(invoice.promisedDate)}
              </StatusPill>
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
              className={primaryButtonClass}
              aria-label={`Record payment for ${studentName}'s ${monthLabel} invoice`}
              onClick={() => {
                setPaymentInvoice(invoice)
                setPaymentOpen(true)
              }}
            >
              Record payment
            </Button>
          ) : null}
          {status !== "paid" ? (
            <Button
              variant="outline"
              size="sm"
              className={OUTLINE_FOCUS}
              aria-label={`${invoice.promisedDate ? "Change promise" : "Promise a date"} for ${studentName}'s ${monthLabel} invoice`}
              onClick={() => openPromiseForm(invoice)}
            >
              {invoice.promisedDate ? "Change promise" : "Promise a date"}
            </Button>
          ) : null}
          {status !== "paid" && invoice.promisedDate ? (
            <Button
              variant="outline"
              size="sm"
              className={OUTLINE_FOCUS}
              aria-label={`Clear promise for ${studentName}'s ${monthLabel} invoice`}
              onClick={() => setPromisedDate(invoice.id, null)}
            >
              Clear promise
            </Button>
          ) : null}
        </div>
        {status !== "paid" && promiseOpen ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              savePromise(invoice.id)
            }}
            className="flex w-full flex-wrap items-center gap-2"
          >
            <input
              type="date"
              aria-label="Promised date"
              min={today}
              value={promiseDraft}
              onChange={(event) => {
                setPromiseDraft(event.target.value)
                setPromiseError("")
              }}
              className={`rounded-xl border border-[#DCE3EE] bg-white px-3 py-1.5 text-sm text-[#0A1F3D] ${OUTLINE_FOCUS}`}
            />
            <Button type="submit" size="sm" className={primaryButtonClass}>
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={OUTLINE_FOCUS}
              onClick={closePromiseForm}
            >
              Cancel
            </Button>
            {promiseError ? (
              <p role="alert" className="w-full text-sm text-[#D93F3F]">
                {promiseError}
              </p>
            ) : null}
          </form>
        ) : null}
      </li>
    )
  }

  function renderBody() {
    if (invoices.length === 0) {
      return (
        <div className={`${cardClass} flex flex-col items-center gap-2 p-6 text-center`}>
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
      return <p className={`${cardClass} p-6 text-center text-muted-foreground`}>{text}</p>
    }

    return (
      <ul
        role="list"
        className={`${cardClass} divide-y divide-[#E6EBF2] overflow-hidden dark:divide-white/10`}
      >
        {visibleRows.map(renderInvoiceRow)}
      </ul>
    )
  }

  if (!mounted) {
    return (
      <p className={`${cardClass} p-6 text-center text-muted-foreground`}>
        Loading invoices…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Invoices"
        description="Every fee you have asked for, and what has come in."
        action={
          <Button className={primaryButtonClass} onClick={handleGenerate}>
            Generate this month&apos;s invoices
          </Button>
        }
      />

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
          className={`w-full rounded-xl border border-[#DCE3EE] bg-white px-3 py-1.5 text-sm text-[#0A1F3D] sm:w-auto ${FOCUS_RING}`}
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
