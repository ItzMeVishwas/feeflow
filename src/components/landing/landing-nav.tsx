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
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B]";

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
        className="glass mx-auto mt-3 flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-6"
      >
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {sectionLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={(event) => scrollToSection(event, link.href)}
                className={`inline-flex h-11 items-center rounded-xl px-3 text-sm font-medium text-[#9AA8BC] transition-colors hover:bg-white/[0.06] hover:text-[#E8EDF5] ${focusRing}`}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard"
          className={`inline-flex h-11 items-center rounded-xl bg-[#F2A93B] px-5 font-semibold text-[#1A1206] ${focusRing}`}
        >
          Open the app
        </Link>
      </nav>
    </header>
  );
}
