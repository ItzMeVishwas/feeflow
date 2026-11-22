import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { seedDemoData } from "./seed"

export type Student = {
  id: string
  name: string
  parentName: string
  parentPhone: string
  monthlyFee: number
  batch: string
  active: boolean
}

export type InvoiceStatus = "unpaid" | "paid" | "overdue"

export type Payment = { id: string; amount: number; date: string } // date is ISO "YYYY-MM-DD"

export type Invoice = {
  id: string
  studentId: string
  amount: number
  month: string // "YYYY-MM"
  dueDate: string // ISO date
  status: InvoiceStatus
  paidDate: string | null
  remindersSent: number
  lastRemindedAt?: string // ISO local date "YYYY-MM-DD" of the last reminder sent
  promisedDate?: string // ISO date "YYYY-MM-DD" the parent said they will pay on
  payments?: Payment[]
}

export type Bill = {
  id: string
  name: string
  amount: number
  dueDate: string // ISO date
  recurringMonthly: boolean
}

export type FeeRules = { lateFee: { enabled: boolean; amount: number; afterDays: number }; siblingDiscount: { enabled: boolean; percent: number } };

export type Settings = {
  tutorName: string
  phone: string // tutor's own WhatsApp number
  businessName: string
  upiId: string
  startingCashBalance: number
  onboarded: boolean
  reminderLanguage: "english" | "hinglish"
  feeDay: number // day of month fees are due (1-28)
  lateFeeUnit: "flat" | "percent"
  reminderDays: 3 | 7 | 14 // auto-reminder after this many days late
  reminderTemplate: string
  compactMode: boolean
  feeRules: FeeRules
}

export type AttendanceRecord = {
  id: string
  studentId: string
  date: string // ISO local date "YYYY-MM-DD"
  present: boolean
}

export type AppState = {
  students: Student[]
  invoices: Invoice[]
  bills: Bill[]
  settings: Settings
  attendance: AttendanceRecord[]
}

export type AppActions = {
  addStudent: (student: Omit<Student, "id">) => void
  updateStudent: (id: string, patch: Partial<Omit<Student, "id">>) => void
  removeStudent: (id: string) => void

  markAttendance: (studentId: string, date: string, present: boolean) => void

  addInvoice: (invoice: Omit<Invoice, "id">) => void
  updateInvoice: (id: string, patch: Partial<Omit<Invoice, "id">>) => void
  removeInvoice: (id: string) => void
  incrementRemindersSent: (id: string) => void
  setPromisedDate: (invoiceId: string, promisedDate: string | null) => void
  recordPayment: (invoiceId: string, amount: number, date: string) => void
  undoPayment: (invoiceId: string, paymentId: string) => void

  addBill: (bill: Omit<Bill, "id">) => void
  updateBill: (id: string, patch: Partial<Omit<Bill, "id">>) => void
  removeBill: (id: string) => void

  updateSettings: (patch: Partial<Settings>) => void

  resetToDemo: () => void
  clearAll: () => void
}

export type AppStore = AppState & AppActions

const defaultSettings: Settings = {
  tutorName: "",
  phone: "",
  businessName: "",
  upiId: "",
  startingCashBalance: 0,
  onboarded: false,
  reminderLanguage: "english",
  feeDay: 5,
  lateFeeUnit: "flat",
  reminderDays: 7,
  reminderTemplate: "Hi {parentName}, a friendly reminder that {amount} for {month} is pending. Thank you!",
  compactMode: false,
  feeRules: { lateFee: { enabled: false, amount: 100, afterDays: 10 }, siblingDiscount: { enabled: false, percent: 10 } },
}

// Local calendar date as "YYYY-MM-DD" (not UTC, so it matches the user's day).
function localIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}


// localStorage is only touched when the storage getter runs (inside the
// browser), never at import time, so this stays safe during Next.js SSR.
export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      students: [],
      invoices: [],
      bills: [],
      settings: defaultSettings,
      attendance: [],

      addStudent: (student) =>
        set((state) => ({
          students: [...state.students, { ...student, id: crypto.randomUUID() }],
        })),
      updateStudent: (id, patch) =>
        set((state) => ({
          students: state.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      removeStudent: (id) =>
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
        })),

      // Upsert: one record per student per date. Re-marking updates the existing record.
      markAttendance: (studentId, date, present) =>
        set((state) => {
          const exists = state.attendance.some((a) => a.studentId === studentId && a.date === date)
          if (exists) {
            return {
              attendance: state.attendance.map((a) =>
                a.studentId === studentId && a.date === date ? { ...a, present } : a,
              ),
            }
          }
          return {
            attendance: [
              ...state.attendance,
              { id: crypto.randomUUID(), studentId, date, present },
            ],
          }
        }),

      addInvoice: (invoice) =>
        set((state) => ({
          invoices: [...state.invoices, { ...invoice, id: crypto.randomUUID() }],
        })),
      updateInvoice: (id, patch) =>
        set((state) => ({
          invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        })),
      removeInvoice: (id) =>
        set((state) => ({
          invoices: state.invoices.filter((i) => i.id !== id),
        })),
      incrementRemindersSent: (id) =>
        set((state) => {
          const today = localIsoDate(new Date())
          return {
            invoices: state.invoices.map((i) =>
              i.id === id ? { ...i, remindersSent: i.remindersSent + 1, lastRemindedAt: today } : i,
            ),
          }
        }),
      setPromisedDate: (invoiceId, promisedDate) =>
        set((state) => ({
          invoices: state.invoices.map((i): Invoice => {
            if (i.id !== invoiceId) return i
            if (promisedDate === null) {
              const cleared = { ...i }
              delete cleared.promisedDate
              return cleared
            }
            return { ...i, promisedDate }
          }),
        })),
      recordPayment: (invoiceId, amount, date) =>
        set((state) => {
          if (amount <= 0) return state
          return {
            invoices: state.invoices.map((i): Invoice => {
              if (i.id !== invoiceId) return i
              const payments = [...(i.payments ?? []), { id: crypto.randomUUID(), amount, date }]
              const total = payments.reduce((sum, p) => sum + p.amount, 0)
              return total >= i.amount
                ? { ...i, payments, status: "paid", paidDate: date }
                : { ...i, payments, status: "unpaid", paidDate: null }
            }),
          }
        }),
      undoPayment: (invoiceId, paymentId) =>
        set((state) => ({
          invoices: state.invoices.map((i): Invoice => {
            if (i.id !== invoiceId) return i
            const payments = (i.payments ?? []).filter((p) => p.id !== paymentId)
            const total = payments.reduce((sum, p) => sum + p.amount, 0)
            return total >= i.amount
              ? { ...i, payments }
              : { ...i, payments, status: "unpaid", paidDate: null }
          }),
        })),

      addBill: (bill) =>
        set((state) => ({
          bills: [...state.bills, { ...bill, id: crypto.randomUUID() }],
        })),
      updateBill: (id, patch) =>
        set((state) => ({
          bills: state.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        })),
      removeBill: (id) =>
        set((state) => ({
          bills: state.bills.filter((b) => b.id !== id),
        })),

      updateSettings: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch },
        })),

      // seedDemoData appends rows and also overwrites settings with demo values,
      // so clear the data first and restore the user's settings afterwards.
      resetToDemo: () => {
        const { settings } = get()
        set({ students: [], invoices: [], bills: [], attendance: [] })
        seedDemoData()
        set({ settings })
      },
      clearAll: () => set({ students: [], invoices: [], bills: [], attendance: [] }),
    }),
    {
      name: "feeflow-store",
      storage: createJSONStorage(() => localStorage),
      // Old persisted settings have no feeRules; fill them from the defaults.
      merge: (persistedState, currentState) => {
        const p = persistedState as Partial<AppState> | undefined
        return {
          ...currentState,
          ...p,
          settings: {
            ...defaultSettings,
            ...p?.settings,
            feeRules: { ...defaultSettings.feeRules, ...(p?.settings?.feeRules ?? {}) },
          },
        }
      },
    },
  ),
)
