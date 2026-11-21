"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  buildForecast,
  summarizeForecast,
  type ForecastEvent,
  type ForecastScenario,
} from "@/lib/forecast";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/format";

export type RunwayChartProps = { scenario?: ForecastScenario };

type Horizon = 30 | 60 | 90;
const HORIZONS: Horizon[] = [30, 60, 90];

// Theme colours come from src/app/globals.css. There is no --coral or --mint
// variable there: --overdue (same #FF6B6B) stands in for coral, and --paid
// (#3DD9A8) for mint. --muted-foreground is the theme-aware muted grey.
const AMBER = "var(--amber)";
const CORAL = "var(--overdue)";
const MUTED = "var(--muted-foreground)";

type ChartPoint = {
  date: string;
  balance: number;
  label: string;
  events: ForecastEvent[];
};

// Parse "YYYY-MM-DD" as a local date to avoid UTC shifting the day.
function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shortDate(iso: string): string {
  return format(parseIso(iso), "d MMM");
}

// Compact rupee label for chart axes: ₹60k, ₹45k, -₹5k. Small values stay whole.
function formatCompactINR(v: number): string {
  if (v === 0) return "₹0";
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  if (abs >= 1000) return sign + "₹" + Math.round(abs / 1000) + "k";
  return sign + "₹" + abs.toLocaleString("en-IN");
}

function RunwayTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: unknown }>;
}) {
  const point = payload?.[0]?.payload as ChartPoint | undefined;
  if (!active || !point) return null;
  return (
    <div className="rounded-xl border border-white/20 bg-[#0E1726]/95 px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold">{format(parseIso(point.date), "d MMM yyyy")}</p>
      <p className="mt-0.5 tabular-nums">{formatINR(point.balance)}</p>
      {point.events.length > 0 && (
        <ul className="mt-1.5 space-y-0.5 border-t border-white/10 pt-1.5">
          {point.events.map((ev, i) => (
            <li key={`${ev.label}-${i}`} className="tabular-nums">
              {ev.label} — {ev.direction === "in" ? "+" : "\u2212"}
              {formatINR(ev.amount)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RunwayChart({ scenario }: RunwayChartProps) {
  const students = useStore((s) => s.students);
  const invoices = useStore((s) => s.invoices);
  const bills = useStore((s) => s.bills);
  const settings = useStore((s) => s.settings);

  const [horizon, setHorizon] = useState<Horizon>(30);
  const [prefersReducedMotion] = useState<boolean>(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  const points = useMemo(
    () => buildForecast({ students, invoices, bills, settings }, horizon, scenario),
    [students, invoices, bills, settings, horizon, scenario],
  );
  const summary = useMemo(() => summarizeForecast(points), [points]);

  const chartData: ChartPoint[] = useMemo(
    () =>
      points.map((p) => ({
        date: p.date,
        balance: p.balance,
        label: shortDate(p.date),
        events: p.events,
      })),
    [points],
  );

  // Fraction (0..1) from the top of the chart where balance = 0, for the split gradient.
  const zeroOffset = useMemo(() => {
    const values = chartData.map((p) => p.balance);
    const max = Math.max(0, ...values);
    const min = Math.min(0, ...values);
    return max === min ? 0 : max / (max - min);
  }, [chartData]);

  const lowest = summary.lowestBalance;
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const isEmpty =
    students.length === 0 && invoices.length === 0 && bills.length === 0;

  const ariaLabel =
    `Cash balance over the next ${horizon} days` +
    (lowest ? `, lowest on ${shortDate(lowest.date)}` : "");

  let runwayMessage: string;
  if (summary.firstBelowZeroDate === null) {
    runwayMessage = `You stay above zero for the next ${horizon} days`;
  } else {
    const when = shortDate(summary.firstBelowZeroDate);
    if (overdueCount === 0) {
      runwayMessage = `Cash runs out on ${when} unless new fees come in`;
    } else if (overdueCount === 1) {
      runwayMessage = `Cash runs out on ${when} unless 1 overdue fee comes in`;
    } else {
      runwayMessage = `Cash runs out on ${when} unless ${overdueCount} overdue fees come in`;
    }
  }

  return (
    <section className="glass-strong rounded-3xl p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-bricolage)" }}>
          Cash runway
        </h2>
        <div role="group" aria-label="Forecast horizon" className="flex w-full gap-1 rounded-xl bg-black/5 p-1 sm:w-auto dark:bg-white/5">
          {HORIZONS.map((h) => (
            <button
              key={h}
              type="button"
              aria-pressed={horizon === h}
              onClick={() => setHorizon(h)}
              className={`flex-1 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:flex-none ${
                horizon === h
                  ? "bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {h} days
            </button>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <p className="mt-6 text-sm text-slate-600 dark:text-slate-400">
          Add a student and their monthly fee to see when cash runs short.
        </p>
      ) : (
        <>
          <div role="img" aria-label={ariaLabel} className="mt-5 h-[220px] w-full sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 24, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="runwayFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={0} stopColor="var(--amber)" stopOpacity={0.35} />
                    <stop offset={zeroOffset} stopColor="var(--amber)" stopOpacity={0.02} />
                    <stop offset={zeroOffset} stopColor="var(--overdue)" stopOpacity={0.02} />
                    <stop offset={1} stopColor="var(--overdue)" stopOpacity={0.35} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: MUTED }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={16}
                />
                <YAxis
                  tickFormatter={formatCompactINR}
                  tick={{ fontSize: 11, fill: MUTED }}
                  tickLine={false}
                  axisLine={false}
                  width={84}
                />
                <Tooltip
                  content={(p) => <RunwayTooltip active={p.active} payload={p.payload} />}
                  cursor={{ stroke: MUTED, strokeDasharray: "3 3" }}
                />
                <ReferenceLine y={0} stroke={MUTED} strokeDasharray="4 4" />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={AMBER}
                  strokeWidth={2}
                  fill="url(#runwayFill)"
                  isAnimationActive={!prefersReducedMotion}
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
                {lowest && (
                  <ReferenceDot
                    x={shortDate(lowest.date)}
                    y={lowest.balance}
                    r={5}
                    fill={AMBER}
                    stroke="var(--background)"
                    strokeWidth={2}
                    label={{
                      value: `Lowest: ${formatINR(lowest.balance)} on ${shortDate(lowest.date)}`,
                      position: "top",
                      fill: AMBER,
                      fontSize: 11,
                    }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{runwayMessage}</p>
        </>
      )}
    </section>
  );
}
