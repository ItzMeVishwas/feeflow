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
import { SuccessBurst } from "@/components/ui/success-burst"
import { formatINR, formatMonth } from "@/lib/format"
import { amountDue, toIsoDate } from "@/lib/invoice-status"
import { buildReceiptPath, receiptNumber, type ReceiptData } from "@/lib/receipt-link"
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

type Recorded = { amount: number; remaining: number; receipt: ReceiptData }

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
  const upiId = useStore((s) => s.settings.upiId)

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
      duration: 8000,
      action: newPayment
        ? {
            label: "Undo",
            onClick: () => undoPayment(invoice.id, newPayment.id),
          }
        : undefined,
    })

    setRecorded({
      amount,
      remaining,
      receipt: {
        no: receiptNumber(invoice.id, invoice.month),
        student: student.name,
        parent: student.parentName,
        amount,
        month: invoice.month,
        date,
        tutor: tutorName,
        upiId,
      },
    })
  }

  // Read the origin at click time so the receipt link matches the host the app runs on.
  function handleSendOnWhatsApp(result: Recorded) {
    const digits = toWhatsAppDigits(student.parentPhone)
    if (!digits) return
    const link = `${window.location.origin}${buildReceiptPath(result.receipt)}`
    const message = `Hi ${student.parentName}, we received ${formatINR(result.amount)} for ${formatMonth(invoice.month)}. Receipt: ${link}. Thank you!`
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer")
  }

  if (recorded) {
    const canWhatsApp = toWhatsAppDigits(student.parentPhone).length > 0
    return (
      <>
        <div className="relative mb-2 h-12 w-12">
          <SuccessBurst show />
        </div>
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
        <div className="space-y-3 rounded-xl border border-[#E6EBF2] p-4">
          <p className="text-sm font-medium text-foreground">Send receipt</p>
          <button
            type="button"
            onClick={() => handleSendOnWhatsApp(recorded)}
            disabled={!canWhatsApp}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-[#0B2A55] px-4 text-sm font-semibold text-white hover:bg-[#133A72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send on WhatsApp
          </button>
          {!canWhatsApp && (
            <p className="text-xs text-[#5E6E87]">Add a phone number to send on WhatsApp</p>
          )}
          <a
            href={buildReceiptPath(recorded.receipt)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 w-full items-center justify-center rounded-xl border border-[#DCE3EE] bg-white px-4 text-sm font-medium text-[#0B2A55] hover:bg-[#F6F8FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"
          >
            Open receipt
          </a>
        </div>
        <DialogFooter>
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
