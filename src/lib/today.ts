import { daysLate, deriveStatus } from "@/lib/invoice-status"
import type { Bill, Invoice, Student } from "@/lib/store"

export type TodayAction = {
  id: string
  kind: "chase" | "bill" | "cash"
  title: string
  detail: string
  invoiceId?: string
  urgency: number
}

export type TodayInput = {
  invoices: Invoice[]
  students: Student[]
  bills: Bill[]
  today: string // local calendar date, "YYYY-MM-DD", supplied by the caller
  forecastFirstBelowZero: string | null // "YYYY-MM-DD" or null when cash never dips below zero
}

const MAX_ACTIONS = 5
const BILL_WINDOW_DAYS = 7
const CASH_WINDOW_DAYS = 30
const DAY_MS = 86_400_000

const wholeRupeeFormatter = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })

const shortDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "UTC", // UTC so the calendar date never shifts with the local timezone
})

// Whole days from `from` to `to` ("YYYY-MM-DD"). Negative when `to` is earlier.
function dayDiff(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number)
  const [ty, tm, td] = to.split("-").map(Number)
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / DAY_MS)
}

// "2025-01-14" -> "14 Jan". No year, because the rail only shows near-term dates.
function shortDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  return shortDateFormatter.format(new Date(Date.UTC(y, m - 1, d)))
}

function dueText(days: number): string {
  if (days === 0) return "due today"
  if (days === 1) return "due tomorrow"
  return `due in ${days} days`
}

// Builds the "Today" to-do list. Pure: everything comes in as arguments.
// Overdue invoices rank first (most days late first), then bills due within a week
// (nearest first), then the cash dip warning. Returns at most MAX_ACTIONS items.
export function buildToday(input: TodayInput): TodayAction[] {
  const { invoices, students, bills, today, forecastFirstBelowZero } = input
  const studentById = new Map<string, Student>(students.map((s) => [s.id, s]))
  const actions: TodayAction[] = []

  for (const invoice of invoices) {
    if (deriveStatus(invoice, today) !== "overdue") continue
    const late = daysLate(invoice.dueDate, today)
    const name = studentById.get(invoice.studentId)?.name ?? "Unknown student"
    actions.push({
      id: `chase-${invoice.id}`,
      kind: "chase",
      title: `Chase ${name}`,
      detail: `${wholeRupeeFormatter.format(invoice.amount)}, ${late} ${late === 1 ? "day" : "days"} late`,
      invoiceId: invoice.id,
      urgency: 100 + late,
    })
  }

  for (const bill of bills) {
    const days = dayDiff(today, bill.dueDate)
    if (days < 0 || days > BILL_WINDOW_DAYS) continue
    actions.push({
      id: `bill-${bill.id}`,
      kind: "bill",
      title: `${bill.name} ${dueText(days)}`,
      detail: wholeRupeeFormatter.format(bill.amount),
      urgency: 50 - days,
    })
  }

  if (forecastFirstBelowZero !== null) {
    const days = dayDiff(today, forecastFirstBelowZero)
    if (days >= 0 && days <= CASH_WINDOW_DAYS) {
      actions.push({
        id: "cash-below-zero",
        kind: "cash",
        title: `Cash dips below zero on ${shortDate(forecastFirstBelowZero)}`,
        detail: "Plan a collection or move a bill",
        urgency: 80,
      })
    }
  }

  actions.sort((a, b) => b.urgency - a.urgency)
  return actions.slice(0, MAX_ACTIONS)
}
