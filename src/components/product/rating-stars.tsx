import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductRating } from '@/types'

/**
 * Rendered only when the data source supplied genuine rating data — the same
 * condition that gates the AggregateRating JSON-LD, so the visible page and the
 * structured data always agree.
 */
export function RatingStars({
  rating,
  className,
  href,
}: {
  rating: ProductRating
  className?: string
  href?: string
}) {
  const rounded = Math.round(rating.average * 2) / 2

  const content = (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span aria-hidden className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              'h-3.5 w-3.5',
              star <= rounded ? 'fill-gold text-gold' : 'text-line-strong',
            )}
            strokeWidth={1}
          />
        ))}
      </span>
      <span className="text-xs text-mocha">
        {rating.average.toFixed(1)} · {rating.count} reviews
      </span>
      <span className="sr-only">
        Rated {rating.average} out of 5 from {rating.count} reviews
      </span>
    </span>
  )

  if (!href) return content
  return (
    <a href={href} className="transition-opacity hover:opacity-75">
      {content}
    </a>
  )
}
