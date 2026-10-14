import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ProductGallery } from '@/components/product/product-gallery'
import { PurchasePanel } from '@/components/product/purchase-panel'
import { RatingStars } from '@/components/product/rating-stars'
import { ProductBadgeChip } from '@/components/ui/badge'
import { ProductGrid } from '@/components/product/product-grid'
import { SectionHeading } from '@/components/ui/section-heading'
import { RecentlyViewed } from '@/components/product/recently-viewed'
import { JsonLd } from '@/components/seo/json-ld'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { getAllCollections, getProductBySlug, getRelatedProducts } from '@/services/catalog'
import { failSoft } from '@/server/fail-soft'
import { getSiteContent } from '@/server/content'
import { buildMetadata, metaDescription, pageTitle } from '@/lib/seo'
import { formatPrice } from '@/lib/utils'
import { productKeywords } from '@/lib/keywords'
import { breadcrumbSchema, faqSchema, graph, productSchema } from '@/lib/jsonld'
import type { Breadcrumb } from '@/types'
import { withSeoOverride } from '@/server/seo'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Stock and price must be current, so the page renders per request; the
// product fetch itself is served from the Data Cache (see services/catalog).
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await failSoft(getProductBySlug(slug), null, 'product:metadata')
  if (!product) return {}

  return withSeoOverride(
    `/products/${product.slug}`,
    buildMetadata({
      title: pageTitle(product.name),
      description: metaDescription(`${product.tagline} ${product.description}`),
      path: `/products/${product.slug}`,
      image: product.images[0],
      keywords: productKeywords(product),
    }),
  )
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product) notFound()

  const [related, allCollections, { commerceByCurrency }] = await Promise.all([
    failSoft(getRelatedProducts(product, 4), [], 'product:related'),
    failSoft(getAllCollections(), [], 'product:collections'),
    getSiteContent(),
  ])
  const collectionNamed = (entry: string) => allCollections.find((c) => c.slug === entry)
  const categoryName = product.categoryName ?? collectionNamed(product.categorySlug)?.name
  const categoryHref = product.categorySlug
    ? `/collections/${product.categorySlug}`
    : '/collections'

  const crumbs: Breadcrumb[] = [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '/collections' },
    { name: categoryName ?? 'Shop', href: categoryHref },
    { name: product.name, href: `/products/${product.slug}` },
  ]

  const collections = product.collectionSlugs
    .map(collectionNamed)
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry) && !entry?.hidden)
    .slice(0, 6)

  return (
    <>
      <JsonLd
        id={`product-${product.slug}`}
        data={graph([
          productSchema(product),
          breadcrumbSchema(crumbs),
          ...(product.faqs?.length ? [faqSchema(product.faqs)] : []),
        ])}
      />

      <div className="container-luxe pt-6">
        <Breadcrumbs items={crumbs} />
      </div>

      <div className="container-luxe grid gap-12 pb-20 pt-8 lg:grid-cols-2 lg:gap-16 lg:pb-28">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <ProductGallery images={product.images} productName={product.name} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={categoryHref}
              className="eyebrow text-taupe transition-colors hover:text-charcoal"
            >
              {categoryName ?? product.material}
            </Link>
            {product.badges.map((badge) => (
              <ProductBadgeChip key={badge} badge={badge} />
            ))}
          </div>

          <h1 className="mt-4 font-serif text-[2rem] leading-[1.1] text-charcoal md:text-[2.75rem]">
            {product.name}
          </h1>

          <p className="mt-3 text-[0.9375rem] leading-relaxed text-mocha">
            {product.tagline}
          </p>

          {product.rating && (
            <div className="mt-4">
              <RatingStars rating={product.rating} />
            </div>
          )}

          <div className="mt-9">
            <PurchasePanel product={product} />
          </div>

          <Accordion
            type="multiple"
            defaultValue={['description']}
            className="mt-12"
          >
            <AccordionItem value="description">
              <AccordionTrigger>Description</AccordionTrigger>
              <AccordionContent>
                <p>{product.description}</p>
                {product.story.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)} className="mt-4">
                    {paragraph}
                  </p>
                ))}
              </AccordionContent>
            </AccordionItem>

            {product.specifications.length > 0 && (
              <AccordionItem value="details">
                <AccordionTrigger>Details & Specifications</AccordionTrigger>
                <AccordionContent>
                  <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                    {product.specifications.map((spec) => (
                      <div key={spec.label} className="flex flex-col">
                        <dt className="text-[0.6875rem] uppercase tracking-[0.12em] text-taupe">
                          {spec.label}
                        </dt>
                        <dd className="mt-1 text-charcoal">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="craft">
              <AccordionTrigger>Material & Craft</AccordionTrigger>
              <AccordionContent>
                <p>
                  <span className="text-charcoal">{product.material}.</span> {product.craft}.
                </p>
                <p className="mt-4">
                  Handmade in {product.countryOfOrigin}. Because every piece is spun and
                  woven by hand, slight variations in weave density, dye depth and fringe
                  length are inherent to the craft rather than faults in it.
                </p>
              </AccordionContent>
            </AccordionItem>

            {product.sizes.length > 0 && (
              <AccordionItem value="size">
                <AccordionTrigger>Size & Fit</AccordionTrigger>
                <AccordionContent>
                  <ul className="flex flex-col gap-2">
                    {product.sizes.map((size) => (
                      <li key={size.slug}>
                        <span className="text-charcoal">{size.name}</span>
                        {size.measurement && (
                          <span className="text-mocha"> — {size.measurement}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4">
                    Handwoven dimensions carry a tolerance of ±2 cm. Measurements are taken
                    flat, excluding fringe.
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="care">
              <AccordionTrigger>Care Instructions</AccordionTrigger>
              <AccordionContent>
                {product.careInstructions.length > 0 && (
                  <ul className="mb-4 flex list-disc flex-col gap-2 pl-4">
                    {product.careInstructions.map((instruction) => (
                      <li key={instruction}>{instruction}</li>
                    ))}
                  </ul>
                )}
                <p>
                  A fuller guide is in our journal:{' '}
                  <Link
                    href="/blog/how-to-care-for-pashmina"
                    className="link-underline text-charcoal"
                  >
                    How to care for your Pashmina
                  </Link>
                  .
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping">
              <AccordionTrigger>Shipping</AccordionTrigger>
              <AccordionContent>
                <p>
                  Dispatched from Srinagar within 48 hours. Delivery across India in 3–6
                  working days; international delivery in 7–12 working days. Shipping is
                  complimentary on Indian orders above{' '}
                  {formatPrice(commerceByCurrency.INR.freeShippingThreshold, 'INR')} and on
                  international orders above{' '}
                  {formatPrice(commerceByCurrency.USD.freeShippingThreshold, 'USD')}.
                </p>
                <p className="mt-4">
                  Full detail on our{' '}
                  <Link href="/shipping" className="link-underline text-charcoal">
                    shipping page
                  </Link>
                  .
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="returns">
              <AccordionTrigger>Returns</AccordionTrigger>
              <AccordionContent>
                <p>
                  Unused pieces in their original packaging can be returned within 14 days
                  of delivery, with free pickup across India. Made-to-order and personalised
                  pieces are excluded. See our{' '}
                  <Link href="/returns" className="link-underline text-charcoal">
                    returns policy
                  </Link>
                  .
                </p>
              </AccordionContent>
            </AccordionItem>

            {product.faqs?.length ? (
              <AccordionItem value="faqs">
                <AccordionTrigger>Frequently Asked Questions</AccordionTrigger>
                <AccordionContent>
                  <dl className="flex flex-col gap-5">
                    {product.faqs.map((faq) => (
                      <div key={faq.question}>
                        <dt className="text-charcoal">{faq.question}</dt>
                        <dd className="mt-1.5">{faq.answer}</dd>
                      </div>
                    ))}
                  </dl>
                </AccordionContent>
              </AccordionItem>
            ) : null}
          </Accordion>

          {collections.length > 0 && (
            <div className="mt-10">
              <p className="eyebrow mb-3 text-taupe">Also in</p>
              <ul className="flex flex-wrap gap-x-5 gap-y-2">
                {collections.map((collection) => (
                  <li key={collection.slug}>
                    <Link
                      href={`/collections/${collection.slug}`}
                      className="link-underline text-sm text-charcoal/85 hover:text-charcoal"
                    >
                      {collection.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section
          className="container-luxe border-t border-line py-20"
          aria-labelledby="you-may-also-like"
        >
          <SectionHeading
            id="you-may-also-like"
            title="You May Also Like"
            href={categoryHref}
            linkLabel={`All ${categoryName ?? 'pieces'}`}
          />
          <ProductGrid products={related} className="mt-12" />
        </section>
      )}

      <RecentlyViewed excludeSlug={product.slug} />
    </>
  )
}
