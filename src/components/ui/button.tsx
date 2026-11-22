"use client"

import { useRef, useState, type PointerEvent } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import type { BaseUIEvent } from "@base-ui/react/types"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, useReducedMotion } from "motion/react"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button relative overflow-hidden inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 active:scale-[0.98] motion-reduce:transform-none",

  {
    variants: {
      variant: {
        default: "bg-[#0B2A55] text-white hover:bg-[#133A72] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/80",
        outline:
          "border-[#DCE3EE] bg-white text-[#0B2A55] hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:text-foreground dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type Ripple = { id: number; x: number; y: number; size: number }

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  disabled,
  onPointerDown,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  const reduceMotion = useReducedMotion()
  const [ripples, setRipples] = useState<Ripple[]>([])
  const nextRippleId = useRef(0)

  function handlePointerDown(event: BaseUIEvent<PointerEvent<HTMLButtonElement>>) {
    onPointerDown?.(event)
    if (disabled || reduceMotion) return

    // Start the ripple where the pointer touched, measured from the button's corner.
    const rect = event.currentTarget.getBoundingClientRect()
    const ripple: Ripple = {
      id: nextRippleId.current++,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      size: Math.max(rect.width, rect.height),
    }
    setRipples((current) => [...current, ripple])
  }

  function removeRipple(id: number) {
    setRipples((current) => current.filter((r) => r.id !== id))
  }

  const rippleColor = variant === "default" ? "bg-white/30" : "bg-[#0B2A55]/10"

  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          aria-hidden
          className={cn("pointer-events-none absolute rounded-full", rippleColor)}
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
          }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          onAnimationComplete={() => removeRipple(ripple.id)}
        />
      ))}
    </ButtonPrimitive>
  )
}

export { Button, buttonVariants }
