import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { getCustomer, getOrders } from '@/server/account'
import { formatDate, formatPrice } from '@/lib/utils'
import { OrderStatusChip } from '@/components/account/order-status-chip'

export default async function AccountOverviewPage() {
  const [customer, { orders }] = await Promise.all([getCustomer(), getOrders(1, '/account')])
  const [latest] = orders

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="account-greeting">
        <h2 id="account-greeting" className="font-serif text-2xl text-charcoal">
          Welcome back{customer.firstName ? `, ${customer.firstName}` : ''}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-mocha">
          {customer.createdAt
            ? `You have been with Pashmore since ${formatDate(customer.createdAt)}. `
            : ''}
          Signed in as {customer.email}.
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
              <dd className="mt-1 text-sm text-charcoal">{formatPrice(latest.totals.total, latest.currency)}</dd>
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
            ['All orders', '/account/orders', 'Order history, status and tracking.'],
            ['Saved addresses', '/account/addresses', 'Manage your delivery addresses.'],
            ['Profile', '/account/profile', 'Update your name, phone and preferences.'],
            ['Wishlist', '/account/wishlist', 'Everything you have saved to your account.'],
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
