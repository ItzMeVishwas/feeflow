"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useMemo, useState, useSyncExternalStore } from "react"
import type { ChangeEvent } from "react"
import { QRCodeSVG } from "qrcode.react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDate, formatINR, formatMonth } from "@/lib/format"
import { buildPayUrl, buildUpiLink } from "@/lib/pay-link"
import type { PayLinkData } from "@/lib/pay-link"
import { useStore } from "@/lib/store"

type StoreState = ReturnType<typeof useStore.getState>
type Student = StoreState["students"][number]
type Invoice = StoreState["invoices"][number]
type Payment = NonNullable<Invoice["payments"]>[number]
type AttendanceRecord = StoreState["attendance"][number]

type MonthStatement = {
  month: string
  invoice: Invoice | null
  fee: number
  payments: Payment[]
  paid: number
  balance: number
  attendance: AttendanceRecord[]
  presentCount: number
}

const amberButtonClass =
  "bg-[var(--amber)] text-[#1A1206] hover:bg-[var(--amber)]/90 focus-visible:ring-2 focus-visible:ring-[var(--amber)]"

// Store hydration is reported through zustand's persist API. Using
// useSyncExternalStore keeps the server render and the first client render
// identical (both "not hydrated"), matching the students page.
function subscribeToHydration(onChange: () => void) {
  return useStore.persist.onFinishHydration(onChange)
}

function getHydrated() {
  return useStore.persist.hasHydrated()
}

function getServerHydrated() {
  return false
}

// Current month as "YYYY-MM" in the user's local time.
function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

// Builds the month's fee, payments and attendance for one student.
function buildStatement(
  student: Student,
  invoices: Invoice[],
  attendance: AttendanceRecord[],
  month: string,
): MonthStatement {
  const monthInvoices = invoices.filter(
    (invoice) => invoice.studentId === student.id && invoice.month === month,
  )
  const invoice = monthInvoices[0] ?? null
  const fee = invoice ? invoice.amount : student.monthlyFee
  const payments = monthInvoices
    .flatMap((item) => item.payments ?? [])
    .sort((a, b) => a.date.localeCompare(b.date))
  const paid = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const records = attendance
    .filter((record) => record.studentId === student.id && record.date.startsWith(`${month}-`))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    month,
    invoice,
    fee,
    payments,
    paid,
    balance: Math.max(0, fee - paid),
    attendance: records,
    presentCount: records.filter((record) => record.present).length,
  }
}

function payDataFor(
  student: Student,
  statement: MonthStatement,
  tutorName: string,
  upiId: string,
): PayLinkData {
  return {
    tutorName,
    upiId,
    studentName: student.name,
    parentName: student.parentName,
    month: statement.month,
    amount: statement.fee,
    amountDue: statement.balance,
    dueDate: statement.invoice?.dueDate ?? "",
    invoiceId: statement.invoice?.id ?? "",
  }
}

// WhatsApp needs country code digits only. Indian 10-digit numbers get "91".
function whatsappDigits(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.length === 10 ? `91${digits}` : digits
}

export default function StatementPage() {
  const params = useParams<{ id: string }>()
  const studentId = params.id
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getServerHydrated,
  )

  const student = useStore((s) => s.students.find((item) => item.id === studentId))
  const invoices = useStore((s) => s.invoices)
  const attendance = useStore((s) => s.attendance)
  const tutorName = useStore((s) => s.settings.tutorName)
  const upiId = useStore((s) => s.settings.upiId)

  const [month, setMonth] = useState(currentMonth)

  const statement = useMemo(
    () => (student ? buildStatement(student, invoices, attendance, month) : null),
    [student, invoices, attendance, month],
  )

  function handleMonthChange(event: ChangeEvent<HTMLInputElement>) {
    // Ignore the empty value a cleared month input reports.
    if (event.target.value) setMonth(event.target.value)
  }

  function handleShareWhatsApp() {
    if (!student || !statement) return

    const lines = [
      `Fee statement for ${student.name}, ${formatMonth(statement.month)}`,
      `Monthly fee: ${formatINR(statement.fee)}`,
      `Paid: ${formatINR(statement.paid)}`,
      `Still due: ${formatINR(statement.balance)}`,
    ]
    if (statement.balance > 0) {
      const payUrl = buildPayUrl(payDataFor(student, statement, tutorName, upiId))
      lines.push(`Pay here: ${payUrl}`)
    }

    const url = `https://wa.me/${whatsappDigits(student.parentPhone)}?text=${encodeURIComponent(lines.join("\n"))}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  function renderBody() {
    if (!hydrated) {
      return (
        <p className="glass rounded-2xl p-6 text-center text-muted-foreground">
          Loading statement…
        </p>
      )
    }

    if (!student || !statement) {
      return (
        <div className="glass flex flex-col items-center gap-2 rounded-2xl p-6 text-center">
          <p className="font-medium text-foreground">We could not find that student.</p>
          <p className="text-sm text-muted-foreground">
            They may have been removed. Check the students list.
          </p>
          <Link
            href="/students"
            className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-2`}
          >
            Back to students
          </Link>
        </div>
      )
    }

    const hasBalance = statement.balance > 0
    const canShowQr = hasBalance && upiId.trim() !== ""

    return (
      <>
        <div className="no-print flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Monthly statement
            </h1>
            <p className="text-sm text-muted-foreground">{student.name}</p>
          </div>
          <Link href="/students" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Back to students
          </Link>
        </div>

        <div className="no-print glass flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid gap-1.5">
            <Label htmlFor="statement-month">Month</Label>
            <Input
              id="statement-month"
              type="month"
              value={month}
              onChange={handleMonthChange}
              className="w-full rounded-xl sm:w-48"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button className={amberButtonClass} onClick={() => window.print()}>
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleShareWhatsApp}>
              Share on WhatsApp
            </Button>
          </div>
        </div>

        <article
          aria-labelledby="statement-title"
          className="print-sheet glass mx-auto flex w-full max-w-[210mm] flex-col gap-6 rounded-2xl p-5 sm:p-10"
        >
          <header className="flex flex-col gap-1 border-b border-[var(--glass-border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {tutorName.trim() ? (
                <p className="font-display text-xl font-semibold text-foreground">{tutorName}</p>
              ) : null}
              {upiId.trim() ? (
                <p className="text-sm text-muted-foreground">UPI ID: {upiId}</p>
              ) : null}
            </div>
            <div className="sm:text-right">
              <h2
                id="statement-title"
                className="text-lg font-semibold tracking-tight text-foreground"
              >
                Fee statement
              </h2>
              <p className="text-sm text-muted-foreground">{formatMonth(statement.month)}</p>
            </div>
          </header>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-muted-foreground">Student</dt>
              <dd className="font-medium text-foreground">{student.name}</dd>
            </div>
            {student.batch ? (
              <div>
                <dt className="text-sm text-muted-foreground">Batch</dt>
                <dd className="text-foreground">{student.batch}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-sm text-muted-foreground">Parent</dt>
              <dd className="text-foreground">{student.parentName}</dd>
            </div>
          </dl>

          <section
            aria-label="Amount due"
            className={`print-hero flex flex-col gap-4 rounded-3xl border border-[var(--glass-border)] p-5 sm:flex-row sm:items-center sm:justify-between ${
              hasBalance ? "bg-[var(--amber)]/15" : "bg-[var(--mint)]/15"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">Still due</p>
              <p className="font-display text-4xl font-semibold tabular-nums text-foreground">
                {formatINR(statement.balance)}
              </p>
              <p className="mt-1 text-sm text-foreground">
                {hasBalance
                  ? `Pay by UPI to clear the ${formatMonth(statement.month)} fee.`
                  : `All fees for ${formatMonth(statement.month)} are paid.`}
              </p>
              {hasBalance && !canShowQr ? (
                <p className="no-print mt-1 text-sm text-muted-foreground">
                  Add a UPI ID in settings to show a payment QR code.
                </p>
              ) : null}
            </div>

            {canShowQr ? (
              <div
                role="img"
                aria-label={`UPI payment QR code for ${formatINR(statement.balance)}`}
                className="shrink-0 self-start rounded-2xl bg-white p-3 sm:self-center"
              >
                <QRCodeSVG
                  value={buildUpiLink(payDataFor(student, statement, tutorName, upiId))}
                  size={144}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                  includeMargin
                />
              </div>
            ) : null}
          </section>

          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Monthly fee</dt>
              <dd className="text-lg font-medium tabular-nums text-foreground">
                {formatINR(statement.fee)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Paid this month</dt>
              <dd className="text-lg font-medium tabular-nums text-foreground">
                {formatINR(statement.paid)}
              </dd>
            </div>
          </dl>

          <section className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-foreground">Payments received</h3>
            {statement.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments received this month.</p>
            ) : (
              <ul role="list" className="flex flex-col divide-y divide-[var(--glass-border)]">
                {statement.payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-4 py-2 text-sm"
                  >
                    <span className="text-foreground">{formatDate(payment.date)}</span>
                    <span className="tabular-nums text-foreground">
                      {formatINR(payment.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-foreground">Attendance</h3>
            {statement.attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attendance recorded this month.</p>
            ) : (
              <>
                <p className="text-sm text-foreground">
                  {`${statement.presentCount} of ${statement.attendance.length} days present`}
                </p>
                <ul role="list" className="flex flex-wrap gap-1.5">
                  {statement.attendance.map((record) => {
                    const label = `${formatDate(record.date)}: ${record.present ? "present" : "absent"}`
                    return (
                      <li key={record.id}>
                        <span
                          role="img"
                          aria-label={label}
                          title={label}
                          className={`block h-3 w-3 rounded-full ${
                            record.present ? "bg-[var(--mint)]" : "bg-[var(--coral)]"
                          }`}
                        />
                      </li>
                    )
                  })}
                </ul>
              </>
            )}
          </section>
        </article>
      </>
    )
  }

  return <div className="flex flex-col gap-4">{renderBody()}</div>
}
