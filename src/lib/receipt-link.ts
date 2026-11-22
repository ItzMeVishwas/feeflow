import { decodeBase64UrlJson, encodeBase64UrlJson } from "@/lib/pay-link"

export type ReceiptData = {
  no: string
  student: string
  parent: string
  amount: number
  month: string // "YYYY-MM"
  date: string // "YYYY-MM-DD" date paid
  tutor: string
  upiId: string
}

// Derived, not stored: "FF-" + yyyymm + "-" + last 4 chars of the invoice id.
export function receiptNumber(invoiceId: string, month: string): string {
  return `FF-${month.replace("-", "")}-${invoiceId.slice(-4).toUpperCase()}`
}

export function encodeReceipt(data: ReceiptData): string {
  return encodeBase64UrlJson(data)
}

// Returns null for any malformed input. Never throws.
export function decodeReceipt(param: string): ReceiptData | null {
  const json = decodeBase64UrlJson(param)
  if (typeof json !== "object" || json === null) return null
  const d = json as Record<string, unknown>

  const strings = ["no", "student", "parent", "month", "date", "tutor", "upiId"] as const
  for (const key of strings) {
    if (typeof d[key] !== "string") return null
  }
  if (typeof d.amount !== "number" || !Number.isFinite(d.amount)) return null

  return d as unknown as ReceiptData
}

export function buildReceiptPath(data: ReceiptData): string {
  return `/receipt?d=${encodeReceipt(data)}`
}
