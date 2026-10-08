'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { useHasHover, usePrefersReducedMotion } from '@/hooks/use-media-query'

/**
 * Cinematic hero with a restrained pointer parallax: the photograph drifts a
 * few pixels, the copy drifts less, and the difference reads as depth. The
 * effect is mouse-only — touch devices and anyone with reduced motion enabled
 * get the same static composition with no listeners attached at all.
 */
export function HeroSection() {
  const hasHover = useHasHover()
  const reduceMotion = usePrefersReducedMotion()
  const parallaxEnabled = hasHover && !reduceMotion

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)

  const springConfig = { stiffness: 60, damping: 22, mass: 0.6 }
  const smoothX = useSpring(pointerX, springConfig)
  const smoothY = useSpring(pointerY, springConfig)

  const imageX = useTransform(smoothX, [-0.5, 0.5], [18, -18])
  const imageY = useTransform(smoothY, [-0.5, 0.5], [12, -12])
  const contentX = useTransform(smoothX, [-0.5, 0.5], [-6, 6])
  const contentY = useTransform(smoothY, [-0.5, 0.5], [-4, 4])

  const onMouseMove = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!parallaxEnabled) return
      const rect = event.currentTarget.getBoundingClientRect()
      pointerX.set((event.clientX - rect.left) / rect.width - 0.5)
      pointerY.set((event.clientY - rect.top) / rect.height - 0.5)
    },
    [parallaxEnabled, pointerX, pointerY],
  )

  const onMouseLeave = React.useCallback(() => {
    pointerX.set(0)
    pointerY.set(0)
  }, [pointerX, pointerY])

  return (
    <section
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className="relative h-[78dvh] min-h-[32rem] w-full overflow-hidden bg-charcoal md:h-[88dvh]"
      aria-labelledby="hero-heading"
    >
      <motion.div
        className="absolute -inset-8 will-change-transform"
        style={parallaxEnabled ? { x: imageX, y: imageY } : undefined}
      >
        <Image
          src="/images/editorial/hero-heritage.png"
          alt="A woman wearing an ivory Kashmiri Pashmina shawl in a heritage courtyard at dawn"
          fill
          // The LCP element: eager, high priority, sized for every breakpoint.
          priority
          fetchPriority="high"
          quality={82}
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>

      {/* Two-stop scrim: enough contrast for AA text without flattening the image. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/25 to-ink/35"
      />

      <motion.div
        className="container-luxe relative flex h-full flex-col items-center justify-center text-center"
        style={parallaxEnabled ? { x: contentX, y: contentY } : undefined}
      >
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          // Wide letter-spacing on an 8-character word overflows small phones
          // fast, so both size and tracking step down below 384px.
          className="font-serif text-[1.75rem] leading-none tracking-[0.24em] text-ivory xs:text-[2.5rem] xs:tracking-[0.34em] sm:text-[3.5rem] md:text-[4.5rem]"
        >
          PASHMORE
        </motion.p>

        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-2xl font-serif text-[1.5rem] font-light leading-[1.25] text-ivory/95 sm:text-[2rem] md:text-[2.5rem]"
        >
          Where Heritage Meets Modern Luxury
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4"
        >
          <Button asChild variant="light" size="lg">
            <Link href="/collections/pure-pashmina">Explore Collection</Link>
          </Button>
          <Button asChild variant="outlineLight" size="lg">
            <Link href="/craftsmanship">Discover Our Craft</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  )
}
