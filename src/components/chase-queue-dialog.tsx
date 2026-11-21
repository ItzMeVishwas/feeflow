"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RecordPaymentDialog } from "@/components/record-payment-dialog"
import type { ChaseItem } from "@/lib/chase"
import { formatINR } from "@/lib/format"
import { TONES, buildDraft, toWhatsAppDigits } from "@/lib/reminder-message"
import { useStore } from "@/lib/store"

type ChaseQueueDialogProps = {
  open: boolean
  onClose: () => void
  queue: ChaseItem[]
}

export function ChaseQueueDialog({ open, onClose, queue }: ChaseQueueDialogProps) {
  const incrementRemindersSent = useStore((s) => s.incrementRemindersSent)

  // Snapshot the queue when the dialog opens so sent items don't vanish mid-session.
  const [snapshot, setSnapshot] = useState<ChaseItem[]>([])
  const [index, setIndex] = useState(0)
  const [sentCount, setSentCount] = useState(0)
  const [sentIds, setSentIds] = useState<string[]>([])
  const [recordOpen, setRecordOpen] = useState(false)
  const [wasOpen, setWasOpen] = useState(open)

  // Reset state during render when `open` changes (avoids a stale first frame).
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSnapshot(queue)
      setIndex(0)
      setSentCount(0)
      setSentIds([])
      setRecordOpen(false)
    }
  }

  const item = snapshot[index] as ChaseItem | undefined
  const isEmpty = snapshot.length === 0
  const digits = item ? toWhatsAppDigits(item.student.parentPhone) : ""

  const remaining = snapshot
    .filter((i) => !sentIds.includes(i.invoice.id))
    .reduce((sum, i) => sum + i.amountDue, 0)

  function advance() {
    setIndex((i) => i + 1)
  }

  function sendOnWhatsApp(current: ChaseItem, message: string, phone: string) {
    if (!phone) return
    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    )
    incrementRemindersSent(current.invoice.id)
    setSentIds((ids) => [...ids, current.invoice.id])
    setSentCount((c) => c + 1)
    advance()
  }

  const draft = item
    ? buildDraft({
        tone: item.tone,
        language: "english",
        parentName: item.student.parentName,
        studentName: item.student.name,
        month: item.invoice.month,
        amountDue: item.amountDue,
        daysLate: item.daysLate,
        payUrl: "",
      })
    : ""

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) onClose()
        }}
      >
        <DialogContent className="flex h-dvh max-h-dvh w-full max-w-full flex-col overflow-y-auto sm:h-auto sm:max-h-[90vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chase overdue fees</DialogTitle>
            {!isEmpty && (
              <DialogDescription className="tabular-nums">
                {item
                  ? `${index + 1} of ${snapshot.length}`
                  : `${snapshot.length} of ${snapshot.length}`}
              </DialogDescription>
            )}
          </DialogHeader>

          {isEmpty ? (
            <>
              <p className="text-sm">
                No overdue fees right now. Come back here when an invoice goes past its due date.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : !item ? (
            <>
              <p className="text-sm">
                {`Done. ${sentCount} reminder${sentCount === 1 ? "" : "s"} sent, ${formatINR(remaining, { wholeRupees: true })} being chased.`}
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="flex flex-1 flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <p className="text-lg font-semibold">{item.student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Parent: {item.student.parentName}
                  </p>
                </div>

                <div className="flex flex-col gap-1 text-sm">
                  <p>
                    Amount due:{" "}
                    <span className="font-medium tabular-nums">
                      {formatINR(item.amountDue, { wholeRupees: true })}
                    </span>
                  </p>
                  <p>
                    {`${item.daysLate} ${item.daysLate === 1 ? "day" : "days"} overdue`}
                  </p>
                  <p>
                    Tone: {TONES.find((t) => t.value === item.tone)?.label ?? item.tone}
                  </p>
                </div>

                <p className="whitespace-pre-line rounded-xl border p-3 text-sm">{draft}</p>

                {!digits && (
                  <p role="alert" className="text-sm text-destructive">
                    Add the parent&apos;s phone number on the student record to send this on WhatsApp.
                  </p>
                )}
              </div>

              <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button
                  disabled={!digits}
                  onClick={() => sendOnWhatsApp(item, draft, digits)}
                >
                  Send on WhatsApp
                </Button>
                <Button variant="outline" onClick={advance}>
                  Skip
                </Button>
                <Button variant="secondary" onClick={() => setRecordOpen(true)}>
                  Record payment instead
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <RecordPaymentDialog
        invoice={item?.invoice ?? null}
        student={item?.student}
        open={recordOpen}
        onOpenChange={setRecordOpen}
      />
    </>
  )
}
