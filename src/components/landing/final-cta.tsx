import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <div className="rounded-3xl bg-[#0B2A55] p-8 text-center text-white shadow-[0_32px_64px_-28px_rgba(11,42,85,0.6)] sm:p-12">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Know what you will earn next month, today.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/80">
          Set up your students in a few minutes and send this month&apos;s fees on WhatsApp.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center rounded-xl bg-[#0E9F8E] px-6 text-base font-semibold text-white transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#0C8A7C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E9F8E]"
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
    <footer className="border-t border-[#E6EBF2] bg-white px-5 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <Logo />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#5E6E87]">
            <a href="#product" className="hover:text-[#0A1F3D]">Product</a>
            <a href="#how-it-works" className="hover:text-[#0A1F3D]">How it works</a>
            <a href="#pricing" className="hover:text-[#0A1F3D]">Pricing</a>
            <a href="#faq" className="hover:text-[#0A1F3D]">FAQ</a>
          </nav>
        </div>
        <p className="mt-8 text-sm text-[#5E6E87]">
          Built for the Codebenders ACE Builders Hackathon 2026
        </p>
      </div>
    </footer>
  );
}
