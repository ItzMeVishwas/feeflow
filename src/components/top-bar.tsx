"use client"

import { useSyncExternalStore } from "react"
import { Search } from "lucide-react"

import ThemeToggle from "@/components/theme-toggle"
import { useStore } from "@/lib/store"

// Long weekday and month names, e.g. "Tuesday, 14 January 2025".
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
})

// Picks the greeting for the browser's local hour.
function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return "Good morning"
  if (hour >= 12 && hour < 17) return "Good afternoon"
  return "Good evening"
}

// The clock is an external value, so it is read through useSyncExternalStore
// instead of setState in an effect. The snapshot is cached per minute: the
// getSnapshot result must be referentially stable between renders.
let cachedMinute = -1
let cachedDate: Date | null = null

function getClockSnapshot(): Date {
  const current = new Date()
  const minute = Math.floor(current.getTime() / 60_000)
  if (minute !== cachedMinute || cachedDate === null) {
    cachedMinute = minute
    cachedDate = current
  }
  return cachedDate
}

// No live subscription: the clock value is read on render, as before.
const subscribeNoop = () => () => {}

// Server render and hydration use null, so the HTML matches and the
// placeholder greeting is shown until the client clock is available.
const getServerClockSnapshot = () => null

export function TopBar() {
  const tutorName = useStore((s) => s.settings.tutorName.trim())
  const now = useSyncExternalStore<Date | null>(
    subscribeNoop,
    getClockSnapshot,
    getServerClockSnapshot
  )

  const greeting = now ? greetingFor(now.getHours()) : "Welcome back"
  const nameSuffix = now && tutorName ? `, ${tutorName}` : ""

  return (
    <header className="glass flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
      <div className="min-w-0">
        <p className="font-heading truncate text-lg font-semibold tracking-tight text-foreground">
          {greeting}
          {nameSuffix}
        </p>
        <p className="min-h-5 text-sm text-muted-foreground">
          {now ? dateFormatter.format(now) : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          aria-label="Search"
          className="flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="size-4" aria-hidden="true" />
          <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-xs font-medium text-foreground">
            Ctrl K
          </kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
