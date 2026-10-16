import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { FilterSidebar } from '@/components/collection/filter-sidebar'
import { FilterDrawer } from '@/components/collection/filter-drawer'
import { SortSelect } from '@/components/collection/sort-select'
import { ActiveFilters } from '@/components/collection/active-filters'
import { Pagination } from '@/components/collection/pagination'
import { ProductGrid } from '@/components/product/product-grid'
import { EmptyState } from '@/components/ui/empty-state'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { JsonLd } from '@/components/seo/json-ld'

import { getAllCollections, getCollectionBySlug, queryProducts } from '@/services/catalog'
import { failSoft } from '@/server/fail-soft'
import {
  countActiveFilters,
  parseFilters,
  parsePage,
  parseSort,
  type SearchParams,
} from '@/lib/query'
import { buildMetadata, metaDescription, pageTitle } from '@/lib/seo'
import { collectionKeywords } from '@/lib/keywords'
import { breadcrumbSchema, collectionPageSchema, faqSchema, graph } from '@/lib/jsonld'
import { pluralise } from '@/lib/utils'
import type { Breadcrumb } from '@/types'
import { withSeoOverride } from '@/server/seo'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<SearchParams>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const collection = await failSoft(getCollectionBySlug(slug), null, 'collection:metadata')
  if (!collection) return {}

  return withSeoOverride(
    `/collections/${collection.slug}`,
    buildMetadata({
      title: pageTitle(collection.heading ?? collection.name),
      description: metaDescription(collection.description),
      path: `/collections/${collection.slug}`,
      image: collection.bannerImage,
      keywords: collectionKeywords(collection.slug),
    }),
  )
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams

  const collection = await getCollectionBySlug(slug)
  if (!collection) notFound()

  const filters = parseFilters(resolvedSearchParams)
  const sort = parseSort(resolvedSearchParams)
  const [{ products, total, facets, page, totalPages }, allCollections] = await Promise.all([
    queryProducts({
      collectionSlug: slug,
      filters,
      sort,
      page: parsePage(resolvedSearchParams),
    }),
    failSoft(getAllCollections(), [], 'collection:related'),
  ])

  const pathname = `/collections/${slug}`
  const activeCount = countActiveFilters(filters)
  const heading = collection.heading ?? collection.name

  const crumbs: Breadcrumb[] = [
    { name: 'Home', href: '/' },
    { name: 'Collections', href: '/collections' },
    { name: heading, href: pathname },
  ]

  const related = collection.relatedSlugs
    .map((relatedSlug) => allCollections.find((entry) => entry.slug === relatedSlug))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

  return (
    <>
      <JsonLd
        id={`collection-${slug}`}
        data={graph([
          collectionPageSchema({ collection, path: pathname, products }),
          breadcrumbSchema(crumbs),
          // FAQPage only when the questions are genuinely rendered below.
          ...(collection.faqs?.length ? [faqSchema(collection.faqs)] : []),
        ])}
      />

      <PageTitleBanner
        image={{ url: collection.bannerImage.url, alt: collection.bannerImage.alt }}
      >
        <Breadcrumbs items={crumbs} tone="light" className="mb-5" />
        <h1 className="font-serif text-[2.25rem] leading-[1.05] text-ivory md:text-[3.5rem]">
          {heading}
        </h1>
      </PageTitleBanner>

      <div className="container-luxe">
        <p className="max-w-3xl py-10 text-[0.9375rem] leading-relaxed text-mocha">
          {collection.description}
        </p>

        <div className="flex gap-12 pb-24">
          {/* Desktop filter rail */}
          <aside className="hidden w-64 shrink-0 lg:block" aria-label="Filters">
            <div className="sticky top-28">
              <h2 className="eyebrow mb-2 text-taupe">Filter</h2>
              <FilterSidebar
                facets={facets}
                filters={filters}
                searchParams={resolvedSearchParams}
                pathname={pathname}
              />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-line pb-5">
              <FilterDrawer activeCount={activeCount} resultCount={total}>
                <FilterSidebar
                  facets={facets}
                  filters={filters}
                  searchParams={resolvedSearchParams}
                  pathname={pathname}
                />
              </FilterDrawer>

              <p className="text-xs text-taupe" aria-live="polite">
                {total} {pluralise(total, 'piece')}
              </p>

              <SortSelect
                value={sort}
                pathname={pathname}
                searchParams={resolvedSearchParams}
                className="w-full sm:ml-auto sm:w-auto"
              />
            </div>

            {activeCount > 0 && (
              <ActiveFilters
                filters={filters}
                facets={facets}
                pathname={pathname}
                searchParams={resolvedSearchParams}
                className="mt-6"
              />
            )}

            {products.length > 0 ? (
              <>
                <ProductGrid products={products} className="mt-10" priorityCount={2} />
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  pathname={pathname}
                  searchParams={resolvedSearchParams}
                  className="mt-14"
                />
              </>
            ) : activeCount > 0 ? (
              <EmptyState
                className="mt-16"
                title="Nothing matches those filters"
                description="Try widening your selection, or browse the full collection."
                actionHref={pathname}
                actionLabel="Clear filters"
              />
            ) : (
              <EmptyState
                className="mt-16"
                title="New pieces are on the loom"
                description="This collection has no pieces available right now. Explore our other collections in the meantime."
                actionHref="/collections"
                actionLabel="All collections"
              />
            )}
          </div>
        </div>
      </div>

      {/* Long-form copy for search intent, below the products where it belongs. */}
      {collection.seoContent?.length ? (
        <section className="border-t border-line bg-cream/40 py-20">
          <div className="container-luxe max-w-3xl">
            <h2 className="font-serif text-[1.75rem] leading-tight text-charcoal md:text-[2.25rem]">
              About {heading}
            </h2>
            {collection.seoContent.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="mt-6 text-[0.9375rem] leading-relaxed text-mocha"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {collection.faqs?.length ? (
        <section className="border-t border-line py-20" aria-labelledby="collection-faqs">
          <div className="container-luxe max-w-3xl">
            <h2
              id="collection-faqs"
              className="font-serif text-[1.75rem] leading-tight text-charcoal md:text-[2.25rem]"
            >
              Frequently Asked Questions
            </h2>
            <Accordion type="single" collapsible className="mt-8">
              {collection.faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      ) : null}

      {related.length > 0 && (
        <section className="border-t border-line py-16" aria-labelledby="related-collections">
          <div className="container-luxe">
            <h2 id="related-collections" className="eyebrow mb-6 text-taupe">
              Continue browsing
            </h2>
            <ul className="flex flex-wrap gap-x-8 gap-y-3">
              {related.map((entry) => (
                <li key={entry.slug}>
                  <Link
                    href={`/collections/${entry.slug}`}
                    className="link-underline font-serif text-lg text-charcoal transition-colors hover:text-gold"
                  >
                    {entry.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  )
}
