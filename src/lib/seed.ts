import { useStore, type InvoiceStatus, type Student } from "./store"

type DemoStudent = {
  name: string
  parentName: string
  parentPhone: string
  monthlyFee: number
  batch: string
  // Days after the due date that this parent pays. 0 = pays on time or a little early.
  latePaymentDays: number
}

const DEMO_STUDENTS: DemoStudent[] = [
  { name: "Aarav Deshmukh", parentName: "Sunita Deshmukh", parentPhone: "+91 99999 10001", monthlyFee: 2000, batch: "Morning 8am", latePaymentDays: 18 },
  { name: "Ananya Kulkarni", parentName: "Rajesh Kulkarni", parentPhone: "+91 99999 10002", monthlyFee: 1800, batch: "Morning 8am", latePaymentDays: 0 },
  { name: "Vihaan Joshi", parentName: "Meera Joshi", parentPhone: "+91 99999 10003", monthlyFee: 2000, batch: "Morning 8am", latePaymentDays: 0 },
  { name: "Diya Patil", parentName: "Anil Patil", parentPhone: "+91 99999 10004", monthlyFee: 2200, batch: "Morning 8am", latePaymentDays: 22 },
  { name: "Ishaan Pawar", parentName: "Kavita Pawar", parentPhone: "+91 99999 10005", monthlyFee: 1500, batch: "Morning 8am", latePaymentDays: 0 },
  { name: "Saanvi Gokhale", parentName: "Prasad Gokhale", parentPhone: "+91 99999 10006", monthlyFee: 2500, batch: "Evening 6pm", latePaymentDays: 0 },
  { name: "Arjun Shinde", parentName: "Vandana Shinde", parentPhone: "+91 99999 10007", monthlyFee: 1800, batch: "Evening 6pm", latePaymentDays: 15 },
  { name: "Kiara Mane", parentName: "Suresh Mane", parentPhone: "+91 99999 10008", monthlyFee: 1500, batch: "Evening 6pm", latePaymentDays: 0 },
  { name: "Reyansh Bapat", parentName: "Neha Bapat", parentPhone: "+91 99999 10009", monthlyFee: 2500, batch: "Evening 6pm", latePaymentDays: 0 },
  { name: "Myra Phadke", parentName: "Harish Phadke", parentPhone: "+91 99999 10010", monthlyFee: 2000, batch: "Evening 6pm", latePaymentDays: 25 },
  { name: "Advait Sawant", parentName: "Pooja Sawant", parentPhone: "+91 99999 10011", monthlyFee: 1800, batch: "Evening 6pm", latePaymentDays: 0 },
  { name: "Tara Ghorpade", parentName: "Rohit Ghorpade", parentPhone: "+91 99999 10012", monthlyFee: 2200, batch: "Evening 6pm", latePaymentDays: 0 },
]

// Formats a Date as "YYYY-MM" using local time.
function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

// Returns the last `count` calendar months, oldest first, ending with the previous month.
function previousMonths(count: number): string[] {
  const now = new Date()
  const months: string[] = []
  for (let back = count; back >= 1; back--) {
    months.push(formatMonth(new Date(now.getFullYear(), now.getMonth() - back, 1)))
  }
  return months
}

// Adds days to an ISO date string ("YYYY-MM-DD") and returns the new ISO date string.
function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

// Local calendar date as "YYYY-MM-DD" (same as localIsoDate in store.ts).
function localIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Indexes into DEMO_STUDENTS of the students who also miss a few extra classes.
const EXTRA_ABSENCE_INDEXES = [3, 7, 10]

// Seeds Mon-Fri attendance for the last 6 weeks, ending today. Mostly present:
// about 1 in 10 weekdays is absent per student, and a few students miss more often.
// Uses markAttendance (upsert), so running it again does not create duplicates.
function seedAttendance(savedStudents: Student[]): void {
  const { markAttendance } = useStore.getState()
  const today = new Date()

  const weekdays: string[] = []
  for (let back = 41; back >= 0; back--) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - back)
    const dayOfWeek = day.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) weekdays.push(localIsoDate(day))
  }

  DEMO_STUDENTS.forEach((demo, index) => {
    const student = savedStudents.find((s) => s.parentPhone === demo.parentPhone)
    if (!student) return

    weekdays.forEach((date, dayIndex) => {
      const regularAbsence = (index * 5 + dayIndex * 3) % 10 === 0
      const extraAbsence = EXTRA_ABSENCE_INDEXES.includes(index) && dayIndex % 8 === 2
      markAttendance(student.id, date, !(regularAbsence || extraAbsence))
    })
  })
}

// Fills the store with fake Pune tuition data: students, 4 months of invoices,
// monthly bills, and settings. Call only on an empty store to avoid duplicates.
export function seedDemoData(): void {
  const { addStudent, addInvoice, addBill, updateSettings } = useStore.getState()

  for (const demo of DEMO_STUDENTS) {
    addStudent({
      name: demo.name,
      parentName: demo.parentName,
      parentPhone: demo.parentPhone,
      monthlyFee: demo.monthlyFee,
      batch: demo.batch,
      active: true,
    })
  }

  // The store generates student ids, so read them back and match by phone number.
  const savedStudents = useStore.getState().students
  const now = new Date()
  const currentMonth = formatMonth(now)
  // 4 past months, then the current month (oldest first).
  const months = [...previousMonths(4), currentMonth]
  const latestMonth = currentMonth
  // The month just before the current one: the most recent month that is fully past.
  const lastPastMonth = months[months.length - 2]

  DEMO_STUDENTS.forEach((demo, index) => {
    const student = savedStudents.find((s) => s.parentPhone === demo.parentPhone)
    if (!student) return

    for (const month of months) {
      const isLate = demo.latePaymentDays > 0

      if (month === latestMonth) {
        // Current month: due on day 5-9, spread across students. Only the first student has paid.
        const currentDueDate = `${month}-${String(5 + (index % 5)).padStart(2, "0")}`
        const isFirstPaid = index === 0
        addInvoice({
          studentId: student.id,
          amount: demo.monthlyFee,
          month,
          dueDate: currentDueDate,
          status: isFirstPaid ? "paid" : "unpaid",
          paidDate: isFirstPaid ? currentDueDate : null,
          ...(isFirstPaid
            ? { payments: [{ id: crypto.randomUUID(), amount: demo.monthlyFee, date: currentDueDate }] }
            : {}),
          remindersSent: 0,
        })
        continue
      }

      const dueDate = `${month}-05`

      let status: InvoiceStatus = "paid"
      let paidDate: string | null = null

      if (month === lastPastMonth && index === 10) {
        status = "overdue"
      } else if (month === lastPastMonth && index === 11) {
        status = "unpaid"
      } else if (isLate) {
        // Late parents pay a fixed number of days after the due date, in every month.
        paidDate = addDays(dueDate, demo.latePaymentDays)
      } else {
        // On-time parents pay on the due date or up to 2 days early.
        paidDate = addDays(dueDate, -(index % 3))
      }

      addInvoice({
        studentId: student.id,
        amount: demo.monthlyFee,
        month,
        dueDate,
        status,
        paidDate,
        remindersSent: isLate ? 1 : 0,
      })
    }
  })

  seedAttendance(savedStudents)

  const billMonth = formatMonth(new Date())

  addBill({ name: "Room rent", amount: 6500, dueDate: `${billMonth}-05`, recurringMonthly: true })
  addBill({ name: "Internet", amount: 999, dueDate: `${billMonth}-10`, recurringMonthly: true })
  addBill({ name: "Part-time assistant", amount: 4000, dueDate: `${billMonth}-01`, recurringMonthly: true })
  addBill({ name: "Printer + whiteboard", amount: 3200, dueDate: addDays(localIsoDate(new Date()), 21), recurringMonthly: false })

  updateSettings({
    tutorName: "Priya Sharma",
    upiId: "feeflow.demo@upi",
    startingCashBalance: 40000,
  })
}
