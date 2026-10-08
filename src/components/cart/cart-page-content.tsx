'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { ProductGrid } from '@/components/product/product-grid'
import { SectionHeading } from '@/components/ui/section-heading'
import { TrustBar } from '@/components/marketing/trust-bar'
import { OrderSummary } from '@/components/cart/order-summary'
import { useCart } from '@/context/cart-context'
import { useToast } from '@/context/toast-context'
import { formatPrice, pluralise } from '@/lib/utils'
import type { Product } from '@/types'

export function CartPageContent({ recommendations }: { recommendations: Product[] }) {
  const { items, totals, hydrated, updateQuantity, removeItem, applyCoupon, coupon, removeCoupon } =
    useCart()
  const { toast } = useToast()
  const [code, setCode] = React.useState('')

  const suggestions = recommendations
    .filter((product) => !items.some((item) => item.productSlug === product.slug))
    .slice(0, 4)

  if (!hydrated) {
    return (
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          {[0, 1].map((index) => (
            <div key={index} className="skeleton h-32 w-full" />
          ))}
        </div>
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  if (!items.length) {
    return (
      <EmptyState
        className="mt-6"
        icon={<ShoppingBag className="h-6 w-6" strokeWidth={1} />}
        title="Your bag is empty"
        description="Nothing here yet. Begin with the pieces our customers return to most."
        actionHref="/collections/best-sellers"
        actionLabel="Shop Best Sellers"
        secondaryHref="/collections/new-arrivals"
        secondaryLabel="New Arrivals"
      />
    )
  }

  function onApplyCoupon(event: React.FormEvent) {
    event.preventDefault()
    const result = applyCoupon(code)
    toast({
      title: result.ok ? 'Discount applied' : 'Could not apply code',
      description: result.message,
      tone: result.ok ? 'success' : 'error',
    })
    if (result.ok) setCode('')
  }

  return (
    <>
      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-16">
        <section aria-label="Bag contents">
          <p className="border-b border-line pb-4 text-sm text-taupe">
            {totals.itemCount} {pluralise(totals.itemCount, 'item')}
          </p>

          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.key} className="flex gap-5 py-6">
                <Link
                  href={`/products/${item.productSlug}`}
                  className="relative aspect-4/5 w-24 shrink-0 overflow-hidden bg-ivory-deep sm:w-32"
                >
                  <Image
                    src={item.image.url}
                    alt={item.image.alt}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="font-serif text-lg leading-snug text-charcoal">
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="transition-colors hover:text-gold"
                        >
                          {item.name}
                        </Link>
                      </h2>
                      {(item.color || item.size) && (
                        <p className="mt-1.5 text-xs text-taupe">
                          {[item.color, item.size].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      aria-label={`Remove ${item.name}`}
                      className="p-1 text-taupe transition-colors hover:text-burgundy"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.25} />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                    <div className="inline-flex items-center border border-line-strong">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity - 1)}
                        className="flex h-9 w-9 items-center justify-center text-charcoal transition-colors hover:text-gold"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <Minus className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.key, item.quantity + 1)}
                        disabled={item.quantity >= item.maxQuantity}
                        className="flex h-9 w-9 items-center justify-center text-charcoal transition-colors hover:text-gold disabled:opacity-30"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <Plus className="h-3 w-3" strokeWidth={1.5} />
                      </button>
                    </div>

                    <p className="text-[0.9375rem] text-charcoal">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={onApplyCoupon} className="mt-8 border-t border-line pt-8">
            <label htmlFor="coupon" className="eyebrow mb-3 block text-taupe">
              Discount code
            </label>
            <div className="flex gap-3">
              <Input
                id="coupon"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="Enter code"
                className="max-w-56"
              />
              <Button type="submit" variant="outline">
                Apply
              </Button>
            </div>
            {coupon && (
              <p className="mt-3 text-xs text-mocha">
                <span className="text-charcoal">{coupon.code}</span> applied — {coupon.label}.{' '}
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="underline underline-offset-2 hover:text-charcoal"
                >
                  Remove
                </button>
              </p>
            )}
          </form>
        </section>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <OrderSummary totals={totals} coupon={coupon} />
          <Button asChild size="lg" className="mt-6 h-13 w-full">
            <Link href="/checkout">Proceed to Checkout</Link>
          </Button>
          <Button asChild variant="ghost" className="mt-2 w-full">
            <Link href="/collections">Continue Shopping</Link>
          </Button>

          <div className="mt-8 border-t border-line pt-8">
            <TrustBar compact />
          </div>
        </aside>
      </div>

      {suggestions.length > 0 && (
        <section className="mt-24 border-t border-line pt-16" aria-labelledby="cart-suggestions">
          <SectionHeading id="cart-suggestions" title="You may also like" />
          <ProductGrid products={suggestions} className="mt-12" />
        </section>
      )}
    </>
  )
}
