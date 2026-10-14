import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Order placed',
  placed: 'Placed',
  confirmed: 'Confirmed',
  payment_pending: 'Awaiting payment',
  payment_failed: 'Payment failed',
  paid: 'Paid',
  processing: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  return_requested: 'Return requested',
  returned: 'Returned',
  refund_pending: 'Refund in progress',
  refunded: 'Refunded',
}

const TONES: Record<OrderStatus, string> = {
  pending: 'border-line-strong text-mocha',
  placed: 'border-line-strong text-mocha',
  confirmed: 'border-line-strong text-mocha',
  payment_pending: 'border-line-strong text-taupe',
  payment_failed: 'border-burgundy/40 text-burgundy',
  paid: 'border-gold/50 text-gold',
  processing: 'border-gold/50 text-gold',
  packed: 'border-gold/50 text-gold',
  shipped: 'border-gold/50 text-gold',
  out_for_delivery: 'border-gold/50 text-gold',
  delivered: 'border-charcoal/30 text-charcoal',
  cancelled: 'border-burgundy/40 text-burgundy',
  return_requested: 'border-burgundy/40 text-burgundy',
  returned: 'border-burgundy/40 text-burgundy',
  refund_pending: 'border-burgundy/40 text-burgundy',
  refunded: 'border-line-strong text-mocha',
}

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex border px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.16em]',
        TONES[status],
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  )
}
