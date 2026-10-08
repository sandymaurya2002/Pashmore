import { ShieldCheck } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { CartTotals, Coupon } from '@/types'

export function OrderSummary({
  totals,
  coupon,
  title = 'Order Summary',
}: {
  totals: CartTotals
  coupon?: Coupon | null
  title?: string
}) {
  return (
    <section aria-labelledby="order-summary" className="border border-line bg-cream/40 p-6">
      <h2 id="order-summary" className="font-serif text-xl text-charcoal">
        {title}
      </h2>

      <dl className="mt-6 flex flex-col gap-3 text-sm">
        <Row label={`Subtotal (${totals.itemCount} items)`} value={formatPrice(totals.subtotal)} />

        {totals.discount > 0 && (
          <Row
            label={coupon ? `Discount (${coupon.code})` : 'Discount'}
            value={`− ${formatPrice(totals.discount)}`}
            tone="discount"
          />
        )}

        <Row
          label="Shipping"
          value={totals.shipping === 0 ? 'Complimentary' : formatPrice(totals.shipping)}
        />

        <Row label="GST (included)" value={formatPrice(totals.tax)} muted />

        <div className="mt-3 flex items-baseline justify-between border-t border-line pt-4">
          <dt className="text-[0.8125rem] uppercase tracking-[0.14em] text-charcoal">
            Total
          </dt>
          <dd className="font-serif text-2xl text-charcoal">{formatPrice(totals.total)}</dd>
        </div>
      </dl>

      <p className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-taupe">
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-gold" strokeWidth={1.25} />
        All prices include GST. Payments are processed over an encrypted connection and card
        details never touch our servers.
      </p>
    </section>
  )
}

function Row({
  label,
  value,
  tone,
  muted,
}: {
  label: string
  value: string
  tone?: 'discount'
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className={muted ? 'text-taupe' : 'text-mocha'}>{label}</dt>
      <dd
        className={
          tone === 'discount' ? 'text-burgundy' : muted ? 'text-taupe' : 'text-charcoal'
        }
      >
        {value}
      </dd>
    </div>
  )
}
