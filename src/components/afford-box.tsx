"use client"

import { useMemo, useState } from "react"

import { Input } from "@/components/ui/input"
import { assessPurchase, type Verdict } from "@/lib/afford"
import { toIsoDate } from "@/lib/invoice-status"
import type { AppState } from "@/lib/store"

const VERDICT_WORD: Record<Verdict, string> = {
  safe: "Safe",
  tight: "Tight",
  danger: "Danger",
}

const VERDICT_COLOR: Record<Verdict, string> = {
  safe: "text-[#3DD9A8]",
  tight: "text-[#F2A93B]",
  danger: "text-[#FF6B6B]",
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
    <section aria-labelledby="afford-heading" className="glass space-y-4 rounded-2xl p-5">
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
          />
        </div>
      </div>

      {showInvalid && (
        <p id="afford-amount-error" className="text-sm text-[#FF6B6B]">
          {INVALID_MESSAGE}
        </p>
      )}

      {assessment && (
        <div role="status" aria-live="polite" className="space-y-1">
          <p className={`text-base font-semibold ${VERDICT_COLOR[assessment.verdict]}`}>
            <strong>{VERDICT_WORD[assessment.verdict]}</strong>
          </p>
          <p className="text-sm tabular-nums text-foreground">{assessment.reason}</p>
        </div>
      )}
    </section>
  )
}
