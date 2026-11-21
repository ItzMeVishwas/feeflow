import type { Invoice } from "@/lib/store"

// Pure dashboard metrics. Dates are local; invoice dates are ISO "YYYY-MM-DD" strings,
// so string comparison and slicing to "YYYY-MM" are safe.

export type OnTimeRate = {
  onTime: number
  total: number
  rate: number // 0-100, rounded
  previousRate: number | null // same measure for the 3 months before, null when no data
}

export type CollectionBucket = {
  key: string // "YYYY-MM"
  label: string // short month name, e.g. "Jan"
  amount: number
  isCurrent: boolean
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

// Months as a running count (year * 12 + monthIndex) so going back is simple arithmetic.
function monthCount(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth()
}

// Converts a month count back to "YYYY-MM".
function monthKey(count: number): string {
  const year = Math.floor(count / 12)
  const month = count - year * 12 + 1
  return `${year}-${String(month).padStart(2, "0")}`
}

// Converts a month count to a short month name.
function monthLabel(count: number): string {
  const month = ((count % 12) + 12) % 12
  return SHORT_MONTHS[month]
}

function percent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

// Share of paid invoices paid on or before their due date, over the last 3 calendar months
// (current month and the two before), compared with the 3 months before that.
export function computeOnTimeRate(invoices: Invoice[], today: Date): OnTimeRate {
  const current = monthCount(today)
  const recent = new Set([0, 1, 2].map((offset) => monthKey(current - offset)))
  const prior = new Set([3, 4, 5].map((offset) => monthKey(current - offset)))

  let onTime = 0
  let total = 0
  let priorOnTime = 0
  let priorTotal = 0

  for (const inv of invoices) {
    if (inv.status !== "paid" || inv.paidDate === null) continue
    const paidMonth = inv.paidDate.slice(0, 7)
    const paidOnTime = inv.paidDate <= inv.dueDate

    if (recent.has(paidMonth)) {
      total += 1
      if (paidOnTime) onTime += 1
    } else if (prior.has(paidMonth)) {
      priorTotal += 1
      if (paidOnTime) priorOnTime += 1
    }
  }

  return {
    onTime,
    total,
    rate: percent(onTime, total),
    previousRate: priorTotal > 0 ? percent(priorOnTime, priorTotal) : null,
  }
}

// Money collected per month for the last 6 months, ending with the current month.
// Uses recorded payments; a paid invoice with no payments counts its full amount on paidDate.
export function computeMonthlyCollections(
  invoices: Invoice[],
  today: Date,
): CollectionBucket[] {
  const current = monthCount(today)
  const buckets: CollectionBucket[] = [5, 4, 3, 2, 1, 0].map((offset) => ({
    key: monthKey(current - offset),
    label: monthLabel(current - offset),
    amount: 0,
    isCurrent: offset === 0,
  }))
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]))

  for (const inv of invoices) {
    if (inv.payments && inv.payments.length > 0) {
      for (const payment of inv.payments) {
        const bucket = byKey.get(payment.date.slice(0, 7))
        if (bucket) bucket.amount += payment.amount
      }
    } else if (inv.status === "paid" && inv.paidDate !== null) {
      const bucket = byKey.get(inv.paidDate.slice(0, 7))
      if (bucket) bucket.amount += inv.amount
    }
  }

  return buckets
}
