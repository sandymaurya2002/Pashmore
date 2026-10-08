'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Eye } from 'lucide-react'

import { Price } from '@/components/product/price'
import { ProductBadgeChip } from '@/components/ui/badge'
import { WishlistButton } from '@/components/product/wishlist-button'
import { QuickView } from '@/components/product/quick-view'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  /** Passed to next/image so the browser picks the right candidate. */
  sizes?: string
  priority?: boolean
  className?: string
}

const DEFAULT_SIZES =
  '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw'

export function ProductCard({
  product,
  sizes = DEFAULT_SIZES,
  priority = false,
  className,
}: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = React.useState(false)

  const primary = product.images[0]
  const secondary = product.images[1] ?? primary
  const soldOut = product.inventory <= 0
  const badge = product.badges[0]

  return (
    <>
      <article className={cn('group relative flex flex-col', className)}>
        <div className="relative overflow-hidden bg-ivory-deep">
          <Link
            href={`/products/${product.slug}`}
            className="block focus-visible:outline-offset-[-2px]"
            aria-label={product.name}
          >
            <div className="relative aspect-4/5 w-full">
              <Image
                src={primary.url}
                alt={primary.alt}
                fill
                sizes={sizes}
                priority={priority}
                className="object-cover transition-[opacity,transform] duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.04] group-hover:opacity-0"
              />
              {/* Second frame crossfades in on hover. It is only decorative —
                  the first image already carries the descriptive alt text. */}
              <Image
                src={secondary.url}
                alt=""
                aria-hidden
                fill
                sizes={sizes}
                loading="lazy"
                className="object-cover opacity-0 transition-[opacity,transform] duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.04] group-hover:opacity-100"
              />
            </div>
          </Link>

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <div className="flex flex-col gap-1.5">
              {soldOut ? (
                <span className="bg-charcoal px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.16em] text-ivory">
                  Sold Out
                </span>
              ) : (
                badge && <ProductBadgeChip badge={badge} />
              )}
            </div>
            <div className="pointer-events-auto">
              <WishlistButton slug={product.slug} productName={product.name} />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 opacity-0 transition-all duration-500 ease-[var(--ease-luxe)] group-hover:translate-y-0 group-hover:opacity-100 [@media(hover:none)]:hidden">
            <button
              type="button"
              onClick={() => setQuickViewOpen(true)}
              className="pointer-events-auto flex w-full items-center justify-center gap-2 bg-ivory/92 py-3 text-[0.6875rem] uppercase tracking-[0.18em] text-charcoal backdrop-blur-[2px] transition-colors duration-300 hover:bg-ivory"
            >
              <Eye className="h-3.5 w-3.5" strokeWidth={1.25} />
              Quick View
            </button>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 pt-4">
          <p className="eyebrow text-taupe">{product.material}</p>
          <h3 className="font-serif text-[1.0625rem] leading-snug text-charcoal">
            <Link
              href={`/products/${product.slug}`}
              className="transition-colors duration-300 hover:text-gold"
            >
              {product.name}
            </Link>
          </h3>
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
        </div>

        {/* Touch devices get a persistent quick-view affordance instead of hover. */}
        <button
          type="button"
          onClick={() => setQuickViewOpen(true)}
          className="mt-3 hidden w-full border border-charcoal/20 py-2.5 text-[0.625rem] uppercase tracking-[0.18em] text-charcoal [@media(hover:none)]:block"
        >
          Quick View
        </button>
      </article>

      <QuickView
        product={product}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </>
  )
}
