"use client"

import { useEffect, useState, type FormEvent } from "react"
import { toast } from "sonner"

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
import { formatINR } from "@/lib/format"
import { useStore, type Settings } from "@/lib/store"

type ReminderLanguage = Settings["reminderLanguage"]

const saveButtonClass = "bg-[#F2A93B] text-[#1A1206] hover:bg-[#F2A93B]/90"
const dangerButtonClass = "bg-[#FF6B6B] text-[#1A1206] hover:bg-[#FF6B6B]/90"
const fieldClass = "h-10 rounded-xl"
const selectClass =
  "h-10 w-full rounded-xl border border-input bg-transparent px-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"

export default function SettingsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <ProfileForm />
      <DataSection />
    </div>
  )
}

function ProfileForm() {
  const settings = useStore((s) => s.settings)
  const updateSettings = useStore((s) => s.updateSettings)

  const [tutorName, setTutorName] = useState(settings.tutorName)
  const [upiId, setUpiId] = useState(settings.upiId)
  const [cashInput, setCashInput] = useState(String(settings.startingCashBalance))
  // Settings saved before this field existed have no reminderLanguage, so fall back to English.
  const [reminderLanguage, setReminderLanguage] = useState<ReminderLanguage>(
    settings.reminderLanguage ?? "english",
  )
  const [cashError, setCashError] = useState<string | null>(null)
  // Zustand persist rehydrates after the first render, so the seeded values above can be stale.
  const [hydrated, setHydrated] = useState(false)
  // True once the user edits a field; blocks the re-sync so their input is never overwritten.
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (useStore.persist.hasHydrated()) setHydrated(true)
    return useStore.persist.onFinishHydration(() => setHydrated(true))
  }, [])

  useEffect(() => {
    if (!hydrated || dirty) return
    const saved = useStore.getState().settings
    setTutorName(saved.tutorName)
    setUpiId(saved.upiId)
    setCashInput(String(saved.startingCashBalance))
    setReminderLanguage(saved.reminderLanguage ?? "english")
  }, [hydrated, dirty])

  const parsedCash = cashInput.trim() === "" ? NaN : Number(cashInput)
  const cashValid = Number.isFinite(parsedCash) && parsedCash >= 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cashValid) {
      setCashError("Enter an amount of 0 or more.")
      return
    }
    setCashError(null)
    updateSettings({
      tutorName: tutorName.trim(),
      upiId: upiId.trim(),
      startingCashBalance: Math.round(parsedCash * 100) / 100,
      reminderLanguage,
    })
    toast.success("Settings saved")
    setDirty(false)
  }

  return (
    <section aria-labelledby="profile-heading" className="glass rounded-2xl p-6">
      <h2 id="profile-heading" className="font-heading text-lg font-semibold text-foreground">
        Profile
      </h2>
      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Label htmlFor="tutor-name">Tutor name</Label>
          <Input
            id="tutor-name"
            type="text"
            autoComplete="name"
            value={tutorName}
            onChange={(e) => {
              setTutorName(e.target.value)
              setDirty(true)
            }}
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
            value={upiId}
            onChange={(e) => {
              setUpiId(e.target.value)
              setDirty(true)
            }}
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
            value={cashInput}
            onChange={(e) => {
              setCashInput(e.target.value)
              setDirty(true)
              if (cashError) setCashError(null)
            }}
            aria-invalid={cashError ? true : undefined}
            aria-describedby={cashError ? "starting-cash-error" : "starting-cash-hint"}
            className={fieldClass}
          />
          {cashError ? (
            <p id="starting-cash-error" className="text-sm text-destructive">
              {cashError}
            </p>
          ) : (
            <p id="starting-cash-hint" className="text-sm text-muted-foreground">
              {cashValid ? `Shows as ${formatINR(parsedCash)}` : "Enter an amount to see it in rupees."}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="reminder-language">Default reminder language</Label>
          <select
            id="reminder-language"
            value={reminderLanguage}
            onChange={(e) => {
              setReminderLanguage(e.target.value as ReminderLanguage)
              setDirty(true)
            }}
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

        <div className="flex justify-end">
          <Button type="submit" className={saveButtonClass}>
            Save settings
          </Button>
        </div>
      </form>
    </section>
  )
}

function DataSection() {
  const resetToDemo = useStore((s) => s.resetToDemo)
  const clearAll = useStore((s) => s.clearAll)

  return (
    <section aria-labelledby="data-heading" className="glass rounded-2xl p-5">
      <h2 id="data-heading" className="font-heading text-lg font-semibold text-foreground">
        Data
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Replace or clear students, invoices and bills. Your settings are kept.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <DataActionDialog
          triggerLabel="Reset to demo data"
          title="Reset to demo data?"
          description="This replaces all students, invoices and bills with the demo set. Your settings stay as they are."
          confirmLabel="Reset to demo data"
          onConfirm={() => {
            resetToDemo()
            toast.success("Demo data restored")
          }}
        />
        <DataActionDialog
          triggerLabel="Start fresh"
          title="Start fresh?"
          description="This deletes all students, invoices and bills. Your name, UPI id, cash balance and language are kept."
          confirmLabel="Start fresh"
          onConfirm={() => {
            clearAll()
            toast.success("All students, invoices and bills deleted")
          }}
        />
      </div>
    </section>
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
      <Button variant="outline" onClick={() => setOpen(true)}>
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
