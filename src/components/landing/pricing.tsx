import Link from "next/link";
import { Check } from "lucide-react";
import { formatINR } from "@/lib/format";

const freeFeatures = ["Up to 15 students"];
const proFeatures = [
  "Unlimited students",
  "Receipts for every payment",
  "90-day cash forecasts",
  "Priority support",
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Simple pricing that grows with you
      </h2>

      <div className="mt-12 grid items-stretch gap-6 md:grid-cols-2">
        <article className="glass flex flex-col rounded-2xl p-8 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.5)]">
          <h3 className="font-heading text-xl font-semibold">Free</h3>
          <p className="mt-4 font-heading text-4xl font-semibold tabular-nums">
            {formatINR(0, { wholeRupees: true })}
            <span className="ml-2 text-base font-normal text-[#9AA8BC]"> to start</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-[#9AA8BC]">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3DD9A8]" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] font-medium transition-colors hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B]"
          >
            Start free
          </Link>
        </article>

        <article className="glass-strong relative flex flex-col rounded-3xl p-8 ring-2 ring-[#F2A93B]/70 shadow-[0_30px_70px_-24px_rgba(242,169,59,0.4)] md:scale-[1.02]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-xl font-semibold">Pro</h3>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#F2A93B] px-3 py-1 text-sm font-medium text-[#1A1206]">
              <Check aria-hidden="true" className="h-4 w-4" />
              Recommended
            </span>
          </div>
          <p className="mt-4 font-heading text-4xl font-semibold tabular-nums">
            {formatINR(199, { wholeRupees: true })}
            <span className="ml-2 text-base font-normal text-[#9AA8BC]"> per month</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-[#9AA8BC]">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F2A93B]" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#F2A93B] font-medium text-[#1A1206] transition-colors hover:bg-[#F5B457] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B]"
          >
            Go Pro
          </Link>
        </article>
      </div>
    </section>
  );
}
