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

// Encodes any JSON-safe value as base64url so it is safe in a URL query string.
export function encodeBase64UrlJson(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// Returns null for any malformed input (including the JSON value null). Never throws.
export function decodeBase64UrlJson(param: string): unknown {
  try {
    let base64 = param.replace(/-/g, "+").replace(/_/g, "/")
    const padding = base64.length % 4
    if (padding) base64 += "=".repeat(4 - padding)

    const binary = atob(base64)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes))
  } catch {
    return null
  }
}

export function encodePayLink(data: PayLinkData): string {
  return encodeBase64UrlJson(data)
}

// Returns null for any malformed input. Never throws.
export function decodePayLink(param: string): PayLinkData | null {
  const json = decodeBase64UrlJson(param)
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
}

export function buildPayUrl(data: PayLinkData): string {
  return `${window.location.origin}/pay?d=${encodePayLink(data)}`
}

// UPI deep link that opens a payment app with the amount and payee pre-filled.
export function buildUpiLink(data: PayLinkData): string {
  return `upi://pay?pa=${encodeURIComponent(data.upiId.trim())}&pn=${encodeURIComponent(data.tutorName)}&am=${data.amountDue}&cu=INR&tn=${encodeURIComponent(`${data.studentName} ${data.month} fee`)}`
}
