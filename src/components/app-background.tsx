"use client"

import { motion, useReducedMotion } from "motion/react"

// Very subtle ambient layer for the app: a slow drifting gradient and a few
// faint flowing lines. Fixed, behind all content, never interactive.
// Dark theme: `dark:opacity-40` on the layer lowers everything together.

const WAVE_PATH = "M0,150 C200,70 400,230 800,150 C1000,70 1200,230 1600,150"

// Each line drifts one full pattern period (half its width) at its own speed.
const WAVES = [
  { top: "18%", height: 140, duration: 46 },
  { top: "48%", height: 120, duration: 62 },
  { top: "74%", height: 160, duration: 78 },
] as const

export function AppBackground() {
  const reduce = useReducedMotion()

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#F6F8FB] dark:bg-transparent dark:opacity-40"
    >
      {/* Soft navy glow, top left */}
      <motion.div
        className="absolute -top-1/4 -left-1/4 size-[70vmax] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(11,42,85,0.04) 0%, rgba(11,42,85,0) 70%)",
        }}
        animate={reduce ? undefined : { x: 60, y: 40 }}
        transition={{ duration: 40, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Soft teal glow, bottom right */}
      <motion.div
        className="absolute -right-1/4 -bottom-1/4 size-[60vmax] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(14,159,142,0.04) 0%, rgba(14,159,142,0) 70%)",
        }}
        animate={reduce ? undefined : { x: -50, y: -30 }}
        transition={{ duration: 40, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Flowing lines: skipped entirely under reduced motion */}
      {!reduce &&
        WAVES.map((wave) => (
          <motion.div
            key={wave.top}
            className="absolute left-0 w-[200%]"
            style={{ top: wave.top, height: wave.height }}
            animate={{ x: "-50%" }}
            transition={{ duration: wave.duration, repeat: Infinity, ease: "linear" }}
          >
            <svg
              viewBox="0 0 1600 300"
              preserveAspectRatio="none"
              className="block size-full"
            >
              <path
                d={WAVE_PATH}
                fill="none"
                stroke="#0B2A55"
                strokeOpacity={0.05}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </motion.div>
        ))}
    </div>
  )
}

export default AppBackground
