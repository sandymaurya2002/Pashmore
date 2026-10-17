import type { Metadata } from 'next'
import Link from 'next/link'

import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { ProductGrid } from '@/components/product/product-grid'
import { EmptyState } from '@/components/ui/empty-state'
import { SortSelect } from '@/components/collection/sort-select'
import { Pagination } from '@/components/collection/pagination'
import { popularSearches } from '@/data/navigation'
import { queryProducts, searchCatalog } from '@/services/catalog'
import { failSoft } from '@/server/fail-soft'
import { parsePage, parseSort, type SearchParams } from '@/lib/query'
import { buildMetadata, pageTitle } from '@/lib/seo'
import { pluralise } from '@/lib/utils'

interface PageProps {
  searchParams: Promise<SearchParams>
}

/**
 * Internal search results are deliberately noindex: they are infinite, they
 * duplicate collection pages, and Google treats them as thin content. Customers
 * still get a proper, shareable results page.
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const term = typeof params.q === 'string' ? params.q : ''

  return buildMetadata({
    title: pageTitle(term ? `Search: ${term}` : 'Search'),
    description: 'Search the Pashmore collection of Pashmina, shawls, stoles and gifting.',
    path: '/search',
    noIndex: true,
  })
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams
  const term = (typeof params.q === 'string' ? params.q : '').trim().slice(0, 120)
  const sort = parseSort(params)

  const [results, suggestions] = term
    ? await Promise.all([
        queryProducts({ search: term, sort, page: parsePage(params) }),
        failSoft(searchCatalog(term, 1), null, 'search:collections'),
      ])
    : [null, null]
  const products = results?.products ?? []
  const total = results?.total ?? 0

  return (
    <>
    <PageTitleBanner plainClassName="container-luxe pt-12">
      <header className="max-w-2xl pb-12">
        <p className="eyebrow text-gold">Search</p>
        <h1 className="mt-5 font-serif type-page text-charcoal">
          {term ? <>Results for “{term}”</> : 'Search Pashmore'}
        </h1>
        {term && (
          <p className="mt-4 text-sm text-taupe">
            {total} {pluralise(total, 'piece')} found
          </p>
        )}
      </header>
    </PageTitleBanner>
    <div className="container-luxe pb-24">

      {!term ? (
        <section className="mt-12" aria-labelledby="popular">
          <h2 id="popular" className="eyebrow mb-5 text-taupe">
            Popular searches
          </h2>
          <ul className="flex flex-wrap gap-2">
            {popularSearches.map((query) => (
              <li key={query}>
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="inline-block border border-line-strong px-4 py-2.5 text-sm text-charcoal transition-colors duration-300 hover:border-charcoal"
                >
                  {query}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : products.length > 0 ? (
        <>
          <div className="mt-10 flex items-center justify-stretch border-b border-line pb-5 sm:justify-end">
            <SortSelect value={sort} pathname="/search" searchParams={params} />
          </div>
          <ProductGrid products={products} className="mt-10" priorityCount={2} />
          {results && (
            <Pagination
              page={results.page}
              totalPages={results.totalPages}
              pathname="/search"
              searchParams={params}
              className="mt-14"
            />
          )}

          {suggestions && suggestions.collections.length > 0 && (
            <section className="mt-16 border-t border-line pt-10" aria-labelledby="matching-collections">
              <h2 id="matching-collections" className="eyebrow mb-5 text-taupe">
                Matching collections
              </h2>
              <ul className="flex flex-wrap gap-x-8 gap-y-3">
                {suggestions.collections.map((collection) => (
                  <li key={collection.slug}>
                    <Link
                      href={`/collections/${collection.slug}`}
                      className="link-underline font-serif text-lg text-charcoal hover:text-gold"
                    >
                      {collection.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      ) : (
        <EmptyState
          className="mt-8"
          title={`No pieces match “${term}”`}
          description="Try a material — pashmina, cashmere, wool — a colour, or browse the full collection."
          actionHref="/collections"
          actionLabel="Browse Collections"
          secondaryHref="/collections/best-sellers"
          secondaryLabel="Best Sellers"
        />
      )}
    </div>
    </>
  )
}
