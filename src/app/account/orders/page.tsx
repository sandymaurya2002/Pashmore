import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'

import { EmptyState } from '@/components/ui/empty-state'
import { OrderStatusChip } from '@/components/account/order-status-chip'
import { Pagination } from '@/components/collection/pagination'
import { getOrders } from '@/server/account'
import { parsePage, type SearchParams } from '@/lib/query'
import { formatDate, formatPrice, pluralise } from '@/lib/utils'

export const metadata: Metadata = { title: 'Orders' }

interface PageProps {
  searchParams: Promise<SearchParams>
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { orders, page, totalPages } = await getOrders(parsePage(params))

  if (!orders.length && page === 1) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" strokeWidth={1} />}
        title="No orders yet"
        description="When you place an order it will appear here, with its status and tracking."
        actionHref="/collections"
        actionLabel="Start Shopping"
      />
    )
  }

  return (
    <div>
      <h2 className="font-serif text-2xl text-charcoal">Order History</h2>

      <ul className="mt-8 flex flex-col gap-5">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/account/orders/${order.id}`}
              className="group block border border-line p-6 transition-colors duration-300 hover:border-charcoal"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <div>
                  <p className="font-serif text-lg text-charcoal">{order.number}</p>
                  <p className="mt-1 text-xs text-taupe">
                    {order.placedAt ? `Placed ${formatDate(order.placedAt)} · ` : ''}
                    {order.totals.itemCount} {pluralise(order.totals.itemCount, 'item')} ·{' '}
                    {formatPrice(order.totals.total)}
                  </p>
                </div>
                <OrderStatusChip status={order.status} />
              </div>

              {order.items.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {order.items.map((item, index) => (
                    <li
                      key={`${order.id}-${item.productSlug}-${index}`}
                      className="relative aspect-4/5 w-14 overflow-hidden bg-ivory-deep"
                    >
                      <Image
                        src={item.image.url}
                        alt={item.image.alt}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          </li>
        ))}
      </ul>

      <Pagination
        page={page}
        totalPages={totalPages}
        pathname="/account/orders"
        searchParams={params}
        className="mt-10"
      />
    </div>
  )
}
