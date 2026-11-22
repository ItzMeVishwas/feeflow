import { BellRing, CalendarCheck, FileText, QrCode, Search, TrendingUp, type LucideIcon } from "lucide-react";

type Tile = {
  icon: LucideIcon;
  title: string;
  body: string;
  span: string;
  shadow: string;
  tint: string;
};

const tiles: Tile[] = [
  {
    icon: TrendingUp,
    title: "See next month's cash before it arrives.",
    body: "A 90-day forecast shows the days your balance dips, so you can plan the month before it starts.",
    span: "rounded-3xl p-8 md:col-span-4 md:row-span-2",
    shadow: "shadow-[0_28px_70px_-24px_rgba(242,169,59,0.35)]",
    tint: "bg-[#F2A93B]/15 text-[#F2A93B]",
  },
  {
    icon: BellRing,
    title: "Reminders that send themselves.",
    body: "Overdue fees get a polite WhatsApp reminder. You approve each one in a tap.",
    span: "rounded-2xl p-6 md:col-span-2",
    shadow: "shadow-[0_12px_32px_-12px_rgba(255,107,107,0.22)]",
    tint: "bg-[#FF6B6B]/15 text-[#FF6B6B]",
  },
  {
    icon: QrCode,
    title: "A pay link for every parent.",
    body: "Parents see the amount due and pay by any UPI app. No account needed.",
    span: "rounded-2xl p-6 md:col-span-2",
    shadow: "shadow-[0_12px_32px_-12px_rgba(61,217,168,0.2)]",
    tint: "bg-[#3DD9A8]/15 text-[#3DD9A8]",
  },
  {
    icon: CalendarCheck,
    title: "Attendance next to the fees.",
    body: "Mark who attended each class so the month's invoice matches the lessons taught.",
    span: "rounded-2xl p-6 md:col-span-2",
    shadow: "shadow-[0_12px_32px_-12px_rgba(120,140,255,0.2)]",
    tint: "bg-[#8C9BFF]/15 text-[#8C9BFF]",
  },
  {
    icon: FileText,
    title: "Monthly statements for each family.",
    body: "See what each parent paid, what is still due and the late fees applied.",
    span: "rounded-2xl p-6 md:col-span-2",
    shadow: "shadow-[0_16px_40px_-18px_rgba(0,0,0,0.6)]",
    tint: "bg-white/10 text-[#E8EEF7]",
  },
  {
    icon: Search,
    title: "Find anything with Ctrl+K.",
    body: "Press Ctrl+K (Cmd+K on Mac) to jump to a student, open the forecast or type a command.",
    span: "rounded-2xl p-6 md:col-span-2",
    shadow: "shadow-[0_16px_40px_-18px_rgba(242,169,59,0.18)]",
    tint: "bg-[#F2A93B]/10 text-[#F2A93B]",
  },
];

export function Features() {
  return (
    <section id="product" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
        Everything a home tutor needs to get paid on time
      </h2>

      <div className="mt-12 grid gap-4 md:grid-cols-6">
        {tiles.map(({ icon: Icon, title, body, span, shadow, tint }) => (
          <article key={title} className={`glass ${span} ${shadow}`}>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
              <Icon aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-heading text-xl font-semibold">{title}</h3>
            <p className="mt-2 leading-relaxed text-[#9AA8BC]">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
