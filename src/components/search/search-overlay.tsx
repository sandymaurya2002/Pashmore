'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Search as SearchIcon } from 'lucide-react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useUI } from '@/context/ui-context'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import { popularSearches } from '@/data/navigation'
import { bff } from '@/lib/api/browser'
import { formatPrice } from '@/lib/utils'
import type { ProductImage } from '@/types'

interface SearchResponse {
  total: number
  products: Array<{
    slug: string
    name: string
    material: string
    price: number
    compareAtPrice?: number
    image: ProductImage
  }>
  collections: Array<{ slug: string; name: string }>
}

const EMPTY: SearchResponse = { total: 0, products: [], collections: [] }

export function SearchOverlay() {
  const { searchOpen, closeSearch } = useUI()
  const router = useRouter()

  const [term, setTerm] = React.useState('')
  const [results, setResults] = React.useState<SearchResponse>(EMPTY)
  const [loading, setLoading] = React.useState(false)
  const [failed, setFailed] = React.useState(false)
  const debounced = useDebouncedValue(term, 220)

  // Reset when the panel closes so it never reopens showing stale results.
  React.useEffect(() => {
    if (!searchOpen) {
      setTerm('')
      setResults(EMPTY)
      setFailed(false)
    }
  }, [searchOpen])

  React.useEffect(() => {
    const query = debounced.trim()
    if (query.length < 2) {
      setResults(EMPTY)
      setLoading(false)
      setFailed(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    bff<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,
    })
      .then(({ data }) => {
        setResults(data)
        setFailed(false)
      })
      .catch((error: unknown) => {
        if ((error as Error)?.name === 'AbortError') return
        setResults(EMPTY)
        setFailed(true)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [debounced])

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const query = term.trim()
    if (!query) return
    closeSearch()
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  const hasQuery = debounced.trim().length >= 2

  return (
    <Dialog open={searchOpen} onOpenChange={(open) => !open && closeSearch()}>
      <DialogContent
        side="top"
        className="max-h-[88dvh] overflow-y-auto"
        closeLabel="Close search"
      >
        <DialogTitle className="sr-only">Search Pashmore</DialogTitle>

        <div className="container-luxe py-8 md:py-12">
          <form onSubmit={onSubmit} role="search">
            <label htmlFor="site-search" className="sr-only">
              What are you looking for?
            </label>
            <div className="flex items-center gap-4 border-b border-line-strong pb-4">
              <SearchIcon className="h-5 w-5 shrink-0 text-taupe" strokeWidth={1.25} />
              <input
                id="site-search"
                type="search"
                autoFocus
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="What are you looking for?"
                autoComplete="off"
                className="w-full bg-transparent font-serif text-2xl text-charcoal outline-none placeholder:text-taupe/70 md:text-4xl"
              />
              {loading && (
                <Loader2
                  className="h-4 w-4 shrink-0 animate-spin text-taupe"
                  strokeWidth={1.5}
                  aria-hidden
                />
              )}
            </div>
          </form>

          <div className="mt-10 min-h-[16rem]">
            {!hasQuery ? (
              <div className="grid gap-12 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <section aria-labelledby="popular-searches">
                  <h2 id="popular-searches" className="eyebrow mb-5 text-taupe">
                    Popular searches
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {popularSearches.map((query) => (
                      <li key={query}>
                        <button
                          type="button"
                          onClick={() => setTerm(query)}
                          className="border border-line-strong px-3.5 py-2 text-xs text-charcoal transition-colors duration-300 hover:border-charcoal"
                        >
                          {query}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>

                <section aria-labelledby="search-shortcuts">
                  <h2 id="search-shortcuts" className="eyebrow mb-5 text-taupe">
                    Shop by category
                  </h2>
                  <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                    {[
                      ['Women’s Shawls', '/collections/womens-shawls'],
                      ['Men’s Shawls', '/collections/mens-shawls'],
                      ['Pure Pashmina', '/collections/pure-pashmina'],
                      ['Stoles', '/collections/stoles'],
                      ['Dupattas', '/collections/womens-dupattas'],
                      ['Gifting', '/collections/gifting'],
                    ].map(([label, href]) => (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={closeSearch}
                          className="link-underline text-sm text-charcoal/90 hover:text-charcoal"
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            ) : failed && !loading ? (
              <div className="py-10 text-center" role="alert">
                <p className="font-serif text-2xl text-charcoal">Search is unavailable right now</p>
                <p className="mt-3 text-sm text-mocha">
                  Please try again in a moment, or browse the{' '}
                  <Link
                    href="/collections"
                    onClick={closeSearch}
                    className="link-underline text-charcoal"
                  >
                    full collection
                  </Link>
                  .
                </p>
              </div>
            ) : results.products.length === 0 && !loading ? (
              <div className="py-10 text-center">
                <p className="font-serif text-2xl text-charcoal">
                  No pieces match “{debounced.trim()}”
                </p>
                <p className="mt-3 text-sm text-mocha">
                  Try a material — pashmina, cashmere, wool — or browse the{' '}
                  <Link
                    href="/collections"
                    onClick={closeSearch}
                    className="link-underline text-charcoal"
                  >
                    full collection
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
                <section aria-labelledby="search-products">
                  <h2 id="search-products" className="eyebrow mb-5 text-taupe">
                    Products
                  </h2>
                  <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3">
                    {results.products.map((product) => (
                      <li key={product.slug}>
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={closeSearch}
                          className="group block"
                        >
                          <span className="relative block aspect-4/5 overflow-hidden bg-ivory-deep">
                            <Image
                              src={product.image.url}
                              alt={product.image.alt}
                              fill
                              sizes="(min-width: 640px) 18vw, 45vw"
                              className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                            />
                          </span>
                          <span className="mt-3 block text-[0.625rem] uppercase tracking-[0.16em] text-taupe">
                            {product.material}
                          </span>
                          <span className="mt-1 block font-serif text-[0.9375rem] leading-snug text-charcoal">
                            {product.name}
                          </span>
                          <span className="mt-1 block text-xs text-mocha">
                            {formatPrice(product.price)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  {results.total > results.products.length && (
                    <button
                      type="button"
                      onClick={onSubmit}
                      className="mt-8 text-[0.6875rem] uppercase tracking-[0.18em] text-charcoal underline underline-offset-4 hover:text-gold"
                    >
                      View all {results.total} results
                    </button>
                  )}
                </section>

                {results.collections.length > 0 && (
                  <section aria-labelledby="search-collections">
                    <h2 id="search-collections" className="eyebrow mb-5 text-taupe">
                      Collections
                    </h2>
                    <ul className="flex flex-col gap-3">
                      {results.collections.map((collection) => (
                        <li key={collection.slug}>
                          <Link
                            href={`/collections/${collection.slug}`}
                            onClick={closeSearch}
                            className="link-underline text-sm text-charcoal/90 hover:text-charcoal"
                          >
                            {collection.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>

          <p className="mt-10 hidden text-[0.625rem] uppercase tracking-[0.16em] text-taupe md:block">
            Press Esc to close · Ctrl / ⌘ + K to reopen
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
