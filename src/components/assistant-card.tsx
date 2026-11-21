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

const ORB_BACKGROUND =
  "conic-gradient(from 0deg, #F2A93B, #2A1F3D, #3DD9A8, #F2A93B)"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
}

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
  const [chaseOpen, setChaseOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const today = toIsoDate(new Date())

  const advice = useMemo(
    () => getAdvice({ students, invoices, bills, settings }, today),
    [students, invoices, bills, settings, today],
  )

  const chaseQueue = useMemo(
    () => buildChaseQueue({ students, invoices, bills, settings }, today),
    [students, invoices, bills, settings, today],
  )

  const relatedStudents = useMemo(
    () => students.filter((s) => advice.relatedStudentIds.includes(s.id)),
    [students, advice.relatedStudentIds],
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

  return (
    <section
      aria-labelledby="assistant-card-heading"
      className="glass-strong rounded-2xl p-5"
    >
      <div className="flex items-center gap-3">
        <div className="relative size-10 shrink-0" aria-hidden="true">
          <div
            className="assistant-orb absolute inset-0 rounded-full"
            style={{ background: ORB_BACKGROUND }}
          />
          <div
            className="assistant-orb absolute inset-0 rounded-full opacity-60 blur-md"
            style={{ background: ORB_BACKGROUND }}
          />
        </div>
        <h2
          id="assistant-card-heading"
          className="font-heading text-base font-semibold text-foreground"
        >
          FeeFlow Assistant
        </h2>
      </div>

      <p className="mt-4 font-heading text-xl font-semibold tracking-tight tabular-nums text-foreground sm:text-2xl">
        {renderHeadline(advice.headline, advice.keyPhrase)}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{advice.detail}</p>

      {relatedStudents.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Students involved">
          {relatedStudents.map((student) => (
            <li
              key={student.id}
              className="rounded-xl bg-muted px-2 py-1 text-xs font-medium text-foreground"
            >
              <span aria-hidden="true">{initials(student.name)}</span>
              <span className="sr-only">{student.name}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {advice.action !== "none" && (
          <Button type="button" className="w-full sm:w-auto" onClick={handleAction}>
            {advice.actionLabel}
          </Button>
        )}
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
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
