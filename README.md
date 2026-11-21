# FeeFlow

FeeFlow is a fee and cash-flow back office for Indian home tutors. It tracks students, invoices, payments and bills, sends WhatsApp payment reminders with UPI pay links, and forecasts cash 90 days ahead. Built for the Codebenders ACE Builders Hackathon 2026 (Problem Statement 1, "The One-Person Back Office"). All data is stored in the browser (localStorage); there is no backend.

## Live features

- Dashboard with cash runway chart, Today rail of ranked actions, overdue and collection cards
- Ctrl+K command palette with plain-language commands (e.g. "tara paid 1200 for oct")
- Invoices: filters, generate this month's invoices, record and undo payments, WhatsApp reminders in English/Hinglish with auto tone (friendly, firm, final) via chase queue
- Forecast: 90-day cash forecast with what-if scenarios and parent reliability badges
- Bills: 60-day upcoming list with runway days, add/edit/delete
- Public /pay page with UPI QR code and Pay button
- Light/dark theme
- Installable as a PWA (manifest + icons)

Still in progress: Students page restyle and Settings page (placeholder).

## Run locally

Prerequisites: Node 20+ and git.

```powershell
git clone https://github.com/ItzMeVishwas/feeflow.git
cd feeflow
npm install
npm run dev
```

Then open http://localhost:3000/dashboard. Demo data loads on first visit.

Tip: if `npm install` fails with ECONNRESET, force IPv4 first in the same terminal:

```powershell
$env:NODE_OPTIONS="--dns-result-order=ipv4first"
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Documentation

- [HANDOFF.md](HANDOFF.md) — setup, stack and file map, and what's left
- [PROMPTS.md](PROMPTS.md) — the prompts used to build each feature
