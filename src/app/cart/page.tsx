import type { Metadata } from 'next'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { CartPageContent } from '@/components/cart/cart-page-content'
import { getBestSellers } from '@/services/catalog'
import { failSoft } from '@/server/fail-soft'
import { buildMetadata, pageTitle } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: pageTitle('Shopping Bag'),
  description: 'Review the pieces in your Pashmore shopping bag.',
  path: '/cart',
  noIndex: true,
})

export const dynamic = 'force-dynamic'

export default async function CartPage() {
  const recommendations = await failSoft(getBestSellers(4), [], 'cart:recommendations')

  return (
    <>
      <PageTitleBanner plainClassName="container-luxe pt-12">
        <header className="max-w-2xl pb-4">
          <p className="eyebrow text-gold">Your Bag</p>
          <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.05] text-charcoal md:text-[3rem]">
            Shopping Bag
          </h1>
        </header>
      </PageTitleBanner>
      <div className="container-luxe pb-24">
        <CartPageContent recommendations={recommendations} />
      </div>
    </>
  )
}
