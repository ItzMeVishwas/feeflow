"use client"

import { useEffect, useState } from "react"
import { useReducedMotion } from "motion/react"
import { toast } from "sonner"

import { WaveChart, type WaveSeries } from "@/components/charts/wave-chart"
import { PageHeader } from "@/components/page-header"
import { AnimatedNumber } from "@/components/ui/animated-number"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { formatINR } from "@/lib/format"
import {
  currentMonthSummary,
  familiesWithSibling,
  lastCompleteMonthSummary,
  lateFeesThisMonth,
  paymentDayHistogram,
  profitMonths,
  reminderSentence,
} from "@/lib/insights"
import { useStore, type FeeRules } from "@/lib/store"

// Same values as the palette tokens. WaveChart sets these as SVG stroke attributes, where CSS
// variables are not reliable, so the hex values are passed directly.
const POSITIVE = "#0E9F8E"
const NEGATIVE = "#D93F3F"
const BAR_MAX_PX = 56
const BAR_MIN_PX = 4

const CARD_CLASS =
  "rounded-3xl border border-[#E6EBF2] bg-white shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)] dark:border-white/10 dark:bg-[#121E36]"

const DEFAULT_FEE_RULES: FeeRules = {
  lateFee: { enabled: false, amount: 100, afterDays: 10 },
  siblingDiscount: { enabled: false, percent: 10 },
}

const saveButtonClass =
  "h-11 rounded-xl bg-[#0B2A55] px-5 font-semibold text-white hover:bg-[#133A72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"
const fieldClass = "h-11 rounded-xl border-[#DCE3EE]"

const formatWhole = (n: number) => formatINR(n, { wholeRupees: true })

function toNonNegative(value: string): number {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export default function InsightsPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <PageHeader
        title="Insights"
        description="See how your money moves, when parents pay and which fee rules to use."
      />
      <SummaryHero />
      <ProfitSection />
      <ReminderTimingSection />
      <FeeRulesSection />
    </div>
  )
}

function SummaryHero() {
  const invoices = useStore((s) => s.invoices)
  const bills = useStore((s) => s.bills)
  const reduceMotion = useReducedMotion()

  const headline = lastCompleteMonthSummary(invoices, bills)

  return (
    <section
      aria-labelledby="summary-heading"
      className="flex flex-col gap-2 rounded-3xl bg-[#0B2A55] p-6 text-white shadow-[0_1px_2px_rgba(10,31,61,.08),0_8px_24px_rgba(10,31,61,.12)] sm:p-7"
    >
      <h2 id="summary-heading" className="sr-only">
        Net profit summary
      </h2>
      <p className="text-sm text-white/80">Net profit in {headline.label}</p>
      <p className="font-heading text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
        {reduceMotion ? (
          formatWhole(headline.net)
        ) : (
          <AnimatedNumber value={headline.net} format={formatWhole} />
        )}
      </p>
      <p className="text-sm text-white/80">
        {headline.marginPct === null
          ? "Margin not available yet"
          : `Margin ${headline.marginPct}%`}
      </p>
    </section>
  )
}

function ProfitSection() {
  const invoices = useStore((s) => s.invoices)
  const bills = useStore((s) => s.bills)

  const chart = profitMonths(invoices, bills)
  const current = currentMonthSummary(invoices, bills)
  const currentLabel = new Date().toLocaleDateString("en-US", { month: "long" })
  const series: WaveSeries[] = [
    { key: "income", label: "Income", color: POSITIVE, values: chart.income },
    { key: "expenses", label: "Expenses", color: NEGATIVE, values: chart.expenses },
  ]

  return (
    <section
      aria-labelledby="profit-heading"
      className={`flex flex-col gap-6 p-5 sm:p-7 ${CARD_CLASS}`}
    >
      <div className="flex flex-col gap-1">
        <h2 id="profit-heading" className="font-heading text-lg font-semibold text-[#0A1F3D] dark:text-[#E6ECF5]">
          Profit and expenses
        </h2>
        <p className="text-sm text-[#5E6E87] dark:text-[#93A3BC]">Last 6 months</p>
      </div>

      <WaveChart series={series} labels={chart.labels} height={200} zeroLine />

      <div className="flex flex-col gap-1">
        <p className="text-sm text-[#5E6E87] dark:text-[#93A3BC]">
          {currentLabel} so far: {formatINR(current.income)} in, {formatINR(current.expenses)} out
        </p>
      </div>
    </section>
  )
}

function ReminderTimingSection() {
  const invoices = useStore((s) => s.invoices)
  const { counts, topDays } = paymentDayHistogram(invoices)
  const max = Math.max(...counts, 0)

  return (
    <section
      aria-labelledby="reminder-heading"
      className={`flex flex-col gap-4 p-5 ${CARD_CLASS}`}
    >
      <h2 id="reminder-heading" className="font-heading text-base font-semibold text-[#0A1F3D] dark:text-[#E6ECF5]">
        Best time to send reminders
      </h2>

      {topDays.length > 0 && (
        <div className="flex flex-wrap gap-1" aria-hidden="true">
          {counts.map((count, index) => {
            const day = index + 1
            const isTop = topDays.includes(day)
            const heightPx =
              max > 0 ? Math.max(BAR_MIN_PX, Math.round((count / max) * BAR_MAX_PX)) : BAR_MIN_PX
            return (
              <div key={day} className="flex min-w-[5px] flex-1 flex-col items-center gap-1">
                <div className="flex h-14 w-full items-end">
                  <div
                    className={`w-full rounded-full transition-colors ${
                      isTop ? "bg-[#0B2A55] dark:bg-[#9DB6E6]" : "bg-[#5E6E87]/25"
                    }`}
                    style={{
                      height: heightPx,
                      boxShadow: isTop ? "0 0 12px rgba(11,42,85,.35)" : undefined,
                    }}
                  />
                </div>
                <span className="h-4 text-xs tabular-nums text-[#0B2A55] dark:text-[#9DB6E6]">{isTop ? day : ""}</span>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-sm text-[#5E6E87] dark:text-[#93A3BC]">{reminderSentence(topDays)}</p>
    </section>
  )
}

type FeeDraft = {
  lateEnabled: boolean
  lateAmount: string
  lateAfterDays: string
  siblingEnabled: boolean
  siblingPercent: string
}

function toDraft(rules: FeeRules): FeeDraft {
  return {
    lateEnabled: rules.lateFee.enabled,
    lateAmount: String(rules.lateFee.amount),
    lateAfterDays: String(rules.lateFee.afterDays),
    siblingEnabled: rules.siblingDiscount.enabled,
    siblingPercent: String(rules.siblingDiscount.percent),
  }
}

function fromDraft(draft: FeeDraft): FeeRules {
  return {
    lateFee: {
      enabled: draft.lateEnabled,
      amount: toNonNegative(draft.lateAmount),
      afterDays: Math.round(toNonNegative(draft.lateAfterDays)),
    },
    siblingDiscount: {
      enabled: draft.siblingEnabled,
      percent: Math.min(100, toNonNegative(draft.siblingPercent)),
    },
  }
}

function FeeRulesSection() {
  const invoices = useStore((s) => s.invoices)
  const students = useStore((s) => s.students)
  const updateSettings = useStore((s) => s.updateSettings)
  // Settings saved before feeRules existed have no value, so fall back to the defaults.
  const savedRules = useStore((s) => s.settings.feeRules) ?? DEFAULT_FEE_RULES

  const [draft, setDraft] = useState<FeeDraft>(() => toDraft(savedRules))
  // True once the user edits a field; blocks the re-sync so their input is never overwritten.
  const [dirty, setDirty] = useState(false)

  // Zustand persist rehydrates after the first render, so re-sync the draft from the store until the user edits.
  useEffect(() => {
    if (!dirty) setDraft(toDraft(savedRules))
  }, [savedRules, dirty])

  const lateFees = lateFeesThisMonth(invoices, savedRules)
  const siblingFamilies = familiesWithSibling(students, savedRules)

  function update(patch: Partial<FeeDraft>) {
    setDraft((current) => ({ ...current, ...patch }))
    setDirty(true)
  }

  function save() {
    updateSettings({ feeRules: fromDraft(draft) })
    setDirty(false)
    toast.success("Fee rules saved")
  }

  return (
    <section aria-labelledby="fee-rules-heading" className={`flex flex-col gap-6 p-5 ${CARD_CLASS}`}>
      <h2 id="fee-rules-heading" className="font-heading text-base font-semibold text-[#0A1F3D] dark:text-[#E6ECF5]">
        Fee rules
      </h2>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="late-fee-enabled" className="text-sm font-medium">
            Late fee
          </Label>
          <Switch
            id="late-fee-enabled"
            checked={draft.lateEnabled}
            onCheckedChange={(checked) => update({ lateEnabled: checked })}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="late-fee-amount">Late fee amount (₹)</Label>
            <Input
              id="late-fee-amount"
              type="number"
              min={0}
              inputMode="decimal"
              className={fieldClass}
              value={draft.lateAmount}
              disabled={!draft.lateEnabled}
              onChange={(e) => update({ lateAmount: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="late-fee-after-days">After how many days</Label>
            <Input
              id="late-fee-after-days"
              type="number"
              min={0}
              inputMode="numeric"
              className={fieldClass}
              value={draft.lateAfterDays}
              disabled={!draft.lateEnabled}
              onChange={(e) => update({ lateAfterDays: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="sibling-discount-enabled" className="text-sm font-medium">
            Sibling discount
          </Label>
          <Switch
            id="sibling-discount-enabled"
            checked={draft.siblingEnabled}
            onCheckedChange={(checked) => update({ siblingEnabled: checked })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sibling-discount-percent">% off for the second child</Label>
          <Input
            id="sibling-discount-percent"
            type="number"
            min={0}
            max={100}
            inputMode="decimal"
            className={fieldClass}
            value={draft.siblingPercent}
            disabled={!draft.siblingEnabled}
            onChange={(e) => update({ siblingPercent: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-[#5E6E87] dark:text-[#93A3BC]">
        <p>{`${formatINR(lateFees)} late fees you could charge this month`}</p>
        <p>{`${siblingFamilies} families get a sibling discount`}</p>
      </div>

      <div className="flex justify-end">
        <Button className={saveButtonClass} onClick={save} disabled={!dirty}>
          Save fee rules
        </Button>
      </div>
    </section>
  )
}
