import { Award, Gift, RefreshCcw, ShieldCheck, Truck } from 'lucide-react'
import { FreeShippingNote } from '@/components/marketing/free-shipping-note'
import { cn } from '@/lib/utils'

const SIGNALS = [
  { icon: ShieldCheck, label: 'Secure Payments', detail: 'Razorpay · UPI · Cards' },
  { icon: RefreshCcw, label: 'Easy Returns', detail: '14 days, free pickup' },
  { icon: Gift, label: 'Premium Packaging', detail: 'Hand-bound gift box' },
  { icon: Award, label: 'Quality Crafted', detail: 'Certified by weaver' },
  { icon: Truck, label: 'Fast Shipping', detail: <FreeShippingNote /> },
]

export function TrustBar({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <ul
      className={cn(
        'grid gap-x-6 gap-y-6',
        compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-5',
        className,
      )}
    >
      {SIGNALS.slice(0, compact ? 3 : SIGNALS.length).map((signal) => (
        <li key={signal.label} className="flex items-start gap-3">
          <signal.icon
            className="mt-0.5 h-[1.15rem] w-[1.15rem] shrink-0 text-gold"
            strokeWidth={1.1}
            aria-hidden
          />
          <span>
            <span className="block text-[0.75rem] uppercase tracking-[0.12em] text-charcoal">
              {signal.label}
            </span>
            <span className="mt-0.5 block text-xs text-taupe">{signal.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
