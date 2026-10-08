import type { Metadata } from 'next'
import { WishlistContent } from '@/components/wishlist/wishlist-content'
import { buildMetadata, pageTitle } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: pageTitle('Wishlist'),
  description: 'The Pashmore pieces you have saved.',
  path: '/wishlist',
  noIndex: true,
})

export default function WishlistPage() {
  return (
    <div className="container-luxe pb-24 pt-12">
      <header className="max-w-2xl">
        <p className="eyebrow text-gold">Saved</p>
        <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.05] text-charcoal md:text-[3rem]">
          Your Wishlist
        </h1>
      </header>

      <WishlistContent />
    </div>
  )
}
