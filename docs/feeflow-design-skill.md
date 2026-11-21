FeeFlow is a fee + cash-flow back office for Indian home tutors. Follow this design system for all UI work.

THEMES (next-themes, class strategy, toggle in top bar)
- Dark "evening study": page bg ink #0E1726 with blurred radial glows of plum #2A1F3D and lamp amber #F2A93B (low opacity) fixed behind content.
- Light "morning mist": page bg #EEF3F6 with soft blurred mint and sky glows.
- Text: dark mode #E8EDF5 / muted #9AA8BC. Light mode #142033 / muted #5B6B82.

COLOURS
- Primary action: amber #F2A93B (text on it #1A1206).
- Paid / positive: mint #3DD9A8. Overdue / danger: coral #FF6B6B. Due soon: amber.
- Expose all as CSS variables in globals.css and map to shadcn tokens.

GLASS
- .glass utility: translucent bg (dark: rgba(255,255,255,0.06), light: rgba(255,255,255,0.55)), backdrop-blur-xl, 1px border (dark: white/10, light: white/70), subtle inner highlight on top edge.
- Radius by hierarchy: hero panels rounded-3xl, normal cards rounded-2xl, chips and inputs rounded-xl. Do not give everything the same radius or the same shadow.
- Never nest a glass card inside another glass card.

TYPE
- Bricolage Grotesque (next/font/google) for headings and big rupee figures. Figtree for body and UI.
- Money always uses tabular-nums and Indian grouping via formatINR in src/lib/format.ts, whole rupees (no .00).
- Sentence case everywhere. No ALL-CAPS labels, no monospace labels, no middle-dot meta strings, no arrow characters in buttons.

LAYOUT
- Floating glass sidebar on desktop, glass bottom nav on mobile. Top bar: greeting by time of day (Good morning/afternoon/evening, {tutorName}), date, Ctrl+K search button, theme toggle.
- Size cards by importance: one hero per page, supporting cards smaller. Avoid grids of identical cards.

MOTION (framer-motion)
- One orchestrated moment per page at most (e.g. hero chart line drawing in). Otherwise motion only on user action: dialog open, row expand, button press, hover lift of y:-2 on clickable cards.
- No fade-up on every section. Respect prefers-reduced-motion.

COPY
- Plain, active, specific to tutors and parents. Buttons say exactly what happens: "Send on WhatsApp", "Record payment". Empty states tell the user what to do next.

QUALITY
- Responsive to 375px, visible keyboard focus, WCAG AA contrast in both themes.
