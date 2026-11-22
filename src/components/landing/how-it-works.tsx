'use client';

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";

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
  const reduce = useReducedMotion();
  const stepsRef = useRef<HTMLDivElement>(null);

  // 0 when the steps start to enter the viewport, 1 when they reach its middle-bottom.
  const { scrollYProgress } = useScroll({
    target: stepsRef,
    offset: ["start center", "end center"],
  });

  return (
    <section id="how-it-works" className="scroll-mt-24 mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <h2 className="font-heading text-3xl font-semibold tracking-tight text-[#0A1F3D] sm:text-4xl">How it works</h2>

      <div ref={stepsRef} className="mt-12 flex gap-8">
        {/* Sticky progress rail on the left. Fills as you scroll through the steps. Decorative only. */}
        <div
          aria-hidden="true"
          className="pointer-events-none sticky top-[120px] h-64 w-12 shrink-0 self-start"
        >
          <div className="absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-[#0B2A55]/10" />
          <motion.div
            className="absolute bottom-0 left-1/2 top-0 w-px origin-top -translate-x-1/2 bg-[#0E9F8E]"
            style={{ scaleY: reduce ? 1 : scrollYProgress }}
          />
        </div>

        <ol className="flex min-w-0 flex-1 flex-col gap-10">
          {steps.map((step, index) => (
            <Step
              key={step.title}
              index={index}
              total={steps.length}
              title={step.title}
              body={step.body}
              progress={scrollYProgress}
              reduce={!!reduce}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

type StepProps = {
  index: number;
  total: number;
  title: string;
  body: string;
  progress: MotionValue<number>;
  reduce: boolean;
};

function Step({ index, total, title, body, progress, reduce }: StepProps) {
  // Each step lights up when the progress line reaches its position.
  const threshold = (index + 0.5) / total;
  const from = threshold - 0.05;
  const background = useTransform(progress, [from, threshold], ["rgba(11,42,85,0.1)", "rgba(14,159,136,1)"]);
  const numberColor = useTransform(progress, [from, threshold], ["#0B2A55", "#FFFFFF"]);

  return (
    <li className="flex gap-5">
      <motion.span
        style={reduce ? undefined : { backgroundColor: background, color: numberColor }}
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-heading text-lg font-semibold ring-4 ring-[#F6F8FB] ${
          reduce ? "bg-[#0E9F8E] text-white" : "bg-[#0B2A55]/10 text-[#0B2A55]"
        }`}
      >
        {index + 1}
      </motion.span>
      <div>
        <h3 className="font-heading text-xl font-semibold text-[#0A1F3D]">{title}</h3>
        <p className="mt-2 text-[#5E6E87]">{body}</p>
      </div>
    </li>
  );
}
