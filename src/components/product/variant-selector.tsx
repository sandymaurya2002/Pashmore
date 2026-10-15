'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductColor, ProductSize } from '@/types'

export function ColorSelector({
  colors,
  value,
  onChange,
  availability,
}: {
  colors: ProductColor[]
  value?: string
  onChange: (slug: string) => void
  availability: Map<string, number>
}) {
  if (colors.length <= 1) return null
  const selected = colors.find((color) => color.slug === value)

  return (
    <fieldset>
      <legend className="eyebrow mb-3 text-taupe">
        Colour
        {selected && <span className="ml-2 normal-case tracking-normal text-charcoal">{selected.name}</span>}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {colors.map((color) => {
          const soldOut = (availability.get(color.slug) ?? 0) <= 0
          const active = color.slug === value
          return (
            <button
              key={color.slug}
              type="button"
              onClick={() => onChange(color.slug)}
              aria-pressed={active}
              aria-label={soldOut ? `${color.name} — out of stock` : color.name}
              className={cn(
                'relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300',
                active ? 'border-charcoal' : 'border-line-strong hover:border-taupe',
              )}
            >
              <span
                aria-hidden
                className="relative h-6 w-6 overflow-hidden rounded-full border border-black/8"
                style={{ backgroundColor: color.hex }}
              >
                {soldOut && (
                  <span className="absolute left-1/2 top-1/2 h-px w-full -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white mix-blend-difference" />
                )}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function SizeSelector({
  sizes,
  value,
  onChange,
  availability,
}: {
  sizes: ProductSize[]
  value?: string
  onChange: (slug: string) => void
  availability: Map<string, number>
}) {
  if (sizes.length <= 1) {
    const only = sizes[0]
    if (!only) return null
    return (
      <div>
        <p className="eyebrow mb-2 text-taupe">Size</p>
        <p className="text-sm text-charcoal">{only.name}</p>
      </div>
    )
  }

  return (
    <fieldset>
      <legend className="eyebrow mb-3 text-taupe">Size</legend>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const soldOut = (availability.get(size.slug) ?? 0) <= 0
          const active = size.slug === value
          return (
            <button
              key={size.slug}
              type="button"
              onClick={() => onChange(size.slug)}
              aria-pressed={active}
              className={cn(
                'border px-4 py-2.5 text-[0.75rem] uppercase tracking-[0.12em] transition-all duration-300',
                active
                  ? 'border-charcoal bg-charcoal text-ivory'
                  : 'border-line-strong text-charcoal hover:border-charcoal',
                soldOut && 'text-taupe line-through opacity-60',
              )}
            >
              {size.name}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export function QuantityStepper({
  value,
  onChange,
  max,
  label = 'Quantity',
}: {
  value: number
  onChange: (next: number) => void
  max: number
  label?: string
}) {
  return (
    <div>
      <p className="eyebrow mb-3 text-taupe">{label}</p>
      <div className="inline-flex items-center border border-line-strong">
        <button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={value <= 1}
          className="flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-gold disabled:opacity-30"
          aria-label="Decrease quantity"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
        <span
          className="w-10 text-center text-sm tabular-nums"
          aria-live="polite"
          aria-label={`${label}: ${value}`}
        >
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={value >= max}
          className="flex h-11 w-11 items-center justify-center text-charcoal transition-colors hover:text-gold disabled:opacity-30"
          aria-label="Increase quantity"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
