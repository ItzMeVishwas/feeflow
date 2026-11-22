# FeeFlow

Live demo: https://feeflow-omega-sand.vercel.app

Fee and cash-flow back office for Indian home tutors.

## The problem

Indian home tutors chase fees on WhatsApp and have no view of their cash. Rent and assistant salaries are due on fixed dates, parents pay whenever they remember, and nobody can say whether next month's cash will cover the bills.

## The solution

FeeFlow replaces the notebook and the WhatsApp chase with one screen. It lists who owes money and by how much, sends WhatsApp reminders with a UPI pay link, and forecasts the daily cash balance for the next 90 days using each parent's real payment history rather than the due date. Payments happen in the parent's own UPI app. FeeFlow never moves money.

## Features

| Group | Feature | What it does |
|---|---|---|
| Get paid | Chase queue | One action walks through overdue parents, with the tone picked by how late they are (1 to 6 days friendly, 7 to 14 firm, 15 or more final). |
| Get paid | WhatsApp reminders | Builds a reminder in English or Hinglish, in friendly, firm or final tone, and opens it in WhatsApp. |
| Get paid | UPI pay links | A public parent page with a UPI QR code and a Pay with UPI button. No login, and the invoice data travels inside the link. |
| Get paid | Receipts | After recording a payment, send a receipt over WhatsApp or open a printable receipt page. |
| Get paid | Broadcast | Message all parents from one dialog. |
| Know your cash | 90-day forecast | A daily cash balance for the next 90 days, drawn as a wave chart. |
| Know your cash | Realistic vs due-date forecast | Switch the forecast between due dates and realistic dates, based on each parent's lateness or a promised date. |
| Know your cash | Can I afford this? | Checks a one-off expense as Safe, Tight or Danger and names the date cash would run short. |
| Know your cash | Calendar | A month view of fees and their status, with a sheet for each day. |
| Know your cash | Monthly report | Pick a month to see expected vs received, collection rate, the top 3 late parents, and bills and profit. Printable. |
| Save time | Ctrl+K quick capture | Command palette (Ctrl+K or Cmd+K) with plain-language commands such as "tara paid 1200 for oct". |
| Save time | Promised dates | Record the date a parent promised to pay. The invoice shows a Promised chip and the forecast uses that date. |
| Save time | Attendance | Mark attendance per student and see it per batch. |
| Save time | Settings | Tutor profile, UPI id, fee and reminder defaults, theme, and data reset. |

## Business model

These are the planned plans, as shown in the pricing section of the landing page.

| Plan | Price | Includes |
|---|---|---|
| Free | ₹0 to start | Up to 15 students |
| Pro | ₹199 per month | Unlimited students, receipts for every payment, 90-day cash forecasts, priority support |

## Tech stack

- **Framework:** Next.js 16.4.6 (App Router), React 19.3.0, TypeScript 5
- **Styling and UI:** Tailwind CSS 4.3.3, shadcn, @base-ui/react, class-variance-authority, lucide-react, next-themes, tw-animate-css
- **State:** zustand 5 (persisted to browser localStorage, no backend)
- **Motion and 3D:** motion, framer-motion, three, @react-three/fiber, @react-three/drei
- **Charts and dates:** recharts, date-fns
- **Other:** sonner (toasts), cmdk (command palette), qrcode.react (UPI QR codes)

## Run locally

Requires Node 20 or newer.

```bash
git clone https://github.com/ItzMeVishwas/feeflow.git
cd feeflow
npm install
npm run dev        # open http://localhost:3000
```

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

On some networks, npm install or build fails with connection resets on Windows. As an option, set this in PowerShell first: `$env:NODE_OPTIONS="--dns-result-order=ipv4first"`

On first visit, choose **Explore with demo data** for sample students, or start with your own.

## Project structure

```
src/
  app/          Pages: landing, dashboard, students, invoices, forecast, calendar,
                report, insights, bills, attendance, settings, and the public pay and receipt pages
  components/   Shared UI: sidebar, dialogs, charts, calendar, landing sections
  lib/          Store, seed data, forecast, chase queue, reminders, pay links, command parser
docs/           Design system notes for the feeflow-design skill
HANDOFF.md      Setup and project handoff guide
PROMPTS.md      Prompts used to build the app, with matching commits
```

## Built with Codebenders and Nexen

- Built in the Codebenders IDE with the Nexen agent, as thin vertical slices: each feature was one small end-to-end change in its own chat.
- The `feeflow-design` skill (`.codebenders/skills/feeflow-design/SKILL.md`) holds the design system and was loaded for every UI prompt.
- `PROMPTS.md` lists the prompts used, with the matching commits.

## Judging criteria

| Criterion | How FeeFlow addresses it |
|---|---|
| Problem and impact | The chase queue and WhatsApp reminders turn late fees into one-tap follow-ups, aimed at the chasing that tutors do by hand. |
| Innovation | The realistic forecast uses each parent's actual lateness and promised dates, and UPI pay links work with no backend. |
| Technical execution | Next.js 16 with a typed zustand store, pure forecast and chase logic in src/lib, and a production build. |
| Design and UX | A glass design system with light and dark themes, a mobile bottom nav, and a Ctrl+K command palette. |
| Business viability | A free tier up to 15 students and a Pro plan at ₹199 per month, with no server costs because data stays in the browser. |
| Use of AI and tooling | The Nexen agent built the app in thin slices with a reusable design skill, and Ctrl+K commands use a rule-based parser. |
