import { ProductCard } from '@/components/product/product-card'
import { cn } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductGridProps {
  products: Product[]
  className?: string
  /** Columns at the widest breakpoint. Mobile is always 2, tablet always 3. */
  columns?: 3 | 4
  /** Marks the first N images as priority for LCP on above-the-fold grids. */
  priorityCount?: number
}

export function ProductGrid({
  products,
  className,
  columns = 4,
  priorityCount = 0,
}: ProductGridProps) {
  const sizes =
    columns === 4
      ? '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 45vw'
      : '(min-width: 1280px) 30vw, (min-width: 768px) 30vw, 45vw'

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 md:gap-y-14',
        columns === 4 && 'xl:grid-cols-4',
        className,
      )}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.slug}
          product={product}
          sizes={sizes}
          priority={index < priorityCount}
        />
      ))}
    </div>
  )
}
