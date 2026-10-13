'use client'

import { Heart } from 'lucide-react'
import { ProductGrid } from '@/components/product/product-grid'
import { ProductGridSkeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useWishlist } from '@/context/wishlist-context'
import { useProductsBySlugs } from '@/hooks/use-products-by-slugs'
import { pluralise } from '@/lib/utils'

export function WishlistContent() {
  const { slugs, hydrated, synced, clear } = useWishlist()
  const { products, loading, error } = useProductsBySlugs(slugs, hydrated)

  // Until the wishlist itself is known there is genuinely nothing to say, so we
  // show the skeleton rather than flashing an incorrect empty state.
  if (!hydrated || (loading && !products.length && slugs.length > 0)) {
    return <ProductGridSkeleton count={4} />
  }

  if (!slugs.length) {
    return (
      <EmptyState
        className="mt-6"
        icon={<Heart className="h-6 w-6" strokeWidth={1} />}
        title="Nothing saved yet"
        description={
          synced
            ? 'Tap the heart on any piece to keep it here. Your wishlist is saved to your account.'
            : 'Tap the heart on any piece to keep it here. Your wishlist is stored on this device — sign in to keep it across devices.'
        }
        actionHref="/collections/best-sellers"
        actionLabel="Shop Best Sellers"
        secondaryHref="/collections/new-arrivals"
        secondaryLabel="New Arrivals"
      />
    )
  }

  if (error && !products.length) {
    return (
      <EmptyState
        className="mt-6"
        icon={<Heart className="h-6 w-6" strokeWidth={1} />}
        title="Your wishlist could not be loaded"
        description={`${error} Your saved pieces are safe — please try again shortly.`}
      />
    )
  }

  // Pieces that have been unpublished or removed simply drop out of the list.
  const unavailable = slugs.length - products.length

  return (
    <>
      <div className="mt-6 flex items-center justify-between border-b border-line pb-5">
        <p className="text-sm text-taupe">
          {products.length} {pluralise(products.length, 'piece')} saved
          {unavailable > 0 && !loading
            ? ` · ${unavailable} no longer available`
            : ''}
        </p>
        <button
          type="button"
          onClick={clear}
          className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline underline-offset-4 transition-colors hover:text-charcoal"
        >
          Clear wishlist
        </button>
      </div>

      <ProductGrid products={products} className="mt-10" />
    </>
  )
}
