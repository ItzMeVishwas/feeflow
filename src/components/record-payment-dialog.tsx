"use client"

import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatINR, formatMonth } from "@/lib/format"
import { amountDue, toIsoDate } from "@/lib/invoice-status"
import { useStore } from "@/lib/store"
import type { Invoice, Student } from "@/lib/store"

type RecordPaymentDialogProps = {
  invoice: Invoice | null
  student: Student | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

type RecordPaymentBodyProps = {
  invoice: Invoice
  student: Student
  tutorName: string
  onDone: () => void
}

type Recorded = { amount: number; remaining: number }

// WhatsApp needs digits only. A 10-digit Indian number gets the 91 country code.
function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits.length === 10 ? `91${digits}` : digits
}

export function RecordPaymentDialog({
  invoice,
  student,
  open,
  onOpenChange,
}: RecordPaymentDialogProps) {
  // Read the invoice from the store so amountDue stays fresh after each payment.
  const current = useStore((s) => s.invoices.find((i) => i.id === invoice?.id))
  const tutorName = useStore((s) => s.settings.tutorName)

  const body =
    current && student ? (
      <RecordPaymentBody
        key={current.id}
        invoice={current}
        student={student}
        tutorName={tutorName}
        onDone={() => onOpenChange(false)}
      />
    ) : (
      <>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">No invoice selected.</p>
      </>
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{body}</DialogContent>
    </Dialog>
  )
}

// Mounted inside DialogContent, so Radix unmounts it on close and the form
// resets to today's date and the full amount due each time the dialog opens.
function RecordPaymentBody({ invoice, student, tutorName, onDone }: RecordPaymentBodyProps) {
  const recordPayment = useStore((s) => s.recordPayment)
  const undoPayment = useStore((s) => s.undoPayment)

  const due = amountDue(invoice)
  const [amountText, setAmountText] = useState(String(due))
  const [date, setDate] = useState(() => toIsoDate(new Date()))
  const [recorded, setRecorded] = useState<Recorded | null>(null)

  const amount = Math.round(Number(amountText) * 100) / 100
  const amountValid =
    amountText.trim() !== "" && Number.isFinite(amount) && amount > 0 && amount <= due
  const amountError = amountValid
    ? null
    : amount > due
      ? `The amount cannot be more than ${formatINR(due)}.`
      : "Enter an amount greater than zero."

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!amountValid || !date) return

    const before = invoice.payments?.length ?? 0
    recordPayment(invoice.id, amount, date)

    const after = useStore.getState().invoices.find((i) => i.id === invoice.id)
    const payments = after?.payments ?? []
    const newPayment = payments.length > before ? payments[payments.length - 1] : undefined
    const remaining = after ? amountDue(after) : 0

    const label = Number.isInteger(amount)
      ? formatINR(amount, { wholeRupees: true })
      : formatINR(amount)
    toast.success(`${label} recorded for ${student.name}`, {
      action: newPayment
        ? {
            label: "Undo",
            onClick: () => undoPayment(invoice.id, newPayment.id),
          }
        : undefined,
    })

    setRecorded({ amount, remaining })
  }

  function handleSendReceipt(result: Recorded) {
    const lines = [
      `Thank you. We received ${formatINR(result.amount)} for ${student.name}'s ${formatMonth(invoice.month)} fees.` +
        (result.remaining > 0 ? ` ${formatINR(result.remaining)} is still due.` : ""),
    ]
    const sign = tutorName.trim()
    if (sign) lines.push(sign)

    const digits = toWhatsAppDigits(student.parentPhone)
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(lines.join("\n"))}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  if (recorded) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Payment recorded</DialogTitle>
          <DialogDescription>
            {student.name}, {formatMonth(invoice.month)}
          </DialogDescription>
        </DialogHeader>
        {recorded.remaining > 0 && (
          <p className="text-sm text-foreground">
            <span className="tabular-nums">{formatINR(recorded.remaining)}</span> still due
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => handleSendReceipt(recorded)}>
            Send receipt on WhatsApp
          </Button>
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        </DialogFooter>
      </>
    )
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Record payment</DialogTitle>
        <DialogDescription>
          {student.name}, {formatMonth(invoice.month)}. Due{" "}
          <span className="tabular-nums">{formatINR(due)}</span>
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-amount">Amount</Label>
          <Input
            id="payment-amount"
            type="number"
            inputMode="decimal"
            step="0.01"
            min={0}
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            aria-invalid={amountError ? true : undefined}
            aria-describedby={amountError ? "payment-amount-error" : undefined}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment-date">Date</Label>
          <Input
            id="payment-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {amountError && (
          <p id="payment-amount-error" role="alert" className="text-sm text-red-700">
            {amountError}
          </p>
        )}
        <DialogFooter>
          <Button type="submit" disabled={!amountValid || !date}>
            Record payment
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
