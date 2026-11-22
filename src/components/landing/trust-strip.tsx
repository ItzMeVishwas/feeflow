'use client';

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import type { AnimationPlaybackControls } from "motion/react";
import { MessageCircle, ShieldCheck, Smartphone } from "lucide-react";

const items = [
  { icon: ShieldCheck, label: "Your data stays on your device" },
  { icon: Smartphone, label: "Works with any UPI app" },
  { icon: MessageCircle, label: "Built around WhatsApp" },
];

export function TrustStrip() {
  const reduce = useReducedMotion();
  const x = useMotionValue("0%");
  const controlsRef = useRef<AnimationPlaybackControls | null>(null);

  // Slow, endless drift. The row holds two identical copies, so moving by -50%
  // of its width lands exactly on the second copy and the loop is seamless.
  useEffect(() => {
    if (reduce) return;
    const controls = animate(x, ["0%", "-50%"], {
      duration: 30,
      ease: "linear",
      repeat: Infinity,
    });
    controlsRef.current = controls;
    return () => {
      controls.stop();
      controlsRef.current = null;
    };
  }, [reduce, x]);

  if (reduce) {
    return (
      <section aria-label="Why FeeFlow" className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <ul className="grid gap-4 border-y border-[#E6EBF2] py-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-[#E6EBF2]">
          {items.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center justify-center gap-2.5 px-4 text-sm font-medium text-[#5E6E87]"
            >
              <Icon className="h-4 w-4 shrink-0 text-[#0B2A55]" aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section aria-label="Why FeeFlow" className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
      <div
        className="overflow-hidden border-y border-[#E6EBF2] py-6 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        onMouseEnter={() => controlsRef.current?.pause()}
        onMouseLeave={() => controlsRef.current?.play()}
      >
        <motion.div style={{ x }} className="flex w-max">
          {/* Second copy is hidden from assistive tech; it only exists to loop. */}
          {[false, true].map((isCopy) => (
            <ul
              key={isCopy ? "copy" : "original"}
              aria-hidden={isCopy || undefined}
              className="flex shrink-0 items-center"
            >
              {items.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2.5 whitespace-nowrap px-8 text-sm font-medium text-[#5E6E87]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[#0B2A55]" aria-hidden="true" />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
