import { amountDue, daysLate, toIsoDate } from "@/lib/invoice-status"
import { suggestTone, type Tone } from "@/lib/reminder-message"
import type { AppState, Invoice, Student } from "@/lib/store"

export type ChaseItem = {
  invoice: Invoice
  student: Student
  amountDue: number
  daysLate: number
  tone: Tone
}

// Overdue invoices, most days late first, for the chase autopilot.
// Skips invoices already reminded today, and invoices whose student is missing.
export function buildChaseQueue(state: AppState, today: string = toIsoDate(new Date())): ChaseItem[] {
  const items: ChaseItem[] = []
  for (const invoice of state.invoices) {
    if (invoice.status === "paid") continue
    if (invoice.dueDate >= today) continue // not overdue yet (same rule as deriveStatus)
    if (invoice.lastRemindedAt === today) continue
    const due = amountDue(invoice)
    if (due <= 0) continue
    const student = state.students.find((s) => s.id === invoice.studentId)
    if (!student) continue
    const late = daysLate(invoice.dueDate, today)
    items.push({ invoice, student, amountDue: due, daysLate: late, tone: suggestTone(late) })
  }
  return items.sort((a, b) => b.daysLate - a.daysLate)
}
