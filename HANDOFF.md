# FeeFlow: handoff guide

FeeFlow is a fee and cash-flow back office for Indian home tutors, built for the Codebenders ACE Builders Hackathon 2026, Problem Statement 1, "The One-Person Back Office".

Repo: https://github.com/ItzMeVishwas/feeflow

## 1. Set up on a new machine or account (about 10 minutes)

1. Install Node 20 or newer and git.
2. Clone and open the project:
   ```powershell
   git clone https://github.com/ItzMeVishwas/feeflow.git
   cd feeflow
   ```
   In Codebenders, choose File, then Open Folder, pick `feeflow`, and click "Yes, I trust the authors".
3. Install packages and start the dev server. If npm fails with ECONNRESET, force IPv4 first by running the line below in every new terminal:
   ```powershell
   $env:NODE_OPTIONS="--dns-result-order=ipv4first"
   npm install
   npm run dev
   ```
   Then open http://localhost:3000/dashboard. Demo data loads automatically on the first visit.
4. Recreate the design skill in Nexen:
   - Open the Nexen panel and go to the **Skills** tab.
   - Click **New skill** and choose **This workspace**.
   - Name: `feeflow-design`
   - Description: `FeeFlow glass design system. Use for any UI, styling, layout or component work in this app.`
   - Instructions: paste the contents of `docs/feeflow-design-skill.md`, then save.
5. Set your git identity. Use the GitHub noreply email, because GitHub blocks pushes that expose a private address:
   ```powershell
   git config --global user.name "<name>"
   git config --global user.email "<id>+<user>@users.noreply.github.com"
   ```

## 2. How we work with Nexen (follow this, judges check it)

- **One feature per chat.** Click `+` for a new chat each time. Long chats burn tokens.
- **Start UI prompts with `/feeflow-design`** so Nexen loads the design system.
- **Name the exact files**, and end with "tsc once" or "tsc once, only touch X". Otherwise Nexen explores the whole repo and re-runs checks in loops.
- **Watch the Apply / Run buttons.** Nexen asks before every file write and command. If nobody clicks within about a minute, it treats the write as refused.
- If Nexen asks to "reproduce" a visual bug or install tools like `tsx`, cancel and say: "skip reproduction, I already checked it in the browser, just make the edits".
- **Install UI pieces with the CLI** instead of prompts (it costs zero tokens), e.g. `npx shadcn@latest add <component>`.
- **After each feature:**
  1. Test it in the browser.
  2. Run `git add . ; git commit -m "feat: ..." ; git push`.
  3. Add the prompt to `PROMPTS.md`.
- **Budget:** a typical feature costs about 300–600k tokens. Account 1's 8M ran out after about 20 features.

## 3. Stack and file map

- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4, shadcn/ui.
- Zustand with persist: all data lives in the browser's localStorage under the key `feeflow-store`. There's no backend, so it deploys to Vercel for free.
- framer-motion / motion, recharts, next-themes, qrcode.react, cmdk, sonner.
- `next.config.ts`: `cacheComponents` and `partialPrefetching` are **off**. Don't turn them back on; they break pages that read the current date.

| Path | What it is |
|---|---|
| `src/lib/store.ts` | Zustand store: students, invoices (with `payments[]`, `remindersSent`, `lastRemindedAt`), bills, settings, and actions including `recordPayment` / `undoPayment` |
| `src/lib/seed.ts` | Demo data (12 Pune students; dates relative to today; 3–4 parents always pay late) |
| `src/lib/invoice-status.ts` | Paid / due / overdue / part paid, `amountDue`, days late |
| `src/lib/forecast.ts` | `parentReliability`, `buildForecast(state, days, scenario)`, `summarizeForecast` |
| `src/lib/today.ts` | Ranked "Today" actions |
| `src/lib/chase.ts` | Chase queue with automatic tone (friendly 1–6 days late, firm 7–14, final 15+) |
| `src/lib/reminder-message.ts` | WhatsApp message builder (English / Hinglish, 3 tones) |
| `src/lib/pay-link.ts` | Encodes invoice data into a `/pay?d=` link (base64url JSON) |
| `src/lib/command-parser.ts` | Rule-based plain-language parser ("pooja paid 1800 for oct", "remind tara", "add rohan 2000 evening") |
| `src/lib/format.ts` | `formatINR` (whole rupees, Indian digit grouping) |
| `src/app/(app)/layout.tsx` | App shell: floating glass sidebar, top bar, mobile bottom nav, command palette |
| `src/app/(app)/dashboard` | Hero runway chart, Today rail, aging / collection / overdue cards, who owes me |
| `src/app/(app)/forecast` | 90-day forecast, what-if panel, parent reliability badges |
| `src/app/(app)/invoices` | Filters, generate this month's invoices, record payment, remind |
| `src/app/(app)/bills` | 60-day upcoming list, runway days, add / edit / delete |
| `src/app/(app)/students` | **Still the old style.** Restyle is next (see section 4) |
| `src/app/(app)/settings` | **Placeholder.** Needs building |
| `src/app/pay` | Public parent payment page: UPI QR code and Pay button |
| `src/components/runway-chart.tsx` | Recharts area chart; accepts `scenario` and baseline props |
| `src/components/today-rail.tsx`, `chase-queue-dialog.tsx`, `reminder-dialog.tsx`, `record-payment-dialog.tsx`, `command-palette.tsx` | Feature components |
| `src/components/app-background.tsx`, `theme-toggle.tsx`, `top-bar.tsx`, `app-sidebar.tsx` | Design shell |
| `src/app/globals.css` | Light and dark palettes, `.glass` / `.glass-strong`, `--amber` / `--mint` / `--coral` |

## 4. What's left, in priority order

Paste these into Nexen one at a time, each in a new chat:

1. **Students restyle:**
   > /feeflow-design restyle src/app/(app)/students/page.tsx to match the dashboard. header with title, "12 active" count, search and amber "Add student" button. glass rows (cards on mobile) with initials avatar, name, parent + phone, batch chip, fee, owed (coral if > 0) and a reliability badge from parentReliability (on time mint / usually late amber / risky coral, avg days late in a tooltip). row actions Remind (ReminderDialog for oldest unpaid invoice) and Record payment (RecordPaymentDialog). "Export CSV" button. empty search state. tsc once, only touch this page
2. **Invoices restyle:** same glass treatment on `src/app/(app)/invoices/page.tsx`, with mobile cards and a month filter.
3. **Settings page:**
   > /feeflow-design build src/app/(app)/settings/page.tsx: tutor name, UPI id, starting cash, default reminder language, theme; "Reset demo data" and "Start fresh (clear everything)" with confirm dialogs. tsc once
4. **Onboarding:** first visit asks "Explore with demo data" or "Start fresh", then 3 steps (name, UPI id, cash in hand).
5. **Cash-gap advisor:** when `summarizeForecast` shows a dip, list which overdue fees or which bill move would cover it.
6. **Landing page** at `src/app/page.tsx`: cinematic dark hero with an animated mesh gradient, "Stop chasing fees. Start forecasting." headline, 3 feature sections showing real UI, pricing (Free up to 15 students; Pro ₹199/month), and a "Try the demo" button linking to /dashboard.
7. **PWA:** `app/manifest.ts` and icons, so it's installable on phones.
8. **Deploy:** vercel.com/new, import `ItzMeVishwas/feeflow`, Deploy. No environment variables are needed.

## 5. Demo script (for the video)

1. **Dashboard:** greeting, cash runway hero, Today rail, Chase all overdue (auto tone).
2. **Ctrl+K:** type "tara paid 1200 for oct" and press Enter. A toast confirms it and the numbers update.
3. **Record a partial payment,** send the WhatsApp receipt, then use Undo.
4. **Remind a parent** and open the `/pay` link on a phone: UPI QR code and Pay button.
5. **Forecast:** Aarav pays 45 days late plus a ₹40k expense. The line drops below zero and the sentence explains it.
6. **Bills,** runway days, light/dark toggle, phone layout with bottom nav.

## 6. Business case (for judging)

- **User:** solo home tutors in India, who mostly collect fees over WhatsApp and UPI.
- **Pain:** late fees, awkward chasing, and no idea whether rent is covered next month.
- **Model:** free up to 15 students; Pro ₹199/month adds unlimited students, receipts and forecasts.
- **Expansion:** coaching centres, music and dance teachers, and gyms. Same monthly-fee pattern.
- **Why switch from a notebook:** one tap sends a polite reminder with a pay link, and the tutor can see cash 90 days ahead.

## 7. Session log

### Entry: 2026-11-22

What shipped:

1. **Landing page rebuild.** `src/app/page.tsx` now composes sections from `src/components/landing/`:
   - `landing-nav.tsx`: sticky glass nav with smooth-scroll links (Product, How it works, Pricing, FAQ) and an amber "Open the app" button.
   - `landing-hero.tsx`: keeps the FlowFieldLazy 3D hero, with an animated stats row labelled as demo figures.
   - `trust-strip.tsx`, `before-after.tsx`, `how-it-works.tsx`, `features.tsx` (bento grid), `pricing.tsx`, `faq.tsx`, `final-cta.tsx` (CTA band and footer).
   - `live-demo.tsx` with `demo-math.ts`: a 90-day balance demo with a slider (0 to 45 days late), a "Student leaves" toggle and a WaveChart. The sentence shows the lowest balance, plus a shortfall line when the balance goes negative.
   - Section 4, item 6 (landing page) is now done.
2. **"Can I afford this?" checker** on the forecast page. Logic in `src/lib/afford.ts` (`AFFORD_BUFFER = 5000`; verdicts Safe, Tight and Danger; the reason names the shortfall date). UI in `src/components/afford-box.tsx`. It runs `buildForecast` with a one-off extra expense dated today.
3. **Promised dates on invoices.** `src/lib/store.ts` adds `promisedDate` on Invoice and a `setPromisedDate` action. The invoices page has "Promise a date", "Change promise" and "Clear promise" actions, and a mint "Promised <date>" chip. A promised date must be today or later.
4. **Forecast basis toggle** (Due dates / Realistic). `src/lib/forecast.ts`: `buildForecast` takes a fifth parameter, `mode`, defaulting to "realistic". Due dates uses each invoice's due date. Realistic uses the parent's average lateness, overridden by a promised date.

Checks run:

- `npx tsc --noEmit` exits 0.
- `npm run build` passes with 16 static pages (run with `NODE_OPTIONS="--dns-result-order=ipv4first"` on Windows).

Open items and not verified:

- Not checked in a browser: visual and layout checks, the 375px mobile layout, and how the landing demo's colours and text render.
- Not checked: the Danger and Tight example numbers in the "Can I afford this?" checker.
- Not checked: lint. The linter could not check these files.
- Known caveat: a promised date already in the past is clamped to today by the existing forecast rule.
- Known caveat: the Due dates basis does not apply the scenario student-delay in the same way as the lateness-based dates. Unverified.
- Known gap: the landing FAQ says offline use and data export are "Not yet". Those are honest answers, not features.

