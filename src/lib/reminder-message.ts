import { formatINR } from "@/lib/format"

export type Tone = "friendly" | "firm" | "final"
export type Language = "english" | "hinglish"

export const TONES: { value: Tone; label: string }[] = [
  { value: "friendly", label: "Friendly" },
  { value: "firm", label: "Firm" },
  { value: "final", label: "Final" },
]

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "english", label: "English" },
  { value: "hinglish", label: "Hinglish" },
]

// "YYYY-MM" -> "March 2025"
export function formatMonth(month: string): string {
  const [year, monthNum] = month.split("-").map(Number)
  if (!year || !monthNum) return month
  return new Date(year, monthNum - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

// Whole calendar days between the due date and today (negative = not yet due).
export function getDaysLate(dueDate: string): number {
  const [year, month, day] = dueDate.slice(0, 10).split("-").map(Number)
  const due = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - due.getTime()) / 86_400_000)
}

// WhatsApp needs digits only, with country code. Assume India for 10-digit numbers.
export function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits.length === 10 ? `91${digits}` : digits
}

export type DraftInput = {
  tone: Tone
  language: Language
  parentName: string
  studentName: string
  month: string
  amountDue: number
  daysLate: number
  payUrl: string
  // Pass only when the late fee rule is enabled; null/undefined adds no line.
  lateFee?: { amount: number; afterDays: number } | null
}

export function buildDraft({
  tone,
  language,
  parentName,
  studentName,
  month,
  amountDue,
  daysLate,
  payUrl,
  lateFee,
}: DraftInput): string {
  const parent = parentName.trim() || "Parent"
  const monthText = formatMonth(month)
  const amountText = formatINR(amountDue)
  const late = Math.max(0, daysLate)
  const lateEn = late > 0 ? `${late} day${late === 1 ? "" : "s"} overdue` : "due today"
  const lateHi = late > 0 ? `${late} din se pending` : "aaj due hai"

  let body: string
  if (language === "english") {
    if (tone === "friendly") {
      body = `Hi ${parent}, hope you're doing well! A gentle reminder that the fee for ${studentName} for ${monthText} (${amountText}) is ${lateEn}. Kindly pay at your earliest convenience. Thank you!`
    } else if (tone === "firm") {
      body = `Dear ${parent}, the fee for ${studentName} for ${monthText} (${amountText}) is ${lateEn}. Please clear this payment as soon as possible.`
    } else {
      body = `Dear ${parent}, this is the final reminder. The fee for ${studentName} for ${monthText} (${amountText}) is ${lateEn}. Please pay immediately to avoid any interruption in classes.`
    }
  } else {
    if (tone === "friendly") {
      body = `Namaste ${parent} ji, umeed hai aap sab theek hain! Ek chhota sa reminder: ${studentName} ki ${monthText} ki fees (${amountText}) ${lateHi}. Kripya jaldi payment kar dein. Dhanyavaad!`
    } else if (tone === "firm") {
      body = `Namaste ${parent} ji, ${studentName} ki ${monthText} ki fees (${amountText}) ${lateHi}. Kripya ise jald se jald clear karein.`
    } else {
      body = `Namaste ${parent} ji, yeh final reminder hai. ${studentName} ki ${monthText} ki fees (${amountText}) ${lateHi}. Kripya turant payment karein, warna classes mein rukavat aa sakti hai.`
    }
  }

  const lines = [body]
  if (lateFee && daysLate > lateFee.afterDays) {
    lines.push(`Late fee: ${formatINR(lateFee.amount)} will be added after ${lateFee.afterDays} days.`)
  }
  if (payUrl) {
    lines.push(`Pay here in one tap: ${payUrl}`)
  }
  return lines.join("\n\n")
}

// Pick the tone for a reminder from how many days late the fee is.
export function suggestTone(daysLate: number): Tone {
  if (daysLate >= 15) return "final"
  if (daysLate >= 7) return "firm"
  return "friendly"
}
