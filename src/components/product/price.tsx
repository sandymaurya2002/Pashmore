import { cn, discountPercent, formatPrice } from '@/lib/utils'

interface PriceProps {
  price: number
  compareAtPrice?: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
  /** Shows the saving as a percentage chip. */
  showDiscount?: boolean
}

const SIZES = {
  sm: 'text-[0.8125rem]',
  md: 'text-[0.9375rem]',
  lg: 'text-lg',
} as const

export function Price({
  price,
  compareAtPrice,
  className,
  size = 'md',
  showDiscount = true,
}: PriceProps) {
  const discount = discountPercent(price, compareAtPrice)

  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2.5 gap-y-1', SIZES[size], className)}>
      <span className="text-charcoal">{formatPrice(price)}</span>
      {discount > 0 && compareAtPrice && (
        <>
          <span className="text-taupe line-through" aria-label={`Was ${formatPrice(compareAtPrice)}`}>
            {formatPrice(compareAtPrice)}
          </span>
          {showDiscount && (
            <span className="text-[0.6875rem] uppercase tracking-[0.12em] text-burgundy">
              {discount}% off
            </span>
          )}
        </>
      )}
    </p>
  )
}
