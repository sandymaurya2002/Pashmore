'use client'

import * as React from 'react'
import { motion, type Variants } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/use-media-query'

interface RevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  /** Distance travelled, in pixels. Kept small — this should read as weight. */
  y?: number
  as?: 'div' | 'section' | 'li' | 'article'
}

/**
 * Scroll reveal. Animates transform and opacity only, so it never triggers
 * layout and never contributes to CLS, and stands down entirely when the
 * customer has asked for reduced motion.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  as = 'div',
}: RevealProps) {
  const reduceMotion = usePrefersReducedMotion()
  const Component = motion[as]

  const variants: Variants = React.useMemo(
    () => ({
      hidden: reduceMotion ? { opacity: 1 } : { opacity: 0, y },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: reduceMotion ? 0 : 0.7,
          delay: reduceMotion ? 0 : delay,
          ease: [0.22, 1, 0.36, 1],
        },
      },
    }),
    [delay, reduceMotion, y],
  )

  return (
    <Component
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      variants={variants}
    >
      {children}
    </Component>
  )
}
