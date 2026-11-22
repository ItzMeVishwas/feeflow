"use client"

import { useState, useSyncExternalStore, type FormEvent } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { useStore, type Bill } from "@/lib/store"
import { formatDate, formatINR } from "@/lib/format"
import { toIsoDate } from "@/lib/invoice-status"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/page-header"
import { StatusPill } from "@/components/status-pill"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const WINDOW_DAYS = 60
const DAY_MS = 86_400_000

type Occurrence = {
  key: string
  billId: string
  name: string
  date: string // ISO "YYYY-MM-DD"
  amount: number
  recurring: boolean
}

type WeekGroup = { label: string; rows: Occurrence[] }

// ---------- Pure date helpers (local calendar days) ----------

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days)
}

function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

// Same day-of-month each month, clamped to the month's last day (31 -> 28/29/30).
function isoForMonth(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return toIsoDate(new Date(year, month, Math.min(day, lastDay)))
}

// ---------- Pure forecast helpers ----------

// Every bill occurrence from `today` through `today + 59` days, sorted by date.
function expandOccurrences(bills: Bill[], today: Date): Occurrence[] {
  const endDate = addDays(today, WINDOW_DAYS - 1)
  const startIso = toIsoDate(today)
  const endIso = toIsoDate(endDate)
  const out: Occurrence[] = []

  for (const bill of bills) {
    if (!bill.recurringMonthly) {
      if (bill.dueDate >= startIso && bill.dueDate <= endIso) {
        out.push({
          key: bill.id,
          billId: bill.id,
          name: bill.name,
          date: bill.dueDate,
          amount: bill.amount,
          recurring: false,
        })
      }
      continue
    }

    const dayOfMonth = parseIso(bill.dueDate).getDate()
    let year = today.getFullYear()
    let month = today.getMonth()
    const endYear = endDate.getFullYear()
    const endMonth = endDate.getMonth()

    while (year < endYear || (year === endYear && month <= endMonth)) {
      const date = isoForMonth(year, month, dayOfMonth)
      // Skip dates before the bill's first due date, and dates outside the window.
      if (date >= bill.dueDate && date >= startIso && date <= endIso) {
        out.push({
          key: `${bill.id}-${date}`,
          billId: bill.id,
          name: bill.name,
          date,
          amount: bill.amount,
          recurring: true,
        })
      }
      month += 1
      if (month > 11) {
        month = 0
        year += 1
      }
    }
  }

  return out.sort(
    (a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name)
  )
}

// Buckets sorted occurrences: days 0-6 "This week", 7-13 "Next week",
// then "Week of {start}" where start is today plus a whole number of weeks.
function groupByWeek(occurrences: Occurrence[], today: Date): WeekGroup[] {
  const groups: WeekGroup[] = []

  for (const occ of occurrences) {
    const offset = daysBetween(today, parseIso(occ.date))
    let label: string
    if (offset < 7) {
      label = "This week"
    } else if (offset < 14) {
      label = "Next week"
    } else {
      const weekStart = addDays(today, Math.floor(offset / 7) * 7)
      label = `Week of ${formatDate(toIsoDate(weekStart))}`
    }

    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.rows.push(occ)
    } else {
      groups.push({ label, rows: [occ] })
    }
  }

  return groups
}

function monthlyFixedTotal(bills: Bill[]): number {
  return bills.reduce((sum, b) => (b.recurringMonthly ? sum + b.amount : sum), 0)
}

const noopSubscribe = () => () => {}

// ---------- Form dialog (add + edit) ----------

type BillFormProps = {
  bill: Bill | null
  onClose: () => void
}

function BillForm({ bill, onClose }: BillFormProps) {
  const addBill = useStore((s) => s.addBill)
  const updateBill = useStore((s) => s.updateBill)

  const [name, setName] = useState(bill?.name ?? "")
  const [amount, setAmount] = useState(bill ? String(bill.amount) : "")
  const [dueDate, setDueDate] = useState(
    bill?.dueDate ?? toIsoDate(startOfDay(new Date()))
  )
  const [recurring, setRecurring] = useState(bill?.recurringMonthly ?? false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmedName = name.trim()
    const parsedAmount = Number(amount)
    const roundedAmount = Math.round(parsedAmount)

    if (!trimmedName) {
      setError("Enter a name for this bill.")
      return
    }
    if (amount.trim() === "" || !Number.isFinite(parsedAmount) || roundedAmount <= 0) {
      setError("Enter an amount in rupees greater than 0.")
      return
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setError("Choose the first due date.")
      return
    }

    const fields = {
      name: trimmedName,
      amount: roundedAmount,
      dueDate,
      recurringMonthly: recurring,
    }
    if (bill) {
      updateBill(bill.id, fields)
    } else {
      addBill(fields)
    }
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="font-display text-lg">
          {bill ? "Edit bill" : "Add bill"}
        </DialogTitle>
        <DialogDescription>
          Bills feed your 60-day forecast and monthly fixed costs.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-2">
        <Label htmlFor="bill-name">Name</Label>
        <Input
          id="bill-name"
          className="h-10 rounded-xl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
          aria-invalid={error !== null && !name.trim() ? true : undefined}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bill-amount">Amount (₹)</Label>
        <Input
          id="bill-amount"
          className="h-10 rounded-xl tabular-nums"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="bill-due">First due date</Label>
        <Input
          id="bill-due"
          className="h-10 rounded-xl"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5">
        <Label htmlFor="bill-recurring">Repeats monthly</Label>
        <Switch
          id="bill-recurring"
          checked={recurring}
          onCheckedChange={(checked) => setRecurring(checked)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-[#D93F3F]">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" onClick={onClose} className={SECONDARY_BUTTON}>
          Cancel
        </Button>
        <Button type="submit" size="lg" className={PRIMARY_BUTTON}>
          {bill ? "Save changes" : "Add bill"}
        </Button>
      </div>
    </form>
  )
}

// ---------- Row pieces ----------

type RowActionsProps = {
  name: string
  onEdit: () => void
  onDelete: () => void
}

function RowActions({ name, onEdit, onDelete }: RowActionsProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        className={SECONDARY_BUTTON}
        aria-label={`Edit ${name}`}
      >
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        aria-label={`Delete ${name}`}
        className="text-[#D93F3F] hover:bg-[#D93F3F]/10"
      >
        Delete
      </Button>
    </div>
  )
}

const ROW_CLASS =
  "flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between"

const CARD =
  "rounded-3xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)] dark:border-white/10 dark:bg-[#121E36] sm:p-6"

const PRIMARY_BUTTON =
  "h-11 rounded-xl bg-[#0B2A55] px-5 font-semibold text-white hover:bg-[#133A72] dark:bg-[#0E9F8E] dark:hover:bg-[#0C8A7B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"

const SECONDARY_BUTTON =
  "h-11 rounded-xl border border-border bg-card text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"

// ---------- Page ----------

export default function BillsPage() {
  // False on the server and during hydration, so the page never renders
  // stale or mismatched localStorage data.
  const mounted = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )

  const bills = useStore((s) => s.bills)
  const startingCashBalance = useStore((s) => s.settings.startingCashBalance)
  const removeBill = useStore((s) => s.removeBill)

  const [formState, setFormState] = useState<{ bill: Bill | null } | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Bill | null>(null)
  const reduceMotion = useReducedMotion()

  if (!mounted) {
    return (
      <div role="status" className="p-4 text-sm text-muted-foreground sm:p-6">
        Loading bills
      </div>
    )
  }

  const today = startOfDay(new Date())
  const occurrences = expandOccurrences(bills, today)
  const weeks = groupByWeek(occurrences, today)
  const monthlyFixed = monthlyFixedTotal(bills)
  const billById = new Map(bills.map((b) => [b.id, b]))
  const allBills = [...bills].sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name)
  )

  // Runway: days cash covers at a daily burn of monthly fixed costs / 30.
  let runwayDays: number | null = null
  let runwayHint = ""
  if (monthlyFixed === 0) {
    runwayHint = "Add a recurring bill to see runway."
  } else if (startingCashBalance <= 0) {
    runwayHint = "Add your cash balance in settings to see runway."
  } else {
    runwayDays = Math.floor(startingCashBalance / (monthlyFixed / 30))
  }

  function openAdd() {
    setFormState({ bill: null })
  }
  function openEdit(billId: string) {
    const bill = billById.get(billId)
    if (bill) setFormState({ bill })
  }
  function openDelete(billId: string) {
    const bill = billById.get(billId)
    if (bill) setPendingDelete(bill)
  }
  function confirmDelete() {
    if (pendingDelete) removeBill(pendingDelete.id)
    setPendingDelete(null)
  }

  const motionProps = reduceMotion ? {} : { whileHover: { y: -2 } }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
      <PageHeader
        title="Bills"
        description="Rent, internet and other payments that shape your cash forecast."
      />

      {/* Supporting summary */}
      <section aria-label="Summary" className="grid gap-3 sm:grid-cols-2">
        <div className={CARD}>
          <p className="text-sm text-muted-foreground">Monthly fixed costs</p>
          <p className="font-display mt-1 text-2xl font-semibold tabular-nums text-foreground">
            {formatINR(monthlyFixed, { wholeRupees: true })}
          </p>
        </div>
        <div className={CARD}>
          <p className="text-sm text-muted-foreground">Runway</p>
          {runwayDays !== null ? (
            <p className="font-display mt-1 text-2xl font-semibold tabular-nums text-[#12A150]">
              {runwayDays} {runwayDays === 1 ? "day" : "days"}
            </p>
          ) : (
            <p className="mt-1 text-sm text-foreground">{runwayHint}</p>
          )}
        </div>
      </section>

      {bills.length === 0 ? (
        <section className={`${CARD} flex flex-col items-start gap-4`}>
          <p className="text-base text-foreground">
            No bills yet. Add rent, internet or salaries so your forecast is accurate.
          </p>
          <Button size="lg" onClick={openAdd} className={PRIMARY_BUTTON}>
            Add bill
          </Button>
        </section>
      ) : (
        <section
          aria-labelledby="upcoming-heading"
          className={CARD}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2
                id="upcoming-heading"
                className="font-display text-xl font-semibold text-foreground"
              >
                Upcoming 60 days
              </h2>
              <p className="text-sm text-muted-foreground">
                {occurrences.length === 0
                  ? "Nothing due in the next 60 days."
                  : `${occurrences.length} ${occurrences.length === 1 ? "payment" : "payments"} due in the next 60 days.`}
              </p>
            </div>
            <Button size="lg" onClick={openAdd} className={PRIMARY_BUTTON}>
              Add bill
            </Button>
          </div>

          {weeks.map((group) => (
            <div key={group.label} className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground">{group.label}</h3>
              <ul className="mt-2 divide-y divide-border">
                {group.rows.map((occ) => (
                  <motion.li key={occ.key} {...motionProps} className={ROW_CLASS}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium text-foreground">{occ.name}</p>
                        {occ.recurring && <StatusPill tone="neutral">Monthly</StatusPill>}
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDate(occ.date)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <p className="font-display font-semibold tabular-nums text-foreground">
                        {formatINR(occ.amount, { wholeRupees: true })}
                      </p>
                      <RowActions
                        name={occ.name}
                        onEdit={() => openEdit(occ.billId)}
                        onDelete={() => openDelete(occ.billId)}
                      />
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {bills.length > 0 && (
        <section aria-labelledby="all-bills-heading" className={CARD}>
          <h2
            id="all-bills-heading"
            className="font-display text-lg font-semibold text-foreground"
          >
            All bills
          </h2>
          <p className="text-sm text-muted-foreground">
            Every stored bill, including one-off bills outside the 60-day window.
          </p>
          <ul className="mt-4 divide-y divide-border">
            {allBills.map((bill) => (
              <motion.li key={bill.id} {...motionProps} className={ROW_CLASS}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-foreground">{bill.name}</p>
                    {bill.recurringMonthly && <StatusPill tone="neutral">Monthly</StatusPill>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {bill.recurringMonthly ? "First due " : "Due "}
                    {formatDate(bill.dueDate)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <p className="font-display font-semibold tabular-nums text-foreground">
                    {formatINR(bill.amount, { wholeRupees: true })}
                  </p>
                  <RowActions
                    name={bill.name}
                    onEdit={() => openEdit(bill.id)}
                    onDelete={() => openDelete(bill.id)}
                  />
                </div>
              </motion.li>
            ))}
          </ul>
        </section>
      )}

      {/* Add / edit dialog */}
      <Dialog
        open={formState !== null}
        onOpenChange={(open) => {
          if (!open) setFormState(null)
        }}
      >
        <DialogContent className="rounded-3xl border-border bg-card sm:max-w-md dark:bg-[#121E36]">
          <BillForm bill={formState?.bill ?? null} onClose={() => setFormState(null)} />
        </DialogContent>
      </Dialog>

      {/* Delete confirm (no alert-dialog component in this project, so a Dialog is used) */}
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
      >
        <DialogContent className="rounded-3xl border-border bg-card sm:max-w-md dark:bg-[#121E36]">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Delete this bill?</DialogTitle>
            <DialogDescription>
              {pendingDelete?.recurringMonthly
                ? `${pendingDelete.name} and all of its monthly payments are removed from the forecast.`
                : `${pendingDelete?.name ?? "This bill"} is removed from the forecast.`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setPendingDelete(null)}
              className={SECONDARY_BUTTON}
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={confirmDelete}
              className="h-11 rounded-xl bg-[#D93F3F] px-5 font-semibold text-white hover:bg-[#B93434] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"
            >
              Delete bill
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
