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
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Your month, before and after FeeFlow
      </h2>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <article className="glass rounded-2xl border border-[#FF6B6B]/30 p-6">
          <h3 className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#FF6B6B]" />
            Your month today
          </h3>
          <ul className="mt-5 flex flex-col gap-3 text-[#9AA8BC]">
            {before.map((line) => (
              <li key={line} className="leading-relaxed">
                {line}
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-strong relative overflow-hidden rounded-2xl border border-[#3DD9A8]/40 p-6 shadow-[inset_0_1px_0_0_rgba(61,217,168,0.6)]">
          <h3 className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#3DD9A8]" />
            Your month with FeeFlow
          </h3>
          <ul className="mt-5 flex flex-col gap-3">
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
