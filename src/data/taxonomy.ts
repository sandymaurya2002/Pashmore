import type { Category, ProductColor, ProductSize } from '@/types'

/**
 * Shared vocabulary for the catalogue. Products reference these by slug so the
 * filter facets, swatches and breadcrumbs can never drift out of sync.
 */

export const colors: ProductColor[] = [
  { name: 'Ivory', slug: 'ivory', hex: '#F3EDE2' },
  { name: 'Cream', slug: 'cream', hex: '#E8DFD0' },
  { name: 'Sand', slug: 'sand', hex: '#D8C7AE' },
  { name: 'Beige', slug: 'beige', hex: '#C9B294' },
  { name: 'Camel', slug: 'camel', hex: '#B08A5C' },
  { name: 'Warm Taupe', slug: 'taupe', hex: '#9C8A72' },
  { name: 'Walnut Brown', slug: 'brown', hex: '#4E3D2E' },
  { name: 'Charcoal', slug: 'charcoal', hex: '#2E2C29' },
  { name: 'Slate Grey', slug: 'slate', hex: '#6B7076' },
  { name: 'Mist Grey', slug: 'mist', hex: '#CBCFCC' },
  { name: 'Midnight Blue', slug: 'midnight', hex: '#1E2433' },
  { name: 'Burgundy', slug: 'burgundy', hex: '#5C2233' },
  { name: 'Crimson', slug: 'crimson', hex: '#83282E' },
  { name: 'Dusty Rose', slug: 'rose', hex: '#C0999A' },
  { name: 'Emerald', slug: 'emerald', hex: '#2E5244' },
  { name: 'Olive', slug: 'olive', hex: '#6E6F4E' },
  { name: 'Saffron', slug: 'saffron', hex: '#C68F3F' },
  { name: 'Antique Gold', slug: 'gold', hex: '#B08D4F' },
]

export const colorBySlug = new Map(colors.map((c) => [c.slug, c]))

export const sizes: ProductSize[] = [
  { name: 'Shawl — 100 × 200 cm', slug: 'shawl-100x200', measurement: '100 × 200 cm' },
  { name: 'Shawl — 110 × 220 cm', slug: 'shawl-110x220', measurement: '110 × 220 cm' },
  { name: 'Stole — 70 × 200 cm', slug: 'stole-70x200', measurement: '70 × 200 cm' },
  { name: 'Scarf — 50 × 180 cm', slug: 'scarf-50x180', measurement: '50 × 180 cm' },
  { name: 'Dupatta — 90 × 230 cm', slug: 'dupatta-90x230', measurement: '90 × 230 cm' },
  { name: 'Wrap — 120 × 210 cm', slug: 'wrap-120x210', measurement: '120 × 210 cm' },
  { name: 'One Size', slug: 'one-size' },
  { name: 'S', slug: 's' },
  { name: 'M', slug: 'm' },
  { name: 'L', slug: 'l' },
  { name: 'XL', slug: 'xl' },
]

export const sizeBySlug = new Map(sizes.map((s) => [s.slug, s]))

export interface TaxonomyTerm {
  name: string
  slug: string
}

export const materials: TaxonomyTerm[] = [
  { name: 'Pure Pashmina', slug: 'pure-pashmina' },
  { name: 'Pashmina Silk Blend', slug: 'pashmina-silk' },
  { name: 'Cashmere', slug: 'cashmere' },
  { name: 'Fine Merino Wool', slug: 'fine-wool' },
  { name: 'Handloom Wool', slug: 'handloom-wool' },
  { name: 'Banarasi Silk', slug: 'banarasi-silk' },
  { name: 'Cotton Silk', slug: 'cotton-silk' },
]

export const materialBySlug = new Map(materials.map((m) => [m.slug, m]))

export const patterns: TaxonomyTerm[] = [
  { name: 'Solid', slug: 'solid' },
  { name: 'Sozni Embroidery', slug: 'sozni' },
  { name: 'Kani Weave', slug: 'kani' },
  { name: 'Jamawar', slug: 'jamawar' },
  { name: 'Paisley', slug: 'paisley' },
  { name: 'Ombré', slug: 'ombre' },
  { name: 'Herringbone', slug: 'herringbone' },
  { name: 'Tilla Work', slug: 'tilla' },
  { name: 'Chikankari', slug: 'chikankari' },
]

export const patternBySlug = new Map(patterns.map((p) => [p.slug, p]))

export const categories: Category[] = [
  {
    slug: 'womens-shawls',
    name: "Women's Shawls",
    gender: 'women',
    description:
      'Handwoven shawls for women in pure Pashmina, cashmere and fine wool.',
  },
  {
    slug: 'womens-pashmina',
    name: "Women's Pashmina",
    gender: 'women',
    description: 'Certified pure Pashmina, spun and woven by hand in Kashmir.',
  },
  {
    slug: 'womens-stoles',
    name: "Women's Stoles",
    gender: 'women',
    description: 'Lightweight stoles that layer beautifully across seasons.',
  },
  {
    slug: 'womens-scarves',
    name: "Women's Scarves",
    gender: 'women',
    description: 'Fine scarves in silk blends, cashmere and merino wool.',
  },
  {
    slug: 'womens-dupattas',
    name: 'Dupattas',
    gender: 'women',
    description: 'Hand-embroidered dupattas for occasion and everyday ethnic wear.',
  },
  {
    slug: 'womens-dresses',
    name: "Women's Dresses",
    gender: 'women',
    description: 'Modern ethnic silhouettes cut from handwoven Indian cloth.',
  },
  {
    slug: 'womens-suits',
    name: "Women's Suits",
    gender: 'women',
    description: 'Tailored suit sets in handloom cotton silk and fine wool.',
  },
  {
    slug: 'mens-shawls',
    name: "Men's Shawls",
    gender: 'men',
    description: 'Classic men’s shawls in Pashmina and Kashmiri handloom wool.',
  },
  {
    slug: 'mens-stoles',
    name: "Men's Stoles",
    gender: 'men',
    description: 'Refined stoles for evening and formal Indian dressing.',
  },
  {
    slug: 'mens-scarves',
    name: "Men's Scarves",
    gender: 'men',
    description: 'Everyday luxury scarves in merino wool and cashmere.',
  },
  {
    slug: 'mens-jackets',
    name: "Men's Jackets",
    gender: 'men',
    description: 'Nehru jackets and handwoven outerwear for modern occasion wear.',
  },
  {
    slug: 'mens-accessories',
    name: "Men's Accessories",
    gender: 'men',
    description: 'Pocket squares, mufflers and finishing pieces.',
  },
  {
    slug: 'gift-sets',
    name: 'Gift Sets',
    gender: 'unisex',
    description: 'Curated gift boxes presented in Pashmore’s signature packaging.',
  },
]

export const categoryBySlug = new Map(categories.map((c) => [c.slug, c]))

export const availabilityOptions = [
  { label: 'In Stock', value: 'in-stock' },
  { label: 'Include Out of Stock', value: 'out-of-stock' },
] as const

export const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
  { label: 'Best Selling', value: 'best-selling' },
] as const
