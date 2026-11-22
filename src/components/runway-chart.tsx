"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { WaveChart, type WaveSeries } from "@/components/charts/wave-chart";
import {
  buildForecast,
  summarizeForecast,
  type ForecastScenario,
} from "@/lib/forecast";
import { useStore } from "@/lib/store";
import { formatINR } from "@/lib/format";

export type RunwayChartProps = {
  scenario?: ForecastScenario;
  // Pass both to control the horizon from the parent. Without them the chart keeps its own (starts at 30 days).
  horizon?: Horizon;
  onHorizonChange?: (horizon: Horizon) => void;
  // With a scenario, also draw the forecast without it as a faint line.
  showBaseline?: boolean;
};

type Horizon = 30 | 60 | 90;
const HORIZONS: Horizon[] = [30, 60, 90];

// WaveChart sets colours as SVG attributes, which cannot read CSS variables,
// so these are hex values. NAVY is the balance line; WaveChart derives its area
// fill from this same colour, so the fill is navy-tinted. The zero-line region
// below zero uses var(--coral) inside WaveChart.
const NAVY = "#1E3A6E";
const BASELINE = "#94A3B8";

// Parse "YYYY-MM-DD" as a local date to avoid UTC shifting the day.
function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function shortDate(iso: string): string {
  return format(parseIso(iso), "d MMM");
}

export function RunwayChart({
  scenario,
  horizon: controlledHorizon,
  onHorizonChange,
  showBaseline = false,
}: RunwayChartProps) {
  const students = useStore((s) => s.students);
  const invoices = useStore((s) => s.invoices);
  const bills = useStore((s) => s.bills);
  const settings = useStore((s) => s.settings);
  const attendance = useStore((s) => s.attendance);

  const [localHorizon, setLocalHorizon] = useState<Horizon>(30);
  const horizon = controlledHorizon ?? localHorizon;
  const setHorizon = onHorizonChange ?? setLocalHorizon;

  const drawBaseline = showBaseline && scenario !== undefined;

  const points = useMemo(
    () => buildForecast({ students, invoices, bills, settings, attendance }, horizon, scenario),
    [students, invoices, bills, settings, attendance, horizon, scenario],
  );
  const baselinePoints = useMemo(
    () =>
      drawBaseline
        ? buildForecast({ students, invoices, bills, settings, attendance }, horizon)
        : null,
    [drawBaseline, students, invoices, bills, settings, attendance, horizon],
  );
  const summary = useMemo(() => summarizeForecast(points), [points]);

  const labels = useMemo(() => points.map((p) => shortDate(p.date)), [points]);

  // Baseline comes first so the balance line draws on top of it.
  const waveSeries: WaveSeries[] = useMemo(() => {
    const series: WaveSeries[] = [];
    if (baselinePoints) {
      series.push({
        key: "baseline",
        label: "Without changes",
        color: BASELINE,
        values: baselinePoints.map((p) => p.balance),
      });
    }
    series.push({
      key: "balance",
      label: "Balance",
      color: NAVY,
      fill: "#7DD9CC",
      values: points.map((p) => p.balance),
    });
    return series;
  }, [points, baselinePoints]);

  const lowestIndex = summary.lowestBalance
    ? points.findIndex((p) => p.date === summary.lowestBalance?.date)
    : -1;
  const marker =
    summary.lowestBalance && lowestIndex >= 0
      ? {
          index: lowestIndex,
          label: `Lowest: ${formatINR(summary.lowestBalance.balance)} on ${shortDate(summary.lowestBalance.date)}`,
        }
      : undefined;

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
          <div role="img" aria-label={ariaLabel} className="mt-5 w-full">
            <WaveChart series={waveSeries} labels={labels} height={240} zeroLine marker={marker} />
          </div>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300">{runwayMessage}</p>
        </>
      )}
    </section>
  );
}
