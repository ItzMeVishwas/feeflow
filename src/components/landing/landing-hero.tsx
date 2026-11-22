'use client';

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import FlowFieldLazy from "@/components/three/flow-field-lazy";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { formatINR } from "@/lib/format";

const runwayTicks = ["Today", "Day 45", "Day 90"];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B]";

export function LandingHero() {
  const reduce = useReducedMotion();

  // One orchestrated entrance: text, then CTAs, then stats.
  const entrance = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay, ease: "easeOut" as const },
        };

  return (
    <section className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <FlowFieldLazy />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 md:grid-cols-2 md:pb-28 md:pt-16 lg:gap-20">
        <div className="relative z-10 flex min-w-0 flex-col items-start gap-6">
          <motion.div {...entrance(0)} className="flex flex-col items-start gap-6">
            <p className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-[#F2A93B]">
              For home tutors in India
            </p>
            <h1 className="font-heading text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Know who owes you. See next month&apos;s cash. Chase fees in one tap.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#9AA8BC]">
              FeeFlow sends WhatsApp reminders, creates UPI pay links for each student, and
              shows a 90-day cash forecast so you can plan the month before it starts.
            </p>
          </motion.div>

          <motion.div {...entrance(0.1)} className="flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={`inline-flex h-12 items-center justify-center rounded-xl bg-[#F2A93B] px-6 font-semibold text-[#1A1206] shadow-lg shadow-[#F2A93B]/25 transition-transform hover:-translate-y-0.5 ${focusRing}`}
            >
              Try the live demo
            </Link>
            <a
              href="#how-it-works"
              className={`inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 font-semibold text-[#E8EDF5] transition-colors hover:bg-white/[0.08] ${focusRing}`}
            >
              See how it works
            </a>
          </motion.div>

          <motion.div {...entrance(0.2)} className="flex w-full flex-col gap-3">
            <dl className="grid w-full grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-[#9AA8BC]">tracked</dt>
                <dd>
                  <AnimatedNumber
                    value={24}
                    format={(n) => `₹${(n / 10).toFixed(1)}L`}
                    className="font-heading text-2xl font-semibold"
                  />
                </dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-[#9AA8BC]">reminders sent</dt>
                <dd>
                  <AnimatedNumber
                    value={380}
                    format={(n) => n.toLocaleString("en-IN")}
                    className="font-heading text-2xl font-semibold"
                  />
                </dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-[#9AA8BC]">on-time</dt>
                <dd>
                  <AnimatedNumber
                    value={92}
                    format={(n) => `${n}%`}
                    className="font-heading text-2xl font-semibold"
                  />
                </dd>
              </div>
            </dl>
            <p className="text-xs text-[#9AA8BC]">Demo figures for illustration.</p>
          </motion.div>
        </div>

        {/* Tilted dashboard mock, built from real markup */}
        <div className="relative min-w-0 md:[transform:perspective(1400px)_rotateY(-8deg)_rotateX(4deg)]">
          <div className="glass rounded-3xl p-5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[#9AA8BC]">Cash runway</p>
              <p className="text-sm text-[#9AA8BC]">Next 90 days</p>
            </div>

            <div className="mt-4 rounded-2xl bg-white/[0.03] p-4">
              <svg
                viewBox="0 0 280 110"
                className="h-auto w-full"
                role="img"
                aria-label="Cash runway falling over the next 90 days"
              >
                <defs>
                  <linearGradient id="runway-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F2A93B" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#F2A93B" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <g stroke="#E8EDF5" strokeOpacity="0.08">
                  <line x1="0" x2="280" y1="25" y2="25" />
                  <line x1="0" x2="280" y1="55" y2="55" />
                  <line x1="0" x2="280" y1="85" y2="85" />
                </g>
                <path
                  d="M0 22 C 40 24, 70 36, 110 46 S 190 74, 240 82 L 280 88 L 280 110 L 0 110 Z"
                  fill="url(#runway-fill)"
                />
                <path
                  d="M0 22 C 40 24, 70 36, 110 46 S 190 74, 240 82 L 280 88"
                  fill="none"
                  stroke="#F2A93B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="280" cy="88" r="4" fill="#FF6B6B" />
              </svg>
              <div className="mt-2 flex justify-between text-xs text-[#9AA8BC] tabular-nums">
                {runwayTicks.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
            </div>

            <div className="glass-strong mt-4 flex items-center justify-between gap-4 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2A93B]/20 text-sm font-semibold text-[#F2A93B]"
                >
                  RM
                </span>
                <div>
                  <p className="font-medium">Rohan Mehta</p>
                  <p className="text-sm text-[#9AA8BC]">Class 9, maths</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-heading text-2xl font-semibold tabular-nums text-[#F2A93B]">
                  {formatINR(4200, { wholeRupees: true })}
                </p>
                <p className="text-sm text-[#9AA8BC]">due today</p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] px-4 py-3">
              <p className="text-sm text-[#9AA8BC]">Collected this month</p>
              <p className="font-medium tabular-nums text-[#3DD9A8]">
                {formatINR(18600, { wholeRupees: true })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
