'use client';

import Link from "next/link";
import type { MouseEvent } from "react";
import { Logo } from "@/components/brand/logo";

const sectionLinks = [
  { href: "#product", label: "Product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E9F8E]";

function scrollToSection(event: MouseEvent<HTMLAnchorElement>, hash: string) {
  event.preventDefault();
  const id = hash.slice(1);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50">
      <nav
        aria-label="Main"
        className="mx-auto mt-3 flex max-w-6xl items-center justify-between gap-4 rounded-2xl border border-[#E6EBF2] bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(10,31,61,0.04),0_12px_32px_-16px_rgba(10,31,61,0.18)] backdrop-blur-md sm:px-6"
      >
        <Logo className="[&>span:last-child]:text-[#0A1F3D]" />

        <ul className="hidden items-center gap-1 md:flex">
          {sectionLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(event) => scrollToSection(event, link.href)}
                className={`inline-flex h-11 items-center rounded-xl px-3 text-sm font-medium text-[#5E6E87] transition-colors hover:bg-[#0B2A55]/5 hover:text-[#0A1F3D] ${focusRing}`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard"
          className={`inline-flex h-11 items-center rounded-xl bg-[#0E9F8E] px-5 text-base font-semibold text-white transition-colors hover:bg-[#0C8A7C] ${focusRing}`}
        >
          Open the app
        </Link>
      </nav>
    </header>
  );
}
