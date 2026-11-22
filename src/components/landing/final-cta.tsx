import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <div className="glass-strong rounded-3xl p-8 text-center sm:p-12">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Know what you will earn next month, today.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[#9AA8BC]">
          Set up your students in a few minutes and send this month&apos;s fees on WhatsApp.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center rounded-xl bg-[#F2A93B] px-6 font-semibold text-[#1A1206] shadow-lg shadow-[#F2A93B]/25 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B]"
          >
            Open the app
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-white/10 px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#9AA8BC]">
            <a href="#product" className="hover:text-[#E8EDF5]">Product</a>
            <a href="#how-it-works" className="hover:text-[#E8EDF5]">How it works</a>
            <a href="#pricing" className="hover:text-[#E8EDF5]">Pricing</a>
            <a href="#faq" className="hover:text-[#E8EDF5]">FAQ</a>
          </nav>
        </div>
        <p className="mt-8 text-sm text-[#9AA8BC]">
          Built for the Codebenders ACE Builders Hackathon 2026
        </p>
      </div>
    </footer>
  );
}
