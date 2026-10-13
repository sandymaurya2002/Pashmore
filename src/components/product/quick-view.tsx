'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Price } from '@/components/product/price'
import { WishlistButton } from '@/components/product/wishlist-button'
import {
  ColorSelector,
  QuantityStepper,
  SizeSelector,
} from '@/components/product/variant-selector'
import { useProductSelection } from '@/hooks/use-product-selection'
import { useIsDesktop } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface QuickViewProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * A modal on desktop, a bottom sheet on mobile — the same content either way.
 * Rendered only while open so a grid of 24 cards does not mount 24 dialogs.
 */
export function QuickView({ product, open, onOpenChange }: QuickViewProps) {
  const isDesktop = useIsDesktop()

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        side={isDesktop ? 'center' : 'bottom'}
        className={cn(
          'overflow-hidden',
          isDesktop ? 'max-w-4xl' : 'max-h-[90dvh]',
        )}
        closeLabel="Close quick view"
      >
        <QuickViewBody product={product} onOpenChange={onOpenChange} isDesktop={isDesktop} />
      </DialogContent>
    </Dialog>
  )
}

function QuickViewBody({
  product,
  onOpenChange,
  isDesktop,
}: {
  product: Product
  onOpenChange: (open: boolean) => void
  isDesktop: boolean
}) {
  const router = useRouter()
  const selection = useProductSelection(product)
  const [imageIndex, setImageIndex] = React.useState(0)
  const image = product.images[imageIndex] ?? product.images[0]

  async function onBuyNow() {
    if (await selection.addToCart()) {
      onOpenChange(false)
      router.push('/checkout')
    }
  }

  return (
    <div
      className={cn(
        'grid min-h-0 flex-1 overflow-hidden',
        isDesktop ? 'grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]' : 'grid-cols-1',
      )}
    >
      {isDesktop && (
        <div className="relative bg-ivory-deep">
          <div className="relative h-full min-h-[32rem]">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="(min-width: 1024px) 40vw, 0px"
              className="object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
              {product.images.map((entry, index) => (
                <button
                  key={entry.url}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  aria-label={`View image ${index + 1} of ${product.images.length}`}
                  aria-current={index === imageIndex}
                  className={cn(
                    'h-1 w-8 transition-colors duration-300',
                    index === imageIndex ? 'bg-charcoal' : 'bg-charcoal/25',
                  )}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-col overflow-y-auto overscroll-contain px-6 py-8 md:px-9 md:py-10">
        {!isDesktop && (
          // `shrink-0` is load-bearing: this is a flex child of a scrolling
          // column, and without it the aspect-ratio box collapses to zero
          // height rather than sizing itself from its width.
          <div className="relative mb-6 aspect-4/5 max-h-[38dvh] w-full shrink-0 overflow-hidden bg-ivory-deep">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}

        <p className="eyebrow text-taupe">{product.material}</p>
        <DialogTitle className="mt-3 font-serif text-[1.75rem] leading-tight text-charcoal md:text-[2rem]">
          {product.name}
        </DialogTitle>

        <div className="mt-4">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
          <p className="mt-1.5 text-xs text-taupe">Inclusive of all taxes</p>
        </div>

        <DialogDescription className="mt-5 text-sm leading-relaxed text-mocha">
          {product.description}
        </DialogDescription>

        <div className="mt-7 flex flex-col gap-6">
          <ColorSelector
            colors={product.colors}
            value={selection.colorSlug}
            onChange={selection.setColorSlug}
            availability={selection.colorAvailability}
          />
          <SizeSelector
            sizes={product.sizes}
            value={selection.sizeSlug}
            onChange={selection.setSizeSlug}
            availability={selection.sizeAvailability}
          />
          <QuantityStepper
            value={selection.quantity}
            onChange={selection.setQuantity}
            max={selection.maxQuantity}
          />
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              onClick={() => selection.addToCart()}
              disabled={!selection.available || selection.adding}
              className="h-13 flex-1"
              size="lg"
            >
              {!selection.available ? 'Out of Stock' : selection.adding ? 'Adding…' : 'Add to Bag'}
            </Button>
            <WishlistButton
              slug={product.slug}
              productName={product.name}
              variant="inline"
            />
          </div>
          <Button
            variant="outline"
            size="lg"
            className="h-13"
            onClick={onBuyNow}
            disabled={!selection.available || selection.adding}
          >
            Buy Now
          </Button>
        </div>

        <Link
          href={`/products/${product.slug}`}
          onClick={() => onOpenChange(false)}
          className="mt-6 inline-flex items-center gap-2 self-start text-[0.75rem] uppercase tracking-[0.16em] text-charcoal transition-colors hover:text-gold"
        >
          View Full Details
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} />
        </Link>
      </div>
    </div>
  )
}
