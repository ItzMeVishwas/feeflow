"use client"

import { useEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ChaseQueueDialog } from "@/components/chase-queue-dialog"
import { getAdvice } from "@/lib/advisor"
import { buildChaseQueue } from "@/lib/chase"
import { toIsoDate } from "@/lib/invoice-status"
import { useStore } from "@/lib/store"
import type { Advice } from "@/lib/advisor"

const DISMISS_KEY = "feeflow-assistant-dismissed"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

// Wraps the key amount in <strong> when it appears in the headline.
function renderHeadline(headline: string, keyPhrase: Advice["keyPhrase"]) {
  if (!keyPhrase) return headline
  const index = headline.indexOf(keyPhrase)
  if (index === -1) return headline
  return (
    <>
      {headline.slice(0, index)}
      <strong>{keyPhrase}</strong>
      {headline.slice(index + keyPhrase.length)}
    </>
  )
}

export function AssistantCard() {
  // Persisted store data only exists on the client, so wait for mount (same as today-rail).
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )
  const router = useRouter()

  const students = useStore((s) => s.students)
  const invoices = useStore((s) => s.invoices)
  const bills = useStore((s) => s.bills)
  const settings = useStore((s) => s.settings)
  const attendance = useStore((s) => s.attendance)
  const [chaseOpen, setChaseOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const today = toIsoDate(new Date())

  const advice = useMemo(
    () => getAdvice({ students, invoices, bills, settings, attendance }, today),
    [students, invoices, bills, settings, attendance, today],
  )

  const chaseQueue = useMemo(
    () => buildChaseQueue({ students, invoices, bills, settings, attendance }, today),
    [students, invoices, bills, settings, attendance, today],
  )

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

  function handleAction() {
    if (advice.action === "chaseAll") setChaseOpen(true)
    else if (advice.action === "openForecast") router.push("/forecast")
  }

  if (!mounted || dismissed) return null

  const actionLabel =
    advice.action === "chaseAll"
      ? "Chase them now"
      : advice.action === "openForecast"
        ? "See forecast"
        : advice.actionLabel

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

      <p className="mt-3 text-base leading-relaxed text-[#0F1E3C]">
        {renderHeadline(advice.headline, advice.keyPhrase)}
      </p>

      {advice.action !== "none" && (
        <Button
          type="button"
          className="mt-5 h-11 w-full rounded-xl bg-[#1E3A6E] font-semibold text-white hover:bg-[#1E3A6E]/90"
          onClick={handleAction}
        >
          {actionLabel}
        </Button>
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

      <ChaseQueueDialog
        open={chaseOpen}
        onClose={() => setChaseOpen(false)}
        queue={chaseQueue}
      />
    </section>
  )
}
