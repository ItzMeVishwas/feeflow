<h1 align="center">FeeFlow</h1>

<p align="center">
  <b>Know who owes you. See next month's cash. Chase fees in one tap.</b><br/>
  The back office for India's home tutors: fees, WhatsApp reminders, UPI pay links and a 90-day cash forecast.
</p>

<p align="center">
  Built for the <b>Codebenders ACE Builders Hackathon 2026</b> · Problem Statement 1: <i>The One-Person Back Office</i><br/>
  Built entirely inside the Codebenders IDE with Nexen.
</p>

---

## The problem

A home tutor in Pune teaching 12 students runs her whole business from WhatsApp chats and a notebook.
Every month the same things go wrong:

- **Fees arrive late, bills don't.** Rent and her assistant's salary are due on fixed dates; parents pay whenever they remember.
- **Chasing is awkward.** She types the same reminder again and again and worries about sounding rude.
- **She can't see next month.** She has no idea whether she'll be short on the 5th, when rent is due.

Small businesses rarely fail for lack of customers. They fail because money arrives late and bills arrive on time.

## The solution

FeeFlow turns that notebook into a calm, visual back office that does the chasing for her and shows her cash before it happens.

### Core flow
| | |
|---|---|
| **Invoices in one click** | "Generate this month's invoices" creates one per active student. Partial payments are tracked, with an Undo option. |
| **Who owes me** | Overdue first, grouped by 0–15 / 16–30 / 30+ days late, with an aging bar on the dashboard. |
| **WhatsApp reminders** | Friendly, firm or final tone, in English or Hinglish. Each reminder includes a link to a **parent payment page**. |
| **Parent payment page** | A clean fee card with a **UPI QR code** and a "Pay with UPI" button. No login, no backend: the data travels inside the link. |
| **Chase autopilot** | One button walks through every late parent and picks the tone by how late they are (1–6 days friendly, 7–14 firm, 15+ final). |
| **WhatsApp receipts** | After recording a payment, send a one-tap thank-you receipt showing what is still due. |
| **Promised dates** | Mark the date a parent promised to pay. The invoice shows a "Promised" chip, and the forecast uses that date. |
| **Landing page** | A premium product site with an interactive demo: drag the slider to see how a late payer changes the cash balance. |


### See the future
| | |
|---|---|
| **90-day cash runway** | A glowing waveform of the daily balance. It predicts when each fee will arrive from that parent's real lateness history, not the due date. |
| **What-if scenarios** | "What if Aarav pays 45 days late and I buy a ₹40k laptop?" The wave redraws against a baseline and explains the impact in one sentence. |
| **FeeFlow Assistant** | A 3D morphing orb card with the single most useful insight, e.g. "Cash dips on 5 Feb. Collecting from Advait and Tara covers it." |
| **Parent reliability** | An On time, Usually late or Risky badge for every family. |
| **Can I afford this?** | Forecast checker for a one-off expense: Safe, Tight or Danger, with the date cash would run short. |
| **Forecast basis toggle** | Switch the 90-day forecast between Due dates and Realistic (each parent's real lateness, or a promised date). |


### Run the business
- **Attendance:** one-tap tiles per batch, monthly %, and a 6-week heat strip for each student.
- **Monthly parent statement:** a printable A4 statement (fees, payments, attendance, UPI QR) to download as PDF or share on WhatsApp.
- **Insights:** profit and expenses wave, margin, the **best day to send reminders** (from when parents actually pay), late-fee and sibling-discount rules.
- **Bills:** recurring and one-off costs, monthly fixed costs, and how many days your cash lasts.
- **Ctrl+K in plain language:** type *"tara paid 1200 for oct"*, *"remind advait"* or *"add rohan 2000 evening batch"* and press Enter.
- **On-time rate gauge, 6-month collections wave**, onboarding (demo data or start fresh), settings, **backup and restore** (JSON), CSV export.
- **Light and dark glass themes**, a slim icon-rail sidebar, a mobile bottom nav, and installable as a **PWA**.

## Business model

| Plan | Price | For |
|---|---|---|
| Free | ₹0 | Up to 15 students |
| Pro | ₹199 / month | Unlimited students, receipts, forecasts, priority support |

**Why tutors switch from a notebook:** one tap sends a polite reminder with a pay link, and FeeFlow shows whether rent is covered 90 days ahead.
**Expansion:** coaching centres, music and dance teachers, sports coaches and gyms. They all share the same monthly-fee pattern.

## Tech

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript**, **Tailwind v4**, **shadcn/ui**
- **Zustand** with persist: all data stays in the browser (localStorage), so there is no backend and no sign-up.
- **three.js + @react-three/fiber:** a WebGL particle-wave hero and the 3D assistant orb, both lazy-loaded and switched off when reduced motion is on.
- Custom **SVG WaveChart**: glow, shimmer, draw-in and a scrubber tooltip. No chart library look.
- framer-motion / motion, motion-primitives animated numbers, cmdk, sonner, qrcode.react, next-themes.

```
src/
  app/
    page.tsx                  landing page (3D hero, live demo, pricing, FAQ)
    pay/                      public parent payment page
    (app)/dashboard|students|attendance|invoices|bills|forecast|insights|settings
    (app)/students/[id]/statement   printable monthly statement
  components/                 runway-chart, charts/wave-chart, three/*, assistant-card,
                              chase-queue-dialog, command-palette, reminder-dialog ...
  lib/                        store, seed, forecast, advisor, chase, insights,
                              command-parser, pay-link, reminder-message, metrics
```

## Run locally

```bash
git clone https://github.com/ItzMeVishwas/feeflow.git
cd feeflow
npm install
npm run dev        # open http://localhost:3000
```

> On some Indian networks npm resets connections. If that happens, run
> `$env:NODE_OPTIONS="--dns-result-order=ipv4first"` (PowerShell) first.

On first visit, pick **Explore with demo data** for 12 sample students in Pune with realistic late payers, or **Start with my own students**.

## Built with Codebenders

Every feature was built in the **Codebenders IDE** with the **Nexen** agent, one small feature per chat.
- **`PROMPTS.md`:** the full prompt log with the matching commits.
- **`/feeflow-design`:** a custom Nexen workspace skill holding the design system (see `docs/feeflow-design-skill.md`), loaded at the start of every UI prompt.
- **UI pieces installed with the CLI** instead of prompts, to save tokens (shadcn, the motion-primitives registry).
- **`HANDOFF.md`:** how we moved the project between two team accounts mid-hackathon.

## Guardrails

Sample data only. FeeFlow never moves money: UPI links open the parent's own UPI app. No personal data leaves the device.
