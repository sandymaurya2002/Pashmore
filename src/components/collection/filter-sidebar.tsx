import Link from 'next/link'
import { CheckMark } from '@/components/ui/checkbox'
import { DisclosureIcon } from '@/components/ui/disclosure-icon'

import {
  FILTER_KEYS,
  clearFiltersHref,
  setParamHref,
  toggleFilterHref,
  type FilterKey,
  type SearchParams,
} from '@/lib/query'
import { formatPrice, cn } from '@/lib/utils'
import type { Currency, FilterFacets, FilterOption, ProductFilters } from '@/types'

const GROUP_LABELS: Record<FilterKey, string> = {
  category: 'Category',
  color: 'Colour',
  material: 'Material',
  size: 'Size',
  pattern: 'Pattern',
  collection: 'Collection',
  availability: 'Availability',
}

/** Groups shown expanded by default; the rest start collapsed. */
const DEFAULT_OPEN: FilterKey[] = ['category', 'color', 'material']

interface FilterSidebarProps {
  facets: FilterFacets
  filters: ProductFilters
  searchParams: SearchParams
  pathname: string
}

/**
 * Every filter is a link, not a checkbox with an onChange handler.
 *
 * That means: the whole panel is a Server Component with zero client JS, the
 * state lives in the URL so it is shareable and crawlable, browser back works
 * as customers expect, and a middle-click opens the filtered view in a new tab.
 */
export function FilterSidebar({
  facets,
  filters,
  searchParams,
  pathname,
}: FilterSidebarProps) {
  const priceBands = buildPriceBands(facets.priceRange, facets.currency)

  return (
    <div className="flex flex-col">
      {FILTER_KEYS.map((key) => {
        const options = facets[key]
        if (!options.length) return null

        return (
          <details
            key={key}
            open={DEFAULT_OPEN.includes(key) || filters[key].length > 0}
            className="group border-b border-line py-5"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between text-[0.75rem] uppercase tracking-[0.14em] text-charcoal marker:hidden [&::-webkit-details-marker]:hidden">
              <span>
                {GROUP_LABELS[key]}
                {filters[key].length > 0 && (
                  <span className="ml-2 text-gold">({filters[key].length})</span>
                )}
              </span>
              <DisclosureIcon />
            </summary>

            <ul className="mt-5 flex flex-col gap-3">
              {options.map((option) => (
                <li key={option.value}>
                  <FilterLink
                    href={toggleFilterHref(pathname, searchParams, key, option.value)}
                    option={option}
                    active={filters[key].includes(option.value)}
                    showSwatch={key === 'color'}
                  />
                </li>
              ))}
            </ul>
          </details>
        )
      })}

      {priceBands.length > 1 && (
        <details open={Boolean(filters.minPrice || filters.maxPrice)} className="group border-b border-line py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between text-[0.75rem] uppercase tracking-[0.14em] text-charcoal marker:hidden [&::-webkit-details-marker]:hidden">
            <span>Price</span>
            <DisclosureIcon />
          </summary>

          <ul className="mt-5 flex flex-col gap-3">
            {priceBands.map((band) => {
              const active =
                filters.minPrice === band.min && filters.maxPrice === band.max
              const withMin = setParamHref(
                pathname,
                searchParams,
                'minPrice',
                active ? undefined : String(band.min),
              )
              // Chain both params through the same helper so the query string
              // stays canonical whichever band is chosen.
              const href = setParamHref(
                pathname,
                parseHrefParams(withMin, searchParams),
                'maxPrice',
                active ? undefined : String(band.max),
              )

              return (
                <li key={`${band.min}-${band.max}`}>
                  <Link
                    href={href}
                    className={cn(
                      'flex items-center gap-3 text-sm transition-colors duration-200',
                      active ? 'text-charcoal' : 'text-mocha hover:text-charcoal',
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center border',
                        active ? 'border-charcoal bg-charcoal text-ivory' : 'border-line-strong',
                      )}
                    >
                      {active && <CheckMark className="h-2.5 w-2.5" />}
                    </span>
                    {band.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </details>
      )}

      <Link
        href={clearFiltersHref(pathname, searchParams)}
        className="mt-6 self-start text-[0.6875rem] uppercase tracking-[0.16em] text-taupe underline underline-offset-4 transition-colors hover:text-charcoal"
      >
        Clear all filters
      </Link>
    </div>
  )
}

function FilterLink({
  href,
  option,
  active,
  showSwatch,
}: {
  href: string
  option: FilterOption
  active: boolean
  showSwatch: boolean
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-3 text-sm transition-colors duration-200',
        active ? 'text-charcoal' : 'text-mocha hover:text-charcoal',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center border',
          active ? 'border-charcoal bg-charcoal text-ivory' : 'border-line-strong',
        )}
      >
        {active && <CheckMark className="h-2.5 w-2.5" />}
      </span>

      {showSwatch && option.hex && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10"
          style={{ backgroundColor: option.hex }}
        />
      )}

      <span className="flex-1">{option.label}</span>
      <span className="text-xs tabular-nums text-taupe">{option.count}</span>
    </Link>
  )
}

interface PriceBand {
  label: string
  min: number
  max: number
}

/** Four bands spanning the collection's actual range, rounded to ₹1,000 or $50. */
function buildPriceBands(range: { min: number; max: number }, currency: Currency): PriceBand[] {
  if (range.max <= range.min) return []
  const unit = BAND_UNIT[currency]
  const step = Math.max(unit, Math.ceil((range.max - range.min) / 4 / unit) * unit)
  const bands: PriceBand[] = []

  for (let start = Math.floor(range.min / unit) * unit; start < range.max; start += step) {
    const end = Math.min(start + step, Math.ceil(range.max / unit) * unit)
    bands.push({
      min: start,
      max: end,
      label: `${formatPrice(start, currency)} – ${formatPrice(end, currency)}`,
    })
  }
  return bands
}

/** Band edges are rounded to this many units of the currency. */
const BAND_UNIT: Record<Currency, number> = { INR: 1000, USD: 50 }

/** Re-reads a generated href back into a SearchParams object. */
function parseHrefParams(href: string, fallback: SearchParams): SearchParams {
  const queryIndex = href.indexOf('?')
  if (queryIndex === -1) return {}
  const params = new URLSearchParams(href.slice(queryIndex + 1))
  const result: SearchParams = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  // `sort` is preserved by setParamHref already; keep anything else the caller had.
  if (fallback.q) result.q = fallback.q
  return result
}
