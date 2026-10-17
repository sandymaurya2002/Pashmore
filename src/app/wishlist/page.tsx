import type { Metadata } from 'next'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
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
    <>
      <PageTitleBanner plainClassName="container-luxe pt-12">
        <header className="max-w-2xl pb-4">
          <p className="eyebrow text-gold">Saved</p>
          <h1 className="mt-5 font-serif type-page text-charcoal">
            Your Wishlist
          </h1>
        </header>
      </PageTitleBanner>
      <div className="container-luxe pb-24">
        <WishlistContent />
      </div>
    </>
  )
}
