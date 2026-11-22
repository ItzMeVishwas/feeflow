"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { ReminderDialog } from "@/components/reminder-dialog"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { parseCommand, type ParsedCommand } from "@/lib/command-parser"
import { formatDate, formatINR } from "@/lib/format"
import { amountDue, deriveStatus, toIsoDate } from "@/lib/invoice-status"
import { usePaletteStore } from "@/lib/palette-store"
import { useStore, type Invoice, type Student } from "@/lib/store"

const PAGES = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/students", label: "Students" },
  { href: "/invoices", label: "Invoices" },
  { href: "/bills", label: "Bills" },
  { href: "/forecast", label: "Forecast" },
  { href: "/settings", label: "Settings" },
]

const QUICK_ACTIONS = [
  { id: "generate", label: "Generate this month's invoices", keywords: "generate invoices" },
  { id: "chase", label: "Chase all overdue", keywords: "chase overdue remind" },
]

const TRY_SAYING = ["pooja paid 1800", "remind tara", "add rohan 2000 evening batch", "rohan owes 1500 due friday"]

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

type ReminderTarget = { invoice: Invoice; student: Student }

type PaymentCommand = Extract<NonNullable<ParsedCommand>, { kind: "payment" }>

// Short month name from "YYYY-MM", e.g. "2025-10" -> "Oct".
function shortMonth(month: string): string {
  return MONTH_SHORT[Number(month.slice(5, 7)) - 1] ?? month
}

// Oldest invoice of a student that still has money owed. Undefined if none.
function oldestOpenInvoice(invoices: Invoice[], studentId: string): Invoice | undefined {
  return invoices
    .filter((i) => i.studentId === studentId && amountDue(i) > 0)
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0))[0]
}

function money(amount: number): ReactNode {
  return <span className="tabular-nums">{formatINR(amount, { wholeRupees: true })}</span>
}

// Shows the parent's name, falling back to the student's name when none is stored.
function parentLabel(student: Student | undefined): string {
  if (!student) return "Unknown student"
  return student.parentName || student.name
}

// Plain-language preview of what the typed command will do.
function previewOf(parsed: NonNullable<ParsedCommand>, students: Student[]): ReactNode {
  switch (parsed.kind) {
    case "payment": {
      const student = students.find((s) => s.id === parsed.studentId)
      const firstName = student?.name.split(" ")[0] ?? ""
      return (
        <>
          Record {money(parsed.amount)} from {parentLabel(student)} for {firstName}
          {parsed.month ? ` (${shortMonth(parsed.month)})` : ""}
        </>
      )
    }
    case "remind": {
      const student = students.find((s) => s.id === parsed.studentId)
      return <>Send reminder to {parentLabel(student)}</>
    }
    case "addStudent":
      return (
        <>
          Add {parsed.name} at {money(parsed.fee)}
          {parsed.batch ? ` (${parsed.batch} batch)` : ""}
        </>
      )
    case "invoice": {
      const student = students.find((s) => s.id === parsed.studentId)
      return `Create a ${formatINR(parsed.amount, { wholeRupees: true })} invoice for ${student?.name ?? "this student"}, due ${formatDate(parsed.dueDate)}`
    }
    case "navigate": {
      const page = PAGES.find((p) => p.href === parsed.href)
      return <>Go to {page?.label ?? parsed.href}</>
    }
  }
}

export function CommandPalette() {
  const router = useRouter()
  const open = usePaletteStore((s) => s.open)
  const setOpen = usePaletteStore((s) => s.setOpen)

  const students = useStore((s) => s.students)
  const invoices = useStore((s) => s.invoices)
  const upiId = useStore((s) => s.settings.upiId)
  const addStudent = useStore((s) => s.addStudent)
  const addInvoice = useStore((s) => s.addInvoice)
  const recordPayment = useStore((s) => s.recordPayment)

  const [query, setQuery] = useState("")
  const [reminder, setReminder] = useState<ReminderTarget | null>(null)

  // Ctrl+K or Cmd+K toggles the palette from anywhere in the app.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        const { open: isOpen, setOpen: set } = usePaletteStore.getState()
        if (isOpen) setQuery("")
        set(!isOpen)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const parsed = useMemo(() => parseCommand(query, { students }), [query, students])

  function closePalette() {
    setQuery("")
    setOpen(false)
  }

  function handleOpenChange(next: boolean) {
    if (!next) setQuery("")
    setOpen(next)
  }

  function recordParsedPayment(command: PaymentCommand) {
    const student = students.find((s) => s.id === command.studentId)
    const invoice = command.month
      ? invoices.find((i) => i.studentId === command.studentId && i.month === command.month)
      : oldestOpenInvoice(invoices, command.studentId)
    closePalette()

    if (!student || !invoice) {
      toast.error(`No open invoice for ${student?.name ?? "this student"}. Generate this month's invoices first.`)
      return
    }
    recordPayment(invoice.id, command.amount, toIsoDate(new Date()))
    toast.success(`Recorded ${formatINR(command.amount)} from ${parentLabel(student)}`)
  }

  function openReminder(studentId: string) {
    const student = students.find((s) => s.id === studentId)
    const invoice = oldestOpenInvoice(invoices, studentId)
    closePalette()

    if (!student) {
      toast.error("Student not found.")
      return
    }
    if (!invoice) {
      toast.error(`${student.name} has no unpaid invoice.`)
      return
    }
    setReminder({ invoice, student })
  }

  function runParsed(command: NonNullable<ParsedCommand>) {
    switch (command.kind) {
      case "payment":
        recordParsedPayment(command)
        return
      case "remind":
        openReminder(command.studentId)
        return
      case "addStudent":
        closePalette()
        addStudent({
          name: command.name,
          parentName: "",
          parentPhone: "",
          monthlyFee: command.fee,
          batch: command.batch ?? "",
          active: true,
        })
        toast.success(`Added ${command.name}`)
        return
      case "invoice":
        closePalette()
        addInvoice({
          studentId: command.studentId,
          amount: command.amount,
          month: command.dueDate.slice(0, 7),
          dueDate: command.dueDate,
          status: "unpaid",
          paidDate: null,
          remindersSent: 0,
        })
        toast.success(`Created ${formatINR(command.amount)} invoice, due ${formatDate(command.dueDate)}`)
        return
      case "navigate":
        closePalette()
        router.push(command.href)
        return
    }
  }

  // Same rules as the invoices page: one invoice per active student per month.
  function generateThisMonth() {
    closePalette()
    const today = toIsoDate(new Date())
    const currentMonth = today.slice(0, 7)
    const activeStudents = students.filter((s) => s.active)
    if (activeStudents.length === 0) {
      toast.error("No active students. Add a student and mark them active first.")
      return
    }

    const existing = new Set(useStore.getState().invoices.map((i) => `${i.studentId}|${i.month}`))
    let created = 0
    for (const student of activeStudents) {
      const key = `${student.id}|${currentMonth}`
      if (existing.has(key)) continue
      addInvoice({
        studentId: student.id,
        amount: student.monthlyFee,
        month: currentMonth,
        dueDate: `${currentMonth}-10`,
        status: "unpaid",
        paidDate: null,
        remindersSent: 0,
      })
      existing.add(key)
      created++
    }

    if (created === 0) {
      toast("All active students already have invoices this month.")
    } else {
      toast.success(`Created ${created} ${created === 1 ? "invoice" : "invoices"} for this month.`)
    }
  }

  function chaseOverdue() {
    closePalette()
    const today = toIsoDate(new Date())
    const overdueCount = invoices.filter(
      (i) => deriveStatus(i, today) === "overdue" && amountDue(i) > 0,
    ).length

    if (overdueCount === 0) {
      toast("No overdue invoices.")
      return
    }
    toast(`${overdueCount} overdue ${overdueCount === 1 ? "invoice" : "invoices"}. Open Invoices to send reminders.`, {
      action: { label: "Open invoices", onClick: () => router.push("/invoices") },
    })
  }

  const q = query.trim().toLowerCase()
  const showTrySaying = q === ""
  const pageItems = PAGES.filter((p) => q === "" || p.label.toLowerCase().includes(q))
  const studentItems = students.filter(
    (s) =>
      q === "" || s.name.toLowerCase().includes(q) || s.parentName.toLowerCase().includes(q),
  )
  const actionItems = QUICK_ACTIONS.filter(
    (a) => q === "" || `${a.label} ${a.keywords}`.toLowerCase().includes(q),
  )

  return (
    <>
      <CommandDialog open={open} onOpenChange={handleOpenChange} className="glass rounded-2xl!">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type a student, a payment, or a page"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>No match yet. Try a student name, or type &quot;forecast&quot;.</CommandEmpty>

            {parsed && (
              <CommandGroup heading="Suggested">
                <CommandItem value="suggested" onSelect={() => runParsed(parsed)} className="rounded-xl!">
                  {previewOf(parsed, students)}
                </CommandItem>
              </CommandGroup>
            )}

            {pageItems.length > 0 && (
              <CommandGroup heading="Go to pages">
                {pageItems.map((page) => (
                  <CommandItem
                    key={page.href}
                    value={`page:${page.href}`}
                    onSelect={() => {
                      closePalette()
                      router.push(page.href)
                    }}
                    className="rounded-xl!"
                  >
                    {page.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {studentItems.length > 0 && (
              <CommandGroup heading="Students">
                {studentItems.map((student) => (
                  <CommandItem
                    key={student.id}
                    value={`student:${student.id}`}
                    onSelect={() => openReminder(student.id)}
                    className="rounded-xl!"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate">{student.name}</span>
                      {student.parentName && (
                        <span className="truncate text-xs text-muted-foreground">{student.parentName}</span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {actionItems.length > 0 && (
              <CommandGroup heading="Quick actions">
                {actionItems.map((action) => (
                  <CommandItem
                    key={action.id}
                    value={`action:${action.id}`}
                    onSelect={() => (action.id === "generate" ? generateThisMonth() : chaseOverdue())}
                    className="rounded-xl!"
                  >
                    {action.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showTrySaying && (
              <CommandGroup heading="Try saying">
                {TRY_SAYING.map((text) => (
                  <CommandItem
                    key={text}
                    value={`try:${text}`}
                    onSelect={() => setQuery(text)}
                    className="rounded-xl!"
                  >
                    {text}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>

      {reminder && (
        <ReminderDialog
          invoice={reminder.invoice}
          student={reminder.student}
          upiId={upiId}
          open
          onClose={() => setReminder(null)}
        />
      )}
    </>
  )
}
