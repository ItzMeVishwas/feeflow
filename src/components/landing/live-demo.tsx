'use client';

import { useMemo, useState } from "react";
import { WaveChart } from "@/components/charts/wave-chart";
import { formatINR } from "@/lib/format";
import { balanceSeries } from "./demo-math";

const NAVY = "#0B2A55";
const TEAL = "#0E9F8E";
const DANGER = "#D93F3F";

export function LiveDemo() {
  const [lateDays, setLateDays] = useState(0);
  const [studentLeaves, setStudentLeaves] = useState(false);

  const { values, labels, lowest, leaverNote } = useMemo(
    () => balanceSeries({ lateDays, studentLeaves }),
    [lateDays, studentLeaves],
  );

  // Navy line with a teal fill; coral (danger) only when the balance goes below zero.
  const isNegative = lowest.value < 0;
  const waveColor = isNegative ? DANGER : NAVY;
  const waveFill = isNegative ? DANGER : TEAL;

  let sentence = `Lowest balance ${formatINR(lowest.value)} on day ${lowest.day}.`;
  if (isNegative) {
    sentence += ` You'd be short by ${formatINR(-lowest.value)}. FeeFlow warns you weeks ahead.`;
  }
  if (studentLeaves) {
    sentence += ` ${leaverNote}`;
  }

  return (
    <section id="try" className="scroll-mt-24 mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#0A1F3D] text-balance sm:text-4xl">
        Try it: what if a parent pays late?
      </h2>
      <p className="mt-3 text-[#5E6E87]">
        Sample numbers for one tutor with 8 students. Move the slider or flip the switch and watch the balance.
      </p>

      <div className="mt-8 rounded-3xl border border-[#E6EBF2] bg-white p-6 shadow-[0_1px_2px_rgba(10,31,61,0.04),0_24px_56px_-28px_rgba(10,31,61,0.25)] sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <label className="flex w-full flex-col gap-2 sm:max-w-xs">
            <span className="text-sm font-medium text-[#0A1F3D]">Days late: {lateDays}</span>
            <input
              type="range"
              min={0}
              max={45}
              step={1}
              value={lateDays}
              aria-label="Days late"
              onChange={(e) => setLateDays(Number(e.target.value))}
              className="accent-[#0B2A55] w-full min-h-11"
            />
          </label>

          <button
            type="button"
            aria-pressed={studentLeaves}
            onClick={() => setStudentLeaves((v) => !v)}
            className={`h-11 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E9F8E] ${
              studentLeaves
                ? "bg-[#0E9F8E] text-white hover:bg-[#0C8A7C]"
                : "border border-[#E6EBF2] bg-white text-[#0A1F3D] hover:bg-[#F6F8FB]"
            }`}
          >
            Student leaves
          </button>
        </div>

        <div className="mt-6">
          <WaveChart
            series={[{ key: "balance", label: "Balance", color: waveColor, fill: waveFill, values }]}
            labels={labels}
            height={220}
            zeroLine
          />
        </div>

        <p aria-live="polite" className="mt-6 text-base text-[#0A1F3D]">
          {sentence}
        </p>
        <p className="mt-2 text-sm text-[#5E6E87]">Sample data for illustration.</p>
      </div>
    </section>
  );
}
