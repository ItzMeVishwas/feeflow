"use client"

import { useMemo, useState } from "react"

import { StatusPill, type PillTone } from "@/components/status-pill"
import { Input } from "@/components/ui/input"
import { assessPurchase, type Verdict } from "@/lib/afford"
import { toIsoDate } from "@/lib/invoice-status"
import type { AppState } from "@/lib/store"

const VERDICT_WORD: Record<Verdict, string> = {
  safe: "Safe",
  tight: "Tight",
  danger: "Danger",
}

const VERDICT_TONE: Record<Verdict, PillTone> = {
  safe: "paid",
  tight: "due",
  danger: "overdue",
}

const INVALID_MESSAGE = "Enter an amount in rupees, like 40000."

// Accepts "40000", "40,000" or "₹40,000". Anything that is not a positive number is invalid.
function parseAmount(text: string): number {
  return Number(text.replace(/[,\s₹]/g, ""))
}

export function AffordBox({ state }: { state: AppState }) {
  const [label, setLabel] = useState("")
  const [amountText, setAmountText] = useState("")

  const today = useMemo(() => toIsoDate(new Date()), [])
  const amount = parseAmount(amountText)
  const isEmpty = amountText.trim() === ""

  const assessment = useMemo(
    () => (isEmpty ? null : assessPurchase({ state, amount, label, today })),
    [state, amount, label, today, isEmpty],
  )

  const showInvalid = !isEmpty && assessment === null

  return (
    <section
      aria-labelledby="afford-heading"
      className="space-y-4 rounded-3xl border border-[#E6EBF2] bg-white p-5 shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)] dark:border-white/10 dark:bg-[#121E36]"
    >
      <h2 id="afford-heading" className="font-heading text-base font-semibold text-foreground">
        Can I afford this?
      </h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="afford-label" className="block text-xs text-muted-foreground">
            What is it?
          </label>
          <Input
            id="afford-label"
            type="text"
            placeholder="New laptop"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-11 rounded-xl border-[#DCE3EE]"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="afford-amount" className="block text-xs text-muted-foreground">
            Amount (₹)
          </label>
          <Input
            id="afford-amount"
            type="text"
            inputMode="numeric"
            placeholder="40000"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            aria-describedby={showInvalid ? "afford-amount-error" : undefined}
            aria-invalid={showInvalid || undefined}
            className="h-11 rounded-xl border-[#DCE3EE]"
          />
        </div>
      </div>

      {showInvalid && (
        <p id="afford-amount-error" className="text-sm text-[#D93F3F]">
          {INVALID_MESSAGE}
        </p>
      )}

      {assessment && (
        <div role="status" aria-live="polite" className="space-y-1">
          <div>
            <StatusPill tone={VERDICT_TONE[assessment.verdict]}>
              {VERDICT_WORD[assessment.verdict]}
            </StatusPill>
          </div>
          <p className="text-sm tabular-nums text-foreground">{assessment.reason}</p>
        </div>
      )}
    </section>
  )
}
