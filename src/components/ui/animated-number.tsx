'use client';
import { cn } from '@/lib/utils';
import { animate, SpringOptions, useMotionValue, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import type React from 'react';

export type AnimatedNumberProps = {
  value: number;
  className?: string;
  /** @deprecated Accepted for API compatibility; the count uses a fixed ease-out tween. */
  springOptions?: SpringOptions;
  as?: React.ElementType;
  format?: (n: number) => string;
};

function formatValue(n: number, format?: (n: number) => string) {
  const rounded = Math.round(n);
  return format ? format(rounded) : rounded.toLocaleString();
}

export function AnimatedNumber({
  value,
  className,
  as = 'span',
  format,
}: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const count = useMotionValue(0);
  // Constant initial text (formatted 0). The count is written straight to the
  // DOM node below, so React never re-renders the number on each frame.
  const [initialText] = useState(() => formatValue(0, format));

  // Write the displayed text whenever the motion value changes.
  useEffect(() => {
    const write = (current: number) => {
      if (ref.current) ref.current.textContent = formatValue(current, format);
    };
    write(count.get());
    return count.on('change', write);
  }, [count, format]);

  // Count from the current displayed value to the target. Under reduced motion,
  // jump straight to the target.
  useEffect(() => {
    if (reduce) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: 0.9, ease: 'easeOut' });
    return () => controls.stop();
  }, [count, value, reduce]);

  const Tag = as as React.ElementType;

  return (
    <Tag ref={ref} className={cn('tabular-nums', className)}>
      {initialText}
    </Tag>
  );
}
