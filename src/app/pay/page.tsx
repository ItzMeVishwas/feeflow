"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { formatDate, formatINR, formatMonth } from "@/lib/format"
import { buildUpiLink, decodePayLink } from "@/lib/pay-link"
import { StatusPill } from "@/components/status-pill"

const CARD_CLASS =
  "rounded-3xl border border-[#E6EBF2] bg-white shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)] dark:border-white/10 dark:bg-[#121E36]"

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className={`${CARD_CLASS} w-full max-w-md p-6 text-center font-[family-name:var(--font-figtree)] text-[#5E6E87]`}>
            Loading your payment details
          </div>
        </main>
      }
    >
      <PayContent />
    </Suspense>
  )
}

function PayContent() {
  const searchParams = useSearchParams()
  const data = decodePayLink(searchParams.get("d") ?? "")

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className={`${CARD_CLASS} w-full max-w-md p-6 sm:p-8`}>
          <h1 className="font-[family-name:var(--font-bricolage)] text-2xl font-semibold text-[#0A1F3D]">
            This payment link looks broken
          </h1>
          <p className="mt-2 font-[family-name:var(--font-figtree)] text-[#5E6E87]">
            Ask your tutor to send you a new link.
          </p>
        </div>
      </main>
    )
  }

  // Dates are "YYYY-MM-DD", so a string comparison against the local date is correct.
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const isOverdue = data.dueDate.slice(0, 10) < today

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className={`${CARD_CLASS} w-full max-w-md p-6 sm:p-8 font-[family-name:var(--font-figtree)] text-[#0A1F3D]`}>
        <h1 className="font-[family-name:var(--font-bricolage)] text-2xl font-semibold">
          {data.tutorName}
        </h1>
        <p className="mt-1 text-[#5E6E87]">
          Fee for {data.studentName}, {formatMonth(data.month)}
        </p>

        <p className="mt-6 font-[family-name:var(--font-bricolage)] text-5xl font-semibold tabular-nums">
          {formatINR(data.amountDue, { wholeRupees: true })}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-[#5E6E87]">Due on {formatDate(data.dueDate)}</p>
          {isOverdue && <StatusPill tone="overdue">Overdue</StatusPill>}
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-[#E6EBF2]">
            <QRCodeSVG value={buildUpiLink(data)} size={180} />
          </div>
          <p className="mt-3 text-sm text-[#5E6E87]">Scan with any UPI app</p>
        </div>

        <a
          href={buildUpiLink(data)}
          className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-[#0E9F8E] px-4 text-center text-base font-semibold text-white hover:bg-[#0C8A7C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"
        >
          Pay {formatINR(data.amountDue)} with UPI
        </a>

        {data.upiId && <UpiIdRow upiId={data.upiId} />}

        <p className="mt-6 text-center text-sm text-[#5E6E87]">
          Already paid? Let {data.tutorName} know on WhatsApp
        </p>
      </div>
    </main>
  )
}

function UpiIdRow({ upiId }: { upiId: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(upiId)
      setStatus("copied")
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setStatus("idle"), 2000)
    } catch {
      setStatus("failed")
    }
  }

  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E6EBF2] px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-[#5E6E87]">UPI id</p>
        <p className="break-all font-medium text-[#0A1F3D]">{upiId}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="h-11 rounded-xl border border-[#DCE3EE] bg-white px-4 text-sm font-medium text-[#0B2A55] hover:bg-[#F6F8FB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2A55]"
      >
        {status === "copied" ? "Copied" : "Copy UPI id"}
      </button>
      {status === "failed" && (
        <p role="status" className="w-full text-sm text-[#D93F3F]">
          Copy failed. Select the id and copy it.
        </p>
      )}
    </div>
  )
}
