// Sample-data model for the landing page "what if a parent pays late" demo.
// Illustrative numbers only; nothing here reads real student data.

const START_BALANCE = 8000
const DAYS = 90
const CYCLE_DAYS = 30 // one "month" in the demo

// Outflows, by cycle day (day 1 of each month = cycle day 1)
const ASSISTANT_COST = 4000
const RENT = 7000
const INTERNET = 999
const EXTRA_MONTHLY_COST = 6500 // other monthly running costs
const RENT_DAY = 5
const INTERNET_DAY = 10
const EXTRA_COST_DAY = 15

// On-time student fees, by cycle day (14000 total per month)
const ON_TIME_FEES: { cycleDay: number; amount: number }[] = [
  { cycleDay: 3, amount: 4000 },
  { cycleDay: 4, amount: 4000 },
  { cycleDay: 5, amount: 4000 },
  { cycleDay: 6, amount: 2000 },
]

// The one parent who can be late. Due on cycle day 5, paid LATE_DUE_DAY + lateDays.
const LATE_PARENT_FEE = 2500
const LATE_DUE_DAY = 5

export function balanceSeries(opts: { lateDays: number; studentLeaves: boolean }): {
  values: number[]
  labels: string[]
  lowest: { value: number; day: number }
  leaverNote: string
} {
  const flows: number[] = new Array(DAYS + 1).fill(0) // index = day number (1-based)
  const addOn = (day: number, amount: number) => {
    if (day >= 1 && day <= DAYS) flows[day] += amount
  }

  for (let cycle = 0; cycle < 3; cycle++) {
    const base = cycle * CYCLE_DAYS // absolute day = base + cycle day

    addOn(base + 1, -ASSISTANT_COST)
    addOn(base + RENT_DAY, -RENT)
    addOn(base + INTERNET_DAY, -INTERNET)
    addOn(base + EXTRA_COST_DAY, -EXTRA_MONTHLY_COST)

    for (const fee of ON_TIME_FEES) addOn(base + fee.cycleDay, fee.amount)

    // Leaving student: the parent only pays in the first cycle.
    const parentPays = !(opts.studentLeaves && cycle >= 1)
    if (parentPays) addOn(base + LATE_DUE_DAY + opts.lateDays, LATE_PARENT_FEE) // dropped if past DAYS
  }

  const values: number[] = []
  const labels: string[] = []
  let balance = START_BALANCE
  let lowest = { value: Infinity, day: 1 }
  for (let day = 1; day <= DAYS; day++) {
    balance += flows[day]
    values.push(balance)
    labels.push(`Day ${day}`)
    if (balance < lowest.value) lowest = { value: balance, day }
  }

  return {
    values,
    labels,
    lowest,
    leaverNote: opts.studentLeaves ? "Their fees stop after the first month." : "",
  }
}
