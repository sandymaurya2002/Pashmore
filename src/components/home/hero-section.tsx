'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { text } from '@/lib/home-copy'
import type { HomeSection } from '@/server/content'

/**
 * The wordmark and tagline are painted into the artwork, so the image is shown
 * whole at every breakpoint: full width, its own 16:9 shape, never cropped.
 * An active "Home hero" banner replaces this block entirely.
 */
export function HeroSection({ section }: { section?: HomeSection }) {
  return (
    <section className="relative w-full bg-charcoal" aria-labelledby="hero-heading">
      <div className="frame-hero-wide relative">
        <Image
          src={section?.imageUrl ?? '/images/editorial/hero-kashmiri-shawls.png'}
          alt={text(
            section?.imageAlt,
            'Pashmore — The Art of Kashmiri Shawls: six Pashmina shawls draped over wooden gift boxes before snow-capped Himalayan peaks',
          )}
          fill
          // The LCP element: eager, high priority, sized for every breakpoint.
          priority
          fetchPriority="high"
          quality={82}
          sizes="100vw"
          className="object-contain"
        />
      </div>

      {/* Bottom-only scrim keeps the buttons legible without dimming the title. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 hidden h-2/5 bg-gradient-to-t from-ink/65 to-transparent md:block"
      />

      <div className="container-luxe relative flex flex-col items-center py-8 text-center md:absolute md:inset-x-0 md:bottom-0 md:py-12 lg:py-14">
        <h1 id="hero-heading" className="sr-only">
          {text(section?.heading, 'Pashmore — The Art of Kashmiri Shawls')}
        </h1>

        {/* Pure CSS entrance: runs before hydration and ships no JS. */}
        <div
          className="flex w-full animate-[pashmore-fade-up_900ms_var(--ease-luxe)_200ms_both] flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4"
        >
          <Button asChild variant="light" size="lg">
            <Link href={section?.href ?? '/collections/pure-pashmina'}>
              {text(section?.linkLabel, 'Explore Collection')}
            </Link>
          </Button>
          <Button asChild variant="outlineLight" size="lg">
            <Link href={section?.secondaryHref ?? '/craftsmanship'}>
              {text(section?.secondaryLinkLabel, 'Discover Our Craft')}
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
