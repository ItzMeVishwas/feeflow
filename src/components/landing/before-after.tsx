const before = [
  "Five parents are late and you are not sure who paid.",
  "You guess next month's cash from memory.",
  "Chasing fees means awkward texts you keep putting off.",
];

const after = [
  "One tap sends every reminder on WhatsApp.",
  "A 90-day cash forecast shows the dips before they happen.",
  "Each parent gets a pay link, so paying takes a few seconds.",
];

export function BeforeAfter() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#0A1F3D] text-balance sm:text-4xl">
        Your month, before and after FeeFlow
      </h2>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-[#E6EBF2] bg-white p-6 shadow-[0_1px_2px_rgba(10,31,61,0.04),0_16px_40px_-20px_rgba(10,31,61,0.18)]">
          <h3 className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight text-[#0A1F3D]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#D93F3F]" />
            Your month today
          </h3>
          <ul className="mt-5 flex flex-col gap-3 text-[#5E6E87]">
            {before.map((line) => (
              <li key={line} className="leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </article>

        <article className="relative overflow-hidden rounded-3xl border border-[#0B2A55] bg-white p-6 shadow-[0_1px_2px_rgba(10,31,61,0.04),0_16px_40px_-20px_rgba(11,42,85,0.35)]">
          <h3 className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight text-[#0A1F3D]">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#0E9F8E]" />
            Your month with FeeFlow
          </h3>
          <ul className="mt-5 flex flex-col gap-3 text-[#0A1F3D]">
            {after.map((line) => (
              <li key={line} className="leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
