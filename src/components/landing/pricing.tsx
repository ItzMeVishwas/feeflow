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

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E9F8E]";

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-24 mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#0A1F3D] sm:text-4xl">
        Simple pricing that grows with you
      </h2>

      <div className="mt-12 grid items-stretch gap-6 md:grid-cols-2">
        <article className="flex flex-col rounded-3xl border border-[#E6EBF2] bg-white p-8 shadow-[0_1px_2px_rgba(10,31,61,0.04),0_16px_40px_-24px_rgba(10,31,61,0.2)]">
          <h3 className="font-heading text-xl font-semibold text-[#0A1F3D]">Free</h3>
          <p className="mt-4 font-heading text-4xl font-semibold tabular-nums text-[#0A1F3D]">
            {formatINR(0, { wholeRupees: true })}
            <span className="ml-2 text-base font-normal text-[#5E6E87]"> to start</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-[#5E6E87]">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0E9F8E]" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl border border-[#E6EBF2] bg-white font-semibold text-[#0A1F3D] transition-colors hover:bg-[#F6F8FB] ${focusRing}`}
          >
            Start free
          </Link>
        </article>

        <article className="relative flex flex-col rounded-3xl border-2 border-[#0B2A55] bg-white p-8 shadow-[0_1px_2px_rgba(10,31,61,0.04),0_30px_60px_-24px_rgba(11,42,85,0.4)] md:scale-[1.02]">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-heading text-xl font-semibold text-[#0A1F3D]">Pro</h3>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#0E9F8E] px-3 py-1 text-sm font-semibold text-white">
              <Check aria-hidden="true" className="h-4 w-4" />
              Recommended
            </span>
          </div>
          <p className="mt-4 font-heading text-4xl font-semibold tabular-nums text-[#0A1F3D]">
            {formatINR(199, { wholeRupees: true })}
            <span className="ml-2 text-base font-normal text-[#5E6E87]"> per month</span>
          </p>
          <ul className="mt-6 flex-1 space-y-3">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-[#5E6E87]">
                <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B2A55]" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard"
            className={`mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#0B2A55] font-semibold text-white transition-colors hover:bg-[#133A72] ${focusRing}`}
          >
            Go Pro
          </Link>
        </article>
      </div>
    </section>
  );
}
