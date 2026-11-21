"use client"

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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatINR } from "@/lib/format"
import { useStore } from "@/lib/store"

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

// Store hydration is reported through zustand's persist API. Using
// useSyncExternalStore keeps the server render and the first client render
// identical (both "not hydrated"), so the table never shows empty-then-real data.
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
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getServerHydrated,
  )

  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<StudentFormValues>(emptyForm)
  const [errors, setErrors] = useState<StudentFormErrors>({})

  // Sum of each student's invoices that are not yet paid.
  const amountOwedByStudent = useMemo(() => {
    const owed = new Map<string, number>()
    for (const invoice of invoices) {
      if (invoice.status === "paid") continue
      owed.set(invoice.studentId, (owed.get(invoice.studentId) ?? 0) + invoice.amount)
    }
    return owed
  }, [invoices])

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

  function renderBody() {
    if (!hydrated) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
            Loading students…
          </TableCell>
        </TableRow>
      )
    }

    if (students.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
            No students yet. Add your first student to get started.
          </TableCell>
        </TableRow>
      )
    }

    if (visibleStudents.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
            No students match “{query.trim()}”.
          </TableCell>
        </TableRow>
      )
    }

    return visibleStudents.map((student) => {
      const owed = amountOwedByStudent.get(student.id) ?? 0
      return (
        <TableRow key={student.id}>
          <TableCell className="font-medium">{student.name}</TableCell>
          <TableCell>{student.parentName}</TableCell>
          <TableCell>{student.parentPhone}</TableCell>
          <TableCell>{student.batch}</TableCell>
          <TableCell className="text-right tabular-nums">
            {formatINR(student.monthlyFee)}
          </TableCell>
          <TableCell
            className={
              owed > 0
                ? "text-right tabular-nums text-destructive"
                : "text-right tabular-nums"
            }
          >
            {formatINR(owed)}
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Students
        </h1>

        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger render={<Button />}>Add student</DialogTrigger>
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
      </div>

      <Input
        type="search"
        aria-label="Search students"
        placeholder="Search by name, parent, phone or batch"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead className="text-right">Monthly fee</TableHead>
            <TableHead className="text-right">Amount owed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{renderBody()}</TableBody>
      </Table>
    </div>
  )
}
