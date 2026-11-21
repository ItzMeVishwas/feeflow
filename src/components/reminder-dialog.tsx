"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { buildPayUrl } from "@/lib/pay-link"
import { buildDraft, formatMonth, getDaysLate, LANGUAGES, toWhatsAppDigits, TONES, type Language, type Tone } from "@/lib/reminder-message"
import { useStore, type Invoice, type Student } from "@/lib/store"


type ReminderDialogProps = {
  invoice: Invoice
  student: Student | undefined
  upiId: string
  open: boolean
  onClose: () => void
}

export function ReminderDialog({
  invoice,
  student,
  upiId,
  open,
  onClose,
}: ReminderDialogProps) {
  const incrementRemindersSent = useStore((s) => s.incrementRemindersSent)
  const tutorName = useStore((s) => s.settings.tutorName)

  const [tone, setTone] = useState<Tone>("friendly")
  const [language, setLanguage] = useState<Language>("english")
  const [draft, setDraft] = useState("")

  const daysLate = getDaysLate(invoice.dueDate)
  const paid = (invoice.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
  const amountDue = Math.max(0, invoice.amount - paid)
  const payUrl =
    typeof window !== "undefined" && upiId.trim() && student
      ? buildPayUrl({
          tutorName,
          upiId: upiId.trim(),
          studentName: student.name,
          parentName: student.parentName,
          month: invoice.month,
          amount: invoice.amount,
          amountDue,
          dueDate: invoice.dueDate,
          invoiceId: invoice.id,
        })
      : ""
  const generated = student
    ? buildDraft({
        tone,
        language,
        parentName: student.parentName,
        studentName: student.name,
        month: invoice.month,
        amountDue: amountDue,
        daysLate,
        payUrl,
      })
    : ""

  // Regenerate the draft when the dialog opens or a toggle changes.
  useEffect(() => {
    if (open) setDraft(generated)
  }, [open, generated])

  const digits = student ? toWhatsAppDigits(student.parentPhone) : ""
  const canSend = Boolean(student) && digits.length > 0 && draft.trim().length > 0

  function handleSend() {
    if (!canSend) return
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(draft)}`
    window.open(url, "_blank", "noopener,noreferrer")
    incrementRemindersSent(invoice.id)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send WhatsApp reminder</DialogTitle>
          <DialogDescription>
            {student
              ? `${student.name} · ${formatMonth(invoice.month)} · ₹${invoice.amount.toLocaleString("en-IN")}`
              : "Student not found"}
          </DialogDescription>
        </DialogHeader>

        <div role="group" aria-labelledby="reminder-tone-label" className="flex flex-col gap-2">
          <span id="reminder-tone-label" className="text-xs font-medium text-muted-foreground">
            Tone
          </span>
          <div className="flex gap-2">
            {TONES.map((t) => (
              <Button
                key={t.value}
                type="button"
                size="sm"
                variant={tone === t.value ? "default" : "outline"}
                aria-pressed={tone === t.value}
                onClick={() => setTone(t.value)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </div>

        <div role="group" aria-labelledby="reminder-language-label" className="flex flex-col gap-2">
          <span id="reminder-language-label" className="text-xs font-medium text-muted-foreground">
            Language
          </span>
          <div className="flex gap-2">
            {LANGUAGES.map((l) => (
              <Button
                key={l.value}
                type="button"
                size="sm"
                variant={language === l.value ? "default" : "outline"}
                aria-pressed={language === l.value}
                onClick={() => setLanguage(l.value)}
              >
                {l.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reminder-draft" className="text-xs font-medium text-muted-foreground">
            Message
          </label>
          <textarea
            id="reminder-draft"
            rows={8}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={!student}
            className="w-full resize-y rounded-lg border border-input bg-background p-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          />
        </div>

        {!student && (
          <p role="alert" className="text-sm text-destructive">
            This student could not be found, so the reminder cannot be sent.
          </p>
        )}
        {student && digits.length === 0 && (
          <p role="alert" className="text-sm text-destructive">
            Add the parent&apos;s phone number on the student record to send this on WhatsApp.
          </p>
        )}

        <DialogFooter>
          <Button type="button" onClick={handleSend} disabled={!canSend}>
            Send on WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
