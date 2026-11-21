"use client"

import { useMemo } from "react"
import { useReducedMotion } from "motion/react"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts"

import { computeMonthlyCollections } from "@/lib/metrics"
import { formatINR } from "@/lib/format"
import { useStore } from "@/lib/store"

// Theme colours from src/app/globals.css (see runway-chart.tsx for the same pattern).
const AMBER = "var(--amber)"
const MUTED = "var(--muted-foreground)"

export function CollectionsCard() {
  const invoices = useStore((s) => s.invoices)
  const reduceMotion = useReducedMotion()

  const buckets = useMemo(() => computeMonthlyCollections(invoices, new Date()), [invoices])
  const hasData = buckets.some((bucket) => bucket.amount > 0)

  return (
    <section aria-labelledby="collections-heading" className="glass rounded-2xl p-4">
      <h2 id="collections-heading" className="text-sm text-muted-foreground">
        Collections
      </h2>
      <p className="text-xs text-muted-foreground">Last 6 months</p>

      {hasData ? (
        <div
          role="img"
          aria-label="Bar chart of money collected in each of the last 6 months"
          className="mt-3 h-44 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: MUTED, fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
                formatter={(value) => formatINR(Number(value), { wholeRupees: true })}
                contentStyle={{
                  background: "#0E1726",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 12,
                }}
                itemStyle={{ color: "#fff" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                isAnimationActive={reduceMotion !== true}
              >
                {buckets.map((bucket) => (
                  <Cell
                    key={bucket.key}
                    fill={bucket.isCurrent ? AMBER : MUTED}
                    fillOpacity={bucket.isCurrent ? 1 : 0.45}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          Record a payment to start your collections chart.
        </p>
      )}
    </section>
  )
}
