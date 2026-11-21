"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { formatDate, formatINR, formatMonth } from "@/lib/format"
import { ReminderDialog } from "@/components/reminder-dialog"
import { useStore } from "@/lib/store"
import type { Invoice } from "@/lib/store"
import { deriveStatus, toIsoDate, type DisplayStatus } from "@/lib/invoice-status"

type Filter = "all" | DisplayStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "paid", label: "Paid" },
  { value: "due", label: "Due" },
  { value: "overdue", label: "Overdue" },
]

const STATUS_LABEL: Record<DisplayStatus, string> = {
  paid: "Paid",
  due: "Due",
  overdue: "Overdue",
}

// Colour is a helper only: every badge also carries its text label.
const BADGE_CLASS: Record<DisplayStatus, string> = {
  paid: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  due: "bg-amber-100 text-amber-900 ring-amber-600/20",
  overdue: "bg-red-100 text-red-800 ring-red-600/20",
}

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

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
  const updateInvoice = useStore((s) => s.updateInvoice)
  const upiId = useStore((s) => s.settings.upiId)

  const [filter, setFilter] = useState<Filter>("all")
  const [message, setMessage] = useState("")
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null)

  const today = toIsoDate(new Date())
  const currentMonth = today.slice(0, 7) // "YYYY-MM"

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

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: rows.length, paid: 0, due: 0, overdue: 0 }
    for (const row of rows) c[row.status]++
    return c
  }, [rows])

  const visibleRows =
    filter === "all" ? rows : rows.filter((row) => row.status === filter)

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

  if (!mounted) {
    return <p className="text-sm text-muted-foreground">Loading invoices…</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Invoices
        </h1>
        <button
          type="button"
          onClick={handleGenerate}
          className={`rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 ${FOCUS_RING}`}
        >
          Generate this month&apos;s invoices
        </button>
      </div>

      {message && (
        <p role="status" className="text-sm text-muted-foreground">
          {message}
        </p>
      )}

      <div role="group" aria-label="Filter invoices" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const pressed = filter === f.value
          return (
            <button
              key={f.value}
              type="button"
              aria-pressed={pressed}
              onClick={() => setFilter(f.value)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${FOCUS_RING} ${
                pressed
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {f.label}{" "}
              <span className="tabular-nums">({counts[f.value]})</span>
            </button>
          )
        })}
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No invoices yet. Use Generate this month&apos;s invoices to create them from your
          active students.
        </p>
      ) : visibleRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {filter} invoices.</p>
      ) : (
        <div className="glass overflow-x-auto rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Student</th>
                <th scope="col" className="px-4 py-3 font-medium">Month</th>
                <th scope="col" className="px-4 py-3 font-medium">Amount</th>
                <th scope="col" className="px-4 py-3 font-medium">Due date</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 font-medium">
                  <span className="sr-only">Action</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visibleRows.map(({ invoice, studentName, status }) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-3 text-foreground">{studentName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatMonth(invoice.month)}</td>
                  <td className="px-4 py-3 tabular-nums text-foreground">
                    {formatINR(invoice.amount)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_CLASS[status]}`}
                    >
                      {STATUS_LABEL[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {status === "overdue" && (
                        <button
                          type="button"
                          aria-label={`Send a WhatsApp reminder for ${studentName}'s ${formatMonth(invoice.month)} invoice`}
                          onClick={() => setReminderInvoice(invoice)}
                          className={`rounded-md border border-border bg-card px-3 py-1 text-sm font-medium text-foreground hover:bg-muted ${FOCUS_RING}`}
                        >
                          Remind
                        </button>
                      )}
                      {status !== "paid" && (
                        <button
                          type="button"
                          aria-label={`Mark ${studentName}'s ${formatMonth(invoice.month)} invoice as paid`}
                          onClick={() =>
                            updateInvoice(invoice.id, { status: "paid", paidDate: today })
                          }
                          className={`rounded-md border border-border bg-card px-3 py-1 text-sm font-medium text-foreground hover:bg-muted ${FOCUS_RING}`}
                        >
                          Mark as paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reminderInvoice && (
        <ReminderDialog
          invoice={reminderInvoice}
          student={students.find((s) => s.id === reminderInvoice.studentId)}
          upiId={upiId}
          open
          onClose={() => setReminderInvoice(null)}
        />
      )}
    </div>
  )
}
