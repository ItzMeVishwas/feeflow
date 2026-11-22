import type { Bill, FeeRules, Invoice, Student } from "./store"

// Pure helpers for the Insights page. No React, no storage access.

const DAY_MS = 86_400_000

// "YYYY-MM-DD" (or longer ISO string) -> local Date at midnight, without timezone shift.
function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number)
  return new Date(year, month - 1, day)
}

// "YYYY-MM" key for a Date in local time.
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

// Money that came in: each recorded payment, or the paid amount if there are no payment rows.
function incomeEntries(invoice: Invoice): { month: string; amount: number }[] {
  if (invoice.payments && invoice.payments.length > 0) {
    return invoice.payments.map((p) => ({ month: monthKey(parseIsoDate(p.date)), amount: p.amount }))
  }
  if (invoice.status === "paid" && invoice.paidDate) {
    return [{ month: monthKey(parseIsoDate(invoice.paidDate)), amount: invoice.amount }]
  }
  return []
}

// Bills carry no paid status, so every bill counts as an expense in the month of its
// dueDate. Recurring monthly bills count in every month from that month onward.
function billMonthsAndAmount(bill: Bill, months: string[]): { month: string; amount: number }[] {
  const startKey = monthKey(parseIsoDate(bill.dueDate))
  if (bill.recurringMonthly) {
    return months.filter((m) => m >= startKey).map((m) => ({ month: m, amount: bill.amount }))
  }
  return months.includes(startKey) ? [{ month: startKey, amount: bill.amount }] : []
}

export function profitMonths(
  invoices: Invoice[],
  bills: Bill[],
  now: Date = new Date(),
): { labels: string[]; income: number[]; expenses: number[]; net: number[] } {
  const monthDates: Date[] = []
  for (let i = 5; i >= 0; i--) {
    monthDates.push(new Date(now.getFullYear(), now.getMonth() - i, 1))
  }
  const keys = monthDates.map(monthKey)
  const labels = monthDates.map((d) => d.toLocaleDateString("en-US", { month: "short" }))

  const income = keys.map(() => 0)
  const expenses = keys.map(() => 0)

  for (const invoice of invoices) {
    for (const entry of incomeEntries(invoice)) {
      const idx = keys.indexOf(entry.month)
      if (idx >= 0) income[idx] += entry.amount
    }
  }
  for (const bill of bills) {
    for (const entry of billMonthsAndAmount(bill, keys)) {
      const idx = keys.indexOf(entry.month)
      if (idx >= 0) expenses[idx] += entry.amount
    }
  }

  const net = income.map((value, i) => value - expenses[i])
  return { labels, income, expenses, net }
}

export function currentMonthSummary(
  invoices: Invoice[],
  bills: Bill[],
  now: Date = new Date(),
): { income: number; expenses: number; net: number; marginPct: number | null } {
  const { income, expenses, net } = profitMonths(invoices, bills, now)
  const last = income.length - 1
  const incomeNow = income[last]
  const expensesNow = expenses[last]
  const netNow = net[last]
  return {
    income: incomeNow,
    expenses: expensesNow,
    net: netNow,
    marginPct: incomeNow > 0 ? Math.round((netNow / incomeNow) * 100) : null,
  }
}

// Counts paid invoices by day-of-month (index 0 = day 1) using paidDate.
export function paymentDayHistogram(invoices: Invoice[]): { counts: number[]; topDays: number[] } {
  const counts: number[] = Array.from({ length: 31 }, () => 0)

  for (const invoice of invoices) {
    if (invoice.status !== "paid" || !invoice.paidDate) continue
    const day = parseIsoDate(invoice.paidDate).getDate()
    if (day >= 1 && day <= 31) counts[day - 1] += 1
  }

  const topDays = counts
    .map((count, index) => ({ day: index + 1, count }))
    .filter((d) => d.count > 0)
    .sort((a, b) => b.count - a.count || a.day - b.day)
    .slice(0, 3)
    .map((d) => d.day)

  return { counts, topDays }
}

// 1 -> "1st", 2 -> "2nd", 3 -> "3rd", 4 -> "4th", 11-13 -> "11th"-"13th", 21 -> "21st"
function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

export function reminderSentence(topDays: number[]): string {
  if (topDays.length === 0) {
    return "Mark a few invoices as paid to see when parents pay."
  }

  const sorted = [...topDays].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  // Send the reminder the evening before the earliest common payment day.
  const reminderDay = min > 1 ? min - 1 : 31

  const payText =
    sorted.length >= 2 && max - min <= 4
      ? `between the ${ordinal(min)} and ${ordinal(max)}`
      : sorted.length === 1
        ? `on the ${ordinal(min)}`
        : `on the ${sorted.slice(0, -1).map(ordinal).join(", ")} and ${ordinal(max)}`

  return `Most parents pay ${payText}. Send reminders on the ${ordinal(reminderDay)} evening.`
}

// Unpaid invoices due this month that are more than afterDays overdue, times the late fee amount.
export function lateFeesThisMonth(
  invoices: Invoice[],
  rules: FeeRules,
  now: Date = new Date(),
): number {
  if (!rules.lateFee.enabled) return 0

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const currentKey = monthKey(today)

  const count = invoices.filter((invoice) => {
    if (invoice.status === "paid") return false
    if (monthKey(parseIsoDate(invoice.dueDate)) !== currentKey) return false
    const daysLate = Math.round((today.getTime() - parseIsoDate(invoice.dueDate).getTime()) / DAY_MS)
    return daysLate > rules.lateFee.afterDays
  }).length

  return count * rules.lateFee.amount
}

// Number of families (distinct parentPhone) that have 2 or more students.
export function familiesWithSibling(students: Student[], rules: FeeRules): number {
  if (!rules.siblingDiscount.enabled) return 0

  const countByPhone = new Map<string, number>()
  for (const student of students) {
    countByPhone.set(student.parentPhone, (countByPhone.get(student.parentPhone) ?? 0) + 1)
  }
  let families = 0
  for (const count of countByPhone.values()) {
    if (count >= 2) families += 1
  }
  return families
}
