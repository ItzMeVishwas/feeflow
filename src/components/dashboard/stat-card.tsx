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
    "mt-2 block text-2xl font-extrabold tracking-tight tabular-nums text-[#0A1F3D] dark:text-[#E6ECF5]"

  return (
    <div className="rounded-3xl bg-white border border-[#E6EBF2] p-4 shadow-[0_1px_2px_rgba(10,31,61,.04),0_8px_24px_rgba(10,31,61,.05)] dark:bg-[#121E36] dark:border-white/10">
      <p className="text-sm text-[#5E6E87] dark:text-[#93A3BC] font-medium">{label}</p>
      {value === null ? (
        <span className={valueClassName}>—</span>
      ) : (
        <AnimatedNumber value={value} format={format} className={valueClassName} />
      )}
      {detail && (
        <p className="mt-1 text-xs text-[#5E6E87] dark:text-[#93A3BC]">{detail}</p>
      )}
    </div>
  )
}
