import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const LABELS: Record<OrderStatus, string> = {
  placed: 'Placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
}

const TONES: Record<OrderStatus, string> = {
  placed: 'border-line-strong text-mocha',
  processing: 'border-gold/50 text-gold',
  shipped: 'border-gold/50 text-gold',
  delivered: 'border-charcoal/30 text-charcoal',
  cancelled: 'border-burgundy/40 text-burgundy',
  returned: 'border-burgundy/40 text-burgundy',
}

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex border px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.16em]',
        TONES[status],
      )}
    >
      {LABELS[status]}
    </span>
  )
}
