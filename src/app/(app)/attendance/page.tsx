"use client"

import Link from "next/link"
import { motion, useAnimation, useReducedMotion } from "framer-motion"
import { useMemo, useState, useSyncExternalStore } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { formatDate } from "@/lib/format"
import { useStore, type Student } from "@/lib/store"
import { cn } from "@/lib/utils"

// Empty string means "All batches" for the batch filter.
const ALL_BATCHES = ""

const primaryButtonClass =
  "h-11 rounded-xl bg-[#0B2A55] px-5 font-semibold text-white hover:bg-[#133A72] dark:bg-[#0E9F8E] dark:hover:bg-[#0C8A7B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"

const cardClass =
  "rounded-3xl border border-border bg-card shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)] dark:border-white/10 dark:bg-[#121E36]"

// Local calendar date as "YYYY-MM-DD" (not UTC, so it matches the user's day).
function localIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// True when an ISO date ("YYYY-MM-DD") falls on Monday to Friday.
function isWeekday(isoDate: string): boolean {
  const [y, m, d] = isoDate.split("-").map(Number)
  const dayOfWeek = new Date(y, m - 1, d).getDay()
  return dayOfWeek !== 0 && dayOfWeek !== 6
}

// Weekdays (oldest first) over the last 6 weeks, ending today.
function recentWeekdays(today: Date): string[] {
  const days: string[] = []
  for (let back = 41; back >= 0; back--) {
    const iso = localIsoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - back))
    if (isWeekday(iso)) days.push(iso)
  }
  return days
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
}

// Store hydration is reported through zustand's persist API. Using
// useSyncExternalStore keeps the server render and the first client render
// identical (both "not hydrated"), so the page never shows empty-then-real data.
function subscribeToHydration(onChange: () => void) {
  return useStore.persist.onFinishHydration(onChange)
}

function getHydrated() {
  return useStore.persist.hasHydrated()
}

function getServerHydrated() {
  return false
}

type AttendanceTileProps = {
  student: Student
  present: boolean | undefined
  disabled: boolean
  onToggle: () => void
}

// One student's tile for the selected date. Tapping toggles present/absent.
function AttendanceTile({ student, present, disabled, onToggle }: AttendanceTileProps) {
  const reduce = useReducedMotion()
  const controls = useAnimation()

  const statusText = present === undefined ? "Not marked yet" : present ? "Present" : "Absent"
  const batchText = student.batch || "No batch"
  // Present is solid navy; absent is muted text on white; not marked is a plain white card.
  const isPresent = present === true
  const tileText = isPresent ? "text-white" : present === false ? "text-muted-foreground" : "text-foreground"

  function handleClick() {
    onToggle()
    if (!reduce) {
      void controls.start({
        scale: [0.94, 1],
        transition: { type: "spring", stiffness: 400, damping: 20 },
      })
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={`${student.name}, ${batchText}, ${statusText.toLowerCase()}`}
      animate={controls}
      whileTap={reduce ? undefined : { scale: 0.96 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "card-lift flex min-h-28 flex-col items-start gap-2 rounded-3xl border p-3 text-left outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55] disabled:opacity-50",
        isPresent ? "border-[#0B2A55] bg-[#0B2A55] dark:border-[#0E9F8E] dark:bg-[#0E9F8E]" : "border-border bg-card shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)]",
        tileText,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          isPresent ? "bg-white/15 text-white" : "bg-[#0B2A55]/10 text-primary dark:bg-[#7FA0D9]/15 dark:text-[#9DB6E6]",
        )}
      >
        {initialsOf(student.name)}
      </span>
      <span className="w-full min-w-0">
        <span className="block truncate font-medium text-current">{student.name}</span>
        <span className="block truncate text-xs text-current opacity-70">{batchText}</span>
      </span>
      <span className="mt-auto text-xs font-medium text-current">{statusText}</span>
    </motion.button>
  )
}

export default function AttendancePage() {
  const students = useStore((s) => s.students)
  const attendance = useStore((s) => s.attendance)
  const markAttendance = useStore((s) => s.markAttendance)
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydrated,
    getServerHydrated,
  )

  // Empty until hydrated so the server and client first render match.
  const todayIso = hydrated ? localIsoDate(new Date()) : ""
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const date = selectedDate ?? todayIso
  const [batchFilter, setBatchFilter] = useState(ALL_BATCHES)

  const batches = useMemo(
    () => Array.from(new Set(students.map((s) => s.batch).filter(Boolean))),
    [students],
  )
  // If the chosen batch no longer exists (its students were removed), show all.
  const activeBatch =
    batchFilter === ALL_BATCHES || batches.includes(batchFilter) ? batchFilter : ALL_BATCHES

  const visibleStudents = useMemo(
    () =>
      activeBatch === ALL_BATCHES
        ? students
        : students.filter((s) => s.batch === activeBatch),
    [students, activeBatch],
  )

  // Present/absent for the selected date, keyed by student id.
  const presentOnDate = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const record of attendance) {
      if (record.date === date) map.set(record.studentId, record.present)
    }
    return map
  }, [attendance, date])

  // This month's marked weekdays (up to today) and present count, per student.
  const monthlyByStudent = useMemo(() => {
    const monthPrefix = todayIso.slice(0, 7)
    const totals = new Map<string, { present: number; marked: number }>()
    for (const record of attendance) {
      if (!record.date.startsWith(monthPrefix)) continue
      if (record.date > todayIso || !isWeekday(record.date)) continue
      const total = totals.get(record.studentId) ?? { present: 0, marked: 0 }
      total.marked += 1
      if (record.present) total.present += 1
      totals.set(record.studentId, total)
    }
    return totals
  }, [attendance, todayIso])

  // Every record per student, keyed by date, for the 6-week heat strip.
  const historyByStudent = useMemo(() => {
    const map = new Map<string, Map<string, boolean>>()
    for (const record of attendance) {
      let days = map.get(record.studentId)
      if (!days) {
        days = new Map()
        map.set(record.studentId, days)
      }
      days.set(record.date, record.present)
    }
    return map
  }, [attendance])

  function toggleAttendance(studentId: string) {
    if (!date) return
    // Present becomes absent; absent or not marked becomes present.
    markAttendance(studentId, date, presentOnDate.get(studentId) !== true)
  }

  function markAllPresent() {
    if (!date) return
    for (const student of visibleStudents) {
      markAttendance(student.id, date, true)
    }
  }

  function renderBody() {
    if (!hydrated) {
      return (
        <p className={`${cardClass} p-6 text-center text-muted-foreground`}>
          Loading attendance…
        </p>
      )
    }

    if (students.length === 0) {
      return (
        <div className={`${cardClass} flex flex-col items-center gap-2 p-6 text-center`}>
          <p className="text-muted-foreground">
            Add a student first to start tracking attendance.
          </p>
          <Link
            href="/students"
            className={cn(
              "mt-2 inline-flex h-11 items-center rounded-xl px-5 text-sm font-semibold",
              primaryButtonClass,
            )}
          >
            Go to students
          </Link>
        </div>
      )
    }

    const heatDays = recentWeekdays(new Date())

    return (
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex flex-col gap-4">
          <div role="group" aria-label="Filter by batch" className="flex flex-wrap gap-2">
            {[ALL_BATCHES, ...batches].map((batch) => {
              const active = activeBatch === batch
              return (
                <button
                  key={batch || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setBatchFilter(batch)}
                  className={cn(
                    "h-11 rounded-xl border px-4 text-sm font-medium transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]",
                    active
                      ? "border-[#0B2A55] bg-[#0B2A55] text-white dark:border-[#0E9F8E] dark:bg-[#0E9F8E]"
                      : "border-border bg-card text-primary hover:bg-muted dark:border-white/10 dark:bg-[#121E36] dark:text-[#E6ECF5]",
                  )}
                >
                  {batch || "All"}
                </button>
              )
            })}
          </div>

          <ul role="list" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {visibleStudents.map((student) => (
              <li key={student.id}>
                <AttendanceTile
                  student={student}
                  present={presentOnDate.get(student.id)}
                  disabled={!date}
                  onToggle={() => toggleAttendance(student.id)}
                />
              </li>
            ))}
          </ul>
        </div>

        <section
          aria-labelledby="this-month-heading"
          className={`${cardClass} flex flex-col gap-4 p-5`}
        >
          <div className="flex flex-col gap-1">
            <h2 id="this-month-heading" className="font-medium text-foreground">
              This month
            </h2>
            <p className="text-xs text-muted-foreground">
              Teal means present, red means absent, and grey squares were not marked.
            </p>
          </div>

          <ul role="list" className="flex flex-col gap-4">
            {visibleStudents.map((student) => {
              const totals = monthlyByStudent.get(student.id)
              const percent =
                totals && totals.marked > 0
                  ? Math.round((totals.present / totals.marked) * 100)
                  : null
              const history = historyByStudent.get(student.id)

              return (
                <li key={student.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium text-foreground">
                      {student.name}
                    </p>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {percent === null ? "No marks yet" : `${percent}% present`}
                    </p>
                  </div>
                  <div aria-hidden="true" className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-[#0B2A55] dark:bg-[#9DB6E6]"
                      style={{ width: `${percent ?? 0}%` }}
                    />
                  </div>
                  <div className="flex gap-0.5">
                    {heatDays.map((day) => {
                      const present = history?.get(day)
                      const label =
                        present === undefined ? "not marked" : present ? "present" : "absent"
                      const text = `${formatDate(day)}, ${label}`
                      return (
                        <span
                          key={day}
                          role="img"
                          aria-label={text}
                          title={text}
                          className={cn(
                            "aspect-square min-w-0 max-w-4 flex-1 rounded-[3px]",
                            present === undefined
                              ? "bg-muted"
                              : present
                                ? "bg-[#0E9F8E]"
                                : "bg-[#D93F3F]/10 ring-1 ring-inset ring-[#D93F3F]",
                          )}
                        />
                      )
                    })}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Attendance"
        description="Tap a student to mark them present or absent."
        action={
          hydrated && students.length > 0 ? (
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Input
                type="date"
                aria-label="Attendance date"
                value={date}
                max={todayIso || undefined}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-11 w-full rounded-xl border-border bg-card sm:w-auto"
              />
              <Button
                className={primaryButtonClass}
                onClick={markAllPresent}
                disabled={!date || visibleStudents.length === 0}
              >
                Mark all present
              </Button>
            </div>
          ) : null
        }
      />

      {renderBody()}
    </div>
  )
}
