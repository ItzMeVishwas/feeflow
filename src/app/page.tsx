import Link from "next/link";
import FlowFieldLazy from "@/components/three/flow-field-lazy";
import { formatINR } from "../lib/format";
import { Logo } from "@/components/brand/logo";

// Decorative 7x7 pattern for the UPI-style mock. It is NOT a scannable QR code.
const UPI_PATTERN = [
  "1111001",
  "1000101",
  "1011101",
  "1011001",
  "1000111",
  "0110010",
  "1101011",
];

const qrCells = UPI_PATTERN.flatMap((row, r) =>
  row.split("").map((bit, c) => ({ key: `${r}-${c}`, on: bit === "1" })),
);

const runwayTicks = ["Today", "Day 45", "Day 90"];


export default function LandingPage() {
  return (
    <div className="dark w-full min-h-screen overflow-x-hidden bg-[#0E1726] font-sans text-[#E8EDF5]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Logo />
        <Link
          href="/dashboard"
          className="rounded-xl px-3 py-2 text-sm font-medium text-[#F2A93B] transition-colors hover:bg-white/[0.06]"
        >
          Open the demo
        </Link>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true"><FlowFieldLazy /></div>

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-10 sm:px-8 md:grid-cols-2 md:pb-28 md:pt-16 lg:gap-20">
          <div className="relative z-10 flex flex-col items-start gap-6">
            <p className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-[#F2A93B]">
              For home tutors in India
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Know who owes you. See next month&apos;s cash. Chase fees in one tap.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-[#9AA8BC]">
              FeeFlow sends WhatsApp reminders, creates UPI pay links for each student, and
              shows a 90-day cash forecast so you can plan the month before it starts.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-[#F2A93B] px-6 font-semibold text-[#1A1206] shadow-lg shadow-[#F2A93B]/25 transition-transform hover:-translate-y-0.5"
              >
                Try the live demo
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 font-semibold text-[#E8EDF5] transition-colors hover:bg-white/[0.08]"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Tilted dashboard mock, built from real markup */}
          <div className="relative md:[transform:perspective(1400px)_rotateY(-8deg)_rotateX(4deg)]">
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
                  <p className="font-display text-2xl font-semibold tabular-nums text-[#F2A93B]">
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

      {/* How it works */}
      <section
        id="how-it-works"
        className="mx-auto max-w-6xl scroll-mt-8 px-5 py-20 sm:px-8"
      >
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            How FeeFlow keeps fees moving
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-[#9AA8BC]">
            Three things a tutor needs every week, shown the way they appear in the app.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* a. Chase */}
          <article className="glass flex flex-col gap-6 rounded-2xl p-6 shadow-xl shadow-black/30">
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                Chase without the awkwardness
              </h3>
              <p className="text-sm leading-relaxed text-[#9AA8BC]">
                A polite WhatsApp reminder goes out with the pay link already attached.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="max-w-[90%] self-end rounded-2xl rounded-br-md bg-[#3DD9A8]/15 px-4 py-3 text-sm leading-relaxed ring-1 ring-[#3DD9A8]/30">
                Hi Sunita, the fee of {formatINR(4200, { wholeRupees: true })} for Rohan is due on
                5 May. You can pay in one tap here.
                <span className="mt-1 block text-right text-xs text-[#9AA8BC]">9:05 am</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.06] p-3 ring-1 ring-white/10">
                <div>
                  <p className="text-sm font-medium">UPI pay link</p>
                  <p className="text-xs tabular-nums text-[#9AA8BC]">
                    {formatINR(4200, { wholeRupees: true })} to your UPI ID
                  </p>
                </div>
                <span className="rounded-xl bg-[#3DD9A8]/15 px-2.5 py-1 text-xs font-medium text-[#3DD9A8]">
                  Ready to share
                </span>
              </div>
            </div>
          </article>

          {/* b. Forecast */}
          <article className="glass flex flex-col gap-6 rounded-2xl p-6 shadow-lg shadow-[#2A1F3D]/60">
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                See the dip before it happens
              </h3>
              <p className="text-sm leading-relaxed text-[#9AA8BC]">
                The forecast projects your balance day by day, so a shortfall shows up weeks early.
              </p>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <svg
                viewBox="0 0 300 120"
                className="h-auto w-full"
                role="img"
                aria-label="Forecast balance dipping below zero in late May"
              >
                <line
                  x1="0"
                  x2="300"
                  y1="60"
                  y2="60"
                  stroke="#E8EDF5"
                  strokeOpacity="0.4"
                  strokeDasharray="4 4"
                />
                <text x="6" y="54" fill="#9AA8BC" fontSize="10">
                  Zero
                </text>
                <path
                  d="M0 36 C 50 30, 100 40, 150 52 C 160 55, 166 56, 172 58"
                  fill="none"
                  stroke="#F2A93B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M172 58 C 188 66, 200 96, 232 98 C 256 100, 276 80, 300 70"
                  fill="none"
                  stroke="#FF6B6B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="232" cy="98" r="4" fill="#FF6B6B" />
              </svg>
            </div>
            <p className="rounded-xl bg-[#FF6B6B]/10 px-4 py-3 text-sm font-medium text-[#FF6B6B] ring-1 ring-[#FF6B6B]/30">
              Cash goes negative on 18 May
            </p>
          </article>

          {/* c. Pay */}
          <article className="glass flex flex-col gap-6 rounded-2xl p-6 shadow-xl shadow-black/30">
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-xl font-semibold tracking-tight">
                Parents pay in one tap
              </h3>
              <p className="text-sm leading-relaxed text-[#9AA8BC]">
                The pay link opens straight into any UPI app with the amount filled in.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div
                aria-hidden="true"
                className="grid w-40 grid-cols-7 gap-0.5 rounded-xl bg-white p-3"
              >
                {qrCells.map((cell) => (
                  <span
                    key={cell.key}
                    className={`aspect-square rounded-[2px] ${cell.on ? "bg-[#0E1726]" : "bg-transparent"}`}
                  />
                ))}
              </div>
              <p className="text-center text-xs text-[#9AA8BC]">
                Decorative pattern, not a real QR code.
              </p>
              <button
                type="button"
                className="h-11 w-full rounded-xl bg-[#F2A93B] px-5 font-semibold text-[#1A1206] shadow-lg shadow-[#F2A93B]/20 transition-transform hover:-translate-y-0.5"
              >
                Pay with UPI
              </button>
            </div>
          </article>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Simple pricing that grows with you
          </h2>
        </div>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-2">
          <article className="glass flex flex-col gap-6 rounded-2xl p-7 shadow-lg shadow-black/25">
            <div>
              <h3 className="font-display text-xl font-semibold tracking-tight">Free</h3>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums">
                {formatINR(0, { wholeRupees: true })}
                <span className="text-base font-normal text-[#9AA8BC]"> to start</span>
              </p>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-[#E8EDF5]">
              <li className="flex items-center gap-3">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#3DD9A8]" />
                Up to 15 students
              </li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-auto inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] px-6 font-semibold transition-colors hover:bg-white/[0.08]"
            >
              Start free
            </Link>
          </article>

          <article className="glass-strong flex flex-col gap-6 rounded-3xl border-[#F2A93B]/60 p-8 shadow-[0_30px_60px_-20px_rgba(242,169,59,0.35)] ring-2 ring-[#F2A93B] md:scale-[1.03]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-semibold tracking-tight">Pro</h3>
                <p className="mt-2 font-display text-5xl font-semibold tabular-nums">
                  {formatINR(199, { wholeRupees: true })}
                  <span className="text-base font-normal text-[#9AA8BC]"> per month</span>
                </p>
              </div>
              <span className="rounded-xl bg-[#F2A93B] px-3 py-1.5 text-sm font-semibold text-[#1A1206]">
                Recommended
              </span>
            </div>
            <ul className="flex flex-col gap-3 text-sm text-[#E8EDF5]">
              <li className="flex items-center gap-3">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#F2A93B]" />
                Unlimited students
              </li>
              <li className="flex items-center gap-3">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#F2A93B]" />
                Receipts for every payment
              </li>
              <li className="flex items-center gap-3">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#F2A93B]" />
                90-day cash forecasts
              </li>
              <li className="flex items-center gap-3">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#F2A93B]" />
                Priority support
              </li>
            </ul>
            <Link
              href="/dashboard"
              className="mt-auto inline-flex h-12 items-center justify-center rounded-xl bg-[#F2A93B] px-6 font-semibold text-[#1A1206] shadow-lg shadow-[#F2A93B]/25 transition-transform hover:-translate-y-0.5"
            >
              Go Pro
            </Link>
          </article>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-[#9AA8BC] sm:px-8">
        Built for the Codebenders ACE Builders Hackathon 2026
      </footer>
    </div>
  );
}
