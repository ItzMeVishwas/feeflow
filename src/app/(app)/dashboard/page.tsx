"use client"

import { useMemo, useSyncExternalStore } from "react"

import { formatINR } from "@/lib/format"
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-neutral-900">
        {formatINR(value)}
      </p>
    </div>
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
    for (const inv of invoices) {
      if (inv.status !== "paid") totalOutstanding += inv.amount
      if (deriveStatus(inv, today) === "overdue") overdueAmount += inv.amount
      if (
        inv.status === "paid" &&
        inv.paidDate !== null &&
        inv.paidDate.startsWith(currentMonth)
      ) {
        collectedThisMonth += inv.amount
      }
    }
    return { totalOutstanding, overdueAmount, collectedThisMonth }
  }, [invoices, today, currentMonth])

  const owedRows = useMemo(() => {
    const rows: OwedRow[] = invoices
      .filter((inv) => inv.status !== "paid")
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

  const groups = useMemo(
    () =>
      BUCKETS.map((bucket) => ({
        label: bucket.label,
        rows: owedRows.filter((row) => bucket.test(row.days)),
      })).filter((group) => group.rows.length > 0),
    [owedRows],
  )

  if (!mounted) {
    return <p className="text-sm text-neutral-500">Loading dashboard…</p>
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Dashboard
      </h1>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total outstanding" value={stats.totalOutstanding} />
        <StatCard label="Overdue amount" value={stats.overdueAmount} />
        <StatCard label="Collected this month" value={stats.collectedThisMonth} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-neutral-900">Who owes me</h2>

        {owedRows.length === 0 ? (
          <p className="text-sm text-neutral-600">
            No unpaid invoices. Nothing is owed right now.
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-700">{group.label}</h3>
              <div className="overflow-x-auto rounded-md border border-neutral-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-neutral-50 text-neutral-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-medium">Student</th>
                      <th scope="col" className="px-4 py-3 font-medium">Parent</th>
                      <th scope="col" className="px-4 py-3 font-medium">Amount</th>
                      <th scope="col" className="px-4 py-3 font-medium">Days late</th>
                      <th scope="col" className="px-4 py-3 font-medium">Reminders sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {group.rows.map(({ invoice, studentName, parentName, days }) => (
                      <tr key={invoice.id}>
                        <td className="px-4 py-3 text-neutral-900">{studentName}</td>
                        <td className="px-4 py-3 text-neutral-700">{parentName}</td>
                        <td className="px-4 py-3 tabular-nums text-neutral-900">
                          {formatINR(invoice.amount)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-neutral-700">{days}</td>
                        <td className="px-4 py-3 tabular-nums text-neutral-700">
                          {invoice.remindersSent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
