---
name: feeflow-design
description: FeeFlow glass design system. Use for any UI, styling, layout or component work in this app.
---

FeeFlow is a fee + cash-flow back office for Indian home tutors. Follow this design system for all UI work.

THEMES: Light is the default. Light: page #F6F8FB, cards #FFFFFF, ink #0A1F3D, muted #5E6E87. Dark is an option with navy tones: page #0B1426, surface #121E36, ink #E6ECF5, muted #93A3BC. Calm and flat, no glows, no plum or amber haze.

COLOURS: ink #0A1F3D; muted #5E6E87; primary navy #0B2A55 (hover #133A72, text #FFFFFF) for primary buttons, links, focus and selected states. Accent teal #0E9F8E with white text is the CTA accent for main calls to action. Success #12A150. Warning #D98E04, for warnings only. Danger #D93F3F. Pills are a 10% tint background with solid text of the same hue. Charts use a navy line with a teal accent. Expose as CSS variables.

GLASS: Light mode has no blur. Cards are solid white with a 1px #E6EBF2 border and a very soft shadow, shadow-[0_1px_2px_rgba(10,31,61,.04),0_4px_16px_rgba(10,31,61,.04)]. Radius 24px on cards. Dark may keep a subtle blur.

TYPE: Plus Jakarta Sans for everything: 700 and 800 for headings with tight tracking, 400 to 600 for body. Money uses tabular-nums and formatINR. Sentence case; no ALL-CAPS, no monospace, no middle dots, no arrows in buttons.

LAYOUT
- Floating glass sidebar on desktop, sheet on mobile. Top bar: greeting by time of day (Good morning/afternoon/evening, {tutorName}), date, Ctrl+K search button, theme toggle.
- Size cards by importance: one hero per page, supporting cards smaller. Avoid grids of identical cards.

MOTION: One page-level fade and rise (8px, 200ms, ease out) via the app template. The sidebar active item uses a sliding pill (layoutId). Buttons press to 0.98 scale. Everything respects prefers-reduced-motion. No scroll-triggered fades, no decorative motion.
List rows stagger once on load. Clickable cards lift 2px on hover (class card-lift, clickable cards only). Numbers count up once. Skeleton shimmer (class skeleton) while the store hydrates. All off under prefers-reduced-motion.

COPY
- Plain, active, specific to tutors and parents. Buttons say exactly what happens: "Send on WhatsApp", "Mark as paid". Empty states tell the user what to do next.

QUALITY
- Responsive to 375px, visible keyboard focus, WCAG AA contrast in both themes.
