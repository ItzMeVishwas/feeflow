"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RecordPaymentDialog } from "@/components/record-payment-dialog"
import { ReminderDialog } from "@/components/reminder-dialog"
import type { CalendarDay } from "@/lib/calendar"
import { formatDate, formatINR } from "@/lib/format"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

type DaySheetProps = {
  date: string // "YYYY-MM-DD" of the selected day
  day: CalendarDay | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FEE_STATUS_LABEL: Record<CalendarDay["fees"][number]["status"], string> = {
  paid: "Paid",
  overdue: "Overdue",
  unpaid: "Due",
}

const FEE_STATUS_CLASS: Record<CalendarDay["fees"][number]["status"], string> = {
  paid: "bg-[var(--mint)]/20",
  overdue: "bg-[var(--coral)]/20",
  unpaid: "bg-[var(--amber)]/20",
}

const amberButtonClass =
  "bg-[var(--amber)] text-[#1A1206] hover:bg-[var(--amber)]/90 focus-visible:ring-2 focus-visible:ring-[var(--amber)]"

export function DaySheet({ date, day, open, onOpenChange }: DaySheetProps) {
  const students = useStore((s) => s.students)
  const invoices = useStore((s) => s.invoices)
  const upiId = useStore((s) => s.settings.upiId)

  // The payment and reminder dialogs are rendered outside the day dialog, and the day dialog closes
  // when one of them opens. That way only one modal is open at a time.
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [reminderInvoiceId, setReminderInvoiceId] = useState<string | null>(null)

  const paymentInvoice = invoices.find((i) => i.id === paymentInvoiceId) ?? null
  const reminderInvoice = invoices.find((i) => i.id === reminderInvoiceId) ?? null

  const fees = day?.fees ?? []
  const bills = day?.bills ?? []
  const isEmpty = fees.length === 0 && bills.length === 0

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formatDate(date)}</DialogTitle>
            <DialogDescription>Fees and bills for this day.</DialogDescription>
          </DialogHeader>

          {isEmpty ? (
            <p className="text-sm text-muted-foreground">Nothing due on this day.</p>
          ) : null}

          {fees.length > 0 ? (
            <section aria-labelledby="day-fees" className="flex flex-col gap-2">
              <h3 id="day-fees" className="text-sm font-medium text-muted-foreground">
                Fees due
              </h3>
              <ul role="list" className="flex flex-col gap-2">
                {fees.map((fee) => {
                  const invoice = invoices.find((i) => i.id === fee.invoiceId)
                  const isPaid = fee.status === "paid"
                  return (
                    <li
                      key={fee.invoiceId}
                      className="glass flex flex-col gap-3 rounded-2xl p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{fee.studentName}</p>
                        <p className="tabular-nums text-sm text-foreground">{formatINR(fee.amount)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-xl px-2.5 py-1 text-xs font-medium text-foreground",
                            FEE_STATUS_CLASS[fee.status],
                          )}
                        >
                          {FEE_STATUS_LABEL[fee.status]}
                        </span>
                        {!isPaid && invoice ? (
                          <>
                            <Button
                              size="sm"
                              className={amberButtonClass}
                              aria-label={`Record payment for ${fee.studentName}`}
                              onClick={() => {
                                setPaymentInvoiceId(invoice.id)
                                setPaymentOpen(true)
                                onOpenChange(false)
                              }}
                            >
                              Record payment
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              aria-label={`Remind ${fee.studentName}`}
                              onClick={() => {
                                setReminderInvoiceId(invoice.id)
                                onOpenChange(false)
                              }}
                            >
                              Remind
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          {bills.length > 0 ? (
            <section aria-labelledby="day-bills" className="flex flex-col gap-2">
              <h3 id="day-bills" className="text-sm font-medium text-muted-foreground">
                Bills going out
              </h3>
              <ul role="list" className="flex flex-col gap-2">
                {bills.map((bill) => (
                  <li
                    key={bill.billId}
                    className="glass flex items-center justify-between gap-3 rounded-2xl p-3"
                  >
                    <p className="min-w-0 truncate font-medium text-foreground">{bill.name}</p>
                    <p className="shrink-0 tabular-nums text-sm text-foreground">{formatINR(bill.amount)}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </DialogContent>
      </Dialog>

      <RecordPaymentDialog
        invoice={paymentInvoice}
        student={students.find((s) => s.id === paymentInvoice?.studentId)}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />

      {reminderInvoice ? (
        <ReminderDialog
          invoice={reminderInvoice}
          student={students.find((s) => s.id === reminderInvoice.studentId)}
          upiId={upiId}
          open
          onClose={() => setReminderInvoiceId(null)}
        />
      ) : null}
    </>
  )
}
