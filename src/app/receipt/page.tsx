"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { formatDate, formatINR, formatMonth } from "@/lib/format"
import { decodeReceipt } from "@/lib/receipt-link"

const CARD_CLASS =
  "rounded-3xl border border-[#E6EBF2] bg-white shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)]"

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className={`${CARD_CLASS} w-full max-w-md p-6 text-center font-[family-name:var(--font-figtree)] text-[#5E6E87]`}>
            Loading your receipt
          </div>
        </main>
      }
    >
      <ReceiptContent />
    </Suspense>
  )
}

function ReceiptContent() {
  const searchParams = useSearchParams()
  const receipt = decodeReceipt(searchParams.get("d") ?? "")

  if (!receipt) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className={`${CARD_CLASS} w-full max-w-md p-6 sm:p-8 font-[family-name:var(--font-figtree)]`}>
          <p className="text-[#0A1F3D]">This receipt link is not valid.</p>
        </div>
      </main>
    )
  }

  const rows: { label: string; value: string }[] = [
    { label: "Receipt no", value: receipt.no },
    { label: "Student", value: receipt.student },
    { label: "Parent", value: receipt.parent },
    { label: "Month", value: formatMonth(receipt.month) },
    { label: "Date paid", value: formatDate(receipt.date) },
    { label: "Tutor", value: receipt.tutor },
    { label: "UPI id", value: receipt.upiId },
  ]

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 print:block print:min-h-0 print:p-0">
      <div
        className={`${CARD_CLASS} w-full max-w-md p-6 sm:p-8 font-[family-name:var(--font-figtree)] text-[#0A1F3D] print:max-w-none print:border-0 print:shadow-none`}
      >
        <h1 className="font-[family-name:var(--font-bricolage)] text-2xl font-semibold">Payment receipt</h1>

        <p className="mt-6 font-[family-name:var(--font-bricolage)] text-5xl font-semibold tabular-nums">
          {formatINR(receipt.amount)}
        </p>
        <p className="mt-1 text-sm text-[#5E6E87]">Paid</p>

        <dl className="mt-6 divide-y divide-[#E6EBF2] border-t border-[#E6EBF2]">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 py-3">
              <dt className="text-sm text-[#5E6E87]">{row.label}</dt>
              <dd className="break-all text-right font-medium tabular-nums">{row.value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={() => window.print()}
          className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-[#0B2A55] px-4 text-sm font-semibold text-white hover:bg-[#133A72] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55] print:hidden"
        >
          Print receipt
        </button>
      </div>
    </main>
  )
}
