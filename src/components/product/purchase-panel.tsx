'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Check, Truck, RefreshCcw, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Price } from '@/components/product/price'
import { WishlistButton } from '@/components/product/wishlist-button'
import {
  ColorSelector,
  QuantityStepper,
  SizeSelector,
} from '@/components/product/variant-selector'
import { useProductSelection } from '@/hooks/use-product-selection'
import { useRecentlyViewed } from '@/context/recently-viewed-context'
import { formatPrice } from '@/lib/utils'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/site'
import type { Product } from '@/types'

export function PurchasePanel({ product }: { product: Product }) {
  const router = useRouter()
  const selection = useProductSelection(product)
  const { record } = useRecentlyViewed()

  const ctaRef = React.useRef<HTMLDivElement>(null)
  const [ctaVisible, setCtaVisible] = React.useState(true)

  // Record the view once per mount. Local only — no account, no cookie.
  React.useEffect(() => {
    record(product.slug)
  }, [product.slug, record])

  // The sticky mobile bar appears only once the real button has scrolled away.
  React.useEffect(() => {
    const node = ctaRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  async function onBuyNow() {
    if (await selection.addToCart()) router.push('/checkout')
  }

  const inventory = selection.variant?.inventory ?? 0
  const lowStock = inventory > 0 && inventory <= 3

  return (
    <>
      <div className="flex flex-col gap-7">
        <div>
          <Price
            price={selection.variant?.price ?? product.price}
            compareAtPrice={selection.variant?.compareAtPrice ?? product.compareAtPrice}
            size="lg"
          />
          <p className="mt-2 text-xs text-taupe">
            Inclusive of all taxes ·{' '}
            {product.price >= FREE_SHIPPING_THRESHOLD
              ? 'Complimentary shipping'
              : `Free shipping above ${formatPrice(FREE_SHIPPING_THRESHOLD)}`}
          </p>
        </div>

        <p
          className="flex items-center gap-2 text-[0.8125rem]"
          aria-live="polite"
        >
          {selection.available ? (
            <>
              <span
                aria-hidden
                className={
                  lowStock
                    ? 'h-1.5 w-1.5 rounded-full bg-gold'
                    : 'h-1.5 w-1.5 rounded-full bg-emerald-700'
                }
              />
              <span className={lowStock ? 'text-gold' : 'text-mocha'}>
                {lowStock
                  ? `Only ${inventory} left — made in small batches`
                  : 'In stock, ready to dispatch'}
              </span>
            </>
          ) : (
            <>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-burgundy" />
              <span className="text-burgundy">
                Out of stock in this combination
              </span>
            </>
          )}
        </p>

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

        <div ref={ctaRef} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button
              size="lg"
              className="h-13 flex-1"
              onClick={() => selection.addToCart()}
              disabled={!selection.available || selection.adding}
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

        {selection.variant?.sku && (
          <p className="text-xs text-taupe">
            SKU: <span className="tabular-nums">{selection.variant.sku}</span>
          </p>
        )}

        <ul className="grid grid-cols-1 gap-3 border-y border-line py-6 sm:grid-cols-3">
          <TrustItem icon={ShieldCheck} label="Secure payments" detail="Razorpay · UPI · Cards" />
          <TrustItem icon={Truck} label="Dispatched in 48 hours" detail="From Srinagar, India" />
          <TrustItem icon={RefreshCcw} label="14-day returns" detail="Free pickup nationwide" />
        </ul>

        <ul className="flex flex-col gap-2.5 text-sm text-mocha">
          {[
            'Presented in a hand-bound box with a muslin sleeve',
            'Craft certificate naming the weaver and the loom',
            'Complimentary gift wrapping and message card',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <Check
                aria-hidden
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold"
                strokeWidth={1.5}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Sticky mobile purchase bar */}
      <div
        className={`fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-ivory/97 px-4 py-3 backdrop-blur-md transition-transform duration-400 ease-[var(--ease-luxe)] md:hidden ${
          ctaVisible ? 'translate-y-[130%]' : 'translate-y-0'
        }`}
        aria-hidden={ctaVisible}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-taupe">{product.name}</p>
            <Price
              price={selection.variant?.price ?? product.price}
              compareAtPrice={selection.variant?.compareAtPrice ?? product.compareAtPrice}
              size="sm"
              showDiscount={false}
            />
          </div>
          <Button
            onClick={() => selection.addToCart()}
            disabled={!selection.available || selection.adding}
            tabIndex={ctaVisible ? -1 : 0}
            className="h-11 px-6"
          >
            {selection.available ? 'Add to Bag' : 'Sold Out'}
          </Button>
        </div>
      </div>
    </>
  )
}

function TrustItem({
  icon: Icon,
  label,
  detail,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  detail: string
}) {
  return (
    <li className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.1} />
      <span>
        <span className="block text-xs text-charcoal">{label}</span>
        <span className="block text-[0.6875rem] text-taupe">{detail}</span>
      </span>
    </li>
  )
}
