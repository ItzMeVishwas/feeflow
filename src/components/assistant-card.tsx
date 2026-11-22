"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { ReminderDialog } from "@/components/reminder-dialog"
import { buildChaseQueue, type ChaseItem } from "@/lib/chase"
import { formatDate, formatINR } from "@/lib/format"
import { toIsoDate } from "@/lib/invoice-status"
import { useStore } from "@/lib/store"

const DISMISS_KEY = "feeflow-assistant-dismissed"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

// One plain sentence describing the single most useful action.
function actionSentence(item: ChaseItem): string {
  const firstName = item.student.name.trim().split(/\s+/)[0] ?? item.student.name
  const amount = formatINR(item.amountDue, { wholeRupees: true })
  if (item.daysLate > 0) {
    const unit = item.daysLate === 1 ? "day" : "days"
    return `Remind ${firstName} today, ${amount} is ${item.daysLate} ${unit} late`
  }
  return `Remind ${firstName} before ${formatDate(item.invoice.dueDate)}, ${amount} is due`
}

export function AssistantCard() {
  // Persisted store data only exists on the client, so wait for mount (same as today-rail).
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  const students = useStore((s) => s.students)
  const invoices = useStore((s) => s.invoices)
  const bills = useStore((s) => s.bills)
  const settings = useStore((s) => s.settings)
  const attendance = useStore((s) => s.attendance)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const today = toIsoDate(new Date())

  const chaseQueue = useMemo(
    () => buildChaseQueue({ students, invoices, bills, settings, attendance }, today),
    [students, invoices, bills, settings, attendance, today],
  )
  const top = chaseQueue[0] as ChaseItem | undefined

  // Read the dismissal after mount so the server and first client render match.
  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === today) setDismissed(true)
    } catch {
      // Storage unavailable (e.g. blocked): the card simply stays visible.
    }
  }, [today])

  function handleDismiss() {
    try {
      window.localStorage.setItem(DISMISS_KEY, today)
    } catch {
      // Storage unavailable: still hide the card for this session.
    }
    setDismissed(true)
  }

  if (!mounted || dismissed) return null

  return (
    <section
      aria-labelledby="assistant-card-heading"
      className="rounded-2xl bg-white border border-[#E3E8F0] p-5 shadow-[0_1px_2px_rgba(15,30,60,.06),0_8px_24px_rgba(15,30,60,.06)]"
    >
      <h2
        id="assistant-card-heading"
        className="text-sm font-semibold text-[#5B6B84]"
      >
        Your next step
      </h2>

      {top ? (
        <>
          <p className="mt-3 text-base leading-relaxed text-[#0F1E3C]">
            {actionSentence(top)}
          </p>

          <Button
            type="button"
            className="mt-5 h-11 w-full rounded-xl bg-[#1E3A6E] font-semibold text-white hover:bg-[#1E3A6E]/90"
            onClick={() => setReminderOpen(true)}
          >
            Send reminder
          </Button>

          <ReminderDialog
            invoice={top.invoice}
            student={top.student}
            upiId={settings.upiId}
            open={reminderOpen}
            onClose={() => setReminderOpen(false)}
          />
        </>
      ) : (
        <p className="mt-3 text-base leading-relaxed text-[#0F1E3C]">
          Nothing to chase today. Your parents are paid up.
        </p>
      )}

      <div className="mt-3 flex justify-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-[#5B6B84]"
          onClick={handleDismiss}
        >
          Dismiss
        </Button>
      </div>
    </section>
  )
}
