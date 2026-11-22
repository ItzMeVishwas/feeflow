"use client"

import { useMemo } from "react"

import { WaveChart, type WaveSeries } from "@/components/charts/wave-chart"
import { computeMonthlyCollections } from "@/lib/metrics"
import { useStore } from "@/lib/store"

// WaveChart sets colours as SVG attributes, which cannot read CSS variables,
// so these are hex values. MINT matches the --paid theme variable.
const MINT = "#3DD9A8"
const EXPECTED = "#94A3B8"

export function CollectionsCard() {
  const invoices = useStore((s) => s.invoices)

  const buckets = useMemo(() => computeMonthlyCollections(invoices, new Date()), [invoices])
  const hasData = buckets.some((bucket) => bucket.amount > 0)

  // Expected per month: invoice amounts whose due date falls in that month (dueDate is YYYY-MM-DD).
  const expected = useMemo(
    () =>
      buckets.map((bucket) =>
        invoices
          .filter((inv) => inv.dueDate.slice(0, 7) === bucket.key)
          .reduce((sum, inv) => sum + inv.amount, 0),
      ),
    [buckets, invoices],
  )

  const series: WaveSeries[] = [
    { key: "expected", label: "Expected", color: EXPECTED, values: expected },
    { key: "collected", label: "Collected", color: MINT, values: buckets.map((b) => b.amount) },
  ]
  const labels = buckets.map((bucket) => bucket.label)

  return (
    <section aria-labelledby="collections-heading" className="glass rounded-2xl p-4">
      <h2 id="collections-heading" className="text-sm text-muted-foreground">
        Collections
      </h2>
      <p className="text-xs text-muted-foreground">Last 6 months</p>

      {hasData ? (
        <div
          role="img"
          aria-label="Wave chart of money collected in each of the last 6 months"
          className="mt-3 w-full"
        >
          <WaveChart series={series} labels={labels} height={176} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Record a payment to start your collections chart.
        </p>
      )}
    </section>
  )
}
