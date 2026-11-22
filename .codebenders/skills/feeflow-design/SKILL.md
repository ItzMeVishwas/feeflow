---
name: feeflow-design
description: FeeFlow glass design system. Use for any UI, styling, layout or component work in this app.
---

FeeFlow is a fee + cash-flow back office for Indian home tutors. Follow this design system for all UI work.

THEMES: Light is the default. Light: page #EEF2F7, cards #FFFFFF, ink #0F1E3C, muted #5B6B84. Dark is an option with navy tones: page #0B1426, surface #121E36, ink #E6ECF5, muted #93A3BC. No plum or lamp-amber glows. Calm and flat, not decorative.

COLOURS: primary navy #1E3A6E for links, focus and selected states. CTA mint #7DD9CC with navy text for main calls to action. Amber #F2A93B only for warnings and due-soon. Coral #E5484D for overdue and danger. Mint is also paid or positive. Expose as CSS variables.

GLASS: Light mode has no blur. Cards are solid white with a 1px #E3E8F0 border and shadow 0 1px 2px rgba(15,30,60,.06), 0 8px 24px rgba(15,30,60,.06). Radius 24px on cards. Dark may keep a subtle blur.

TYPE: Plus Jakarta Sans for everything: 700 and 800 for headings with tight tracking, 400 to 600 for body. Money uses tabular-nums and formatINR. Sentence case; no ALL-CAPS, no monospace, no middle dots, no arrows in buttons.

LAYOUT
- Floating glass sidebar on desktop, sheet on mobile. Top bar: greeting by time of day (Good morning/afternoon/evening, {tutorName}), date, Ctrl+K search button, theme toggle.
- Size cards by importance: one hero per page, supporting cards smaller. Avoid grids of identical cards.

MOTION: One page-level fade and rise (8px, 200ms, ease out) via the app template. The sidebar active item uses a sliding pill (layoutId). Buttons press to 0.98 scale. Everything respects prefers-reduced-motion. No scroll-triggered fades, no decorative motion.

COPY
- Plain, active, specific to tutors and parents. Buttons say exactly what happens: "Send on WhatsApp", "Mark as paid". Empty states tell the user what to do next.

QUALITY
- Responsive to 375px, visible keyboard focus, WCAG AA contrast in both themes.
