'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useCart } from '@/context/cart-context'
import { bff } from '@/lib/api/browser'
import { formatPrice } from '@/lib/utils'
import type { CartItem, Currency, Product } from '@/types'

/** Fetched the first time the drawer opens; a failure simply hides the rail. */
function useRecommendations(enabled: boolean): Product[] {
  const [products, setProducts] = React.useState<Product[]>([])
  const requested = React.useRef(false)

  React.useEffect(() => {
    if (!enabled || requested.current) return
    requested.current = true
    bff<{ products: Product[] }>('/api/recommendations')
      .then(({ data }) => setProducts(data.products))
      .catch(() => {
        requested.current = false
      })
  }, [enabled])

  return products
}

export function CartDrawer() {
  const {
    isOpen,
    closeCart,
    currency,
    items,
    totals,
    coupon,
    removeCoupon,
    updateQuantity,
    removeItem,
    freeShippingThreshold,
    remainingForFreeShipping,
    hydrated,
    error,
    pendingKey,
    reload,
  } = useCart()

  const recommendations = useRecommendations(isOpen)
  const suggestions = recommendations
    .filter((product) => product.images.length > 0 && product.availableInRegion)
    .filter((product) => !items.some((item) => item.productSlug === product.slug))
    .slice(0, 3)

  const hasUnavailable = items.some((item) => !item.inStock)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <DialogContent side="right" closeLabel="Close shopping bag">
        <div className="border-b border-line px-6 py-6">
          <DialogTitle className="font-serif text-2xl text-charcoal">
            Your Bag
            {totals.itemCount > 0 && (
              <span className="ml-2 text-base text-taupe">({totals.itemCount})</span>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Review the items in your shopping bag and proceed to checkout.
          </DialogDescription>
        </div>

        {!hydrated ? (
          <div className="flex flex-1 items-center justify-center px-8">
            <p className="text-sm text-taupe" aria-live="polite">
              Loading your bag…
            </p>
          </div>
        ) : error && items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <p className="text-sm leading-relaxed text-mocha">{error}</p>
            <Button variant="outline" className="mt-6" onClick={() => void reload()}>
              Try again
            </Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyBag onContinue={closeCart} />
        ) : (
          <>
            {remainingForFreeShipping > 0 && freeShippingThreshold > 0 && (
              <div className="border-b border-line bg-cream/50 px-6 py-3.5">
                <p className="text-xs text-mocha">
                  Add{' '}
                  <span className="text-charcoal">
                    {formatPrice(remainingForFreeShipping, currency)}
                  </span>{' '}
                  more for complimentary shipping.
                </p>
                <div className="mt-2 h-px w-full bg-line-strong">
                  <div
                    className="h-px bg-gold transition-[width] duration-700 ease-[var(--ease-luxe)]"
                    style={{
                      width: `${Math.min(100, (totals.subtotal / freeShippingThreshold) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <ul className="flex-1 divide-y divide-line overflow-y-auto overscroll-contain px-6">
              {items.map((item) => (
                <CartLine
                  key={item.key}
                  item={item}
                  currency={currency}
                  pending={pendingKey === item.key || pendingKey === 'cart'}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </ul>

            {hasUnavailable && (
              <p className="border-t border-line bg-cream/50 px-6 py-3 text-xs text-burgundy">
                Some pieces in your bag are no longer available. Remove them to continue.
              </p>
            )}

            {suggestions.length > 0 && (
              <section className="border-t border-line px-6 py-5" aria-labelledby="cart-suggestions">
                <h3 id="cart-suggestions" className="eyebrow mb-4 text-taupe">
                  You may also like
                </h3>
                <ul className="flex gap-3">
                  {suggestions.map((product) => (
                    <li key={product.slug} className="min-w-0 flex-1">
                      <Link
                        href={`/products/${product.slug}`}
                        onClick={closeCart}
                        className="group block"
                      >
                        <span className="relative block aspect-4/5 overflow-hidden bg-ivory-deep">
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt}
                            fill
                            sizes="96px"
                            className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-105"
                          />
                        </span>
                        <span className="mt-2 block truncate text-xs text-charcoal">
                          {product.name}
                        </span>
                        <span className="block text-xs text-taupe">
                          {formatPrice(product.price, product.currency)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="border-t border-line px-6 py-5">
              <dl className="flex flex-col gap-2 text-sm">
                <Row label="Subtotal" value={formatPrice(totals.subtotal, currency)} />
                {totals.discount > 0 && (
                  <Row
                    label={
                      <span className="flex items-center gap-2">
                        Discount
                        {coupon && (
                          <button
                            type="button"
                            onClick={() => void removeCoupon()}
                            disabled={pendingKey === 'coupon'}
                            className="text-[0.625rem] uppercase tracking-[0.12em] text-taupe underline underline-offset-2 hover:text-charcoal"
                          >
                            {coupon.code} — remove
                          </button>
                        )}
                      </span>
                    }
                    value={`− ${formatPrice(totals.discount, currency)}`}
                    tone="discount"
                  />
                )}
                <Row
                  label="Estimated shipping"
                  value={totals.shipping === 0 ? 'Complimentary' : formatPrice(totals.shipping, currency)}
                />
                <div className="mt-2 flex items-baseline justify-between border-t border-line pt-3">
                  <dt className="text-[0.8125rem] uppercase tracking-[0.14em] text-charcoal">
                    Total
                  </dt>
                  <dd className="font-serif text-xl text-charcoal">
                    {formatPrice(totals.total, currency)}
                  </dd>
                </div>
                <p className="text-[0.6875rem] text-taupe">
                  Includes {formatPrice(totals.tax, currency)} GST. Duties calculated at checkout for
                  international orders.
                </p>
              </dl>

              <div className="mt-5 flex flex-col gap-2.5">
                <Button asChild size="lg" className="h-13 w-full">
                  <Link href="/checkout" onClick={closeCart}>
                    Checkout
                  </Link>
                </Button>
                <Button variant="ghost" onClick={closeCart} className="w-full">
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Row({
  label,
  value,
  tone,
}: {
  label: React.ReactNode
  value: string
  tone?: 'discount'
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-mocha">{label}</dt>
      <dd className={tone === 'discount' ? 'text-burgundy' : 'text-charcoal'}>{value}</dd>
    </div>
  )
}

function CartLine({
  item,
  currency,
  pending,
  onQuantityChange,
  onRemove,
}: {
  item: CartItem
  currency: Currency
  pending: boolean
  onQuantityChange: (key: string, quantity: number) => Promise<void>
  onRemove: (key: string) => Promise<void>
}) {
  return (
    <li className="flex gap-4 py-5" aria-busy={pending}>
      <Link
        href={`/products/${item.productSlug}`}
        className="relative aspect-4/5 w-20 shrink-0 overflow-hidden bg-ivory-deep"
      >
        <Image
          src={item.image.url}
          alt={item.image.alt}
          fill
          sizes="80px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-[0.9375rem] leading-snug text-charcoal">
            <Link href={`/products/${item.productSlug}`} className="hover:text-gold">
              {item.name}
            </Link>
          </h3>
          <button
            type="button"
            onClick={() => void onRemove(item.key)}
            disabled={pending}
            aria-label={`Remove ${item.name} from bag`}
            className="-mr-1 p-1 text-taupe transition-colors hover:text-burgundy disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.25} />
          </button>
        </div>

        {(item.color || item.size) && (
          <p className="mt-1 text-xs text-taupe">
            {[item.color, item.size].filter(Boolean).join(' · ')}
          </p>
        )}

        {!item.inStock && (
          <p className="mt-1 text-xs text-burgundy">
            {item.regionUnavailable ? 'Not available in your region' : 'No longer available'}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <div className="inline-flex items-center border border-line-strong">
            <button
              type="button"
              onClick={() => void onQuantityChange(item.key, item.quantity - 1)}
              disabled={pending}
              className="flex h-8 w-8 items-center justify-center text-charcoal transition-colors hover:text-gold disabled:opacity-30"
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus className="h-3 w-3" strokeWidth={1.5} />
            </button>
            <span className="w-7 text-center text-xs tabular-nums">{item.quantity}</span>
            <button
              type="button"
              onClick={() => void onQuantityChange(item.key, item.quantity + 1)}
              disabled={pending || !item.inStock || item.quantity >= item.maxQuantity}
              className="flex h-8 w-8 items-center justify-center text-charcoal transition-colors hover:text-gold disabled:opacity-30"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus className="h-3 w-3" strokeWidth={1.5} />
            </button>
          </div>

          <p className="text-sm text-charcoal">
            {item.regionUnavailable ? '—' : formatPrice(item.unitPrice * item.quantity, currency)}
          </p>
        </div>
      </div>
    </li>
  )
}

function EmptyBag({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full border border-line"
      >
        <ShoppingBag className="h-6 w-6 text-taupe" strokeWidth={1} />
      </span>
      <h3 className="mt-6 font-serif text-2xl text-charcoal">Your bag is empty</h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-mocha">
        Nothing here yet. Begin with the pieces our customers return to most.
      </p>
      <div className="mt-8 flex w-full flex-col gap-2.5">
        <Button asChild className="w-full">
          <Link href="/collections/best-sellers" onClick={onContinue}>
            Shop Best Sellers
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/collections/new-arrivals" onClick={onContinue}>
            New Arrivals
          </Link>
        </Button>
      </div>
    </div>
  )
}
