import { buildForecast, summarizeForecast } from "@/lib/forecast"
import { formatDate, formatINR } from "@/lib/format"

// Lowest balance (in rupees) below which a purchase is "Tight" rather than "Safe".
export const AFFORD_BUFFER = 5000

export type Verdict = "safe" | "tight" | "danger"

export type Assessment = {
  verdict: Verdict
  reason: string
  lowest: number
  lowestDate: string
}

const whole = (amount: number): string => formatINR(amount, { wholeRupees: true })

// Checks whether a one-time purchase made today keeps the forecast above zero and above the buffer.
export function assessPurchase(args: {
  state: Parameters<typeof buildForecast>[0]
  amount: number
  label: string
  today: string
  days?: number
}): Assessment | null {
  const { state, amount, today } = args
  if (!Number.isFinite(amount) || amount <= 0) return null

  const days = args.days ?? 90
  const points = buildForecast(state, days, { extraExpense: { amount, date: today } }, today)
  const summary = summarizeForecast(points)

  const lowest = summary.lowestBalance ?? {
    balance: points[0]?.balance ?? 0,
    date: points[0]?.date ?? today,
  }
  const firstBelow = summary.firstBelowZeroDate

  if (firstBelow !== null) {
    const point = points.find((p) => p.date === firstBelow && p.balance < 0)
    const shortfall = point ? -point.balance : 0
    const outEvent = point?.events.find((e) => e.direction === "out")
    const reason = outEvent
      ? `Leaves you short ${whole(shortfall)} before ${outEvent.label} on ${formatDate(firstBelow)}.`
      : `Leaves you short ${whole(shortfall)} on ${formatDate(firstBelow)}.`
    return { verdict: "danger", reason, lowest: lowest.balance, lowestDate: lowest.date }
  }

  if (lowest.balance < AFFORD_BUFFER) {
    return {
      verdict: "tight",
      reason: `Lowest balance after this is ${whole(lowest.balance)} on ${formatDate(lowest.date)}.`,
      lowest: lowest.balance,
      lowestDate: lowest.date,
    }
  }

  return {
    verdict: "safe",
    reason: `Your balance stays above ${whole(AFFORD_BUFFER)} for the next ${days} days.`,
    lowest: lowest.balance,
    lowestDate: lowest.date,
  }
}
