'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/use-media-query'

const ROTATE_MS = 5200

/**
 * Messages are managed in the admin dashboard (Store Settings). An empty list
 * keeps the strip but leaves it blank: the fixed header is sized around it.
 */
export function AnnouncementBar({
  messages,
  condensed,
}: {
  messages: string[]
  condensed: boolean
}) {
  const [index, setIndex] = React.useState(0)
  const reduceMotion = usePrefersReducedMotion()
  const count = messages.length

  React.useEffect(() => {
    if (reduceMotion || count < 2) return
    const timer = window.setInterval(
      () => setIndex((previous) => (previous + 1) % count),
      ROTATE_MS,
    )
    return () => window.clearInterval(timer)
  }, [reduceMotion, count])

  const message = count ? messages[index % count] : null

  return (
    <div
      className="h-9 overflow-hidden bg-charcoal text-ivory transition-opacity duration-500 ease-[var(--ease-luxe)]"
      style={{ opacity: condensed ? 0 : 1 }}
      aria-hidden={condensed}
    >
      {/* Narrower gutters than `container-luxe`: this bar is a single clipped
          line of wide-tracked uppercase, and it needs every pixel at 320px. */}
      <div className="mx-auto flex h-9 max-w-[100rem] items-center justify-center px-2 sm:px-10">
        <div className="relative h-4 w-full overflow-hidden text-center">
          <AnimatePresence mode="wait" initial={false}>
            {message && (
              <motion.p
                key={index}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: reduceMotion ? 0.001 : 0.5, ease: [0.22, 1, 0.36, 1] }}
                // The bar clips to a single line, so the text must never wrap:
                // tracking and size step down on phones, and `truncate` degrades
                // to an ellipsis rather than silently hiding half the sentence.
                className="eyebrow absolute inset-0 truncate text-[0.5625rem] tracking-[0.02em] text-ivory/85 xs:tracking-[0.1em] sm:text-[0.625rem] sm:tracking-[0.22em]"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
