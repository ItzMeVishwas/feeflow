'use client';

import { motion, useReducedMotion } from "motion/react";

type HeadlineWordsProps = {
  text: string;
  className?: string;
};

// Splits a headline into words that slide up one after another on load.
// Under reduced motion the words render at their final position immediately.
export function HeadlineWords({ text, className }: HeadlineWordsProps) {
  const reduce = useReducedMotion();
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span key={`${word}-${index}`} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.06 }}
          >
            {word}
          </motion.span>
          {index < words.length - 1 ? "\u00A0" : null}
        </span>
      ))}
    </span>
  );
}
