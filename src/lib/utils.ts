import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** ₹8,999 — Indian digit grouping, no decimals (catalogue prices are whole rupees). */
export function formatPrice(value: number): string {
  return inrFormatter.format(value)
}

export function discountPercent(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function truncate(input: string, max: number): string {
  if (input.length <= max) return input
  return `${input.slice(0, max - 1).trimEnd()}…`
}

/** Clamps a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items))
}

/** Stable, dependency-free id for client-side keys. */
export function createId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function pluralise(count: number, singular: string, plural?: string) {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}
