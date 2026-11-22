"use client"

import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "motion/react"

const BURST_COLORS = ["#0B2A55", "#0E9F8E", "#D98E04", "#12A150"]
const PARTICLE_COUNT = 18
const VISIBLE_MS = 1400

// Spread particles evenly around the circle, with a small deterministic variation
// in distance and rotation so the burst does not look mechanical.
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const angle = (i / PARTICLE_COUNT) * Math.PI * 2
  return {
    x: Math.cos(angle) * (64 + (i % 3) * 14),
    y: Math.sin(angle) * (64 + (i % 3) * 14),
    rotate: (i * 47) % 360,
    color: BURST_COLORS[i % BURST_COLORS.length],
  }
})

export function SuccessBurst({ show }: { show: boolean }) {
  const reduceMotion = useReducedMotion()
  const [visible, setVisible] = useState(show)

  // Play once each time `show` turns true, then unmount.
  useEffect(() => {
    if (!show) {
      setVisible(false)
      return
    }
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [show])

  if (!visible) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {!reduceMotion &&
        PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-2 w-1.5 rounded-sm"
            style={{ backgroundColor: p.color, marginLeft: -3, marginTop: -4 }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0.6, rotate: 0 }}
            animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        ))}

      <motion.div
        className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#12A150]"
        initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </svg>
      </motion.div>
    </div>
  )
}
