'use client'

import { ProductCarousel } from '@/components/product/product-carousel'
import { useRecentlyViewed } from '@/context/recently-viewed-context'
import { useProductsBySlugs } from '@/hooks/use-products-by-slugs'

/**
 * Renders nothing until there is genuinely something to show, so the section
 * never occupies space it cannot fill — no placeholder, no layout shift.
 */
export function RecentlyViewed({ excludeSlug }: { excludeSlug?: string }) {
  const { slugs, hydrated } = useRecentlyViewed()
  const visible = slugs.filter((slug) => slug !== excludeSlug).slice(0, 8)
  const { products } = useProductsBySlugs(visible, hydrated)

  if (!hydrated || products.length < 2) return null

  return (
    <div className="border-t border-line">
      <ProductCarousel products={products} heading="Recently Viewed" />
    </div>
  )
}
