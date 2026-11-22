const steps = [
  {
    title: "Add students",
    body: "Add each student, their parent's name and the monthly fee. Takes about a minute per family.",
  },
  {
    title: "Send the month's fees",
    body: "Send one message per parent on WhatsApp with their pay link. Late ones get a reminder automatically.",
  },
  {
    title: "Watch cash flow",
    body: "See what has come in, what is still due, and where your balance dips over the next 90 days.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-24 mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>

      <div className="relative mt-12">
        {/* Connecting line: vertical on mobile, horizontal on desktop. Decorative only. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-6 top-0 w-px -translate-x-1/2 bg-gradient-to-b from-[#F2A93B]/60 via-[#F2A93B]/30 to-transparent md:bottom-auto md:left-[16.66%] md:right-[16.66%] md:top-6 md:h-px md:w-auto md:translate-x-0 md:bg-gradient-to-r md:from-[#F2A93B]/60 md:via-[#F2A93B]/30 md:to-[#F2A93B]/60"
        />

        <ol className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-5 md:flex-col md:items-center md:text-center">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0E1726] font-heading text-lg font-semibold text-[#F2A93B] ring-2 ring-[#F2A93B]">
                {index + 1}
              </span>
              <div className="md:mt-6">
                <h3 className="font-heading text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-[#9AA8BC]">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
