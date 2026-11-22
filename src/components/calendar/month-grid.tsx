"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { CalendarDay } from "@/lib/calendar"
import { formatDate, formatMonth } from "@/lib/format"
import { cn } from "@/lib/utils"

type MonthGridProps = {
  year: number
  month0: number // 0-based, same as Date.getMonth()
  today: string // "YYYY-MM-DD"
  days: CalendarDay[]
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
  onSelectDay: (date: string) => void
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

// Chip colour plus a word, so the status never depends on colour alone.
const FEE_TONE: Record<CalendarDay["fees"][number]["status"], { chip: string; dot: string; word: string }> = {
  paid: { chip: "bg-[var(--mint)]/20", dot: "bg-[var(--mint)]", word: "Paid" },
  overdue: { chip: "bg-[var(--coral)]/20", dot: "bg-[var(--coral)]", word: "Overdue" },
  unpaid: { chip: "bg-[var(--amber)]/20", dot: "bg-[var(--amber)]", word: "Due" },
}

const BILL_TONE = { chip: "bg-foreground/10", dot: "bg-foreground/50" }

type ChipView = { key: string; label: string; word: string | null; chip: string; dot: string }

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function DayCell({
  day,
  isToday,
  onSelect,
}: {
  day: CalendarDay
  isToday: boolean
  onSelect: (date: string) => void
}) {
  const dayNumber = Number(day.date.slice(8, 10))

  // Out-of-month cells are dimmed and not clickable.
  if (!day.inMonth) {
    return (
      <div className="flex min-h-12 justify-start rounded-xl p-1 text-sm tabular-nums text-muted-foreground opacity-40 sm:min-h-28 sm:p-2">
        {dayNumber}
      </div>
    )
  }

  const feeCount = day.fees.length
  const billCount = day.bills.length

  const chips: ChipView[] = day.fees.map((fee) => ({
    key: fee.invoiceId,
    label: firstName(fee.studentName),
    word: FEE_TONE[fee.status].word,
    chip: FEE_TONE[fee.status].chip,
    dot: FEE_TONE[fee.status].dot,
  }))
  if (billCount > 0) {
    chips.push({
      key: "bills",
      label: `${billCount} ${billCount === 1 ? "bill" : "bills"}`,
      word: null,
      chip: BILL_TONE.chip,
      dot: BILL_TONE.dot,
    })
  }
  const shown = chips.slice(0, 2)
  const hiddenCount = chips.length - shown.length

  const summaryParts = [formatDate(day.date)]
  if (feeCount > 0) summaryParts.push(`${feeCount} ${feeCount === 1 ? "fee" : "fees"}`)
  if (billCount > 0) summaryParts.push(`${billCount} ${billCount === 1 ? "bill" : "bills"}`)
  if (chips.length === 0) summaryParts.push("nothing due")

  return (
    <button
      type="button"
      aria-label={summaryParts.join(", ")}
      aria-current={isToday ? "date" : undefined}
      onClick={() => onSelect(day.date)}
      className={cn(
        "flex min-h-12 min-w-0 flex-col items-start gap-1 overflow-hidden rounded-xl bg-foreground/[0.04] p-1 text-left transition-colors hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-28 sm:p-2",
        isToday && "ring-2 ring-[var(--amber)]",
      )}
    >
      <span className="text-sm font-medium tabular-nums text-foreground">{dayNumber}</span>

      {/* Named chips on every screen width. */}
      <span className="flex w-full min-w-0 flex-col gap-0.5">
        {shown.map((chip) => (
          <span
            key={chip.key}
            className={cn("flex min-w-0 flex-col rounded-xl px-1.5 py-0.5 text-foreground", chip.chip)}
          >
            <span className="block truncate text-[10px] font-medium sm:text-xs">{chip.label}</span>
            {chip.word ? <span className="hidden text-[10px] sm:block">{chip.word}</span> : null}
          </span>
        ))}
        {hiddenCount > 0 ? (
          <span className="px-1 text-[10px] text-muted-foreground">+{hiddenCount} more</span>
        ) : null}
      </span>
    </button>
  )
}

export function MonthGrid({
  year,
  month0,
  today,
  days,
  onPrevMonth,
  onNextMonth,
  onToday,
  onSelectDay,
}: MonthGridProps) {
  const monthLabel = formatMonth(`${year}-${pad2(month0 + 1)}`)

  return (
    <section aria-label="Month calendar" className="glass rounded-3xl p-3 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">{monthLabel}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Previous month" onClick={onPrevMonth}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Next month" onClick={onNextMonth}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="text-center text-xs font-medium text-muted-foreground">
            {weekday}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => (
          <DayCell
            key={day.date}
            day={day}
            isToday={day.date === today}
            onSelect={onSelectDay}
          />
        ))}
      </div>
    </section>
  )
}
