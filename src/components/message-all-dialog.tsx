"use client"

import { useEffect, useMemo, useState } from "react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toWhatsAppDigits } from "@/lib/reminder-message"
import { useStore, type Student } from "@/lib/store"

type TemplateKey = "holiday" | "test" | "fee" | "custom"

const TEMPLATES: { key: TemplateKey; label: string; body: string }[] = [
  {
    key: "holiday",
    label: "Holiday",
    body: "Hi {parentName}, classes for {studentName} pause next week for the holiday. We restart on the usual day after that. Thank you, {tutorName}.",
  },
  {
    key: "test",
    label: "Test date",
    body: "Hi {parentName}, {studentName} has a test on [date]. Please make sure they revise the chapters we covered in class. Thank you, {tutorName}.",
  },
  {
    key: "fee",
    label: "Fee hike",
    body: "Hi {parentName}, from next month the monthly fee for {studentName} changes to [new fee]. I will share the details of the new schedule soon. Thank you, {tutorName}.",
  },
  { key: "custom", label: "Custom", body: "" },
]

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F2A93B]"

type MessageAllDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  students: Student[]
}

// "Rohan Mehta" -> "Rohan". Returns "" for an empty name.
function firstWord(name: string) {
  return name.trim().split(/\s+/)[0] ?? ""
}

function personalise(body: string, parentName: string, studentName: string, tutorName: string) {
  return body
    .replace(/\{parentName\}/g, firstWord(parentName))
    .replace(/\{studentName\}/g, firstWord(studentName))
    .replace(/\{tutorName\}/g, tutorName)
}

export function MessageAllDialog({ open, onOpenChange, students }: MessageAllDialogProps) {
  const tutorName = useStore((s) => s.settings.tutorName)

  const [body, setBody] = useState("")
  const [templateKey, setTemplateKey] = useState<TemplateKey | null>(null)
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle")

  const recipients = useMemo(
    () =>
      students
        .filter((student) => student.active)
        .map((student) => ({
          student,
          digits: toWhatsAppDigits(student.parentPhone),
          message: personalise(body, student.parentName, student.name, tutorName),
        })),
    [students, body, tutorName],
  )

  // The "Copied" status clears itself after 2 seconds.
  useEffect(() => {
    if (copyState !== "copied") return
    const timer = window.setTimeout(() => setCopyState("idle"), 2000)
    return () => window.clearTimeout(timer)
  }, [copyState])

  function chooseTemplate(template: (typeof TEMPLATES)[number]) {
    setTemplateKey(template.key)
    setBody(template.body)
  }

  async function handleCopyAll() {
    const text = recipients
      .map(
        ({ student, message }) =>
          `To ${student.parentName} (${student.name}):\n${message}`,
      )
      .join("\n\n")
    try {
      await navigator.clipboard.writeText(text)
      setCopyState("copied")
    } catch {
      setCopyState("failed")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Message all parents</DialogTitle>
          <DialogDescription>
            Pick a template, edit the text, then send it to each parent.
          </DialogDescription>
        </DialogHeader>

        <div role="group" aria-label="Message template" className="flex flex-wrap gap-2">
          {TEMPLATES.map((template) => (
            <Button
              key={template.key}
              type="button"
              size="sm"
              variant={templateKey === template.key ? "default" : "outline"}
              aria-pressed={templateKey === template.key}
              className={focusRing}
              onClick={() => chooseTemplate(template)}
            >
              {template.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="message-all-text" className="text-xs font-medium text-muted-foreground">
            Message
          </label>
          <textarea
            id="message-all-text"
            aria-label="Message text"
            aria-describedby="message-all-placeholders"
            rows={6}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className={`w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${focusRing}`}
          />
          <p id="message-all-placeholders" className="text-xs text-muted-foreground">
            Use {"{parentName}"}, {"{studentName}"} and {"{tutorName}"}. They are filled in for each parent.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className={focusRing}
              onClick={handleCopyAll}
              disabled={recipients.length === 0}
            >
              Copy all
            </Button>
            <p aria-live="polite" className="text-sm text-muted-foreground">
              {copyState === "copied"
                ? "Copied"
                : copyState === "failed"
                  ? "Could not copy. Select the text and copy it by hand."
                  : ""}
            </p>
          </div>

          {recipients.length === 0 ? (
            <p className="rounded-xl border border-input p-4 text-sm text-muted-foreground">
              Add a student first, then come back to message their parents.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {recipients.map(({ student, digits, message }) => (
                <li
                  key={student.id}
                  className="flex flex-col gap-3 rounded-xl border border-input p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{student.parentName}</p>
                    <p className="truncate text-sm text-muted-foreground">{student.name}</p>
                    <p className="text-sm tabular-nums text-muted-foreground">{student.parentPhone}</p>
                  </div>

                  {digits.length > 0 ? (
                    <a
                      href={`https://wa.me/${digits}?text=${encodeURIComponent(message)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${buttonVariants({ size: "sm" })} ${focusRing} shrink-0`}
                    >
                      Send on WhatsApp
                    </a>
                  ) : (
                    <div className="flex shrink-0 flex-col gap-1 sm:max-w-56 sm:items-end">
                      <Button type="button" size="sm" disabled className={focusRing}>
                        Send on WhatsApp
                      </Button>
                      <p className="text-xs text-muted-foreground sm:text-right">
                        Add the parent&apos;s phone number on the student record to send this.
                      </p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
