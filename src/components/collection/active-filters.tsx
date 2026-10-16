import Link from 'next/link'
import { X } from 'lucide-react'

import {
  FILTER_KEYS,
  clearFiltersHref,
  setParamHref,
  toggleFilterHref,
  type SearchParams,
} from '@/lib/query'
import { formatPrice, cn } from '@/lib/utils'
import type { FilterFacets, ProductFilters } from '@/types'

/** Removable chips for everything currently applied. Links, so still no JS. */
export function ActiveFilters({
  filters,
  facets,
  pathname,
  searchParams,
  className,
}: {
  filters: ProductFilters
  facets: FilterFacets
  pathname: string
  searchParams: SearchParams
  className?: string
}) {
  const chips = FILTER_KEYS.flatMap((key) =>
    filters[key].map((value) => ({
      key,
      value,
      label: facets[key].find((option) => option.value === value)?.label ?? value,
      href: toggleFilterHref(pathname, searchParams, key, value),
    })),
  )

  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice ?? facets.priceRange.min
    const max = filters.maxPrice ?? facets.priceRange.max
    const withoutMin = setParamHref(pathname, searchParams, 'minPrice', undefined)
    chips.push({
      key: 'price' as (typeof FILTER_KEYS)[number],
      value: 'price',
      label: `${formatPrice(min, facets.currency)} – ${formatPrice(max, facets.currency)}`,
      href: stripParam(withoutMin, 'maxPrice'),
    })
  }

  if (!chips.length) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className="sr-only">Active filters</span>
      {chips.map((chip) => (
        <Link
          key={`${chip.key}-${chip.value}`}
          href={chip.href}
          className="group inline-flex max-w-full items-center gap-2 border border-line-strong py-1.5 pl-3 pr-2.5 text-xs text-charcoal transition-colors duration-200 hover:border-charcoal"
        >
          {chip.label}
          <X
            aria-hidden
            className="h-3 w-3 text-taupe transition-colors group-hover:text-charcoal"
            strokeWidth={1.5}
          />
          <span className="sr-only">Remove filter</span>
        </Link>
      ))}

      <Link
        href={clearFiltersHref(pathname, searchParams)}
        className="ml-1 text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline underline-offset-4 transition-colors hover:text-charcoal"
      >
        Clear all
      </Link>
    </div>
  )
}

function stripParam(href: string, param: string): string {
  const [path, query] = href.split('?')
  if (!query) return path
  const params = new URLSearchParams(query)
  params.delete(param)
  const rest = params.toString()
  return rest ? `${path}?${rest}` : path
}
