import type { AppState, Invoice } from "@/lib/store"

// Pure month logic for the calendar page. No React here.
// All dates are "YYYY-MM-DD" strings, compared as strings. month0 is 0-based (0 = January).

export type CalendarDay = {
  date: string
  inMonth: boolean
  fees: { invoiceId: string; studentId: string; studentName: string; amount: number; status: "paid" | "overdue" | "unpaid" }[]
  bills: { billId: string; name: string; amount: number }[]
}

export type MonthSummary = { expected: number; received: number }

type CalendarFee = CalendarDay["fees"][number]
type CalendarBill = CalendarDay["bills"][number]

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

// "YYYY-MM" for a 0-based month.
function monthKey(year: number, month0: number): string {
  return `${year}-${pad2(month0 + 1)}`
}

function daysInMonth(year: number, month0: number): number {
  // Day 0 of the next month is the last day of this month.
  return new Date(Date.UTC(year, month0 + 1, 0)).getUTCDate()
}

function pushTo<T>(map: Map<string, T[]>, key: string, value: T): void {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

function feeStatus(invoice: Invoice, today: string): CalendarFee["status"] {
  if (invoice.status === "paid") return "paid"
  if (invoice.status === "overdue" || invoice.dueDate < today) return "overdue"
  return "unpaid"
}

// Monday-first grid of whole weeks that touches the month: 35 or 42 cells.
// Fees and bills are only attached to in-month days.
export function buildMonthGrid(state: AppState, year: number, month0: number, today: string): CalendarDay[] {
  const prefix = monthKey(year, month0)
  const length = daysInMonth(year, month0)
  // getUTCDay: 0 = Sunday. Shift so Monday = 0 and Sunday = 6.
  const leadingBlanks = (new Date(Date.UTC(year, month0, 1)).getUTCDay() + 6) % 7
  const cellCount = Math.ceil((leadingBlanks + length) / 7) * 7

  const studentNames = new Map(state.students.map((s) => [s.id, s.name]))

  const feesByDate = new Map<string, CalendarFee[]>()
  for (const invoice of state.invoices) {
    if (invoice.dueDate.slice(0, 7) !== prefix) continue
    pushTo(feesByDate, invoice.dueDate, {
      invoiceId: invoice.id,
      studentId: invoice.studentId,
      studentName: studentNames.get(invoice.studentId) ?? "Unknown student",
      amount: invoice.amount,
      status: feeStatus(invoice, today),
    })
  }

  const billsByDate = new Map<string, CalendarBill[]>()
  for (const bill of state.bills) {
    const billItem = { billId: bill.id, name: bill.name, amount: bill.amount }
    if (bill.recurringMonthly) {
      // Same day of month as the bill's dueDate, clamped to this month's length (e.g. 31 becomes 30 in April).
      const day = Number(bill.dueDate.slice(8, 10))
      if (!Number.isInteger(day) || day < 1) continue
      const clamped = Math.min(day, length)
      pushTo(billsByDate, `${prefix}-${pad2(clamped)}`, billItem)
    } else if (bill.dueDate.slice(0, 7) === prefix) {
      pushTo(billsByDate, bill.dueDate, billItem)
    }
  }

  const days: CalendarDay[] = []
  for (let i = 0; i < cellCount; i++) {
    const dayNumber = i - leadingBlanks + 1
    const inMonth = dayNumber >= 1 && dayNumber <= length
    // Date.UTC handles day numbers outside the month (they roll into the neighbouring months).
    const date = new Date(Date.UTC(year, month0, dayNumber)).toISOString().slice(0, 10)
    days.push({
      date,
      inMonth,
      fees: inMonth ? feesByDate.get(date) ?? [] : [],
      bills: inMonth ? billsByDate.get(date) ?? [] : [],
    })
  }
  return days
}

// Expected = total of invoices due this month.
// Received = payment records dated this month, plus the full amount of paid invoices that have no
// payment records and whose paidDate is this month (older data).
export function summarizeMonth(state: AppState, year: number, month0: number): MonthSummary {
  const prefix = monthKey(year, month0)
  let expected = 0
  let received = 0
  for (const invoice of state.invoices) {
    if (invoice.dueDate.slice(0, 7) === prefix) expected += invoice.amount
    const payments = invoice.payments ?? []
    if (payments.length > 0) {
      for (const payment of payments) {
        if (payment.date.slice(0, 7) === prefix) received += payment.amount
      }
    } else if (invoice.status === "paid" && invoice.paidDate?.slice(0, 7) === prefix) {
      received += invoice.amount
    }
  }
  return {
    expected: Math.round(expected * 100) / 100,
    received: Math.round(received * 100) / 100,
  }
}
