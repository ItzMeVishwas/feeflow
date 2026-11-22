import { BellRing, CalendarCheck, FileText, QrCode, Search, TrendingUp, type LucideIcon } from "lucide-react";

type Tile = {
  icon: LucideIcon;
  title: string;
  body: string;
  span: string;
};

const tiles: Tile[] = [
  {
    icon: TrendingUp,
    title: "See next month's cash before it arrives.",
    body: "A 90-day forecast shows the days your balance dips, so you can plan the month before it starts.",
    span: "p-8 md:col-span-4 md:row-span-2",
  },
  {
    icon: BellRing,
    title: "Reminders that send themselves.",
    body: "Overdue fees get a polite WhatsApp reminder. You approve each one in a tap.",
    span: "p-6 md:col-span-2",
  },
  {
    icon: QrCode,
    title: "A pay link for every parent.",
    body: "Parents see the amount due and pay by any UPI app. No account needed.",
    span: "p-6 md:col-span-2",
  },
  {
    icon: CalendarCheck,
    title: "Attendance next to the fees.",
    body: "Mark who attended each class so the month's invoice matches the lessons taught.",
    span: "p-6 md:col-span-2",
  },
  {
    icon: FileText,
    title: "Monthly statements for each family.",
    body: "See what each parent paid, what is still due and the late fees applied.",
    span: "p-6 md:col-span-2",
  },
  {
    icon: Search,
    title: "Find anything with Ctrl+K.",
    body: "Press Ctrl+K (Cmd+K on Mac) to jump to a student, open the forecast or type a command.",
    span: "p-6 md:col-span-2",
  },
];

export function Features() {
  return (
    <section id="product" className="scroll-mt-24 mx-auto max-w-6xl px-5 py-20 sm:px-8">
      <h2 className="max-w-2xl font-heading text-3xl font-semibold tracking-tight text-[#0A1F3D] sm:text-4xl">
        Everything a home tutor needs to get paid on time
      </h2>

      <div className="mt-12 grid gap-4 md:grid-cols-6">
        {tiles.map(({ icon: Icon, title, body, span }) => (
          <article
            key={title}
            className={`rounded-3xl border border-[#E6EBF2] bg-white shadow-[0_1px_2px_rgba(10,31,61,0.04),0_16px_40px_-24px_rgba(10,31,61,0.2)] ${span}`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0B2A55]/10 text-[#0B2A55]">
              <Icon aria-hidden="true" className="h-5 w-5" />
            </div>
            <h3 className="mt-5 font-heading text-xl font-semibold text-[#0A1F3D]">{title}</h3>
            <p className="mt-2 leading-relaxed text-[#5E6E87]">{body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
