"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { formatINR } from "@/lib/format"
import {
  useStore,
  type AppState,
  type AttendanceRecord,
  type Bill,
  type Invoice,
  type Settings,
  type Student,
} from "@/lib/store"

type ReminderLanguage = Settings["reminderLanguage"]
type LateFeeUnit = Settings["lateFeeUnit"]
type ReminderDays = Settings["reminderDays"]

type TabId = "profile" | "fees" | "appearance" | "data"

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "fees", label: "Fees and reminders" },
  { id: "appearance", label: "Appearance" },
  { id: "data", label: "Data" },
]

const REMINDER_OPTIONS: ReminderDays[] = [3, 7, 14]
const DEFAULT_TEMPLATE =
  "Hi {parentName}, the fee of {amount} for {month} is due. Please pay by UPI. Thank you."
const PREVIEW_VALUES: Record<string, string> = {
  parentName: "Rahul's parent",
  amount: "₹1,800",
  month: "November",
}

const CARD_CLASS =
  "rounded-3xl border border-[#E6EBF2] bg-white shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)] dark:border-white/10 dark:bg-[#121E36]"
const INK_CLASS = "text-[#0A1F3D] dark:text-white"
const MUTED_CLASS = "text-[#5E6E87] dark:text-white/60"
const FOCUS_CLASS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"
const saveButtonClass = `h-11 rounded-xl bg-[#0B2A55] px-5 font-semibold text-white hover:bg-[#133A72] ${FOCUS_CLASS} disabled:cursor-not-allowed disabled:opacity-50`
const secondaryButtonClass = `h-11 rounded-xl border border-[#DCE3EE] bg-white px-5 font-semibold text-[#0B2A55] hover:bg-[#F5F7FB] dark:bg-transparent dark:text-white dark:hover:bg-white/5 ${FOCUS_CLASS}`
const dangerButtonClass =
  "bg-[#D93F3F] text-white hover:bg-[#C23535] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D93F3F]"
const fieldClass = "h-11 rounded-xl border-[#DCE3EE]"
const selectClass = `h-11 w-full rounded-xl border border-[#DCE3EE] bg-white px-2.5 text-base text-[#0A1F3D] outline-none transition-colors ${FOCUS_CLASS} md:text-sm dark:border-white/10 dark:bg-input/30 dark:text-white`

// Editable fields. Numbers are kept as strings so inputs can be empty while typing.
type Draft = {
  tutorName: string
  phone: string
  upiId: string
  businessName: string
  startingCash: string
  feeDay: string
  lateFeeEnabled: boolean
  lateFeeUnit: LateFeeUnit
  lateFeeAmount: string
  lateFeeAfterDays: string
  reminderDays: ReminderDays
  reminderLanguage: ReminderLanguage
  reminderTemplate: string
}

type DraftErrors = Partial<
  Record<"startingCash" | "feeDay" | "lateFeeAmount" | "lateFeeAfterDays", string>
>

type PanelProps = {
  draft: Draft
  update: (changes: Partial<Draft>) => void
  errors: DraftErrors
}

function draftFromSettings(s: Settings): Draft {
  return {
    tutorName: s.tutorName ?? "",
    phone: s.phone ?? "",
    upiId: s.upiId ?? "",
    businessName: s.businessName ?? "",
    startingCash: String(s.startingCashBalance ?? 0),
    feeDay: String(s.feeDay ?? 1),
    lateFeeEnabled: s.feeRules.lateFee.enabled,
    lateFeeUnit: s.lateFeeUnit ?? "flat",
    lateFeeAmount: String(s.feeRules.lateFee.amount ?? 0),
    lateFeeAfterDays: String(s.feeRules.lateFee.afterDays ?? 0),
    reminderDays: s.reminderDays ?? 7,
    reminderLanguage: s.reminderLanguage ?? "english",
    reminderTemplate: s.reminderTemplate ?? DEFAULT_TEMPLATE,
  }
}

function parseNumber(value: string): number {
  return value.trim() === "" ? NaN : Number(value)
}

function validateDraft(d: Draft): DraftErrors {
  const errors: DraftErrors = {}
  const cash = parseNumber(d.startingCash)
  if (!(Number.isFinite(cash) && cash >= 0)) errors.startingCash = "Enter an amount of 0 or more."
  const day = parseNumber(d.feeDay)
  if (!(Number.isInteger(day) && day >= 1 && day <= 28)) {
    errors.feeDay = "Enter a day between 1 and 28."
  }
  if (d.lateFeeEnabled) {
    const amount = parseNumber(d.lateFeeAmount)
    if (!(Number.isFinite(amount) && amount >= 0)) {
      errors.lateFeeAmount = "Enter an amount of 0 or more."
    }
    const days = parseNumber(d.lateFeeAfterDays)
    if (!(Number.isInteger(days) && days >= 0)) {
      errors.lateFeeAfterDays = "Enter a whole number of days, 0 or more."
    }
  }
  return errors
}

function renderTemplate(template: string): string {
  return template.replace(
    /\{(parentName|amount|month)\}/g,
    (_match, key: string) => PREVIEW_VALUES[key] ?? "",
  )
}

function getInitials(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("")
  return initials || "?"
}

export default function SettingsPage() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)

  const [tab, setTab] = useState<TabId>("profile")
  const [hydrated, setHydrated] = useState(false)
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({})

  // Zustand persist rehydrates after the first render, so wait before treating the store as the baseline.
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setHydrated(true)
    return useStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  const saved = useMemo(() => draftFromSettings(settings), [settings])
  const [draft, setDraft] = useState<Draft>(saved)

  // Re-seed the draft whenever the stored settings change (hydration, save, restore, reset).
  useEffect(() => {
    setDraft(saved)
  }, [saved])

  const update = (changes: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...changes }))
  const errors = validateDraft(draft)
  const hasErrors = Object.keys(errors).length > 0
  const dirty = hydrated && JSON.stringify(draft) !== JSON.stringify(saved)
  const showSaveBar = dirty && (tab === "profile" || tab === "fees")

  function handleSave() {
    if (!dirty || hasErrors) return
    const cash = parseNumber(draft.startingCash)
    const lateAmount = parseNumber(draft.lateFeeAmount)
    const lateDays = parseNumber(draft.lateFeeAfterDays)
    updateSettings({
      tutorName: draft.tutorName.trim(),
      phone: draft.phone.trim(),
      upiId: draft.upiId.trim(),
      businessName: draft.businessName.trim(),
      startingCashBalance: Math.round(cash * 100) / 100,
      feeDay: parseNumber(draft.feeDay),
      lateFeeUnit: draft.lateFeeUnit,
      reminderDays: draft.reminderDays,
      reminderLanguage: draft.reminderLanguage,
      reminderTemplate: draft.reminderTemplate,
      // Spread the whole feeRules so siblingDiscount is kept.
      feeRules: {
        ...settings.feeRules,
        lateFee: {
          enabled: draft.lateFeeEnabled,
          amount: Number.isFinite(lateAmount) ? lateAmount : 0,
          afterDays: Number.isFinite(lateDays) ? lateDays : 0,
        },
      },
    })
    toast.success("Settings saved")
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"]
    if (!keys.includes(event.key)) return
    event.preventDefault()
    const index = TABS.findIndex((t) => t.id === tab)
    let next = index
    if (event.key === "Home") next = 0
    else if (event.key === "End") next = TABS.length - 1
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      next = (index + 1) % TABS.length
    } else next = (index - 1 + TABS.length) % TABS.length
    const nextId = TABS[next].id
    setTab(nextId)
    tabRefs.current[nextId]?.focus()
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, fee rules, reminders, appearance and data."
      />

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div
          role="tablist"
          aria-label="Settings sections"
          aria-orientation="vertical"
          className="flex gap-1 overflow-x-auto md:w-56 md:shrink-0 md:flex-col md:overflow-visible"
        >
          {TABS.map((t) => {
            const active = t.id === tab
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el
                }}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${t.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={handleTabKeyDown}
                className={`shrink-0 whitespace-nowrap rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors md:w-full md:px-4 ${FOCUS_CLASS} ${
                  active
                    ? "bg-[#0B2A55] text-white"
                    : `${MUTED_CLASS} hover:bg-[#EEF3FA] hover:text-[#0A1F3D] dark:hover:bg-white/5 dark:hover:text-white`
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
          className={`flex min-w-0 flex-1 flex-col gap-6 ${FOCUS_CLASS}`}
        >
          {tab === "profile" ? <ProfilePanel draft={draft} update={update} errors={errors} /> : null}
          {tab === "fees" ? <FeesPanel draft={draft} update={update} errors={errors} /> : null}
          {tab === "appearance" ? <AppearancePanel /> : null}
          {tab === "data" ? <DataPanel /> : null}
        </div>
      </div>

      {showSaveBar ? (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-[#E6EBF2] bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(10,31,61,.08)] sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-[#121E36]"
        >
          <p className={`text-sm font-medium ${INK_CLASS}`}>You have unsaved changes</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className={secondaryButtonClass}
              onClick={() => setDraft(saved)}
            >
              Discard
            </Button>
            <Button
              type="button"
              className={saveButtonClass}
              disabled={hasErrors}
              onClick={handleSave}
            >
              Save changes
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function FieldMessage({
  base,
  error,
  children,
}: {
  base: string
  error?: string
  children?: ReactNode
}) {
  if (error) {
    return (
      <p id={`${base}-error`} className="text-sm text-[#D93F3F]">
        {error}
      </p>
    )
  }
  return (
    <p id={`${base}-hint`} className={`text-sm ${MUTED_CLASS}`}>
      {children}
    </p>
  )
}

function ProfilePanel({ draft, update, errors }: PanelProps) {
  const cash = parseNumber(draft.startingCash)
  return (
    <section aria-labelledby="profile-heading" className={`${CARD_CLASS} p-5 md:p-6`}>
      <h2 id="profile-heading" className={`font-heading text-lg font-semibold ${INK_CLASS}`}>
        Profile
      </h2>
      <p className={`mt-1 text-sm ${MUTED_CLASS}`}>
        Your name and payment details, shown to parents on reminders.
      </p>

      <div className="mt-5 flex items-center gap-4">
        <div
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#0B2A55] text-xl font-semibold text-white"
        >
          {getInitials(draft.tutorName)}
        </div>
        <p className={`text-sm ${MUTED_CLASS}`}>Your avatar uses your initials.</p>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tutor-name">Tutor name</Label>
          <Input
            id="tutor-name"
            type="text"
            autoComplete="name"
            value={draft.tutorName}
            onChange={(e) => update({ tutorName: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="phone">Phone for WhatsApp</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={draft.phone}
            onChange={(e) => update({ phone: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="upi-id">UPI id</Label>
          <Input
            id="upi-id"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={draft.upiId}
            onChange={(e) => update({ upiId: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="business-name">Business name</Label>
          <Input
            id="business-name"
            type="text"
            autoComplete="organization"
            value={draft.businessName}
            onChange={(e) => update({ businessName: e.target.value })}
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="starting-cash">Starting cash balance (₹)</Label>
          <Input
            id="starting-cash"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={draft.startingCash}
            onChange={(e) => update({ startingCash: e.target.value })}
            aria-invalid={errors.startingCash ? true : undefined}
            aria-describedby={
              errors.startingCash ? "starting-cash-error" : "starting-cash-hint"
            }
            className={fieldClass}
          />
          <FieldMessage base="starting-cash" error={errors.startingCash}>
            {`Shows as ${formatINR(cash)}`}
          </FieldMessage>
        </div>
      </div>
    </section>
  )
}

function FeesPanel({ draft, update, errors }: PanelProps) {
  const previewText = renderTemplate(draft.reminderTemplate)
  return (
    <section aria-labelledby="fees-heading" className={`${CARD_CLASS} p-5 md:p-6`}>
      <h2 id="fees-heading" className={`font-heading text-lg font-semibold ${INK_CLASS}`}>
        Fees and reminders
      </h2>
      <p className={`mt-1 text-sm ${MUTED_CLASS}`}>
        Set when fees are due, when late fees apply and what reminders say.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fee-day">Default fee day</Label>
          <Input
            id="fee-day"
            type="number"
            inputMode="numeric"
            min={1}
            max={28}
            step={1}
            value={draft.feeDay}
            onChange={(e) => update({ feeDay: e.target.value })}
            aria-invalid={errors.feeDay ? true : undefined}
            aria-describedby={errors.feeDay ? "fee-day-error" : "fee-day-hint"}
            className={`${fieldClass} sm:max-w-40`}
          />
          <FieldMessage base="fee-day" error={errors.feeDay}>
            Day of the month fees are due, from 1 to 28.
          </FieldMessage>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-[#E6EBF2] p-4 dark:border-white/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="late-fee-enabled">Charge a late fee</Label>
              <p className={`text-sm ${MUTED_CLASS}`}>Applies to unpaid invoices after the days below.</p>
            </div>
            <Switch
              id="late-fee-enabled"
              checked={draft.lateFeeEnabled}
              onCheckedChange={(checked) => update({ lateFeeEnabled: checked })}
            />
          </div>

          <div className="flex flex-col gap-2">
            <p id="late-fee-unit-label" className={`text-sm font-medium ${INK_CLASS}`}>
              Late fee type
            </p>
            <div
              role="group"
              aria-labelledby="late-fee-unit-label"
              className="inline-flex w-fit rounded-xl border border-[#DCE3EE] p-1 dark:border-white/10"
            >
              {(["flat", "percent"] as const).map((unit) => {
                const active = draft.lateFeeUnit === unit
                return (
                  <button
                    key={unit}
                    type="button"
                    aria-pressed={active}
                    disabled={!draft.lateFeeEnabled}
                    onClick={() => update({ lateFeeUnit: unit })}
                    className={`h-9 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_CLASS} ${
                      active ? "bg-[#0B2A55] text-white" : `${MUTED_CLASS} hover:text-[#0A1F3D] dark:hover:text-white`
                    }`}
                  >
                    {unit === "flat" ? "₹ flat" : "%"}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="late-fee-amount">Late fee amount</Label>
              <Input
                id="late-fee-amount"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={draft.lateFeeAmount}
                disabled={!draft.lateFeeEnabled}
                onChange={(e) => update({ lateFeeAmount: e.target.value })}
                aria-invalid={errors.lateFeeAmount ? true : undefined}
                aria-describedby={
                  errors.lateFeeAmount ? "late-fee-amount-error" : "late-fee-amount-hint"
                }
                className={fieldClass}
              />
              <FieldMessage base="late-fee-amount" error={errors.lateFeeAmount}>
                {draft.lateFeeUnit === "flat" ? "In rupees." : "In percent of the invoice."}
              </FieldMessage>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="late-fee-days">After how many days</Label>
              <Input
                id="late-fee-days"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={draft.lateFeeAfterDays}
                disabled={!draft.lateFeeEnabled}
                onChange={(e) => update({ lateFeeAfterDays: e.target.value })}
                aria-invalid={errors.lateFeeAfterDays ? true : undefined}
                aria-describedby={
                  errors.lateFeeAfterDays ? "late-fee-days-error" : "late-fee-days-hint"
                }
                className={fieldClass}
              />
              <FieldMessage base="late-fee-days" error={errors.lateFeeAfterDays}>
                Days after the due date.
              </FieldMessage>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p id="reminder-days-label" className={`text-sm font-medium ${INK_CLASS}`}>
            Auto-reminder
          </p>
          <div
            role="radiogroup"
            aria-labelledby="reminder-days-label"
            className="grid grid-cols-3 gap-2"
          >
            {REMINDER_OPTIONS.map((days) => {
              const checked = draft.reminderDays === days
              return (
                <button
                  key={days}
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => update({ reminderDays: days })}
                  className={`h-11 rounded-xl border text-sm font-medium transition-colors ${FOCUS_CLASS} ${
                    checked
                      ? "border-[#0B2A55] bg-[#EEF3FA] text-[#0B2A55] dark:border-white dark:bg-white/10 dark:text-white"
                      : `border-[#DCE3EE] ${MUTED_CLASS} hover:text-[#0A1F3D] dark:border-white/10 dark:hover:text-white`
                  }`}
                >
                  {`${days} days late`}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder-language">Reminder language</Label>
          <select
            id="reminder-language"
            value={draft.reminderLanguage}
            onChange={(e) => update({ reminderLanguage: e.target.value as ReminderLanguage })}
            className={selectClass}
          >
            <option value="english" className="bg-popover text-popover-foreground">
              English
            </option>
            <option value="hinglish" className="bg-popover text-popover-foreground">
              Hinglish
            </option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder-template">WhatsApp reminder template</Label>
          <Textarea
            id="reminder-template"
            rows={5}
            value={draft.reminderTemplate}
            onChange={(e) => update({ reminderTemplate: e.target.value })}
            className="rounded-xl border-[#DCE3EE]"
          />
          <p className={`text-sm ${MUTED_CLASS}`}>
            Use {"{parentName}"}, {"{amount}"} and {"{month}"} to fill in details.
          </p>
        </div>

        <div className="rounded-2xl bg-[#F5F7FB] p-4 dark:bg-white/5">
          <p className={`text-xs font-semibold uppercase tracking-wide ${MUTED_CLASS}`}>Preview</p>
          <p aria-live="polite" className={`mt-2 whitespace-pre-wrap text-sm ${INK_CLASS}`}>
            {previewText}
          </p>
        </div>
      </div>
    </section>
  )
}

const THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const

function PreviewSurface({ dark, className = "" }: { dark: boolean; className?: string }) {
  return (
    <div
      className={`flex min-w-0 gap-2 p-2 ${dark ? "bg-[#0B1424]" : "bg-[#F5F7FB]"} ${className}`}
    >
      <div className={`w-1/4 rounded-md ${dark ? "bg-[#121E36]" : "bg-white"}`} />
      <div
        className={`flex flex-1 flex-col gap-1.5 rounded-md p-2 ${dark ? "bg-[#1A2A46]" : "bg-white"}`}
      >
        <div className={`h-2 w-3/4 rounded-full ${dark ? "bg-white/30" : "bg-[#0B2A55]/70"}`} />
        <div className={`h-2 w-1/2 rounded-full ${dark ? "bg-white/15" : "bg-[#E6EBF2]"}`} />
      </div>
    </div>
  )
}

function ThemePreview({ variant }: { variant: "light" | "dark" | "system" }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-24 overflow-hidden rounded-xl border border-[#E6EBF2] dark:border-white/10"
    >
      {variant === "system" ? (
        <>
          <PreviewSurface dark={false} className="flex-1" />
          <PreviewSurface dark className="flex-1" />
        </>
      ) : (
        <PreviewSurface dark={variant === "dark"} className="flex-1" />
      )}
    </div>
  )
}

function AppearancePanel() {
  const { theme, setTheme } = useTheme()
  const compactMode = useStore((s) => s.settings.compactMode) ?? false
  const updateSettings = useStore((s) => s.updateSettings)

  return (
    <section aria-labelledby="appearance-heading" className={`${CARD_CLASS} p-5 md:p-6`}>
      <h2 id="appearance-heading" className={`font-heading text-lg font-semibold ${INK_CLASS}`}>
        Appearance
      </h2>
      <p className={`mt-1 text-sm ${MUTED_CLASS}`}>Choose how FeeFlow looks on this device.</p>

      <p id="theme-label" className={`mt-6 text-sm font-medium ${INK_CLASS}`}>
        Theme
      </p>
      <div role="radiogroup" aria-labelledby="theme-label" className="mt-2 grid gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((option) => {
          const selected = theme === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setTheme(option.value)}
              className={`flex flex-col gap-3 rounded-2xl border p-3 text-left transition-shadow ${FOCUS_CLASS} ${
                selected
                  ? "border-transparent ring-2 ring-[#0B2A55] dark:ring-white"
                  : "border-[#DCE3EE] hover:border-[#B8C4D6] dark:border-white/10"
              }`}
            >
              <ThemePreview variant={option.value} />
              <span className={`text-sm font-medium ${INK_CLASS}`}>{option.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-[#E6EBF2] p-4 dark:border-white/10">
        <div className="flex flex-col gap-1">
          <Label htmlFor="compact-mode">Compact mode</Label>
          <p className={`text-sm ${MUTED_CLASS}`}>Use tighter spacing in lists and tables.</p>
        </div>
        <Switch
          id="compact-mode"
          checked={compactMode}
          onCheckedChange={(checked) => {
            updateSettings({ compactMode: checked })
            toast.success("Settings saved")
          }}
        />
      </div>
    </section>
  )
}

function DataPanel() {
  return (
    <>
      <section aria-labelledby="data-heading" className={`${CARD_CLASS} p-5 md:p-6`}>
        <h2 id="data-heading" className={`font-heading text-lg font-semibold ${INK_CLASS}`}>
          Backup and export
        </h2>
        <p className={`mt-1 text-sm ${MUTED_CLASS}`}>
          Save a full backup, restore one, or export invoices for a spreadsheet.
        </p>
        <BackupControls />
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" className={secondaryButtonClass} onClick={() => exportInvoicesCsv()}>
            Export invoices as CSV
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="danger-heading"
        className="rounded-3xl border border-[#D93F3F]/40 bg-white p-5 md:p-6 dark:bg-[#121E36]"
      >
        <h2 id="danger-heading" className="font-heading text-lg font-semibold text-[#D93F3F]">
          Danger zone
        </h2>
        <p className={`mt-1 text-sm ${MUTED_CLASS}`}>
          These actions replace or delete your student, invoice and bill records.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <DataActionDialog
            triggerLabel="Reset demo data"
            title="Reset to demo data?"
            description="This replaces all students, invoices and bills with the demo set. Your settings stay as they are."
            confirmLabel="Reset to demo data"
            onConfirm={() => {
              useStore.getState().resetToDemo()
              toast.success("Demo data restored")
            }}
          />
          <DataActionDialog
            triggerLabel="Start fresh"
            title="Start fresh?"
            description="This deletes all students, invoices and bills. Your name, UPI id, cash balance and language are kept."
            confirmLabel="Start fresh"
            onConfirm={() => {
              useStore.getState().clearAll()
              toast.success("All students, invoices and bills deleted")
            }}
          />
        </div>
      </section>
    </>
  )
}

// Local calendar date as "YYYY-MM-DD" for file names.
function localDateStamp(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// Quote a CSV cell when it contains a comma, quote or line break.
function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function exportInvoicesCsv() {
  const { invoices, students } = useStore.getState()
  const header = ["Student", "Parent", "Amount", "Due date", "Status", "Paid date"]
  const rows = invoices.map((invoice) => {
    const student = students.find((s) => s.id === invoice.studentId)
    return [
      student?.name ?? "",
      student?.parentName ?? "",
      invoice.amount,
      invoice.dueDate,
      invoice.status,
      invoice.paidDate ?? "",
    ]
  })
  const csv = [header, ...rows].map((row) => row.map(escapeCsvCell).join(",")).join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `feeflow-invoices-${localDateStamp(new Date())}.csv`
  anchor.click()
  // Revoke on the next tick so the browser has started the download before the URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

// Shape of a backup file after validation. Records are checked as plain objects, not field by field.
type BackupFile = {
  students: Record<string, unknown>[]
  invoices: Record<string, unknown>[]
  bills: Record<string, unknown>[]
  settings?: Record<string, unknown>
  attendance?: Record<string, unknown>[]
}

const notABackupMessage =
  "This file is not a FeeFlow backup. It needs students, invoices and bills lists."

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isRecordList(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isPlainObject)
}

function parseBackup(value: unknown): BackupFile | null {
  if (!isPlainObject(value)) return null
  const { students, invoices, bills, settings, attendance } = value
  if (!isRecordList(students) || !isRecordList(invoices) || !isRecordList(bills)) return null
  if (settings !== undefined && !isPlainObject(settings)) return null
  if (attendance !== undefined && !isRecordList(attendance)) return null
  return {
    students,
    invoices,
    bills,
    settings: isPlainObject(settings) ? settings : undefined,
    attendance: isRecordList(attendance) ? attendance : undefined,
  }
}

// Keys missing from the backup fall back to the store's initial defaults.
function buildRestoredState(backup: BackupFile): Partial<AppState> {
  const defaults = useStore.getInitialState()
  const backupSettings = backup.settings ?? {}
  return {
    students: backup.students as Student[],
    invoices: backup.invoices as Invoice[],
    bills: backup.bills as Bill[],
    attendance: (backup.attendance ?? defaults.attendance) as AttendanceRecord[],
    settings: {
      ...defaults.settings,
      ...backupSettings,
      feeRules: {
        ...defaults.settings.feeRules,
        ...((backupSettings.feeRules as Partial<Settings["feeRules"]> | undefined) ?? {}),
      },
    } as Settings,
  }
}

function downloadBackup() {
  const state = useStore.getState()
  // Keep data only: action functions are dropped so the file is plain JSON.
  const data = Object.fromEntries(
    Object.entries(state).filter(([, value]) => typeof value !== "function"),
  )
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `feeflow-backup-${localDateStamp(new Date())}.json`
  anchor.click()
  // Revoke on the next tick so the browser has started the download before the URL is released.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function BackupControls() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingBackup, setPendingBackup] = useState<BackupFile | null>(null)
  const [restoreError, setRestoreError] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Clear the input so choosing the same file again still fires onChange.
    event.target.value = ""
    if (!file) return
    setRestoreError(null)
    let backup: BackupFile | null = null
    try {
      backup = parseBackup(JSON.parse(await file.text()))
    } catch {
      backup = null
    }
    if (backup) setPendingBackup(backup)
    else setRestoreError(notABackupMessage)
  }

  function handleConfirmRestore() {
    if (!pendingBackup) return
    useStore.setState(buildRestoredState(pendingBackup))
    setPendingBackup(null)
    toast.success("Backup restored. Your students, invoices and bills are back.")
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className={secondaryButtonClass} onClick={() => downloadBackup()}>
          Download backup
        </Button>
        <Button
          variant="outline"
          className={secondaryButtonClass}
          onClick={() => fileInputRef.current?.click()}
        >
          Restore from backup
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          hidden
          onChange={handleFileChange}
        />
      </div>
      {restoreError ? (
        <p role="alert" className="text-sm text-[#D93F3F]">
          {restoreError}
        </p>
      ) : null}
      <Dialog
        open={pendingBackup !== null}
        onOpenChange={(open) => {
          if (!open) setPendingBackup(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace your data with this backup?</DialogTitle>
            <DialogDescription>
              Restoring replaces all current students, invoices and bills with the ones in this
              backup. Your current settings are replaced by the settings saved in the backup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingBackup(null)}>
              Cancel
            </Button>
            <Button className={dangerButtonClass} onClick={handleConfirmRestore}>
              Replace my data with this backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

type DataActionDialogProps = {
  triggerLabel: string
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
}

function DataActionDialog({
  triggerLabel,
  title,
  description,
  confirmLabel,
  onConfirm,
}: DataActionDialogProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" className={secondaryButtonClass} onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              className={dangerButtonClass}
              onClick={() => {
                setOpen(false)
                onConfirm()
              }}
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
