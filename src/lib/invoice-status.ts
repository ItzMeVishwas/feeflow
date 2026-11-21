import type { Invoice } from "@/lib/store"

export type DisplayStatus = "paid" | "due" | "overdue"

// Local calendar date as "YYYY-MM-DD". Not toISOString(), which is UTC and can be a day off.
export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Paid stays paid. Anything else is Overdue once its due date has passed, otherwise Due.
// A stored "overdue" status is treated the same as "unpaid".
export function deriveStatus(invoice: Invoice, today: string): DisplayStatus {
  if (invoice.status === "paid") return "paid"
  return invoice.dueDate < today ? "overdue" : "due"
}

// Whole days a due date is past today ("YYYY-MM-DD" strings). 0 if not yet past due.
export function daysLate(dueDate: string, today: string): number {
  const [y, m, d] = dueDate.split("-").map(Number)
  const [ty, tm, td] = today.split("-").map(Number)
  const diff = Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(y, m - 1, d)) / 86400000)
  return Math.max(0, diff)
}

// Sum of all recorded payments for an invoice, rounded to 2 decimals.
export function amountPaid(invoice: Invoice): number {
  const total = (invoice.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
  return Math.round(total * 100) / 100
}

// Outstanding balance. 0 once the invoice is marked paid.
export function amountDue(invoice: Invoice): number {
  if (invoice.status === "paid") return 0
  const due = Math.max(0, invoice.amount - amountPaid(invoice))
  return Math.round(due * 100) / 100
}

// True when some money has been paid but a balance still remains.
export function isPartPaid(invoice: Invoice): boolean {
  return amountPaid(invoice) > 0 && amountDue(invoice) > 0
}
