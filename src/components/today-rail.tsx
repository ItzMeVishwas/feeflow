"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { motion, useReducedMotion } from "motion/react"

import { Button } from "@/components/ui/button"
import { ChaseQueueDialog } from "@/components/chase-queue-dialog"
import { ReminderDialog } from "@/components/reminder-dialog"
import { buildChaseQueue } from "@/lib/chase"
import { buildForecast, summarizeForecast } from "@/lib/forecast"
import { toIsoDate } from "@/lib/invoice-status"
import { useStore } from "@/lib/store"
import type { Invoice, Student } from "@/lib/store"
import { buildToday } from "@/lib/today"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

const FORECAST_DAYS = 90

// Tall "Today" card for the dashboard right column: the actions that need attention now.
export function TodayRail() {
  // Persisted store data only exists on the client, so wait for mount (same as the dashboard).
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
  const reduceMotion = useReducedMotion()

  const students = useStore((s) => s.students)
  const invoices = useStore((s) => s.invoices)
  const bills = useStore((s) => s.bills)
  const settings = useStore((s) => s.settings)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [chaseOpen, setChaseOpen] = useState(false)

  const today = toIsoDate(new Date())

  const chaseQueue = useMemo(
    () => buildChaseQueue({ students, invoices, bills, settings }, today),
    [students, invoices, bills, settings, today],
  )

  const studentById = useMemo(
    () => new Map<string, Student>(students.map((s) => [s.id, s])),
    [students],
  )
  const invoiceById = useMemo(
    () => new Map<string, Invoice>(invoices.map((inv) => [inv.id, inv])),
    [invoices],
  )

  const forecastFirstBelowZero = useMemo(
    () =>
      summarizeForecast(
        buildForecast({ students, invoices, bills, settings }, FORECAST_DAYS, undefined, today),
      ).firstBelowZeroDate,
    [students, invoices, bills, settings, today],
  )

  const actions = useMemo(
    () => buildToday({ invoices, students, bills, today, forecastFirstBelowZero }),
    [invoices, students, bills, today, forecastFirstBelowZero],
  )

  const selectedInvoice = selectedInvoiceId ? invoiceById.get(selectedInvoiceId) : undefined

  return (
    <section
      aria-labelledby="today-rail-heading"
      className="glass rounded-3xl p-6 h-full flex flex-col"
    >
      <h2
        id="today-rail-heading"
        className="font-heading text-lg font-semibold tracking-tight text-foreground"
      >
        Today
      </h2>

      {mounted && chaseQueue.length > 0 && (
        <Button
          type="button"
          size="sm"
          variant="default"
          className="mt-3 w-full"
          onClick={() => setChaseOpen(true)}
        >
          Chase all overdue ({chaseQueue.length})
        </Button>
      )}

      <div className="mt-4 flex-1">
        {!mounted ? (
          <p className="text-sm text-muted-foreground">Loading today…</p>
        ) : actions.length === 0 ? (
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              All caught up. Nothing to chase today.
            </p>
            <p className="text-sm text-muted-foreground">
              New invoices and bills will show up here when they are due.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {actions.map((action) => {
              const invoice =
                action.kind === "chase" && action.invoiceId
                  ? invoiceById.get(action.invoiceId)
                  : undefined

              if (invoice) {
                return (
                  <motion.li
                    key={action.id}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {action.title}
                      </p>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        {action.detail}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="focus-visible:ring-2 focus-visible:ring-amber"
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                    >
                      Remind
                    </Button>
                  </motion.li>
                )
              }

              return (
                <li key={action.id} className="rounded-2xl border border-border/60 p-4">
                  <p className="truncate text-sm font-medium text-foreground">
                    {action.title}
                  </p>
                  <p className="text-sm tabular-nums text-muted-foreground">
                    {action.detail}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {selectedInvoice && (
        <ReminderDialog
          invoice={selectedInvoice}
          student={studentById.get(selectedInvoice.studentId)}
          upiId={settings.upiId}
          open
          onClose={() => setSelectedInvoiceId(null)}
        />
      )}

      <ChaseQueueDialog open={chaseOpen} onClose={() => setChaseOpen(false)} queue={chaseQueue} />
    </section>
  )
}
