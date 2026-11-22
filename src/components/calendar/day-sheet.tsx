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
import { type PillTone, StatusPill } from "@/components/status-pill"

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

const FEE_STATUS_TONE: Record<CalendarDay["fees"][number]["status"], PillTone> = {
  paid: "paid",
  overdue: "overdue",
  unpaid: "due",
}

const primaryButtonClass =
  "h-11 rounded-xl bg-[#0B2A55] px-5 font-semibold text-white hover:bg-[#133A72] dark:bg-[#0E9F8E] dark:hover:bg-[#0C8A7B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"

const secondaryButtonClass =
  "h-11 rounded-xl border border-border bg-card text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"

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
        <DialogContent className="rounded-3xl border-border bg-card dark:bg-[#121E36]">
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
              <ul role="list" className="flex flex-col divide-y divide-border">
                {fees.map((fee) => {
                  const invoice = invoices.find((i) => i.id === fee.invoiceId)
                  const isPaid = fee.status === "paid"
                  return (
                    <li
                      key={fee.invoiceId}
                      className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{fee.studentName}</p>
                        <p className="tabular-nums text-sm text-foreground">{formatINR(fee.amount)}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={FEE_STATUS_TONE[fee.status]}>
                          {FEE_STATUS_LABEL[fee.status]}
                        </StatusPill>
                        {!isPaid && invoice ? (
                          <>
                            <Button
                              size="sm"
                              className={primaryButtonClass}
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
                              className={secondaryButtonClass}
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
              <ul role="list" className="flex flex-col divide-y divide-border">
                {bills.map((bill) => (
                  <li
                    key={bill.billId}
                    className="flex items-center justify-between gap-3 py-3"
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
