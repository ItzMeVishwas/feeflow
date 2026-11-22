'use client'

import type { ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type AppTemplateProps = {
  children: ReactNode
}

export default function AppTemplate({ children }: AppTemplateProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}
