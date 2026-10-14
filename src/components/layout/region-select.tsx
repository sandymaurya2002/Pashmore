'use client'

import * as React from 'react'
import { ChevronDown, Globe } from 'lucide-react'

import { useRegion } from '@/context/region-context'
import { COUNTRIES, CURRENCY_SYMBOL, currencyForCountry } from '@/lib/region'
import { cn } from '@/lib/utils'

/**
 * Shopping region picker. India shops in rupees; every other country in US
 * dollars. A native select keeps it keyboard and screen-reader friendly; the
 * compact header variant lays it invisibly over a short "IN · ₹" label.
 */
export function RegionSelect({ variant = 'header', className }: { variant?: 'header' | 'menu'; className?: string }) {
  const { region, changing, setCountry } = useRegion()
  const id = React.useId()
  if (!region) return null

  const select = (
    <select
      id={id}
      value={region.country}
      disabled={changing}
      onChange={(event) => void setCountry(event.target.value)}
      className={
        variant === 'header'
          ? 'absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait'
          : 'h-11 w-full appearance-none border border-line bg-ivory px-3 pr-9 text-sm text-charcoal disabled:opacity-60'
      }
    >
      {COUNTRIES.map((country) => {
        const currency = currencyForCountry(country.code)
        return (
          <option key={country.code} value={country.code}>
            {country.name} ({CURRENCY_SYMBOL[currency]} {currency})
          </option>
        )
      })}
    </select>
  )

  if (variant === 'menu') {
    return (
      <div className={className}>
        <label htmlFor={id} className="eyebrow mb-2 block text-taupe">
          Shopping region
        </label>
        <div className="relative">
          {select}
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-taupe"
            strokeWidth={1.25}
            aria-hidden
          />
        </div>
        <p className="mt-2 text-xs text-taupe">
          Prices in {CURRENCY_SYMBOL[region.currency]} {region.currency} for {region.countryName}.
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex h-10 items-center gap-1.5 px-2 text-[0.6875rem] uppercase tracking-[0.14em] text-ivory transition-colors duration-300 hover:text-gold',
        changing && 'opacity-60',
        className,
      )}
      title={`Shopping in ${region.countryName} · prices in ${region.currency}`}
    >
      <Globe className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.25} aria-hidden />
      <span aria-hidden>
        {region.country} · {CURRENCY_SYMBOL[region.currency]}
      </span>
      <label htmlFor={id} className="sr-only">
        Shopping region, currently {region.countryName}, prices in {region.currency}
      </label>
      {select}
    </div>
  )
}
