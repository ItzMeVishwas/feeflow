"use client"

import Link from "next/link"
import { useMemo, useState, useSyncExternalStore } from "react"
import type { FormEvent } from "react"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MessageAllDialog } from "@/components/message-all-dialog"
import { PageHeader } from "@/components/page-header"
import { StatusPill, type PillTone } from "@/components/status-pill"
import { RecordPaymentDialog } from "@/components/record-payment-dialog"
import { ReminderDialog } from "@/components/reminder-dialog"
import { parentReliability } from "@/lib/forecast"
import { formatINR } from "@/lib/format"
import { useStore } from "@/lib/store"

type StoreState = ReturnType<typeof useStore.getState>
type Student = StoreState["students"][number]
type Invoice = StoreState["invoices"][number]
type InvoiceTarget = { invoice: Invoice; student: Student }

type StudentFormValues = {
  name: string
  parentName: string
  parentPhone: string
  batch: string
  monthlyFee: string
}

type StudentFormErrors = Partial<Record<keyof StudentFormValues, string>>

const emptyForm: StudentFormValues = {
  name: "",
  parentName: "",
  parentPhone: "",
  batch: "",
  monthlyFee: "",
}

const formFields: {
  key: keyof StudentFormValues
  label: string
  type: "text" | "tel" | "number"
  required: boolean
}[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "parentName", label: "Parent name", type: "text", required: true },
  { key: "parentPhone", label: "Parent phone", type: "tel", required: true },
  { key: "batch", label: "Batch", type: "text", required: false },
  { key: "monthlyFee", label: "Monthly fee (₹)", type: "number", required: true },
]

// Primary action colour: navy with white text.
const primaryButtonClass =
  "rounded-xl bg-[#0B2A55] font-semibold text-white hover:bg-[#133A72] dark:bg-[#0E9F8E] dark:hover:bg-[#0C8A7B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"

// White content card: 1px border, 24px radius, soft two-part shadow.
const cardClass =
  "rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)] dark:border-white/10 dark:bg-[#121E36]"

function validateStudentForm(values: StudentFormValues): StudentFormErrors {
  const errors: StudentFormErrors = {}

  if (!values.name.trim()) errors.name = "Enter the student's name."
  if (!values.parentName.trim()) errors.parentName = "Enter the parent's name."
  if (!values.parentPhone.trim()) errors.parentPhone = "Enter the parent's phone number."

  const fee = values.monthlyFee.trim()
  if (fee === "") {
    errors.monthlyFee = "Enter the monthly fee."
  } else if (!Number.isFinite(Number(fee)) || Number(fee) < 0) {
    errors.monthlyFee = "Enter a fee of 0 or more."
  }

  return errors
}

// Reliability is the average number of days a parent pays late.
function reliabilityFor(days: number): { label: string; tone: PillTone } {
  if (days < 4) {
    return { label: "On time", tone: "paid" }
  }
  if (days < 15) {
    return { label: "Usually late", tone: "due" }
  }
  return { label: "Risky", tone: "overdue" }
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

// Wraps a CSV field in quotes when needed and doubles any embedded quotes.
function escapeCsv(value: string | number): string {
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Store hydration is reported through zustand's persist API. Using
// useSyncExternalStore keeps the server render and the first client render
// identical (both "not hydrated"), so the list never shows empty-then-real data.
function subscribeToHydration(onChange: () => void) {
  return useStore.persist.onFinishHydration(onChange)
}

function getHydrated() {
  return useStore.persist.hasHydrated()
}

function getServerHydrated() {
  return false
}

export default function StudentsPage() {
  const students = useStore((s) => s.students)
  const invoices = useStore((s) => s.invoices)
  const addStudent = useStore((s) => s.addStudent)
  const upiId = useStore((s) => s.settings.upiId)
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getServerHydrated,
  )

  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<StudentFormValues>(emptyForm)
  const [errors, setErrors] = useState<StudentFormErrors>({})
  const [reminderTarget, setReminderTarget] = useState<InvoiceTarget | null>(null)
  const [paymentTarget, setPaymentTarget] = useState<InvoiceTarget | null>(null)
  const [messageAllOpen, setMessageAllOpen] = useState(false)

  // Sum of each student's invoices that are not yet paid.
  const amountOwedByStudent = useMemo(() => {
    const owed = new Map<string, number>()
    for (const invoice of invoices) {
      if (invoice.status === "paid") continue
      owed.set(invoice.studentId, (owed.get(invoice.studentId) ?? 0) + invoice.amount)
    }
    return owed
  }, [invoices])

  // The unpaid invoice with the earliest due date, per student.
  const oldestUnpaidByStudent = useMemo(() => {
    const oldest = new Map<string, Invoice>()
    for (const invoice of invoices) {
      if (invoice.status === "paid") continue
      const current = oldest.get(invoice.studentId)
      if (!current || invoice.dueDate < current.dueDate) {
        oldest.set(invoice.studentId, invoice)
      }
    }
    return oldest
  }, [invoices])

  const activeCount = useMemo(
    () => students.filter((student) => student.active).length,
    [students],
  )

  const visibleStudents = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return students
    return students.filter((student) =>
      [student.name, student.parentName, student.parentPhone, student.batch].some(
        (field) => field.toLowerCase().includes(term),
      ),
    )
  }, [students, query])

  function resetForm() {
    setForm(emptyForm)
    setErrors({})
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) resetForm()
  }

  function updateField(key: keyof StudentFormValues, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateStudentForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    addStudent({
      name: form.name.trim(),
      parentName: form.parentName.trim(),
      parentPhone: form.parentPhone.trim(),
      batch: form.batch.trim(),
      monthlyFee: Number(form.monthlyFee),
      active: true,
    })
    setDialogOpen(false)
    resetForm()
  }

  function handleExportCsv() {
    const header = ["name", "parent", "phone", "batch", "fee", "owed", "reliability"]
    const rows = visibleStudents.map((student) => {
      const owed = amountOwedByStudent.get(student.id) ?? 0
      const reliability = reliabilityFor(parentReliability(student.id, invoices)).label
      return [
        student.name,
        student.parentName,
        student.parentPhone,
        student.batch,
        student.monthlyFee,
        owed,
        reliability,
      ]
        .map(escapeCsv)
        .join(",")
    })
    const csv = [header.join(","), ...rows].join("\r\n")

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "students.csv"
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  function renderStudentRow(student: Student) {
    const owed = amountOwedByStudent.get(student.id) ?? 0
    const oldest = oldestUnpaidByStudent.get(student.id)
    const days = parentReliability(student.id, invoices)
    const reliability = reliabilityFor(days)

    return (
      <li
        key={student.id}
        className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted dark:hover:bg-white/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B2A55]/10 text-sm font-semibold text-[#0B2A55] dark:bg-[#7FA0D9]/15 dark:text-[#9DB6E6]"
          >
            {initialsOf(student.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-foreground">{student.name}</p>
              {student.batch ? (
                <span className="rounded-xl border border-border px-2 py-0.5 text-xs text-foreground">
                  {student.batch}
                </span>
              ) : null}
            </div>
            <p className="truncate text-sm text-muted-foreground">{student.parentName}</p>
            <p className="text-sm tabular-nums text-muted-foreground">{student.parentPhone}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 sm:justify-end">
          <div>
            <p className="text-xs text-muted-foreground">Monthly fee</p>
            <p className="tabular-nums text-foreground">{formatINR(student.monthlyFee)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Amount owed</p>
            <p
              className={
                owed > 0
                  ? "font-medium tabular-nums text-[#D93F3F]"
                  : "tabular-nums text-foreground"
              }
            >
              {formatINR(owed)}
            </p>
          </div>
          <span title={`Pays on average ${days} days late`}>
            <StatusPill tone={reliability.tone}>{reliability.label}</StatusPill>
          </span>
          <div className="flex items-center gap-2">
            {oldest ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReminderTarget({ invoice: oldest, student })}
                >
                  Remind
                </Button>
                <Button
                  size="sm"
                  className={primaryButtonClass}
                  onClick={() => setPaymentTarget({ invoice: oldest, student })}
                >
                  Record payment
                </Button>
              </>
            ) : null}
            <Link
              href={`/students/${student.id}/statement`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Statement
            </Link>
          </div>
        </div>
      </li>
    )
  }

  function renderBody() {
    if (!hydrated) {
      return (
        <p className={`${cardClass} p-6 text-center text-muted-foreground`}>
          Loading students…
        </p>
      )
    }

    if (students.length === 0) {
      return (
        <div className={`${cardClass} flex flex-col items-center gap-2 p-6 text-center`}>
          <p className="font-medium text-foreground">No students yet.</p>
          <p className="text-sm text-muted-foreground">
            Add your first student to start tracking fees.
          </p>
          <Button
            size="sm"
            className={`mt-2 ${primaryButtonClass}`}
            onClick={() => setDialogOpen(true)}
          >
            Add student
          </Button>
        </div>
      )
    }

    if (visibleStudents.length === 0) {
      return (
        <p className={`${cardClass} p-6 text-center text-muted-foreground`}>
          {`No students match "${query.trim()}"`}
        </p>
      )
    }

    return (
      <ul
        role="list"
        className={`${cardClass} divide-y divide-border overflow-hidden dark:divide-white/10`}
      >
        {visibleStudents.map(renderStudentRow)}
      </ul>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Students"
        description="See who is active, what each parent owes and how reliably they pay."
        action={
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <Input
              type="search"
              aria-label="Search students"
              placeholder="Search by name, parent, phone or batch"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full rounded-xl sm:w-64"
            />
            <Button
              variant="outline"
              onClick={handleExportCsv}
              disabled={!hydrated || visibleStudents.length === 0}
            >
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => setMessageAllOpen(true)}>
              Message all parents
            </Button>
            <Button className={primaryButtonClass} onClick={() => setDialogOpen(true)}>
              Add student
            </Button>
          </div>
        }
      />

      {hydrated ? (
        <p className="-mt-4 text-sm tabular-nums text-muted-foreground dark:text-[#93A3BC]">
          {`${activeCount} active`}
        </p>
      ) : null}

      {renderBody()}

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <form onSubmit={handleSubmit} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Add student</DialogTitle>
              <DialogDescription>
                Enter the student and parent details.
              </DialogDescription>
            </DialogHeader>

            {formFields.map((field) => {
              const inputId = `student-${field.key}`
              const errorId = `${inputId}-error`
              const error = errors[field.key]
              return (
                <div key={field.key} className="grid gap-1.5">
                  <Label htmlFor={inputId}>
                    {field.label}
                    {field.required ? null : (
                      <span className="font-normal text-muted-foreground">(optional)</span>
                    )}
                  </Label>
                  <Input
                    id={inputId}
                    type={field.type}
                    min={field.type === "number" ? 0 : undefined}
                    step={field.type === "number" ? "any" : undefined}
                    value={form[field.key]}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                  />
                  {error ? (
                    <p id={errorId} className="text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              )
            })}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                Cancel
              </DialogClose>
              <Button type="submit">Save student</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {reminderTarget ? (
        <ReminderDialog
          invoice={reminderTarget.invoice}
          student={reminderTarget.student}
          upiId={upiId}
          open
          onClose={() => setReminderTarget(null)}
        />
      ) : null}

      {paymentTarget ? (
        <RecordPaymentDialog
          invoice={paymentTarget.invoice}
          student={paymentTarget.student}
          open
          onOpenChange={(open) => {
            if (!open) setPaymentTarget(null)
          }}
        />
      ) : null}

      <MessageAllDialog
        open={messageAllOpen}
        onOpenChange={setMessageAllOpen}
        students={students}
      />
    </div>
  )
}
