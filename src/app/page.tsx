import type { Metadata } from 'next'
import { Fragment, type ReactNode } from 'react'

import { HeroSection } from '@/components/home/hero-section'
import { EditorialIntro } from '@/components/home/editorial-intro'
import { CategoryCards } from '@/components/home/category-cards'
import { FeaturedBanner } from '@/components/home/featured-banner'
import { HeritageStory } from '@/components/home/heritage-story'
import { GiftingBanner } from '@/components/home/gifting-banner'
import { GiftPackagingBanner } from '@/components/home/gift-packaging-banner'
import { SocialGrid } from '@/components/home/social-grid'
import { CmsBanner } from '@/components/home/cms-banner'
import { ProductCarousel } from '@/components/product/product-carousel'
import { ProductGrid } from '@/components/product/product-grid'
import { SectionHeading } from '@/components/ui/section-heading'
import { TrustBar } from '@/components/marketing/trust-bar'
import { JsonLd } from '@/components/seo/json-ld'
import { RecentlyViewed } from '@/components/product/recently-viewed'

import { getBestSellers, getMerchandisedRail, getNewArrivals } from '@/services/catalog'
import { getHomeContent, type Banner, type HomeSection } from '@/server/content'
import { failSoft } from '@/server/fail-soft'
import { buildMetadata } from '@/lib/seo'
import { withSeoOverride } from '@/server/seo'
import { graph, webPageSchema } from '@/lib/jsonld'
import { site } from '@/lib/site'
import { siteKeywords } from '@/lib/keywords'
import type { Product } from '@/types'

const BASE_METADATA: Metadata = buildMetadata({
  title: 'Pashmore | Luxury Pashmina, Shawls & Indian Craftsmanship',
  description: site.description,
  path: '/',
  keywords: siteKeywords,
})

export function generateMetadata(): Promise<Metadata> {
  return withSeoOverride('/', BASE_METADATA)
}

// Rendered per request so builds never depend on the Worker; the catalogue
// and content fetches themselves are served from the Data Cache.
export const dynamic = 'force-dynamic'

/** The homepage as it was before it became editable; used when the CMS is unavailable. */
const DEFAULT_SECTIONS: HomeSection[] = [
  { key: 'hero', type: 'BANNER', isActive: true },
  { key: 'editorial-intro', type: 'STATIC', isActive: true },
  { key: 'category-cards', type: 'STATIC', isActive: true },
  {
    key: 'new-arrivals',
    type: 'PRODUCT_RAIL',
    heading: 'New Arrivals',
    subheading: 'Fresh expressions of timeless craftsmanship.',
    href: '/collections/new-arrivals',
    linkLabel: 'View all new arrivals',
    isActive: true,
  },
  { key: 'featured-banner', type: 'BANNER', isActive: true },
  { key: 'heritage-story', type: 'STATIC', isActive: true },
  { key: 'gift-packaging', type: 'BANNER', isActive: true },
  {
    key: 'best-sellers',
    type: 'PRODUCT_GRID',
    heading: 'Most Loved',
    subheading: 'The pieces our customers return to, ranked by what actually sells.',
    href: '/collections/best-sellers',
    linkLabel: 'View all',
    isActive: true,
  },
  { key: 'gifting-banner', type: 'BANNER', isActive: true },
  { key: 'trust-bar', type: 'STATIC', isActive: true },
  { key: 'recently-viewed', type: 'STATIC', isActive: true },
  { key: 'social-grid', type: 'STATIC', isActive: true },
]

const BANNER_SLOTS: Record<
  string,
  { placement: string; variant: 'hero' | 'feature'; fallback: (section: HomeSection) => ReactNode }
> = {
  hero: {
    placement: 'HOME_HERO',
    variant: 'hero',
    fallback: (section) => <HeroSection section={section} />,
  },
  'featured-banner': {
    placement: 'HOME_FEATURED',
    variant: 'feature',
    fallback: (section) => <FeaturedBanner section={section} />,
  },
  'gift-packaging': {
    placement: 'HOME_GIFT_PACKAGING',
    variant: 'feature',
    fallback: (section) => <GiftPackagingBanner section={section} />,
  },
  'gifting-banner': {
    placement: 'HOME_GIFTING',
    variant: 'feature',
    fallback: (section) => <GiftingBanner section={section} />,
  },
}

const STATIC_SECTIONS: Record<string, (section: HomeSection) => ReactNode> = {
  'editorial-intro': (section) => <EditorialIntro section={section} />,
  'category-cards': (section) => <CategoryCards section={section} />,
  'heritage-story': (section) => <HeritageStory section={section} />,
  'trust-bar': () => (
    <section className="container-luxe border-y border-line py-12">
      <h2 className="sr-only">Why shop with Pashmore</h2>
      <TrustBar />
    </section>
  ),
  'recently-viewed': () => <RecentlyViewed />,
  'social-grid': (section) => <SocialGrid section={section} />,
}

export default async function HomePage() {
  const content = await getHomeContent()
  const sections = (content?.sections.length ? content.sections : DEFAULT_SECTIONS).filter(
    (section) => section.isActive,
  )
  const banners: Record<string, Banner[]> = content?.banners ?? {}
  const wanted = new Set(sections.map((section) => section.key))

  const [newArrivals, bestSellers, featured, trending] = await Promise.all([
    wanted.has('new-arrivals') ? failSoft(getNewArrivals(8), [], 'home:new-arrivals') : [],
    wanted.has('best-sellers') ? failSoft(getBestSellers(8), [], 'home:best-sellers') : [],
    wanted.has('featured-products')
      ? failSoft(getMerchandisedRail('featured', 8), [], 'home:featured')
      : [],
    wanted.has('trending') ? failSoft(getMerchandisedRail('trending', 8), [], 'home:trending') : [],
  ])
  const products: Record<string, Product[]> = {
    'new-arrivals': newArrivals,
    'best-sellers': bestSellers,
    'featured-products': featured,
    trending,
  }

  function render(section: HomeSection): ReactNode {
    const slot = BANNER_SLOTS[section.key]
    if (slot) {
      const banner = banners[slot.placement]?.[0]
      return banner ? (
        <CmsBanner banner={banner} variant={slot.variant} priority={slot.variant === 'hero'} />
      ) : (
        slot.fallback(section)
      )
    }

    const staticSection = STATIC_SECTIONS[section.key]
    if (staticSection) return staticSection(section)

    const rail = products[section.key]
    if (!rail?.length) return null
    if (section.type === 'PRODUCT_GRID') {
      const headingId = `home-${section.key}`
      return (
        <section className="container-luxe py-20 lg:py-28" aria-labelledby={headingId}>
          <SectionHeading
            id={headingId}
            eyebrow={section.eyebrow ?? (section.key === 'best-sellers' ? 'Best Sellers' : undefined)}
            title={section.heading ?? ''}
            description={section.subheading}
            href={section.href}
            linkLabel={section.linkLabel}
          />
          <ProductGrid products={rail} className="mt-14" />
        </section>
      )
    }
    return (
      <ProductCarousel
        products={rail}
        heading={section.heading ?? ''}
        subheading={section.subheading}
        viewAllHref={section.href}
        viewAllLabel={section.linkLabel}
      />
    )
  }

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

      {sections.map((section) => (
        <Fragment key={section.key}>{render(section)}</Fragment>
      ))}
    </>
  )
}
