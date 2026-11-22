"use client"

import { useMemo, useState, useSyncExternalStore } from "react"

import { DaySheet } from "@/components/calendar/day-sheet"
import { MonthGrid } from "@/components/calendar/month-grid"
import { buildMonthGrid, summarizeMonth } from "@/lib/calendar"
import { formatINR, formatMonth } from "@/lib/format"
import { toIsoDate } from "@/lib/invoice-status"
import { useStore } from "@/lib/store"

// Subscribed to nothing; used only to detect the client after hydration.
const subscribeNoop = () => () => {}

type MonthView = { year: number; month0: number } // month0 is 0-based

export default function CalendarPage() {
  // Zustand persist reads localStorage on the client only, so the server HTML
  // would not match the first client render. Wait for mount before showing data.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  )

  // The whole store is passed to the pure calendar helpers, which read what they need.
  const store = useStore((s) => s)

  const today = toIsoDate(new Date())
  const todayYear = Number(today.slice(0, 4))
  const todayMonth0 = Number(today.slice(5, 7)) - 1

  const [view, setView] = useState<MonthView>(() => ({ year: todayYear, month0: todayMonth0 }))
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [sheetOpen, setSheetOpen] = useState(false)

  const days = useMemo(
    () => buildMonthGrid(store, view.year, view.month0, today),
    [store, view.year, view.month0, today],
  )
  const summary = useMemo(
    () => summarizeMonth(store, view.year, view.month0),
    [store, view.year, view.month0],
  )

  const selectedDay = days.find((d) => d.date === selectedDate)
  const isCurrentMonth = view.year === todayYear && view.month0 === todayMonth0
  const monthLabel = formatMonth(`${view.year}-${String(view.month0 + 1).padStart(2, "0")}`)

  function shiftMonth(delta: number) {
    setView((v) => {
      // Date.UTC handles month overflow, e.g. month -1 becomes December of the previous year.
      const d = new Date(Date.UTC(v.year, v.month0 + delta, 1))
      return { year: d.getUTCFullYear(), month0: d.getUTCMonth() }
    })
  }

  if (!mounted) {
    return (
      <p className="glass rounded-2xl p-6 text-center text-muted-foreground">
        Loading calendar…
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Calendar
        </h1>
        <p className="text-sm text-muted-foreground">
          Expected <span className="tabular-nums text-foreground">{formatINR(summary.expected)}</span>,
          {" "}received <span className="tabular-nums text-foreground">{formatINR(summary.received)}</span>{" "}
          {isCurrentMonth ? "this month" : `in ${monthLabel}`}
        </p>
      </div>

      <MonthGrid
        year={view.year}
        month0={view.month0}
        today={today}
        days={days}
        onPrevMonth={() => shiftMonth(-1)}
        onNextMonth={() => shiftMonth(1)}
        onToday={() => setView({ year: todayYear, month0: todayMonth0 })}
        onSelectDay={(date) => {
          setSelectedDate(date)
          setSheetOpen(true)
        }}
      />

      <DaySheet
        date={selectedDate}
        day={selectedDay}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
