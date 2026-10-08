import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { demoCustomer } from '@/data/account'
import { getOrders } from '@/services/orders'
import { formatDate, formatPrice } from '@/lib/utils'
import { OrderStatusChip } from '@/components/account/order-status-chip'

export default async function AccountOverviewPage() {
  const orders = await getOrders()
  const [latest] = orders

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="account-greeting">
        <h2 id="account-greeting" className="font-serif text-2xl text-charcoal">
          Welcome back, {demoCustomer.firstName}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-mocha">
          You have been with Pashmore since {formatDate(demoCustomer.createdAt)}. This is a demo
          account — connect an authentication provider to see real customer data here.
        </p>
      </section>

      {latest && (
        <section aria-labelledby="latest-order" className="border border-line p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="latest-order" className="font-serif text-xl text-charcoal">
              Latest order
            </h2>
            <OrderStatusChip status={latest.status} />
          </div>

          <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="eyebrow text-taupe">Order</dt>
              <dd className="mt-1 text-sm text-charcoal">{latest.number}</dd>
            </div>
            <div>
              <dt className="eyebrow text-taupe">Placed</dt>
              <dd className="mt-1 text-sm text-charcoal">{formatDate(latest.placedAt)}</dd>
            </div>
            <div>
              <dt className="eyebrow text-taupe">Total</dt>
              <dd className="mt-1 text-sm text-charcoal">{formatPrice(latest.totals.total)}</dd>
            </div>
          </dl>

          <Link
            href={`/account/orders/${latest.id}`}
            className="group mt-6 inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.16em] text-charcoal transition-colors hover:text-gold"
          >
            View order
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-1"
              strokeWidth={1.25}
            />
          </Link>
        </section>
      )}

      <section aria-labelledby="account-shortcuts">
        <h2 id="account-shortcuts" className="eyebrow mb-5 text-taupe">
          Quick links
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {[
            ['All orders', '/account/orders', 'Track, reorder and download invoices.'],
            ['Saved addresses', '/account/addresses', 'Manage delivery and billing addresses.'],
            ['Profile', '/account/profile', 'Update your name, email and preferences.'],
            ['Wishlist', '/account/wishlist', 'Everything you have saved on this device.'],
          ].map(([label, href, detail]) => (
            <li key={href}>
              <Link
                href={href}
                className="group block border border-line p-5 transition-colors duration-300 hover:border-charcoal"
              >
                <span className="block font-serif text-lg text-charcoal">{label}</span>
                <span className="mt-1.5 block text-sm text-mocha">{detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
