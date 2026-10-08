import 'server-only'

import { products, productBySlug } from '@/data/products'
import { collections, collectionBySlug } from '@/data/collections'
import { categoryBySlug, colorBySlug, materialBySlug, patternBySlug, sizeBySlug } from '@/data/taxonomy'
import type {
  Availability,
  Collection,
  FilterFacets,
  FilterOption,
  Product,
  ProductFilters,
  ProductQueryResult,
  SortKey,
} from '@/types'

/**
 * The catalogue service is the only module that knows where product data comes
 * from. Swapping the bundled demo data for a headless backend means changing
 * the bodies of these functions and nothing else — every caller is already
 * async and already talks in domain types.
 *
 * When NEXT_PUBLIC_API_BASE_URL is configured, replace the local lookups here
 * with `apiFetch` calls from `@/services/api`.
 */

export function getAvailability(product: Product): Availability {
  if (product.inventory <= 0) return 'out-of-stock'
  if (product.inventory <= 6) return 'low-stock'
  return 'in-stock'
}

export async function getAllProducts(): Promise<Product[]> {
  return products
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return productBySlug.get(slug) ?? null
}

export async function getAllCollections(): Promise<Collection[]> {
  return collections
}

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
  return collectionBySlug.get(slug) ?? null
}

/** Products belonging to a collection, either by direct membership or category. */
export function selectCollectionProducts(collection: Collection): Product[] {
  const categorySlugs = new Set(collection.includeCategorySlugs ?? [])
  return products.filter(
    (product) =>
      product.collectionSlugs.includes(collection.slug) ||
      product.categorySlug === collection.slug ||
      categorySlugs.has(product.categorySlug),
  )
}

export async function getProductsByCollection(slug: string): Promise<Product[]> {
  const collection = collectionBySlug.get(slug)
  if (!collection) return []
  return selectCollectionProducts(collection)
}

/* ------------------------------------------------------------------ *
 * Filtering, sorting, faceting
 * ------------------------------------------------------------------ */

function matchesFilters(product: Product, filters: ProductFilters): boolean {
  if (filters.category.length && !filters.category.includes(product.categorySlug)) return false
  if (filters.material.length && !filters.material.includes(product.materialSlug)) return false
  if (filters.pattern.length && !filters.pattern.includes(product.patternSlug)) return false

  if (filters.collection.length) {
    const inCollection = filters.collection.some((slug) =>
      product.collectionSlugs.includes(slug),
    )
    if (!inCollection) return false
  }

  if (filters.color.length) {
    const hasColor = product.colors.some((color) => filters.color.includes(color.slug))
    if (!hasColor) return false
  }

  if (filters.size.length) {
    const hasSize = product.sizes.some((size) => filters.size.includes(size.slug))
    if (!hasSize) return false
  }

  // "in-stock" hides sold-out lines. Selecting "out-of-stock" opts them back in.
  const includeOutOfStock = filters.availability.includes('out-of-stock')
  const onlyInStock = filters.availability.includes('in-stock')
  const available = getAvailability(product) !== 'out-of-stock'
  if (onlyInStock && !available) return false
  if (!includeOutOfStock && !onlyInStock && !available) return false

  if (filters.minPrice !== undefined && product.price < filters.minPrice) return false
  if (filters.maxPrice !== undefined && product.price > filters.maxPrice) return false

  return true
}

function sortProducts(list: Product[], sort: SortKey): Product[] {
  const sorted = [...list]
  switch (sort) {
    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price)
    case 'best-selling':
      return sorted.sort((a, b) => b.popularity - a.popularity)
    case 'featured':
    default:
      // Featured weights badges above raw popularity so curated pieces surface.
      return sorted.sort((a, b) => featuredScore(b) - featuredScore(a))
  }
}

function featuredScore(product: Product): number {
  let score = product.popularity
  if (product.badges.includes('exclusive')) score += 24
  if (product.badges.includes('limited')) score += 16
  if (product.badges.includes('bestseller')) score += 12
  if (product.badges.includes('new')) score += 8
  return score
}

function buildOptions(
  list: Product[],
  extract: (product: Product) => string[],
  label: (value: string) => string | undefined,
  hex?: (value: string) => string | undefined,
): FilterOption[] {
  const counts = new Map<string, number>()
  for (const product of list) {
    for (const value of new Set(extract(product))) {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({
      value,
      count,
      label: label(value) ?? value,
      hex: hex?.(value),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}

export function buildFacets(list: Product[]): FilterFacets {
  const prices = list.map((p) => p.price)
  return {
    category: buildOptions(
      list,
      (p) => [p.categorySlug],
      (value) => categoryBySlug.get(value)?.name,
    ),
    color: buildOptions(
      list,
      (p) => p.colors.map((c) => c.slug),
      (value) => colorBySlug.get(value)?.name,
      (value) => colorBySlug.get(value)?.hex,
    ),
    material: buildOptions(
      list,
      (p) => [p.materialSlug],
      (value) => materialBySlug.get(value)?.name,
    ),
    size: buildOptions(
      list,
      (p) => p.sizes.map((s) => s.slug),
      (value) => sizeBySlug.get(value)?.name,
    ),
    pattern: buildOptions(
      list,
      (p) => [p.patternSlug],
      (value) => patternBySlug.get(value)?.name,
    ),
    collection: buildOptions(
      list,
      (p) => p.collectionSlugs,
      (value) => collectionBySlug.get(value)?.name,
    ),
    availability: [
      {
        label: 'In Stock',
        value: 'in-stock',
        count: list.filter((p) => getAvailability(p) !== 'out-of-stock').length,
      },
      {
        label: 'Include Out of Stock',
        value: 'out-of-stock',
        count: list.filter((p) => getAvailability(p) === 'out-of-stock').length,
      },
    ],
    priceRange: {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    },
  }
}

export interface QueryOptions {
  /** Restrict the base set to a collection before filtering. */
  collectionSlug?: string
  filters?: ProductFilters
  sort?: SortKey
  search?: string
}

const EMPTY_FILTERS: ProductFilters = {
  category: [],
  color: [],
  material: [],
  size: [],
  pattern: [],
  collection: [],
  availability: [],
}

export async function queryProducts(options: QueryOptions = {}): Promise<ProductQueryResult> {
  const { collectionSlug, filters = EMPTY_FILTERS, sort = 'featured', search } = options

  let base = products
  if (collectionSlug) {
    const collection = collectionBySlug.get(collectionSlug)
    base = collection ? selectCollectionProducts(collection) : []
  }
  if (search) base = searchProducts(base, search)

  // Facets are computed against the collection scope rather than the filtered
  // result, so counts do not collapse to zero as the customer narrows down.
  const facets = buildFacets(base)
  const filtered = base.filter((product) => matchesFilters(product, filters))

  return {
    products: sortProducts(filtered, sort),
    total: filtered.length,
    facets,
  }
}

/* ------------------------------------------------------------------ *
 * Search
 * ------------------------------------------------------------------ */

function searchProducts(list: Product[], term: string): Product[] {
  const needle = term.trim().toLowerCase()
  if (!needle) return list
  const tokens = needle.split(/\s+/)

  return list
    .map((product) => {
      const haystack = [
        product.name,
        product.tagline,
        product.material,
        product.pattern,
        product.craft,
        product.description,
        ...product.colors.map((c) => c.name),
        ...product.collectionSlugs,
        product.categorySlug,
      ]
        .join(' ')
        .toLowerCase()

      const score = tokens.reduce((total, token) => {
        if (!haystack.includes(token)) return total - 100
        return total + (product.name.toLowerCase().includes(token) ? 10 : 3)
      }, 0)

      return { product, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.product.popularity - a.product.popularity)
    .map((entry) => entry.product)
}

export async function searchCatalog(term: string, limit = 8) {
  const matched = searchProducts(products, term)
  const needle = term.trim().toLowerCase()

  const matchedCollections = needle
    ? collections
        .filter(
          (collection) =>
            !collection.hidden &&
            (collection.name.toLowerCase().includes(needle) ||
              collection.description.toLowerCase().includes(needle)),
        )
        .slice(0, 4)
    : []

  return {
    products: matched.slice(0, limit),
    total: matched.length,
    collections: matchedCollections,
  }
}

/* ------------------------------------------------------------------ *
 * Merchandising helpers
 * ------------------------------------------------------------------ */

export async function getNewArrivals(limit = 8): Promise<Product[]> {
  return [...products]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  return [...products].sort((a, b) => b.popularity - a.popularity).slice(0, limit)
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const explicit = (product.relatedSlugs ?? [])
    .map((slug) => productBySlug.get(slug))
    .filter((entry): entry is Product => Boolean(entry))

  if (explicit.length >= limit) return explicit.slice(0, limit)

  // Fall back to shared collections, then to the same category.
  const scored = products
    .filter((candidate) => candidate.slug !== product.slug)
    .filter((candidate) => !explicit.some((e) => e.slug === candidate.slug))
    .map((candidate) => {
      const shared = candidate.collectionSlugs.filter((slug) =>
        product.collectionSlugs.includes(slug),
      ).length
      const sameCategory = candidate.categorySlug === product.categorySlug ? 3 : 0
      const sameMaterial = candidate.materialSlug === product.materialSlug ? 2 : 0
      return { candidate, score: shared + sameCategory + sameMaterial }
    })
    .sort((a, b) => b.score - a.score || b.candidate.popularity - a.candidate.popularity)
    .map((entry) => entry.candidate)

  return [...explicit, ...scored].slice(0, limit)
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  return slugs
    .map((slug) => productBySlug.get(slug))
    .filter((product): product is Product => Boolean(product))
}
