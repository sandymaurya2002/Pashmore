import type { Metadata } from 'next'

import { HeroSection } from '@/components/home/hero-section'
import { EditorialIntro } from '@/components/home/editorial-intro'
import { CategoryCards } from '@/components/home/category-cards'
import { FeaturedBanner } from '@/components/home/featured-banner'
import { HeritageStory } from '@/components/home/heritage-story'
import { GiftingBanner } from '@/components/home/gifting-banner'
import { GiftPackagingBanner } from '@/components/home/gift-packaging-banner'
import { SocialGrid } from '@/components/home/social-grid'
import { ProductCarousel } from '@/components/product/product-carousel'
import { ProductGrid } from '@/components/product/product-grid'
import { SectionHeading } from '@/components/ui/section-heading'
import { TrustBar } from '@/components/marketing/trust-bar'
import { JsonLd } from '@/components/seo/json-ld'
import { RecentlyViewed } from '@/components/product/recently-viewed'

import { getBestSellers, getNewArrivals } from '@/services/catalog'
import { failSoft } from '@/server/fail-soft'
import { buildMetadata } from '@/lib/seo'
import { graph, webPageSchema } from '@/lib/jsonld'
import { site } from '@/lib/site'
import { siteKeywords } from '@/lib/keywords'

export const metadata: Metadata = buildMetadata({
  title: 'Pashmore | Luxury Pashmina, Shawls & Indian Craftsmanship',
  description: site.description,
  path: '/',
  keywords: siteKeywords,
})

// Rendered per request so builds never depend on the Worker; the catalogue
// fetches themselves are served from the Data Cache.
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [newArrivals, bestSellers] = await Promise.all([
    failSoft(getNewArrivals(8), [], 'home:new-arrivals'),
    failSoft(getBestSellers(8), [], 'home:best-sellers'),
  ])

  return (
    <>
      <JsonLd
        id="home-graph"
        data={graph([
          webPageSchema({
            path: '/',
            name: 'Pashmore | Luxury Pashmina, Shawls & Indian Craftsmanship',
            description: site.description,
          }),
        ])}
      />

      <HeroSection />
      <EditorialIntro />
      <CategoryCards />

      {newArrivals.length > 0 && (
        <ProductCarousel
          products={newArrivals}
          heading="New Arrivals"
          subheading="Fresh expressions of timeless craftsmanship."
          viewAllHref="/collections/new-arrivals"
          viewAllLabel="View all new arrivals"
        />
      )}

      <FeaturedBanner />
      <HeritageStory />
      <GiftPackagingBanner />

      {bestSellers.length > 0 && (
        <section className="container-luxe py-20 lg:py-28" aria-labelledby="most-loved">
          <SectionHeading
            id="most-loved"
            eyebrow="Best Sellers"
            title="Most Loved"
            description="The pieces our customers return to, ranked by what actually sells."
            href="/collections/best-sellers"
            linkLabel="View all"
          />
          <ProductGrid products={bestSellers} className="mt-14" />
        </section>
      )}

      <GiftingBanner />

      <section className="container-luxe border-y border-line py-12">
        <h2 className="sr-only">Why shop with Pashmore</h2>
        <TrustBar />
      </section>

      <RecentlyViewed />
      <SocialGrid />
    </>
  )
}
