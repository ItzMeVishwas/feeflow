"use client"

import { useEffect, useMemo, useState } from "react"

import { computeOnTimeRate } from "@/lib/metrics"
import { useStore } from "@/lib/store"

// Semicircle drawn with pathLength=100, so the dash offset is a percentage of the arc.
const ARC_PATH = "M 20 100 A 80 80 0 0 1 180 100"

function UpArrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}

function DownArrow() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  )
}

export function OnTimeRateCard() {
  const invoices = useStore((s) => s.invoices)

  const metrics = useMemo(() => computeOnTimeRate(invoices, new Date()), [invoices])
  const { onTime, total, rate, previousRate } = metrics
  const hasData = total > 0

  // Arc starts empty and fills on the first frame after mount. Under reduced motion
  // the CSS transition is disabled (motion-reduce:transition-none), so it jumps to the value.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const shownRate = ready && hasData ? rate : 0
  const improved = previousRate !== null && rate >= previousRate

  return (
    <section aria-labelledby="on-time-rate-heading" className="glass rounded-2xl p-4">
      <h2 id="on-time-rate-heading" className="text-sm text-muted-foreground">
        On-time rate
      </h2>

      <div className="relative mx-auto mt-3 w-full max-w-[220px]">
        <svg
          viewBox="0 0 200 110"
          className="block w-full"
          role="img"
          aria-label={hasData ? `${rate}% of fees paid on time` : "No on-time data yet"}
        >
          <path
            d={ARC_PATH}
            pathLength={100}
            fill="none"
            strokeWidth={12}
            className="stroke-muted"
          />
          <path
            d={ARC_PATH}
            pathLength={100}
            fill="none"
            strokeWidth={12}
            strokeDasharray={100}
            strokeDashoffset={100 - shownRate}
            className="stroke-amber transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>
        <p className="absolute inset-x-0 bottom-0 text-center font-heading text-4xl font-semibold tabular-nums text-foreground">
          {hasData ? `${rate}%` : "\u2013"}
        </p>
      </div>

      {hasData ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-center">
          <p className="text-sm tabular-nums text-muted-foreground">
            {onTime} of {total} fees on time
          </p>
          {previousRate !== null && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${
                improved ? "bg-paid/15 text-paid-text" : "bg-overdue/15 text-overdue-text"
              }`}
            >
              {improved ? <UpArrow /> : <DownArrow />}
              {improved ? "Up from" : "Down from"} {previousRate}% in the 3 months before
            </span>
          )}
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Mark a fee as paid to see your on-time rate.
        </p>
      )}
    </section>
  )
}
