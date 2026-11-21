"use client"

import { useState, useSyncExternalStore, type FormEvent } from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"

type Step = 1 | 2 | 3

// Subscribing to a no-op store is the standard way to know we are on the client
// after hydration, without setting state in an effect.
const subscribeNoop = () => () => {}

const inputClass =
  "h-11 w-full rounded-xl border border-foreground/15 bg-background/40 px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-[#F2A93B] focus-visible:ring-2 focus-visible:ring-[#F2A93B]/50 aria-invalid:border-destructive"

const primaryButtonClass =
  "inline-flex h-11 w-full items-center justify-center rounded-xl bg-[#F2A93B] px-5 text-sm font-semibold text-[#1A1206] transition-colors hover:bg-[#F2A93B]/90 focus-visible:ring-2 focus-visible:ring-[#F2A93B] outline-none sm:w-auto"

const secondaryButtonClass =
  "inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-foreground/40 outline-none sm:w-auto"

export default function OnboardingDialog() {
  const onboarded = useStore((s) => s.settings.onboarded)
  const updateSettings = useStore((s) => s.updateSettings)
  const resetToDemo = useStore((s) => s.resetToDemo)
  const clearAll = useStore((s) => s.clearAll)
  const reduceMotion = useReducedMotion()

  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false)

  const [step, setStep] = useState<Step>(1)
  const [tutorName, setTutorName] = useState("")
  const [upiId, setUpiId] = useState("")
  const [cashInput, setCashInput] = useState("")
  const [nameError, setNameError] = useState("")

  // Render nothing on the server and on the first client render to avoid hydration mismatches.
  if (!mounted) return null

  const open = onboarded !== true

  function chooseDemo() {
    resetToDemo()
    updateSettings({ onboarded: true })
  }

  function chooseOwnStudents() {
    setStep(2)
  }

  function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!tutorName.trim()) {
      setNameError("Please enter your name to continue.")
      return
    }
    setNameError("")
    setStep(3)
  }

  function handleFinish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearAll()
    updateSettings({
      tutorName: tutorName.trim(),
      upiId: upiId.trim(),
      startingCashBalance: Math.max(0, Number(cashInput) || 0),
      onboarded: true,
    })
  }

  const slideIn = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, x: 16 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -16 } }

  return (
    // Closing requests (Escape, outside click) are ignored: onboarding must finish
    // through one of the choices, so onboarded is always set to true.
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Popup className="glass fixed top-1/2 left-1/2 z-50 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 rounded-3xl p-6 text-foreground outline-none sm:max-w-md sm:p-8">
          <p className="text-xs font-medium text-muted-foreground" aria-live="polite">
            Step {step} of 3
          </p>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={slideIn.initial}
              animate={slideIn.animate}
              exit={slideIn.exit}
              transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
            >
              {step === 1 && (
                <div>
                  <DialogPrimitive.Title className="mt-2 text-2xl font-semibold tracking-tight">
                    Welcome to FeeFlow
                  </DialogPrimitive.Title>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Keep track of fees, reminders and cash for your students. How would you like to start?
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={chooseDemo}
                      className="w-full rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 text-left transition-colors hover:bg-foreground/[0.07] focus-visible:ring-2 focus-visible:ring-[#F2A93B] outline-none"
                    >
                      <span className="block text-base font-semibold">Explore with demo data</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Sample students and invoices so you can look around. You can clear them any time from Settings.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={chooseOwnStudents}
                      className="w-full rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-4 text-left transition-colors hover:bg-foreground/[0.07] focus-visible:ring-2 focus-visible:ring-[#F2A93B] outline-none"
                    >
                      <span className="block text-base font-semibold">Start with my own students</span>
                      <span className="mt-1 block text-sm text-muted-foreground">
                        Begin with an empty list and add your students and their monthly fees.
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <form onSubmit={handleNameSubmit} noValidate>
                  <DialogPrimitive.Title className="mt-2 text-2xl font-semibold tracking-tight">
                    Tell us about you
                  </DialogPrimitive.Title>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Parents see your name and UPI ID when they pay you.
                  </p>
                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="onboarding-tutor-name">Tutor name</Label>
                      <input
                        id="onboarding-tutor-name"
                        name="tutorName"
                        type="text"
                        autoComplete="name"
                        placeholder="For example, Anjali Verma"
                        value={tutorName}
                        onChange={(e) => {
                          setTutorName(e.target.value)
                          if (nameError) setNameError("")
                        }}
                        aria-invalid={nameError ? true : undefined}
                        aria-describedby={nameError ? "onboarding-name-error" : undefined}
                        className={inputClass}
                      />
                      {nameError && (
                        <p id="onboarding-name-error" role="alert" className="text-sm text-destructive">
                          {nameError}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="onboarding-upi-id">UPI ID (optional)</Label>
                      <input
                        id="onboarding-upi-id"
                        name="upiId"
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="yourname@bank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => { setNameError(""); setStep(1) }} className={secondaryButtonClass}>
                      Back
                    </button>
                    <button type="submit" className={primaryButtonClass}>
                      Continue
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleFinish} noValidate>
                  <DialogPrimitive.Title className="mt-2 text-2xl font-semibold tracking-tight">
                    Cash in hand today
                  </DialogPrimitive.Title>
                  <p className="mt-2 text-sm text-muted-foreground">
                    How much cash do you have with you right now? FeeFlow starts your cash balance from this amount.
                  </p>
                  <div className="mt-6 space-y-2">
                    <Label htmlFor="onboarding-cash">Cash in hand today (rupees)</Label>
                    <input
                      id="onboarding-cash"
                      name="startingCashBalance"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      placeholder="0"
                      value={cashInput}
                      onChange={(e) => setCashInput(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button type="button" onClick={() => setStep(2)} className={secondaryButtonClass}>
                      Back
                    </button>
                    <button type="submit" className={primaryButtonClass}>
                      Finish setup
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </AnimatePresence>
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  )
}
