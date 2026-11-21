const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
})

const inrWholeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
})

export function formatINR(amount: number, options?: { wholeRupees?: boolean }): string {
  if (options?.wholeRupees) return inrWholeFormatter.format(amount)
  const paise = Math.round(Math.abs(amount) * 100) % 100
  return paise === 0 ? inrWholeFormatter.format(amount) : inrFormatter.format(amount)
}


const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC", // UTC so the calendar date never shifts with the local timezone
})

const monthFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
})

// Formats "YYYY-MM-DD" as a readable date, e.g. "2025-03-05" -> "5 Mar 2025".
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  return dateFormatter.format(new Date(Date.UTC(y, m - 1, d)))
}

// Formats "YYYY-MM" as a readable month, e.g. "2025-03" -> "Mar 2025".
export function formatMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number)
  return monthFormatter.format(new Date(Date.UTC(y, m - 1, 1)))
}

