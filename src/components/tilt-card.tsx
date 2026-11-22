"use client";

import { useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
};

const SPRING = { stiffness: 200, damping: 20, mass: 0.5 };

export function TiltCard({ children, className, maxTilt = 6 }: TiltCardProps) {
  const reduceMotion = useReducedMotion();

  // Normalised pointer position inside the card: 0..1, centre = 0.5.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(
    useTransform(py, [0, 1], [maxTilt, -maxTilt]),
    SPRING,
  );
  const rotateY = useSpring(
    useTransform(px, [0, 1], [-maxTilt, maxTilt]),
    SPRING,
  );

  const highlightX = useTransform(px, [0, 1], [0, 100]);
  const highlightY = useTransform(py, [0, 1], [0, 100]);
  const highlight = useMotionTemplate`radial-gradient(circle at ${highlightX}% ${highlightY}%, rgba(255,255,255,0.16), transparent 45%)`;

  const [isTouch, setIsTouch] = useState(false);
  const [hovering, setHovering] = useState(false);

  const tiltOn = !reduceMotion && !isTouch;

  const onPointerEnter = (e: ReactPointerEvent<HTMLDivElement>) => {
    setIsTouch(e.pointerType === "touch");
    setHovering(true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!tiltOn) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  };

  const onPointerLeave = () => {
    setHovering(false);
    setIsTouch(false);
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <motion.div
      className={`relative ${className ?? ""}`}
      style={
        tiltOn
          ? { rotateX, rotateY, transformPerspective: 900 }
          : undefined
      }
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {children}
      {tiltOn ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: highlight }}
          initial={{ opacity: 0 }}
          animate={{ opacity: hovering ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      ) : null}
    </motion.div>
  );
}
