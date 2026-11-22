"use client"

import { AnimatedNumber } from "@/components/ui/animated-number"

type StatCardProps = {
  label: string
  value: number | null
  format?: (n: number) => string
  detail?: string
}

// Small dashboard stat: a muted label above a large count-up figure.
export function StatCard({ label, value, format, detail }: StatCardProps) {
  const valueClassName =
    "mt-2 block text-2xl font-extrabold tracking-tight text-[#0F1E3C] dark:text-[#E6ECF5]"

  return (
    <div className="rounded-2xl bg-white border border-[#E3E8F0] p-4 shadow-[0_1px_2px_rgba(15,30,60,.06),0_8px_24px_rgba(15,30,60,.06)] dark:bg-[#121E36] dark:border-white/10">
      <p className="text-sm text-[#5B6B84] dark:text-[#93A3BC] font-medium">{label}</p>
      {value === null ? (
        <span className={valueClassName}>—</span>
      ) : (
        <AnimatedNumber value={value} format={format} className={valueClassName} />
      )}
      {detail && (
        <p className="mt-1 text-xs text-[#5B6B84] dark:text-[#93A3BC]">{detail}</p>
      )}
    </div>
  )
}
