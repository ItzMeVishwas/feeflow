"use client";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { formatINR } from "@/lib/format";

export type OwedHeroProps = {
  owed: number;
  parents: number;
  oldestDays: number;
  onChase: () => void;
  onSeeForecast: () => void;
};

// Three wave shapes, each one period wide (600 units). The group holds two copies
// side by side (1200 units), so drifting by -50% loops without a visible jump.
const WAVES = [
  { d: "M0 120 C100 60 200 60 300 120 S500 180 600 120", opacity: 0.08 },
  { d: "M0 90 C150 150 250 30 300 90 S450 150 600 90", opacity: 0.11 },
  { d: "M0 150 C120 110 220 190 300 150 S480 100 600 150", opacity: 0.14 },
];

export function OwedHero({ owed, parents, oldestDays, onChase, onSeeForecast }: OwedHeroProps) {
  const parentLabel = parents === 1 ? "1 parent" : `${parents} parents`;
  const detail = oldestDays > 0 ? `, oldest ${oldestDays} days` : ", nothing overdue yet";

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#0B2A55] p-6 text-white sm:p-8">
      <style>{`
        @keyframes owed-hero-drift {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .owed-hero-drift {
          animation: owed-hero-drift 22s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .owed-hero-drift {
            animation: none;
          }
        }
      `}</style>

      <svg
        aria-hidden="true"
        focusable="false"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
      >
        <g className="owed-hero-drift">
          {[0, 600].map((offset) =>
            WAVES.map((wave, i) => (
              <path
                key={`${offset}-${i}`}
                d={wave.d}
                transform={`translate(${offset} 0)`}
                fill="none"
                stroke="#ffffff"
                strokeWidth={1.5}
                strokeOpacity={wave.opacity}
                vectorEffect="non-scaling-stroke"
              />
            )),
          )}
        </g>
      </svg>

      <div className="relative">
        <p className="text-sm font-medium text-white/80">Parents owe you</p>

        <AnimatedNumber
          value={owed}
          format={(n) => formatINR(n, { wholeRupees: true })}
          className="mt-2 block text-5xl font-extrabold leading-none tracking-tight text-white sm:text-[64px]"
        />

        <p className="mt-3 text-sm text-white/80">
          {parentLabel}
          {detail}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onChase}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0E9F8E] px-5 font-semibold text-white transition-transform hover:bg-[#0C8A7C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
          >
            Chase them now
          </button>
          <button
            type="button"
            onClick={onSeeForecast}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white px-5 font-semibold text-white transition-transform hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:scale-[0.98]"
          >
            See forecast
          </button>
        </div>
      </div>
    </section>
  );
}
