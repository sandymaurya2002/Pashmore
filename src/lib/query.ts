import type { ProductFilters, SortKey } from '@/types'

/**
 * Filter state lives entirely in the URL — `?color=beige&material=pure-pashmina&sort=price-low`.
 * That keeps collection pages shareable, crawlable and back-button correct, and
 * means the grid can stay a Server Component.
 */

export const FILTER_KEYS = [
  'category',
  'color',
  'material',
  'size',
  'pattern',
  'collection',
  'availability',
] as const

export type FilterKey = (typeof FILTER_KEYS)[number]

export const SORT_KEYS: SortKey[] = [
  'featured',
  'newest',
  'price-low',
  'price-high',
  'best-selling',
]

/** Next passes `searchParams` as this shape. */
export type SearchParams = Record<string, string | string[] | undefined>

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  const raw = Array.isArray(value) ? value : [value]
  return raw
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function parseFilters(searchParams: SearchParams): ProductFilters {
  const minPrice = Number(searchParams.minPrice)
  const maxPrice = Number(searchParams.maxPrice)

  return {
    category: toArray(searchParams.category),
    color: toArray(searchParams.color),
    material: toArray(searchParams.material),
    size: toArray(searchParams.size),
    pattern: toArray(searchParams.pattern),
    collection: toArray(searchParams.collection),
    availability: toArray(searchParams.availability),
    minPrice: Number.isFinite(minPrice) && minPrice > 0 ? minPrice : undefined,
    maxPrice: Number.isFinite(maxPrice) && maxPrice > 0 ? maxPrice : undefined,
  }
}

export function parseSort(searchParams: SearchParams): SortKey {
  const value = Array.isArray(searchParams.sort)
    ? searchParams.sort[0]
    : searchParams.sort
  return SORT_KEYS.includes(value as SortKey) ? (value as SortKey) : 'featured'
}

export function parsePage(searchParams: SearchParams): number {
  const value = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page
  const page = Number(value)
  return Number.isFinite(page) && page > 1 ? Math.floor(page) : 1
}

export function countActiveFilters(filters: ProductFilters): number {
  const listCount = FILTER_KEYS.reduce((total, key) => total + filters[key].length, 0)
  return listCount + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)
}

/**
 * Rebuilds a query string with one filter value toggled. Returns a canonical
 * ordering so that the same selection always produces the same URL — important
 * so search engines do not index permutations of an identical page.
 */
export function toggleFilterHref(
  pathname: string,
  searchParams: SearchParams,
  key: FilterKey,
  value: string,
): string {
  const next = new URLSearchParams()
  const filters = parseFilters(searchParams)
  const current = new Set(filters[key])

  if (current.has(value)) current.delete(value)
  else current.add(value)

  for (const filterKey of FILTER_KEYS) {
    const values = filterKey === key ? Array.from(current) : filters[filterKey]
    if (values.length) next.set(filterKey, values.slice().sort().join(','))
  }

  if (filters.minPrice) next.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) next.set('maxPrice', String(filters.maxPrice))

  const sort = parseSort(searchParams)
  if (sort !== 'featured') next.set('sort', sort)

  const qs = next.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

export function setParamHref(
  pathname: string,
  searchParams: SearchParams,
  key: string,
  value: string | undefined,
): string {
  const next = new URLSearchParams()
  const filters = parseFilters(searchParams)

  for (const filterKey of FILTER_KEYS) {
    if (filters[filterKey].length) {
      next.set(filterKey, filters[filterKey].slice().sort().join(','))
    }
  }
  if (filters.minPrice) next.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) next.set('maxPrice', String(filters.maxPrice))

  const sort = parseSort(searchParams)
  if (sort !== 'featured') next.set('sort', sort)

  if (value === undefined || value === '' || value === 'featured') next.delete(key)
  else next.set(key, value)

  // A page reset is always correct when any facet changes.
  if (key !== 'page') next.delete('page')

  const qs = next.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

export function clearFiltersHref(pathname: string, searchParams: SearchParams): string {
  const sort = parseSort(searchParams)
  return sort === 'featured' ? pathname : `${pathname}?sort=${sort}`
}
