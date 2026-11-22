'use client';

import { useMemo, useState } from "react";
import { WaveChart } from "@/components/charts/wave-chart";
import { formatINR } from "@/lib/format";
import { balanceSeries } from "./demo-math";

export function LiveDemo() {
  const [lateDays, setLateDays] = useState(0);
  const [studentLeaves, setStudentLeaves] = useState(false);

  const { values, labels, lowest, leaverNote } = useMemo(
    () => balanceSeries({ lateDays, studentLeaves }),
    [lateDays, studentLeaves],
  );

  const isNegative = lowest.value < 0;
  const waveColor = isNegative ? "#FF6B6B" : "#3DD9A8";

  let sentence = `Lowest balance ${formatINR(lowest.value)} on day ${lowest.day}.`;
  if (isNegative) {
    sentence += ` You'd be short by ${formatINR(-lowest.value)}. FeeFlow warns you weeks ahead.`;
  }
  if (studentLeaves) {
    sentence += ` ${leaverNote}`;
  }

  return (
    <section id="try" className="scroll-mt-24 mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Try it: what if a parent pays late?
      </h2>
      <p className="mt-3 text-[#9AA8BC]">
        Sample numbers for one tutor with 8 students. Move the slider or flip the switch and watch the balance.
      </p>

      <div className="glass mt-8 rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex w-full flex-col gap-2 sm:max-w-xs">
            <span className="text-sm font-medium">Days late: {lateDays}</span>
            <input
              type="range"
              min={0}
              max={45}
              step={1}
              value={lateDays}
              aria-label="Days late"
              onChange={(e) => setLateDays(Number(e.target.value))}
              className="accent-[#F2A93B] w-full min-h-11"
            />
          </label>

          <button
            type="button"
            aria-pressed={studentLeaves}
            onClick={() => setStudentLeaves((v) => !v)}
            className={`h-11 rounded-xl px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B] ${
              studentLeaves
                ? "bg-[#F2A93B] text-[#1A1206]"
                : "border border-white/15 bg-white/[0.04]"
            }`}
          >
            Student leaves
          </button>
        </div>

        <div className="mt-6">
          <WaveChart
            series={[{ key: "balance", label: "Balance", color: waveColor, values }]}
            labels={labels}
            height={220}
            zeroLine
          />
        </div>

        <p aria-live="polite" className="mt-6 text-base">
          {sentence}
        </p>
        <p className="mt-2 text-sm text-[#9AA8BC]">Sample data for illustration.</p>
      </div>
    </section>
  );
}
