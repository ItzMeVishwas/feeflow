export type PayLinkData = {
  tutorName: string
  upiId: string
  studentName: string
  parentName: string
  month: string // "YYYY-MM"
  amount: number
  amountDue: number
  dueDate: string // "YYYY-MM-DD"
  invoiceId: string
}

// Encodes as base64url so the value is safe in a URL query string.
export function encodePayLink(data: PayLinkData): string {
  const bytes = new TextEncoder().encode(JSON.stringify(data))
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// Returns null for any malformed input. Never throws.
export function decodePayLink(param: string): PayLinkData | null {
  try {
    let base64 = param.replace(/-/g, "+").replace(/_/g, "/")
    const padding = base64.length % 4
    if (padding) base64 += "=".repeat(4 - padding)

    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const json: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))

    if (typeof json !== "object" || json === null) return null
    const d = json as Record<string, unknown>

    const strings = ["tutorName", "upiId", "studentName", "parentName", "month", "dueDate", "invoiceId"] as const
    for (const key of strings) {
      if (typeof d[key] !== "string") return null
    }
    const numbers = ["amount", "amountDue"] as const
    for (const key of numbers) {
      if (typeof d[key] !== "number" || !Number.isFinite(d[key])) return null
    }

    return d as unknown as PayLinkData
  } catch {
    return null
  }
}

export function buildPayUrl(data: PayLinkData): string {
  return `${window.location.origin}/pay?d=${encodePayLink(data)}`
}

// UPI deep link that opens a payment app with the amount and payee pre-filled.
export function buildUpiLink(data: PayLinkData): string {
  return `upi://pay?pa=${encodeURIComponent(data.upiId.trim())}&pn=${encodeURIComponent(data.tutorName)}&am=${data.amountDue}&cu=INR&tn=${encodeURIComponent(`${data.studentName} ${data.month} fee`)}`
}
