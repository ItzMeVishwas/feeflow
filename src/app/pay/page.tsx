"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { formatDate, formatINR, formatMonth } from "@/lib/format"
import { buildUpiLink, decodePayLink } from "@/lib/pay-link"

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center px-4 py-10">
          <div className="glass w-full max-w-md rounded-2xl p-6 text-center font-[family-name:var(--font-figtree)] text-muted-foreground">
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
        <div className="glass w-full max-w-md rounded-2xl p-6 sm:p-8">
          <h1 className="font-[family-name:var(--font-bricolage)] text-2xl font-semibold text-foreground">
            This payment link looks broken
          </h1>
          <p className="mt-2 font-[family-name:var(--font-figtree)] text-muted-foreground">
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
      <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8 font-[family-name:var(--font-figtree)] text-foreground">
        <h1 className="font-[family-name:var(--font-bricolage)] text-2xl font-semibold">
          {data.tutorName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Fee for {data.studentName}, {formatMonth(data.month)}
        </p>

        <p className="mt-6 font-[family-name:var(--font-bricolage)] text-5xl font-semibold tabular-nums">
          {formatINR(data.amountDue, { wholeRupees: true })}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-muted-foreground">Due on {formatDate(data.dueDate)}</p>
          {isOverdue && (
            <span className="rounded-xl bg-[#FF6B6B]/15 px-2.5 py-1 text-sm font-medium text-[#FF6B6B]">
              Overdue
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="rounded-2xl bg-white p-4">
            <QRCodeSVG value={buildUpiLink(data)} size={180} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Scan with any UPI app</p>
        </div>

        <a
          href={buildUpiLink(data)}
          className="mt-6 block w-full rounded-xl bg-[#F2A93B] px-4 py-3.5 text-center text-base font-semibold text-[#1A1206] hover:brightness-105 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#F2A93B]/50"
        >
          Pay {formatINR(data.amountDue)} with UPI
        </a>

        {data.upiId && <UpiIdRow upiId={data.upiId} />}

        <p className="mt-6 text-center text-sm text-muted-foreground">
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
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">UPI id</p>
        <p className="break-all font-medium">{upiId}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-xl border border-border px-3 py-2 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#F2A93B]/50"
      >
        {status === "copied" ? "Copied" : "Copy UPI id"}
      </button>
      {status === "failed" && (
        <p role="status" className="w-full text-sm text-[#FF6B6B]">
          Copy failed. Select the id and copy it.
        </p>
      )}
    </div>
  )
}
