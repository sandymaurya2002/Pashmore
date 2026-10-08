'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { sortOptions } from '@/data/taxonomy'
import { setParamHref, type SearchParams } from '@/lib/query'
import type { SortKey } from '@/types'

/**
 * A native <select>. It is keyboard accessible, screen-reader correct and
 * renders as the platform picker on mobile — all things a custom dropdown has
 * to reimplement badly. Only the chevron is ours.
 */
export function SortSelect({
  value,
  pathname,
  searchParams,
}: {
  value: SortKey
  pathname: string
  searchParams: SearchParams
}) {
  const router = useRouter()

  return (
    <div className="relative">
      <label htmlFor="sort" className="sr-only">
        Sort products
      </label>
      <select
        id="sort"
        value={value}
        onChange={(event) =>
          router.push(setParamHref(pathname, searchParams, 'sort', event.target.value), {
            scroll: false,
          })
        }
        className="appearance-none border border-line-strong bg-transparent py-2.5 pl-4 pr-10 text-[0.6875rem] uppercase tracking-[0.14em] text-charcoal transition-colors hover:border-charcoal focus:border-charcoal focus:outline-none"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            Sort: {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-taupe"
        strokeWidth={1.25}
      />
    </div>
  )
}
