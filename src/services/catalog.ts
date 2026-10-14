import 'server-only'

import { ApiError } from '@/lib/api/envelope'
import {
  EMPTY_FACETS,
  normalizeCollection,
  normalizeCollections,
  normalizeFacets,
  normalizeProduct,
  normalizeProducts,
  normalizeSearch,
} from '@/lib/normalize/catalog'
import { asNumber } from '@/lib/normalize/primitives'
import { DEFAULT_CURRENCY, type Currency } from '@/lib/region'
import { getRegion } from '@/server/region'
import { workerFetch, type QueryValue } from '@/server/worker'
import type {
  Availability,
  Collection,
  Product,
  ProductFilters,
  ProductQueryResult,
  SearchResult,
  SortKey,
} from '@/types'

/**
 * The catalogue service is the only module that knows where product data comes
 * from: the Cloudflare Worker API backed by D1 (records) and R2 (images).
 *
 * Reads are cached in the Next Data Cache for CATALOG_REVALIDATE seconds and
 * tagged, so `/api/revalidate` can purge them the moment the admin publishes.
 * Failures surface as `ApiError` — there is no demo fallback.
 */

export const CATALOG_REVALIDATE = 60
export const CATALOG_TAG = 'catalog'

/** The Worker caps list pages at 100 and batch lookups at 24 slugs. */
const MAX_PAGE_SIZE = 100
const MAX_BATCH = 24

function cached(...tags: string[]) {
  return { revalidate: CATALOG_REVALIDATE, tags: [CATALOG_TAG, ...tags] }
}

/**
 * Prices come back in the shopper's currency. It is sent as `?currency=`
 * rather than the country header so the Data Cache keeps one entry per
 * currency, not one per country.
 */
async function currency(): Promise<Currency> {
  return (await getRegion()).currency
}

export function getAvailability(product: Product): Availability {
  if (product.inventory <= 0) return 'out-of-stock'
  if (product.inventory <= 6) return 'low-stock'
  return 'in-stock'
}

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const { data } = await workerFetch<unknown>(`/products/${encodeURIComponent(slug)}`, {
      query: { currency: await currency() },
      cache: cached('products', `product:${slug}`),
    })
    return normalizeProduct(data)
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.code === 'VALIDATION_ERROR')) {
      return null
    }
    throw error
  }
}

/**
 * Every published product, page by page. Used by the sitemap and keyword tools.
 * Listed in rupees: every product has an India price, while international
 * listings leave out products without a USD price.
 */
export async function getAllProducts(): Promise<Product[]> {
  const all: Product[] = []
  for (let page = 1; page <= 50; page += 1) {
    const { data, meta } = await workerFetch<unknown>('/products', {
      query: {
        page,
        limit: MAX_PAGE_SIZE,
        sort: 'newest',
        facets: false,
        availability: 'out-of-stock',
        currency: DEFAULT_CURRENCY,
      },
      cache: cached('products'),
    })
    all.push(...normalizeProducts(data))
    if (page >= asNumber(meta.totalPages, 1)) break
  }
  return all
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const unique = Array.from(new Set(slugs.filter(Boolean)))
  if (!unique.length) return []

  const chunks: string[][] = []
  for (let index = 0; index < unique.length; index += MAX_BATCH) {
    chunks.push(unique.slice(index, index + MAX_BATCH))
  }
  const shopperCurrency = await currency()
  const pages = await Promise.all(
    chunks.map((chunk) =>
      workerFetch<unknown>('/products/batch', {
        query: { slugs: chunk, currency: shopperCurrency },
        cache: cached('products'),
      }),
    ),
  )
  const bySlug = new Map(
    pages.flatMap(({ data }) => normalizeProducts(data)).map((product) => [product.slug, product]),
  )
  // Preserve the caller's order; unknown or unpublished slugs simply drop out.
  return unique.map((slug) => bySlug.get(slug)).filter((p): p is Product => Boolean(p))
}

async function listRail(sort: SortKey, limit: number): Promise<Product[]> {
  const { data } = await workerFetch<unknown>('/products', {
    query: { sort, limit: Math.min(limit, MAX_PAGE_SIZE), facets: false, currency: await currency() },
    cache: cached('products'),
  })
  return normalizeProducts(data).slice(0, limit)
}

export function getNewArrivals(limit = 8): Promise<Product[]> {
  return listRail('newest', limit)
}

export function getBestSellers(limit = 8): Promise<Product[]> {
  return listRail('best-selling', limit)
}

/** Products flagged "featured" or "trending" in the admin Merchandising screen, in its order. */
export async function getMerchandisedRail(rail: 'featured' | 'trending', limit = 8): Promise<Product[]> {
  const { data } = await workerFetch<unknown>(`/products/${rail}`, {
    query: { limit: Math.min(limit, 48), currency: await currency() },
    cache: cached('products'),
  })
  return normalizeProducts(data).slice(0, limit)
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const { data } = await workerFetch<unknown>(
    `/products/${encodeURIComponent(product.slug)}/related`,
    { query: { limit, currency: await currency() }, cache: cached('products', `product:${product.slug}`) },
  )
  return normalizeProducts(data)
    .filter((entry) => entry.slug !== product.slug)
    .slice(0, limit)
}

/* ------------------------------------------------------------------ *
 * Collections
 * ------------------------------------------------------------------ */

export async function getAllCollections(): Promise<Collection[]> {
  const { data } = await workerFetch<unknown>('/collections', {
    query: { currency: await currency() },
    cache: cached('collections'),
  })
  return normalizeCollections(data)
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  try {
    const { data } = await workerFetch<unknown>(`/collections/${encodeURIComponent(slug)}`, {
      query: { currency: await currency() },
      cache: cached('collections', `collection:${slug}`),
    })
    return normalizeCollection(data)
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.code === 'VALIDATION_ERROR')) {
      return null
    }
    throw error
  }
}

/* ------------------------------------------------------------------ *
 * Filtering, sorting, faceting — performed by the Worker
 * ------------------------------------------------------------------ */

export interface QueryOptions {
  /** Restrict the base set to a collection (including aggregate category rules). */
  collectionSlug?: string
  filters?: ProductFilters
  sort?: SortKey
  search?: string
  page?: number
  limit?: number
}

export const PAGE_SIZE = 48

function filterQuery(filters?: ProductFilters): Record<string, QueryValue> {
  if (!filters) return {}
  return {
    category: filters.category,
    color: filters.color,
    material: filters.material,
    size: filters.size,
    pattern: filters.pattern,
    collection: filters.collection,
    availability: filters.availability,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
  }
}

export async function queryProducts(options: QueryOptions = {}): Promise<ProductQueryResult> {
  const { collectionSlug, filters, sort = 'featured', search, page = 1, limit = PAGE_SIZE } = options
  const path = collectionSlug
    ? `/collections/${encodeURIComponent(collectionSlug)}/products`
    : '/products'

  try {
    const { data, meta } = await workerFetch<unknown>(path, {
      query: {
        ...filterQuery(filters),
        sort,
        q: search?.trim() || undefined,
        page,
        limit: Math.min(limit, MAX_PAGE_SIZE),
        currency: await currency(),
      },
      cache: cached('products', ...(collectionSlug ? [`collection:${collectionSlug}`] : [])),
    })
    const products = normalizeProducts(data)
    const total = asNumber(meta.total, products.length)
    return {
      products,
      total,
      page: asNumber(meta.page, page),
      totalPages: asNumber(meta.totalPages, Math.max(1, Math.ceil(total / limit))),
      facets: normalizeFacets(meta.facets),
    }
  } catch (error) {
    // An unknown collection is a 404 for the page, not an outage.
    if (collectionSlug && error instanceof ApiError && error.isNotFound) {
      return { products: [], total: 0, page: 1, totalPages: 1, facets: EMPTY_FACETS }
    }
    throw error
  }
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

export async function searchCatalog(term: string, limit = 8): Promise<SearchResult> {
  const q = term.trim().slice(0, 80)
  if (!q) return { products: [], collections: [], total: 0 }
  const { data } = await workerFetch<unknown>('/search', {
    query: { q, limit: Math.min(Math.max(limit, 1), 24), currency: await currency() },
    cache: cached('products', 'collections'),
  })
  return normalizeSearch(data)
}
