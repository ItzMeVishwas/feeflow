import { buildChaseQueue, type ChaseItem } from "@/lib/chase"
import { formatINR } from "@/lib/format"
import { buildForecast, summarizeForecast } from "@/lib/forecast"
import type { AppState, Bill } from "@/lib/store"

export type AdvisorAction = "chaseAll" | "openForecast" | "none"

export type Advice = {
  tone: "warning" | "info" | "good"
  headline: string
  detail: string
  actionLabel: string
  action: AdvisorAction
  relatedStudentIds: string[]
  keyPhrase?: string
}

const FORECAST_DAYS = 90
const LOOKAHEAD_DAYS = 7
const DAY_MS = 86_400_000
const MINUS_SIGN = "\u2212"

// Date math is done in UTC on "YYYY-MM-DD" strings so it does not shift with the local timezone.
function parseIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

function addDays(iso: string, days: number): string {
  return new Date(parseIso(iso) + days * DAY_MS).toISOString().slice(0, 10)
}

const shortDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
})

// "2025-02-05" -> "5 Feb"
function shortDate(iso: string): string {
  return shortDateFormatter.format(new Date(parseIso(iso)))
}

// Whole rupees, e.g. 8200 -> "₹8,200". Callers add the minus sign when needed.
function rupees(amount: number): string {
  return formatINR(amount, { wholeRupees: true })
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}

// One first name per student, in the order given: "A", "A and B", "A, B and C".
function joinFirstNames(items: ChaseItem[]): string {
  const names = [...new Map(items.map((i) => [i.student.id, firstName(i.student.name)])).values()]
  if (names.length <= 1) return names[0] ?? ""
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

function uniqueStudentIds(items: ChaseItem[]): string[] {
  return [...new Set(items.map((i) => i.student.id))]
}

// Earliest date within the lookahead window when this bill is due, or null.
function nextBillDate(bill: Bill, today: string): string | null {
  for (let offset = 0; offset <= LOOKAHEAD_DAYS; offset++) {
    const date = addDays(today, offset)
    if (bill.recurringMonthly) {
      // Recurring bills repeat on the same day of the month.
      if (date.slice(8, 10) === bill.dueDate.slice(8, 10)) return date
    } else if (date === bill.dueDate) {
      return date
    }
  }
  return null
}

function nextDueBill(state: AppState, today: string): { bill: Bill; date: string } | null {
  let best: { bill: Bill; date: string } | null = null
  for (const bill of state.bills) {
    const date = nextBillDate(bill, today)
    if (date !== null && (best === null || date < best.date)) best = { bill, date }
  }
  return best
}

// Plain-language cash advice for the dashboard. Rules run in priority order.
export function getAdvice(state: AppState, today: string): Advice {
  const summary = summarizeForecast(buildForecast(state, FORECAST_DAYS, undefined, today))
  const lowest = summary.lowestBalance?.balance ?? 0
  const overdue = buildChaseQueue(state, today) // most days late first

  // a) Cash goes below zero within the forecast window.
  if (summary.firstBelowZeroDate !== null) {
    const shortfall = -lowest
    const dipText = `${MINUS_SIGN}${rupees(shortfall)}`

    // Pick the fewest overdue invoices (largest amounts first) that cover the shortfall.
    const byAmount = [...overdue].sort((a, b) => b.amountDue - a.amountDue)
    const chosen: ChaseItem[] = []
    let covered = 0
    for (const item of byAmount) {
      if (covered >= shortfall) break
      chosen.push(item)
      covered += item.amountDue
    }

    const headline = `Cash dips to ${dipText} on ${shortDate(summary.firstBelowZeroDate)}`

    if (covered >= shortfall) {
      return {
        tone: "warning",
        headline,
        detail: `Collecting from ${joinFirstNames(chosen)} covers it.`,
        actionLabel: "Chase overdue fees",
        action: "chaseAll",
        relatedStudentIds: uniqueStudentIds(chosen),
        keyPhrase: dipText,
      }
    }

    const missing = shortfall - covered
    const detail =
      overdue.length > 0
        ? `Collecting all overdue fees still leaves ${rupees(missing)} missing.`
        : `There are no overdue fees to collect, so ${rupees(missing)} is still missing.`
    return {
      tone: "warning",
      headline,
      detail,
      actionLabel: "Open forecast",
      action: "openForecast",
      relatedStudentIds: uniqueStudentIds(overdue),
      keyPhrase: dipText,
    }
  }

  // b) Money is overdue, but the balance stays above zero.
  if (overdue.length > 0) {
    const total = overdue.reduce((sum, i) => sum + i.amountDue, 0)
    const parentCount = new Set(overdue.map((i) => i.student.id)).size
    const oldest = overdue[0]
    const amount = rupees(total)
    return {
      tone: "warning",
      headline: `${amount} is overdue from ${plural(parentCount, "parent")}`,
      detail: `${oldest.student.name} is furthest behind. Oldest is ${plural(oldest.daysLate, "day")} late.`,
      actionLabel: "Send reminders",
      action: "chaseAll",
      relatedStudentIds: uniqueStudentIds(overdue),
      keyPhrase: amount,
    }
  }

  // c) A bill is due within the next week.
  const upcoming = nextDueBill(state, today)
  if (upcoming) {
    const amount = rupees(upcoming.bill.amount)
    return {
      tone: "info",
      headline: `${upcoming.bill.name} of ${amount} is due on ${shortDate(upcoming.date)}`,
      detail: "Check that your balance covers it.",
      actionLabel: "Open forecast",
      action: "openForecast",
      relatedStudentIds: [],
      keyPhrase: amount,
    }
  }

  // d) Nothing needs attention.
  if (state.students.length === 0) {
    return {
      tone: "good",
      headline: "Add your first student to see cash flow.",
      detail: "Once fees are set, your balance forecast appears here.",
      actionLabel: "",
      action: "none",
      relatedStudentIds: [],
    }
  }

  const lowestText = rupees(lowest)
  return {
    tone: "good",
    headline: "All fees on track.",
    detail: `Your lowest balance in ${FORECAST_DAYS} days is ${lowestText}.`,
    actionLabel: "",
    action: "none",
    relatedStudentIds: [],
    keyPhrase: lowestText,
  }
}
