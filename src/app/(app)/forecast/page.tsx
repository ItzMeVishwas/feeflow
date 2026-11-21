"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RunwayChart } from "@/components/runway-chart"
import {
  buildForecast,
  parentReliability,
  summarizeForecast,
  type ForecastScenario,
  type ForecastSummary,
} from "@/lib/forecast"
import { formatDate, formatINR } from "@/lib/format"
import { useStore } from "@/lib/store"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

type Horizon = 30 | 60 | 90
const DEFAULT_HORIZON: Horizon = 90
const MAX_DELAY_DAYS = 60

const fieldClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-base text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30 md:text-sm [&>option]:bg-background [&>option]:text-foreground"

// Whole rupees for sentences and figures, e.g. "₹28,801".
const whole = (amount: number): string => formatINR(amount, { wholeRupees: true })

function daysText(days: number): string {
  return `${days} ${days === 1 ? "day" : "days"}`
}

// Bands: 0-3 days on time (mint), 4-14 usually late (amber), 15+ risky (coral).
function reliabilityBand(days: number): { label: string; className: string } {
  if (days <= 3) return { label: "On time", className: "bg-mint" }
  if (days <= 14) return { label: "Usually late", className: "bg-amber" }
  return { label: "Risky", className: "bg-coral" }
}

// One plain-English sentence comparing the lowest balance with and without the changes.
function comparisonSentence({
  scenario,
  studentNames,
  baseline,
  withChanges,
  horizon,
}: {
  scenario: ForecastScenario | undefined
  studentNames: Map<string, string>
  baseline: ForecastSummary
  withChanges: ForecastSummary
  horizon: Horizon
}): string {
  const before = baseline.lowestBalance
  const after = withChanges.lowestBalance
  if (!before || !after) return ""

  const clauses: string[] = []
  if (scenario?.delayStudentId && scenario.delayDays) {
    const name = studentNames.get(scenario.delayStudentId) ?? "This student"
    clauses.push(`${name} pays ${daysText(scenario.delayDays)} late`)
  }
  if (scenario?.dropStudentId) {
    clauses.push(`${studentNames.get(scenario.dropStudentId) ?? "This student"} leaves`)
  }
  if (scenario?.extraExpense) {
    const { amount, date } = scenario.extraExpense
    clauses.push(`you spend ${whole(amount)} on ${formatDate(date)}`)
  }

  if (clauses.length === 0) {
    return `Nothing is changed yet. Your lowest balance over the next ${horizon} days is ${whole(before.balance)} on ${formatDate(before.date)}. Use What if to test a change.`
  }

  const condition = `If ${clauses.join(" and ")}`
  const when = formatDate(after.date)
  if (after.balance < before.balance) {
    return `${condition}, your lowest balance over the next ${horizon} days drops from ${whole(before.balance)} to ${whole(after.balance)} on ${when}.`
  }
  if (after.balance > before.balance) {
    return `${condition}, your lowest balance over the next ${horizon} days rises from ${whole(before.balance)} to ${whole(after.balance)} on ${when}.`
  }
  return `${condition}, your lowest balance over the next ${horizon} days stays at ${whole(after.balance)} on ${when}.`
}

export default function ForecastPage() {
  // Zustand persist reads localStorage on the client only, so the server HTML
  // would not match the first client render. Wait for mount before showing data.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  const students = useStore((s) => s.students)
  const invoices = useStore((s) => s.invoices)
  const bills = useStore((s) => s.bills)
  const settings = useStore((s) => s.settings)

  const [horizon, setHorizon] = useState<Horizon>(DEFAULT_HORIZON)
  const [delayStudentId, setDelayStudentId] = useState("")
  const [delayDays, setDelayDays] = useState(0)
  const [dropStudentId, setDropStudentId] = useState("")
  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseDate, setExpenseDate] = useState("")

  const studentNames = useMemo(
    () => new Map<string, string>(students.map((s) => [s.id, s.name])),
    [students],
  )

  // Only changes that have an effect go into the scenario, so "no change" is undefined.
  const scenario = useMemo<ForecastScenario | undefined>(() => {
    const next: ForecastScenario = {}
    if (delayStudentId && delayDays > 0) {
      next.delayStudentId = delayStudentId
      next.delayDays = delayDays
    }
    if (dropStudentId) next.dropStudentId = dropStudentId
    const amount = Number(expenseAmount)
    if (expenseDate && expenseAmount !== "" && Number.isFinite(amount) && amount > 0) {
      next.extraExpense = { amount, date: expenseDate }
    }
    return Object.keys(next).length > 0 ? next : undefined
  }, [delayStudentId, delayDays, dropStudentId, expenseAmount, expenseDate])

  const state = useMemo(
    () => ({ students, invoices, bills, settings }),
    [students, invoices, bills, settings],
  )
  const baselineSummary = useMemo(
    () => summarizeForecast(buildForecast(state, horizon)),
    [state, horizon],
  )
  const withChangesSummary = useMemo(
    () => summarizeForecast(buildForecast(state, horizon, scenario)),
    [state, horizon, scenario],
  )

  const sentence = comparisonSentence({
    scenario,
    studentNames,
    baseline: baselineSummary,
    withChanges: withChangesSummary,
    horizon,
  })

  const reliabilityRows = useMemo(
    () =>
      students
        .map((student) => ({
          student,
          days: parentReliability(student.id, invoices),
          hasHistory: invoices.some(
            (i) => i.studentId === student.id && i.status === "paid" && Boolean(i.paidDate),
          ),
        }))
        .sort((a, b) => a.student.name.localeCompare(b.student.name)),
    [students, invoices],
  )
  const anyHistory = reliabilityRows.some((row) => row.hasHistory)

  const hasChanges =
    delayStudentId !== "" || dropStudentId !== "" || expenseAmount !== "" || expenseDate !== ""

  function handleDelayStudentChange(id: string) {
    setDelayStudentId(id)
    if (!id) setDelayDays(0)
  }

  function resetChanges() {
    setDelayStudentId("")
    setDelayDays(0)
    setDropStudentId("")
    setExpenseAmount("")
    setExpenseDate("")
  }

  if (!mounted) {
    return <p className="text-sm text-muted-foreground">Loading forecast…</p>
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Forecast</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          See when cash runs short, and test what a late payment or a student leaving would do.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-3">
          <RunwayChart
            scenario={scenario}
            horizon={horizon}
            onHorizonChange={setHorizon}
            showBaseline
          />
          <p className="px-1 text-sm tabular-nums text-foreground">{sentence}</p>
        </div>

        <section
          aria-labelledby="what-if-heading"
          className="glass space-y-6 rounded-2xl p-5 lg:sticky lg:top-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="what-if-heading" className="text-lg font-semibold text-foreground">
              What if…
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={resetChanges} disabled={!hasChanges}>
              Clear all changes
            </Button>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="what-if-delay-student" className="block text-sm font-medium text-foreground">
                Parent pays late
              </label>
              <select
                id="what-if-delay-student"
                value={delayStudentId}
                onChange={(e) => handleDelayStudentChange(e.target.value)}
                className={fieldClass}
              >
                <option value="">Choose a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <label htmlFor="what-if-delay-days" className="text-muted-foreground">
                Days late
              </label>
              <span className="font-display tabular-nums text-foreground">
                {delayStudentId ? daysText(delayDays) : "Not set"}
              </span>
            </div>
            <input
              id="what-if-delay-days"
              type="range"
              min={0}
              max={MAX_DELAY_DAYS}
              step={1}
              value={delayDays}
              disabled={!delayStudentId}
              onChange={(e) => setDelayDays(Number(e.target.value))}
              className="w-full accent-amber disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="what-if-drop-student" className="block text-sm font-medium text-foreground">
              Student leaves
            </label>
            <select
              id="what-if-drop-student"
              value={dropStudentId}
              onChange={(e) => setDropStudentId(e.target.value)}
              className={fieldClass}
            >
              <option value="">Nobody leaves</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Their unpaid invoices and future fees stop counting.
            </p>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">One-time expense</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="what-if-expense-amount" className="block text-xs text-muted-foreground">
                  Amount (₹)
                </label>
                <Input
                  id="what-if-expense-amount"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1}
                  placeholder="0"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="what-if-expense-date" className="block text-xs text-muted-foreground">
                  Date
                </label>
                <Input
                  id="what-if-expense-date"
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Counts only if the date falls inside the forecast window.
            </p>
          </fieldset>
        </section>
      </div>

      <section aria-labelledby="reliability-heading" className="space-y-4">
        <div>
          <h2 id="reliability-heading" className="text-lg font-semibold tracking-tight text-foreground">
            Parent reliability
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How many days after the due date each parent has usually paid.
          </p>
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add a student to see how each parent pays.
          </p>
        ) : (
          <>
            {!anyHistory && (
              <p className="text-sm text-muted-foreground">
                No paid invoices yet. Record a paid invoice to see how late each parent usually pays.
              </p>
            )}
            <ul className="space-y-2">
              {reliabilityRows.map(({ student, days, hasHistory }) => {
                const band = reliabilityBand(days)
                return (
                  <li
                    key={student.id}
                    className="glass flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="break-words font-medium text-foreground">{student.name}</p>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        {hasHistory ? `Averages ${daysText(days)} late` : "No paid invoices yet"}
                      </p>
                    </div>
                    {hasHistory && (
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold text-slate-900 ${band.className}`}
                      >
                        {band.label}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}
