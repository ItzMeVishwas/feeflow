import type React from "react";

export type PillTone = "paid" | "due" | "overdue" | "neutral";

const base =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap";

const tones: Record<PillTone, string> = {
  paid: "bg-[#7DD9CC]/25 text-[#0F5C52]",
  due: "bg-[#1E3A6E]/10 text-[#1E3A6E] dark:text-[#9DB6E6]",
  overdue: "bg-[#E5484D]/12 text-[#B42328] dark:text-[#FF8A8D]",
  neutral: "bg-[#EEF2F7] text-[#5B6B84]",
};

export function StatusPill({
  tone,
  children,
}: {
  tone: PillTone;
  children: React.ReactNode;
}) {
  return <span className={`${base} ${tones[tone]}`}>{children}</span>;
}
