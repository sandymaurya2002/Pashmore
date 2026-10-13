import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'

import { OrderStatusChip } from '@/components/account/order-status-chip'
import { OrderSummary } from '@/components/cart/order-summary'
import { getOrder } from '@/server/account'
import { formatDate, formatPrice } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = { title: 'Order' }

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params
  const order = await getOrder(id)
  if (!order) notFound()

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-taupe transition-colors hover:text-charcoal"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        All orders
      </Link>

      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-charcoal">Order {order.number}</h2>
          {order.placedAt && (
            <p className="mt-1.5 text-xs text-taupe">Placed {formatDate(order.placedAt)}</p>
          )}
        </div>
        <OrderStatusChip status={order.status} />
      </div>

      {order.trackingNumber && (
        <div className="mt-6 border border-line bg-cream/40 px-5 py-4">
          <p className="text-sm text-charcoal">
            Tracking number{' '}
            <span className="tabular-nums">{order.trackingNumber}</span>
            {order.carrier && <span className="text-mocha"> · {order.carrier}</span>}
          </p>
          {order.estimatedDelivery && (
            <p className="mt-1 text-xs text-taupe">
              Estimated delivery {formatDate(order.estimatedDelivery)}
            </p>
          )}
        </div>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-labelledby="order-items">
          <h3 id="order-items" className="eyebrow mb-5 text-taupe">
            Items
          </h3>
          <ul className="divide-y divide-line border-y border-line">
            {order.items.map((item, index) => (
              <li key={`${item.productSlug}-${index}`} className="flex gap-5 py-5">
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
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-base leading-snug text-charcoal">
                    <Link href={`/products/${item.productSlug}`} className="hover:text-gold">
                      {item.name}
                    </Link>
                  </p>
                  <p className="mt-1.5 text-xs text-taupe">
                    {[item.color, item.size].filter(Boolean).join(' · ')} · Qty {item.quantity}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-charcoal">
                  {formatPrice(item.unitPrice * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <section aria-labelledby="order-address" className="mt-10">
            <h3 id="order-address" className="eyebrow mb-4 text-taupe">
              Delivery address
            </h3>
            <address className="text-sm not-italic leading-relaxed text-mocha">
              {order.shippingAddress.fullName}
              <br />
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.line2 && (
                <>
                  {order.shippingAddress.line2}
                  <br />
                </>
              )}
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </address>
          </section>

          {order.paymentMethod && (
            <section aria-labelledby="order-payment" className="mt-8">
              <h3 id="order-payment" className="eyebrow mb-3 text-taupe">
                Payment
              </h3>
              <p className="text-sm text-mocha">{order.paymentMethod}</p>
            </section>
          )}
        </section>

        <aside>
          <OrderSummary totals={order.totals} title="Order total" />
        </aside>
      </div>
    </div>
  )
}
