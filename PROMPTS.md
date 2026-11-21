# Build log: Codebenders / Nexen prompts

Every feature was built in the Codebenders IDE with Nexen (Claude Haiku 5.5), one feature per chat. Each step below has its git commit.

**Tools that cost zero tokens** (run in the IDE terminal):
- `create-next-app`
- `shadcn add` (button, card, input, label, table, dialog, select, badge, tabs, sheet, sonner, dropdown-menu, textarea, command, slider, tooltip, progress, popover, switch, separator, scroll-area)
- motion-primitives `animated-number` (from its shadcn registry)
- `npm i` for zustand, recharts, date-fns, framer-motion, motion, next-themes and qrcode.react

**Custom Nexen skill:** `/feeflow-design` holds the design system (see `docs/feeflow-design-skill.md`). It's loaded at the start of every UI prompt.

---

### Slice 0: scaffold (terminal only)
`create-next-app` with TypeScript, Tailwind, App Router and `src/`, plus `shadcn init` and component installs. Commit: `slice 0: scaffold next.js + tailwind + shadcn`

### Slice 1: data store
> can you set up a zustand store in src/lib/store.ts that saves to localStorage. i need students (name, parent name, parent phone, monthly fee, batch, active), invoices (studentId, amount, month, due date, status, paid date, reminders sent) and bills (name, amount, due date, recurring monthly or not), plus settings with tutor name, upi id and starting cash balance

> now add src/lib/seed.ts with around 12 fake students in pune, 4 months of invoices where 3 or 4 parents always pay 15-25 days late, and bills for rent, internet and an assistant's salary. also set a tutor name, a fake upi id and starting cash of like 40k. load it on first visit if the store is empty

### Slice 2: app shell
> create a route group at src/app/(app) with a layout.tsx that has a sidebar (src/components/app-sidebar.tsx) linking to /dashboard, /students, /invoices, /bills, /forecast and /settings, plus a simple page.tsx for each of those with just a heading for now. on mobile the sidebar should collapse into the shadcn sheet. light theme, emerald accent, lucide icons, app name is FeeFlow. leave src/app/page.tsx alone

*Lesson learned:* the first, vaguer attempt was blocked by Nexen's write gate, so we retried with exact file paths.

### Slice 3: students
> build the students page in src/app/(app)/students/page.tsx using the store in src/lib/store.ts. a table with name, parent, phone, batch, monthly fee and current amount owed (sum of their unpaid invoices), a search box, and an add student dialog. format money as indian rupees

### Slice 4: invoices
> build src/app/(app)/invoices/page.tsx using src/lib/store.ts and src/lib/format.ts. show all invoices with student name, month, amount, due date and a paid / due / overdue badge (overdue = unpaid and past due date), with filter tabs for each. add a "generate this month's invoices" button that makes one per active student and skips ones that already exist, and a mark as paid action. no need to explore the rest of the repo, and just run tsc once at the end, skip the build

*Token lesson:* adding "only tsc once, don't explore" cut this slice from about 215k to about 48k input tokens.

### Fixes
> couple of fixes: 1) turn off cacheComponents in next.config.ts ... 2) the body font is falling back to serif ... 3) in src/lib/seed.ts make the months relative to today ...

> dev server won't start now: "partialPrefetching requires cacheComponents to be enabled". remove partialPrefetching from next.config.ts too

### Slice 5: dashboard
> dashboard time, src/app/(app)/dashboard/page.tsx. three stat cards up top: total outstanding, overdue amount, collected this month. below that a "who owes me" table of unpaid invoices sorted by days overdue, grouped into 0-15, 16-30 and 30+ days ... move the invoice status logic into src/lib so both pages share it

### Slice 6: WhatsApp reminders
> add whatsapp reminders. make src/components/reminder-dialog.tsx that opens from a "Remind" button on overdue rows ... friendly / firm / final tone toggle and an english / hinglish toggle ... opens https://wa.me/<phone>?text=<message> ... show overdue invoices first and move not-yet-due ones into a separate "upcoming" section

### Redesign: research and design system
- References analysed: glassmorphism dashboard reels, textura.us trend post (avoid template tells), motion-primitives.
- Created the Nexen workspace skill `/feeflow-design`.

### Forecast engine
> /caveman create src/lib/forecast.ts, pure functions only, no UI. 1) parentReliability(studentId, invoices) ... 2) buildForecast(state, days=90, scenario?) ... 3) scenario options ... 4) summary ...

### Glass foundation
> /feeflow-design set up the foundation only ... next/font Bricolage Grotesque + Figtree, next-themes ThemeProvider ... light and dark palettes ... .glass utility ... app-background.tsx ... theme-toggle.tsx

### Glass app shell
> /feeflow-design rebuild the app shell ... floating glass sidebar ... "Good evening, {tutorName}" ... Ctrl K ... mobile glass bottom nav

### Cash runway hero chart
> /feeflow-design create src/components/runway-chart.tsx, the hero of the dashboard ... recharts area chart ... lowest balance dot ... one plain sentence ... accept an optional scenario prop

Follow-ups fixed a recharts v3 tooltip type error and a React 19 `JSX` namespace error in animated-number.

### Today rail
> /feeflow-design create src/components/today-rail.tsx ... max 5 actions ranked by urgency ... Remind button ... calm empty state

### Dashboard layout and polish
> /feeflow-design rework src/app/(app)/dashboard/page.tsx layout ... RunwayChart hero spanning 2 of 3 columns, TodayRail in the third ... three NOT identical cards ... AnimatedNumber ... mobile cards

> a few polish fixes: 1) glass card nested inside another glass card ... 2) draw-in about 1.2s ... 3) compact ticks ₹60k ... 4) whole rupees

### Forecast page and what-if
> /feeflow-design build src/app/(app)/forecast/page.tsx ... "What if..." panel: student + slider 0-60 days late, "student leaves", extra one-time expense ... baseline faint line vs amber scenario line ... comparison sentence ... Parent reliability list with badges

### Bills
> /feeflow-design build src/app/(app)/bills/page.tsx ... monthly fixed costs + runway days ... "Upcoming 60 days" grouped by week ... add / edit / delete ... empty state

### Partial payments and receipts
> /feeflow-design add partial payments + receipts ... recordPayment / undoPayment ... "Part paid" badge ... record-payment-dialog.tsx ... sonner toast with Undo ... "Send receipt on WhatsApp"

### Parent payment page
> /feeflow-design build a public parent payment page ... src/lib/pay-link.ts base64url ... src/app/pay/page.tsx receipt card, QR code (qrcode.react), "Pay ₹X with UPI" button, copy UPI id ... reminder-dialog uses the pay link

> small fixes: reminders use amountDue, formatINR drops .00, toast lasts 8 seconds

### Chase autopilot
> /feeflow-design new feature, chase autopilot. src/lib/chase.ts buildChaseQueue ... friendly 1-6 / firm 7-14 / final 15+ ... chase-queue-dialog.tsx stepping "2 of 5" ... Send on WhatsApp / Skip / Record payment instead ... "Chase all overdue (n)" button in TodayRail

### Ctrl+K plain-language command palette
> /feeflow-design new feature: a Ctrl+K command palette that understands plain language. src/lib/command-parser.ts rule-based parseCommand ... "pooja paid 1800", "remind tara", "add rohan 2000 evening batch" ... command-palette.tsx with shadcn Command ... parsed intent as top item with preview, Enter executes

---
Account 1 (8M tokens) ran out after this point. Work continues on account 2. See HANDOFF.md section 4.
