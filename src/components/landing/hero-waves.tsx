'use client';

import { motion, useReducedMotion } from "motion/react";

// Each layer is twice the hero width and holds two identical wave periods,
// so drifting it by -50% of its own width loops seamlessly.
const WAVE_PATH =
  "M0 100 C 150 40, 250 40, 300 100 S 450 160, 600 100 S 750 40, 900 100 S 1050 160, 1200 100";

const layers = [
  { position: "bottom-[10%] h-40", stroke: "#FFFFFF", opacity: 0.08, width: 1.5, duration: 18 },
  { position: "top-[16%] h-36", stroke: "#0E9F8E", opacity: 0.12, width: 2.5, duration: 26 },
  { position: "bottom-[24%] h-48", stroke: "#FFFFFF", opacity: 0.06, width: 1, duration: 34 },
];

// Decorative flowing lines behind the hero content. Static under reduced motion.
export function HeroWaves() {
  const reduce = useReducedMotion();

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {layers.map((layer) => (
        <motion.div
          key={`${layer.stroke}-${layer.duration}`}
          className={`absolute left-0 w-[200%] ${layer.position}`}
          animate={reduce ? undefined : { x: ["0%", "-50%"] }}
          transition={
            reduce ? undefined : { duration: layer.duration, ease: "linear", repeat: Infinity }
          }
        >
          <svg
            viewBox="0 0 1200 200"
            preserveAspectRatio="none"
            className="h-full w-full"
            style={{ opacity: layer.opacity }}
          >
            <path
              d={WAVE_PATH}
              fill="none"
              stroke={layer.stroke}
              strokeWidth={layer.width}
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
