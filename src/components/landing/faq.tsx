import { Plus } from "lucide-react";

const questions = [
  {
    question: "Is my data safe?",
    answer:
      "Your student and payment records are saved in your browser on your device. Nothing is uploaded to a server by this app.",
  },
  {
    question: "Do parents need the app?",
    answer:
      "No. Parents get a pay link on WhatsApp and pay with any UPI app. They do not install or sign up for anything.",
  },
  {
    question: "Which UPI apps work?",
    answer:
      "Parents can use any UPI app on their phone to pay. FeeFlow does not hold the money; it sends the payment request.",
  },
  {
    question: "Does it work offline?",
    answer:
      "Not yet. You need a connection to open the app and the pay links. Offline use is not built or tested.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Not yet. There is no CSV or PDF export in the app today. Statements are viewable on screen.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-24 mx-auto max-w-3xl px-5 py-20 sm:px-8">
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#0A1F3D] sm:text-4xl">Questions tutors ask</h2>

      <div className="mt-10 space-y-3">
        {questions.map(({ question, answer }) => (
          <details
            key={question}
            className="group rounded-2xl border border-[#E6EBF2] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(10,31,61,0.04)] open:shadow-[0_12px_32px_-20px_rgba(10,31,61,0.25)]"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg font-semibold text-[#0A1F3D] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0E9F8E]">
              {question}
              <Plus
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-[#0B2A55] transition-transform group-open:rotate-45"
              />
            </summary>
            <div className="mt-4 space-y-3">
              <p className="leading-relaxed text-[#5E6E87]">{answer}</p>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
