'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { ProductCard } from '@/components/product/product-card'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCarouselProps {
  products: Product[]
  heading: string
  subheading?: string
  viewAllHref?: string
  viewAllLabel?: string
  id?: string
}

/**
 * Native scroll-snap carousel — no carousel library, no JS layout work.
 * The arrows scroll by one card; touch and trackpad users just swipe, and
 * keyboard users can tab through the cards, which scrolls them into view.
 */
export function ProductCarousel({
  products,
  heading,
  subheading,
  viewAllHref,
  viewAllLabel = 'View all',
  id,
}: ProductCarouselProps) {
  const scroller = React.useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = React.useState(true)
  const [atEnd, setAtEnd] = React.useState(false)
  const headingId = id ?? `carousel-${heading.replace(/\W+/g, '-').toLowerCase()}`

  const measure = React.useCallback(() => {
    const node = scroller.current
    if (!node) return
    setAtStart(node.scrollLeft <= 4)
    setAtEnd(node.scrollLeft + node.clientWidth >= node.scrollWidth - 4)
  }, [])

  React.useEffect(() => {
    measure()
    const node = scroller.current
    if (!node) return
    node.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    return () => {
      node.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  function scrollBy(direction: 1 | -1) {
    const node = scroller.current
    if (!node) return
    const card = node.querySelector('li')
    const step = card ? card.clientWidth + 24 : node.clientWidth * 0.8
    node.scrollBy({ left: step * direction, behavior: 'smooth' })
  }

  if (!products.length) return null

  return (
    <section aria-labelledby={headingId} className="py-20 lg:py-28">
      <div className="container-luxe">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2
              id={headingId}
              className="font-serif text-[2rem] leading-[1.1] text-charcoal md:text-[2.75rem]"
            >
              {heading}
            </h2>
            {subheading && (
              <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-mocha">
                {subheading}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="link-underline mr-3 hidden text-[0.6875rem] uppercase tracking-[0.18em] text-charcoal md:inline-block"
              >
                {viewAllLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              disabled={atStart}
              aria-label="Previous products"
              className="flex h-11 w-11 items-center justify-center border border-line-strong text-charcoal transition-all duration-300 hover:border-charcoal disabled:opacity-30"
            >
              <ArrowLeft className="h-4 w-4" strokeWidth={1.25} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              disabled={atEnd}
              aria-label="Next products"
              className="flex h-11 w-11 items-center justify-center border border-line-strong text-charcoal transition-all duration-300 hover:border-charcoal disabled:opacity-30"
            >
              <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </div>
        </div>
      </div>

      <ul
        ref={scroller}
        className={cn(
          'scrollbar-none mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto',
          // Matches the container gutters so the first card lines up with the
          // heading while the rest bleed off the right edge. Scroll padding
          // must match, or snapping parks each card flush against the edge.
          'px-5 scroll-px-5 md:px-10 md:scroll-px-10 3xl:px-16 3xl:scroll-px-16',
        )}
      >
        {products.map((product) => (
          <li
            key={product.slug}
            className="w-[62vw] shrink-0 snap-start sm:w-[42vw] md:w-[30vw] lg:w-[calc((100vw-8rem)/4)] 3xl:w-[calc((100rem-10rem)/4)]"
          >
            <ProductCard
              product={product}
              sizes="(min-width: 1024px) 24vw, (min-width: 640px) 42vw, 62vw"
            />
          </li>
        ))}
      </ul>

      {viewAllHref && (
        <div className="container-luxe mt-10 md:hidden">
          <Link
            href={viewAllHref}
            className="block border border-charcoal/20 py-3.5 text-center text-[0.6875rem] uppercase tracking-[0.18em] text-charcoal"
          >
            {viewAllLabel}
          </Link>
        </div>
      )}
    </section>
  )
}
