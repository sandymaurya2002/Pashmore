import type { Metadata } from 'next'
import { WishlistContent } from '@/components/wishlist/wishlist-content'

export const metadata: Metadata = { title: 'Wishlist' }

export default function AccountWishlistPage() {
  return (
    <div>
      <h2 className="font-serif text-2xl text-charcoal">Wishlist</h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-mocha">
        Saved to your account, so your wishlist follows you across devices.
      </p>

      <div className="mt-8">
        <WishlistContent />
      </div>
    </div>
  )
}
