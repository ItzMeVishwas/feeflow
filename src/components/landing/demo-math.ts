// Sample-data model for the landing page "what if a parent pays late" demo.
// Illustrative numbers only; nothing here reads real student data.

const START_BALANCE = 12000
const DAYS = 90
const STUDENTS = 8
const FEE = 1500
const OUTFLOW = 9000

export function balanceSeries(opts: { lateDays: number; studentLeaves: boolean }): {
  values: number[]
  labels: string[]
  lowest: { value: number; day: number }
  leaverNote: string
} {
  const flows: number[] = new Array(DAYS + 1).fill(0) // index = day number (1-based)

  for (let cycle = 0; cycle < 3; cycle++) {
    const dueDay = 5 + cycle * 30
    flows[1 + cycle * 30] -= OUTFLOW
    // The other students pay on time; the demo parent is the only one who can be late.
    flows[dueDay] += (STUDENTS - 1) * FEE
    const parentLeft = opts.studentLeaves && cycle >= 1
    if (!parentLeft) {
      const paidDay = dueDay + opts.lateDays
      if (paidDay <= DAYS) flows[paidDay] += FEE
    }
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
