import type React from "react";

export type PillTone = "paid" | "due" | "overdue" | "neutral";

const base =
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap";

const tones: Record<PillTone, string> = {
  paid: "bg-[#12A150]/10 text-[#0E7A3E] dark:text-[#12A150]",
  due: "bg-[#0B2A55]/10 text-[#0B2A55] dark:text-[#9DB6E6]",
  overdue: "bg-[#D93F3F]/10 text-[#D93F3F] dark:text-[#FF8A8D]",
  neutral: "bg-[#0A1F3D]/5 text-[#5E6E87]",
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
