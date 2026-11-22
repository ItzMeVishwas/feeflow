'use client';

import { useRef } from "react";
import type { PointerEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { formatINR } from "@/lib/format";

const MAX_TILT = 6; // degrees

// Static sample dashboard shown in the hero. All figures are illustrative.
export function DashboardPreview() {
  const reduce = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const entranceRef = useRef<HTMLDivElement>(null);

  // Scroll entrance: the card grows and levels out as it moves into view.
  // Lives on an outer wrapper so it does not fight the pointer tilt on the card.
  const { scrollYProgress } = useScroll({
    target: entranceRef,
    offset: ["start end", "center center"],
  });
  const entranceScale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const entranceRotateX = useTransform(scrollYProgress, [0, 1], [8, 0]);

  // Pointer position inside the card, from 0 (left/top) to 1 (right/bottom).
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const springConfig = { stiffness: 180, damping: 20, mass: 0.6 };
  const sx = useSpring(px, springConfig);
  const sy = useSpring(py, springConfig);

  const rotateY = useTransform(sx, [0, 1], [-MAX_TILT, MAX_TILT]);
  const rotateX = useTransform(sy, [0, 1], [MAX_TILT, -MAX_TILT]);

  const handleMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const handleLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" style={{ perspective: 1000 }}>
      <motion.div
        ref={entranceRef}
        style={
          reduce
            ? undefined
            : { scale: entranceScale, rotateX: entranceRotateX, transformStyle: "preserve-3d" }
        }
      >
      <motion.div
        ref={cardRef}
        onPointerMove={reduce ? undefined : handleMove}
        onPointerLeave={reduce ? undefined : handleLeave}
        style={reduce ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="overflow-hidden rounded-3xl border border-[#E6EBF2] bg-white shadow-[0_1px_2px_rgba(10,31,61,0.04),0_32px_64px_-28px_rgba(10,31,61,0.45)]"
      >
        {/* Navy top block */}
        <div className="bg-[#0B2A55] p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/80">Parents owe you</p>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
              Sample figures
            </span>
          </div>
          <p className="mt-3 font-heading text-4xl font-semibold tabular-nums tracking-tight">
            {formatINR(18600, { wholeRupees: true })}
          </p>
          <p className="mt-1 text-sm text-white/75">across 6 families, oldest 12 days</p>
        </div>

        <div className="p-6">
          {/* Two stat tiles */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#E6EBF2] bg-white p-4">
              <p className="text-xs font-medium text-[#5E6E87]">Collected</p>
              <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-[#0A1F3D]">
                {formatINR(12400, { wholeRupees: true })}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E6EBF2] bg-white p-4">
              <p className="text-xs font-medium text-[#5E6E87]">Due today</p>
              <p className="mt-1 font-heading text-xl font-semibold tabular-nums text-[#0A1F3D]">
                {formatINR(4200, { wholeRupees: true })}
              </p>
            </div>
          </div>

          {/* Teal-filled wave chart */}
          <div className="mt-5 rounded-2xl bg-[#F6F8FB] p-4">
            <div className="flex items-center justify-between text-xs text-[#5E6E87]">
              <span>Cash balance</span>
              <span>Next 90 days</span>
            </div>
            <svg
              viewBox="0 0 320 110"
              className="mt-3 h-auto w-full"
              role="img"
              aria-label="Sample cash balance wave over the next 90 days"
            >
              <defs>
                <linearGradient id="preview-wave-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0E9F8E" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0E9F8E" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 40 C 45 30, 80 58, 120 52 S 200 22, 250 40 S 300 62, 320 50 L 320 110 L 0 110 Z"
                fill="url(#preview-wave-fill)"
              />
              <path
                d="M0 40 C 45 30, 80 58, 120 52 S 200 22, 250 40 S 300 62, 320 50"
                fill="none"
                stroke="#0E9F8E"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      </motion.div>
      </motion.div>
    </div>
  );
}
