'use client';

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import FlowFieldLazy from "@/components/three/flow-field-lazy";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { HeadlineWords } from "@/components/landing/headline-words";
import { HeroWaves } from "@/components/landing/hero-waves";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E9F8E]";

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
    <section className="relative isolate overflow-hidden bg-[#0B2A55] text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <FlowFieldLazy />
      </div>
      <HeroWaves />

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 md:pb-28 md:pt-20 lg:grid-cols-2 lg:gap-16">
        <div className="relative z-10 flex min-w-0 flex-col items-start gap-6">
          <motion.div {...entrance(0)} className="flex flex-col items-start gap-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#0E9F8E]" />
              For home tutors in India
            </p>
            <h1 className="font-heading text-4xl font-extrabold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              <HeadlineWords text="Know who owes you. See next month's cash. Chase fees in one tap." />
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-white/80">
              FeeFlow sends WhatsApp reminders, creates UPI pay links for each student, and
              shows a 90-day cash forecast so you can plan the month before it starts.
            </p>
          </motion.div>

          <motion.div {...entrance(0.1)} className="flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className={`inline-flex h-12 items-center justify-center rounded-xl bg-[#0E9F8E] px-6 text-base font-semibold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#0C8A7C] ${focusRing}`}
            >
              Try the live demo
            </Link>
            <a
              href="#how-it-works"
              className={`inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-6 font-semibold text-white transition-colors hover:bg-white/10 ${focusRing}`}
            >
              See how it works
            </a>
          </motion.div>

          <motion.div {...entrance(0.2)} className="flex w-full flex-col gap-3">
            <dl className="grid w-full grid-cols-3 gap-4 border-t border-white/15 pt-6">
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-white/70">tracked</dt>
                <dd>
                  <AnimatedNumber
                    value={24}
                    format={(n) => `₹${(n / 10).toFixed(1)}L`}
                    className="font-heading text-2xl font-semibold"
                  />
                </dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-white/70">reminders sent</dt>
                <dd>
                  <AnimatedNumber
                    value={380}
                    format={(n) => n.toLocaleString("en-IN")}
                    className="font-heading text-2xl font-semibold"
                  />
                </dd>
              </div>
              <div className="flex flex-col-reverse gap-1">
                <dt className="text-sm text-white/70">on-time</dt>
                <dd>
                  <AnimatedNumber
                    value={92}
                    format={(n) => `${n}%`}
                    className="font-heading text-2xl font-semibold"
                  />
                </dd>
              </div>
            </dl>
            <p className="text-xs text-white/70">Demo figures for illustration.</p>
          </motion.div>
        </div>

        <motion.div {...entrance(0.2)} className="relative z-10 min-w-0">
          <DashboardPreview />
        </motion.div>
      </div>
    </section>
  );
}
