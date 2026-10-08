import type { Metadata } from 'next'
import { CartPageContent } from '@/components/cart/cart-page-content'
import { getBestSellers } from '@/services/catalog'
import { buildMetadata, pageTitle } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: pageTitle('Shopping Bag'),
  description: 'Review the pieces in your Pashmore shopping bag.',
  path: '/cart',
  noIndex: true,
})

export default async function CartPage() {
  const recommendations = await getBestSellers(4)

  return (
    <div className="container-luxe pb-24 pt-12">
      <header className="max-w-2xl">
        <p className="eyebrow text-gold">Your Bag</p>
        <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.05] text-charcoal md:text-[3rem]">
          Shopping Bag
        </h1>
      </header>

      <CartPageContent recommendations={recommendations} />
    </div>
  )
}
