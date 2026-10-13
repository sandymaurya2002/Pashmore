/**
 * Storefront-side vocabulary. Colours, sizes, materials, patterns and
 * categories are admin-managed in the Worker and reach the UI through filter
 * facets; only the sort options — which the Worker accepts verbatim — live here.
 */

export const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
  { label: 'Best Selling', value: 'best-selling' },
] as const
