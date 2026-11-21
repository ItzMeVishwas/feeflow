import type { AppState, Bill, Invoice } from "./store"
import { toIsoDate } from "./invoice-status"

export type ForecastScenario = {
  delayStudentId?: string
  delayDays?: number
  dropStudentId?: string
  extraExpense?: { amount: number; date: string }
}

export type ForecastEvent = {
  kind: "fee" | "invoice" | "bill" | "expense"
  direction: "in" | "out"
  label: string
  amount: number
  date: string
  studentId?: string
  billId?: string
}

export type ForecastPoint = {
  date: string
  balance: number
  inflow: number
  outflow: number
  events: ForecastEvent[]
}

export type ForecastSummary = {
  lowestBalance: { balance: number; date: string } | null
  firstBelowZeroDate: string | null
  totalExpectedIn: number
  totalExpectedOut: number
}

type YearMonth = { year: number; month: number } // month is 0-based

const DAY_MS = 86_400_000

// All date math is done in UTC on "YYYY-MM-DD" strings so it does not shift with the local timezone.
function parseIso(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number)
  return Date.UTC(y, m - 1, d)
}

function formatIso(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

function addDays(iso: string, days: number): string {
  return formatIso(parseIso(iso) + days * DAY_MS)
}

function daysBetween(from: string, to: string): number {
  return Math.round((parseIso(to) - parseIso(from)) / DAY_MS)
}

// Day-of-month is clamped to the month's length, so day 31 becomes 28/29 in February.
function dateInMonth(year: number, month: number, day: number): string {
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return formatIso(Date.UTC(year, month, Math.min(day, lastDay)))
}

function lastDayOfMonth(year: number, month: number): string {
  return formatIso(Date.UTC(year, month + 1, 0))
}

// Every calendar month that touches the range [startIso, endIso].
function monthsInRange(startIso: string, endIso: string): YearMonth[] {
  const last = Number(endIso.slice(0, 4)) * 12 + Number(endIso.slice(5, 7)) - 1
  const months: YearMonth[] = []
  for (let index = Number(startIso.slice(0, 4)) * 12 + Number(startIso.slice(5, 7)) - 1; index <= last; index++) {
    months.push({ year: Math.floor(index / 12), month: index % 12 })
  }
  return months
}

// Days late for each of this student's paid invoices. Empty list means no history.
function latenessHistory(studentId: string, invoices: Invoice[]): number[] {
  const lateDays: number[] = []
  for (const invoice of invoices) {
    if (invoice.studentId === studentId && invoice.status === "paid" && invoice.paidDate) {
      lateDays.push(Math.max(0, daysBetween(invoice.dueDate, invoice.paidDate)))
    }
  }
  return lateDays
}

function roundedAverage(values: number[]): number {
  if (values.length === 0) return 0
  const total = values.reduce((sum, value) => sum + value, 0)
  return Math.round(total / values.length)
}

export function parentReliability(studentId: string, invoices: Invoice[]): number {
  return roundedAverage(latenessHistory(studentId, invoices))
}

// Inflows sort before outflows within a day.
function inflowsFirst(a: ForecastEvent, b: ForecastEvent): number {
  if (a.direction === b.direction) return 0
  return a.direction === "in" ? -1 : 1
}

export function buildForecast(
  state: AppState,
  days = 90,
  scenario?: ForecastScenario,
  today: string = toIsoDate(new Date()),
): ForecastPoint[] {
  const endDate = addDays(today, days - 1)
  const inWindow = (date: string): boolean => date >= today && date <= endDate

  const studentNames = new Map<string, string>(state.students.map((s) => [s.id, s.name]))
  const nameOf = (studentId: string): string => studentNames.get(studentId) || studentId

  const isDropped = (studentId: string): boolean => scenario?.dropStudentId === studentId

  // Only the delayed student's inflows move; the scenario is applied after the normal date rules.
  const applyDelay = (studentId: string, date: string): string => {
    if (!scenario || scenario.delayStudentId !== studentId || scenario.delayDays === undefined) return date
    return addDays(date, scenario.delayDays)
  }

  const events: ForecastEvent[] = []

  const pushInflow = (
    studentId: string,
    kind: "fee" | "invoice",
    amount: number,
    expectedDate: string,
  ): void => {
    const date = applyDelay(studentId, expectedDate)
    if (!inWindow(date)) return
    events.push({ kind, direction: "in", label: nameOf(studentId), amount, date, studentId })
  }

  const pushBillOutflow = (bill: Bill, date: string): void => {
    if (!inWindow(date)) return
    events.push({ kind: "bill", direction: "out", label: bill.name, amount: bill.amount, date, billId: bill.id })
  }

  // Real unpaid invoices. Overdue ones land today if the parent has paid late before, otherwise in 7 days.
  for (const invoice of state.invoices) {
    if (invoice.status === "paid" || isDropped(invoice.studentId)) continue
    const history = latenessHistory(invoice.studentId, state.invoices)
    let expected = addDays(invoice.dueDate, roundedAverage(history))
    if (expected < today) {
      expected = history.length > 0 ? today : addDays(today, 7)
    }
    pushInflow(invoice.studentId, "invoice", invoice.amount, expected)
  }

  // Expected monthly fees, due on the last day of each month, skipping months that already have an invoice.
  const monthsToWindowEnd = monthsInRange(today, endDate)
  for (const student of state.students) {
    if (!student.active || isDropped(student.id)) continue
    const reliability = roundedAverage(latenessHistory(student.id, state.invoices))
    for (const { year, month } of monthsToWindowEnd) {
      const dueDate = lastDayOfMonth(year, month)
      if (dueDate < today) continue
      const dueMonth = dueDate.slice(0, 7)
      const alreadyInvoiced = state.invoices.some(
        (i) => i.studentId === student.id && i.dueDate.slice(0, 7) === dueMonth,
      )
      if (alreadyInvoiced) continue
      pushInflow(student.id, "fee", student.monthlyFee, addDays(dueDate, reliability))
    }
  }

  // Bills. Recurring ones repeat on the same day of each month.
  for (const bill of state.bills) {
    if (bill.recurringMonthly) {
      const day = Number(bill.dueDate.slice(8, 10))
      for (const { year, month } of monthsToWindowEnd) {
        pushBillOutflow(bill, dateInMonth(year, month, day))
      }
    } else {
      pushBillOutflow(bill, bill.dueDate)
    }
  }

  if (scenario?.extraExpense && inWindow(scenario.extraExpense.date)) {
    events.push({
      kind: "expense",
      direction: "out",
      label: "Extra expense",
      amount: scenario.extraExpense.amount,
      date: scenario.extraExpense.date,
    })
  }

  const eventsByDate = new Map<string, ForecastEvent[]>()
  for (const event of events) {
    const bucket = eventsByDate.get(event.date)
    if (bucket) bucket.push(event)
    else eventsByDate.set(event.date, [event])
  }

  const points: ForecastPoint[] = []
  let balance = state.settings.startingCashBalance
  for (let offset = 0; offset < days; offset++) {
    const date = addDays(today, offset)
    const dayEvents = (eventsByDate.get(date) ?? []).sort(inflowsFirst)
    let inflow = 0
    let outflow = 0
    for (const event of dayEvents) {
      if (event.direction === "in") inflow += event.amount
      else outflow += event.amount
    }
    balance = balance + inflow - outflow
    points.push({ date, balance, inflow, outflow, events: dayEvents })
  }
  return points
}

export function summarizeForecast(points: ForecastPoint[]): ForecastSummary {
  let lowestBalance: { balance: number; date: string } | null = null
  let firstBelowZeroDate: string | null = null
  let totalExpectedIn = 0
  let totalExpectedOut = 0

  for (const point of points) {
    // Strict "<" keeps the earliest date when balances tie.
    if (lowestBalance === null || point.balance < lowestBalance.balance) {
      lowestBalance = { balance: point.balance, date: point.date }
    }
    if (firstBelowZeroDate === null && point.balance < 0) {
      firstBelowZeroDate = point.date
    }
    totalExpectedIn += point.inflow
    totalExpectedOut += point.outflow
  }

  return { lowestBalance, firstBelowZeroDate, totalExpectedIn, totalExpectedOut }
}
