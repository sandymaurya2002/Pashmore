'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, Lock, ShoppingBag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { OrderSummary } from '@/components/cart/order-summary'
import { TrustBar } from '@/components/marketing/trust-bar'
import { useCart } from '@/context/cart-context'
import { useSession } from '@/context/session-context'
import { formatPrice } from '@/lib/utils'

/**
 * Online payment (Razorpay) is not live yet, so checkout stops at a review of
 * the server-priced bag. Nothing here creates an order or takes a payment.
 */
export function CheckoutFlow() {
  const { items, totals, coupon, hydrated, error, reload } = useCart()
  const { status } = useSession()

  if (!hydrated) {
    return (
      <div className="container-luxe py-20">
        <div className="skeleton h-96 w-full" />
      </div>
    )
  }

  if (error && !items.length) {
    return (
      <div className="container-luxe">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" strokeWidth={1} />}
          title="We couldn’t load your bag"
          description={error}
          action={
            <Button variant="outline" onClick={() => void reload()}>
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="container-luxe">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" strokeWidth={1} />}
          title="Your bag is empty"
          description="There is nothing to check out. Choose a piece and we will keep the box warm."
          actionHref="/collections/best-sellers"
          actionLabel="Shop Best Sellers"
        />
      </div>
    )
  }

  const hasUnavailable = items.some((item) => !item.inStock)

  return (
    <div className="container-luxe py-10 lg:py-14">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
        <section aria-labelledby="checkout-heading">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-taupe transition-colors hover:text-charcoal"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back to bag
          </Link>
          <h1
            id="checkout-heading"
            className="mt-5 font-serif text-[1.75rem] text-charcoal md:text-[2.25rem]"
          >
            Checkout
          </h1>

          <div className="mt-8 border border-line bg-cream/40 p-6 md:p-8" role="status">
            <p className="eyebrow flex items-center gap-2 text-gold">
              <Lock className="h-3 w-3" strokeWidth={1.5} aria-hidden />
              Opening soon
            </p>
            <h2 className="mt-4 font-serif text-2xl text-charcoal">
              Online payments are not yet enabled
            </h2>
            <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-mocha">
              We are completing our secure payment setup. No order has been placed and no
              payment has been taken. Your bag is saved
              {status === 'authenticated' ? ' to your account' : ' on this device'} and will be
              waiting when checkout opens.
            </p>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-mocha">
              If you would like to order now, our client care team can help you directly.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-13 sm:px-10">
                <Link href="/contact">Contact Client Care</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-13 sm:px-10">
                <Link href="/cart">Return to Bag</Link>
              </Button>
            </div>
          </div>

          {hasUnavailable && (
            <p className="mt-6 text-xs text-burgundy">
              Some pieces in your bag are no longer available and will need to be removed.
            </p>
          )}

          {status === 'guest' && (
            <p className="mt-6 text-sm text-mocha">
              <Link
                href="/login?next=/checkout"
                className="text-charcoal underline underline-offset-4 hover:text-gold"
              >
                Sign in
              </Link>{' '}
              to keep your bag with your account across devices.
            </p>
          )}
        </section>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <ul className="mb-6 flex flex-col gap-4 border border-line bg-cream/30 p-5">
            {items.map((item) => (
              <li key={item.key} className="flex gap-4">
                <span className="relative aspect-4/5 w-14 shrink-0 overflow-hidden bg-ivory-deep">
                  <Image
                    src={item.image.url}
                    alt={item.image.alt}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-charcoal">{item.name}</span>
                  <span className="block text-xs text-taupe">
                    {[item.color, item.size, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                  </span>
                  {!item.inStock && (
                    <span className="block text-xs text-burgundy">No longer available</span>
                  )}
                </span>
                <span className="shrink-0 text-sm text-charcoal">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <OrderSummary totals={totals} coupon={coupon} />

          <div className="mt-8 border-t border-line pt-8">
            <TrustBar compact />
          </div>
        </aside>
      </div>
    </div>
  )
}
