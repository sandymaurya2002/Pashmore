import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ExternalLink } from 'lucide-react'

import { OrderActions } from '@/components/account/order-actions'
import { ORDER_STATUS_LABELS, OrderStatusChip } from '@/components/account/order-status-chip'
import { OrderSummary } from '@/components/cart/order-summary'
import { getOrder } from '@/server/account'
import { formatDate, formatPrice } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ placed?: string; payment?: string }>
}

export const metadata: Metadata = { title: 'Order' }

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Due on delivery',
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  FAILED: 'Payment failed',
  REFUND_PENDING: 'Refund in progress',
  PARTIALLY_REFUNDED: 'Partly refunded',
  REFUNDED: 'Refunded',
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const order = await getOrder(id)
  if (!order) notFound()

  const justPlaced = query.placed === '1'
  const paymentProblem = query.payment === 'failed' || query.payment === 'cancelled'
  const online = order.paymentMethodCode === 'RAZORPAY'
  const confirming = justPlaced && online && order.awaitingPayment === true

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-taupe transition-colors hover:text-charcoal"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        All orders
      </Link>

      {justPlaced && !order.awaitingPayment && (
        <div className="mt-6 border border-gold/40 bg-gold/5 p-6" role="status">
          <p className="eyebrow text-gold">Thank you</p>
          <h2 className="mt-3 font-serif text-2xl text-charcoal">Your order is confirmed</h2>
          <p className="mt-3 text-sm leading-relaxed text-mocha">
            A confirmation is on its way to your inbox. You can follow your order here at any time.
          </p>
        </div>
      )}
      {confirming && (
        <div className="mt-6 border border-line bg-cream/40 p-6" role="status">
          <p className="eyebrow text-taupe">Confirming payment</p>
          <p className="mt-3 text-sm leading-relaxed text-mocha">
            We are confirming your payment with the bank. This usually takes a few seconds; this
            page updates on its own. If money left your account, it is safe — you will not be
            charged twice.
          </p>
        </div>
      )}
      {paymentProblem && order.awaitingPayment && (
        <div className="mt-6 border border-burgundy/30 bg-burgundy/5 p-6" role="alert">
          <p className="text-sm text-burgundy">
            {query.payment === 'failed'
              ? 'Your payment did not go through. No money has been taken — please try again.'
              : 'Payment was not completed. Your order is held for you; pay below to confirm it.'}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-charcoal">Order {order.number}</h2>
          {order.placedAt && (
            <p className="mt-1.5 text-xs text-taupe">Placed {formatDate(order.placedAt)}</p>
          )}
        </div>
        <OrderStatusChip status={order.status} />
      </div>

      <OrderActions
        orderId={order.id}
        awaitingPayment={Boolean(order.awaitingPayment)}
        paymentExpiresAt={order.paymentExpiresAt}
        canCancel={Boolean(order.canCancel)}
        canReturn={Boolean(order.canReturn)}
        confirming={confirming}
      />

      {(order.trackingNumber || order.estimatedDelivery) && (
        <div className="mt-6 border border-line bg-cream/40 px-5 py-4">
          {order.trackingNumber && (
            <p className="flex flex-wrap items-center gap-x-2 text-sm text-charcoal">
              Tracking number <span className="tabular-nums">{order.trackingNumber}</span>
              {order.carrier && <span className="text-mocha">· {order.carrier}</span>}
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-gold underline underline-offset-4"
                >
                  Track shipment <ExternalLink className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                </a>
              )}
            </p>
          )}
          {order.estimatedDelivery && (
            <p className="mt-1 text-xs text-taupe">
              Estimated delivery {formatDate(order.estimatedDelivery)}
            </p>
          )}
        </div>
      )}

      {order.returnReason && (
        <p className="mt-6 text-sm text-mocha">
          <span className="text-taupe">Return reason:</span> {order.returnReason}
        </p>
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
                  {formatPrice(item.unitPrice * item.quantity, order.currency)}
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
              <p className="text-sm text-mocha">
                {online ? 'Online payment' : order.paymentMethod}
                {order.paymentStatus && (
                  <span className="text-taupe">
                    {' '}
                    · {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                  </span>
                )}
              </p>
              {order.refunded ? (
                <p className="mt-1 text-xs text-taupe">{formatPrice(order.refunded, order.currency)} refunded</p>
              ) : null}
            </section>
          )}

          {order.history && order.history.length > 0 && (
            <section aria-labelledby="order-history" className="mt-8">
              <h3 id="order-history" className="eyebrow mb-4 text-taupe">
                Order updates
              </h3>
              <ol className="relative flex flex-col gap-4 border-l border-line pl-5">
                {[...order.history].reverse().map((entry, index) => (
                  <li key={`${entry.status}-${entry.createdAt}-${index}`} className="relative">
                    <span
                      className="absolute -left-[1.4rem] top-1.5 h-2 w-2 rounded-full bg-gold"
                      aria-hidden
                    />
                    <p className="text-sm text-charcoal">{ORDER_STATUS_LABELS[entry.status]}</p>
                    {entry.createdAt && (
                      <p className="text-xs text-taupe">
                        {formatDate(entry.createdAt)}{' '}
                        {new Date(entry.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </section>

        <aside>
          <OrderSummary totals={order.totals} currency={order.currency} title="Order total" />
        </aside>
      </div>
    </div>
  )
}
