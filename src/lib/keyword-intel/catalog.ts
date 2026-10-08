import { colorSearchTerms, keywordConfig } from '@/data/keyword-config'
import type { Gender } from '@/types'
import type { ContentType, KeywordIntent } from '@/types/keywords'
import { hasAny, hasTerm } from './normalize'

export type ProductType =
  | 'shawl'
  | 'wrap'
  | 'stole'
  | 'scarf'
  | 'dupatta'
  | 'gift-set'
  | 'pocket-square'
  | 'jacket'
  | 'suit'
  | 'dress'
  | 'other'

/** The slice of a product the keyword engine reasons about. */
export interface CatalogProduct {
  slug: string
  name: string
  type: ProductType
  gender: Gender
  materialSlug: string
  patternSlug: string
  colorSlugs: string[]
  collectionSlugs: string[]
  price: number
  inStock: boolean
}

/** An indexable page that already exists on the site. */
export interface SitePage {
  url: string
  type: ContentType
  /** The search the page was built to answer. */
  primaryKeyword: string
  intent: KeywordIntent
}

export interface CatalogFacts {
  products: CatalogProduct[]
  pages: SitePage[]
}

export function productTypeOf(name: string, categorySlug: string): ProductType {
  const value = name.toLowerCase()
  if (categorySlug === 'gift-sets' || /gift (box|set)|stole set/.test(value)) return 'gift-set'
  if (value.includes('pocket square')) return 'pocket-square'
  if (value.includes('jacket')) return 'jacket'
  if (value.includes('suit')) return 'suit'
  if (value.includes('dress')) return 'dress'
  if (value.includes('dupatta')) return 'dupatta'
  if (value.includes('wrap')) return 'wrap'
  if (value.includes('stole')) return 'stole'
  if (value.includes('scarf') || value.includes('muffler')) return 'scarf'
  if (value.includes('shawl')) return 'shawl'
  return 'other'
}

/** Products the business actually sells — excluded types never count. */
export function sellableProducts(facts: CatalogFacts): CatalogProduct[] {
  const excluded = keywordConfig.excludedProductTypes as readonly string[]
  return facts.products.filter((product) => product.inStock && !excluded.includes(product.type))
}

/* ---------------------------------------------------------------- *
 * Keyword → catalogue constraints
 * ---------------------------------------------------------------- */

const TYPE_TERMS: Array<{ terms: string[]; types: ProductType[] }> = [
  { terms: ['shawl', 'shawls'], types: ['shawl', 'wrap'] },
  { terms: ['wrap', 'wraps'], types: ['wrap', 'shawl'] },
  { terms: ['stole', 'stoles'], types: ['stole'] },
  { terms: ['scarf', 'scarves', 'muffler'], types: ['scarf'] },
  { terms: ['dupatta', 'dupattas'], types: ['dupatta'] },
  { terms: ['pocket square'], types: ['pocket-square'] },
]

/** Words for product types Pashmore has told us it does not sell. */
const UNSOLD_TYPE_TERMS: Record<string, string[]> = {
  jacket: ['jacket', 'jackets'],
  suit: ['suit', 'suits'],
  blanket: ['blanket', 'blankets'],
}

const MATERIAL_TERMS: Array<{ terms: string[]; materials: string[] }> = [
  { terms: ['pure pashmina', '100% pashmina', '100% pure'], materials: ['pure-pashmina'] },
  { terms: ['pashmina', 'pashm', 'pashmeena'], materials: ['pure-pashmina', 'pashmina-silk'] },
  // Pashmina is the finest grade of cashmere, so it honestly answers a cashmere search.
  { terms: ['cashmere'], materials: ['cashmere', 'pure-pashmina'] },
  { terms: ['merino', 'wool'], materials: ['fine-wool', 'handloom-wool'] },
  { terms: ['silk'], materials: ['pashmina-silk', 'banarasi-silk', 'cotton-silk'] },
]

const PATTERN_TERMS: Array<{ terms: string[]; patterns: string[] }> = [
  { terms: ['embroidered', 'embroidery'], patterns: ['sozni', 'tilla', 'chikankari'] },
  { terms: ['kani'], patterns: ['kani'] },
  { terms: ['sozni'], patterns: ['sozni'] },
  { terms: ['jamawar'], patterns: ['jamawar'] },
  { terms: ['paisley'], patterns: ['paisley', 'jamawar'] },
  { terms: ['tilla'], patterns: ['tilla'] },
  { terms: ['ombre', 'ombré'], patterns: ['ombre'] },
  { terms: ['herringbone'], patterns: ['herringbone'] },
  { terms: ['patterned'], patterns: ['sozni', 'kani', 'jamawar', 'paisley', 'tilla', 'ombre', 'herringbone'] },
  { terms: ['plain', 'solid'], patterns: ['solid'] },
  // Nothing in the catalogue is printed or floral-printed.
  { terms: ['printed', 'print', 'floral'], patterns: [] },
]

export interface Constraint {
  types?: ProductType[]
  materials?: string[]
  patterns?: string[]
  colorTerm?: string
  colorFamily?: string
  colors?: string[]
  gender?: 'women' | 'men'
  maxPrice?: number
  wedding?: boolean
}

export interface StockCheck {
  constraint: Constraint
  /** Products that satisfy every constraint. */
  matches: CatalogProduct[]
  /** A hard "we do not sell this" reason, if any. */
  rejectReason: string | null
  /** True when the keyword names attributes but the full combination isn't stocked. */
  gap: boolean
  /** True when the keyword names any product attribute at all. */
  constrained: boolean
}

export function parseConstraint(keyword: string): Constraint {
  const constraint: Constraint = {}

  const type = TYPE_TERMS.find((entry) => hasAny(keyword, entry.terms))
  if (type) constraint.types = type.types

  const material = MATERIAL_TERMS.find((entry) => hasAny(keyword, entry.terms))
  if (material) constraint.materials = material.materials

  const pattern = PATTERN_TERMS.find((entry) => hasAny(keyword, entry.terms))
  if (pattern) constraint.patterns = pattern.patterns

  // Longest colour terms first so "off white" wins over "white".
  const colorTerm = Object.keys(colorSearchTerms)
    .sort((a, b) => b.length - a.length)
    .find((term) => hasTerm(keyword, term))
  if (colorTerm) {
    constraint.colorTerm = colorTerm
    constraint.colorFamily = colorSearchTerms[colorTerm].family
    constraint.colors = colorSearchTerms[colorTerm].slugs
  }

  if (/\b(women|womens|women's|ladies|her|wife|mother|girlfriend|sister|grandmother|bride)\b/.test(keyword)) {
    constraint.gender = 'women'
  } else if (/\b(men|mens|men's|gents|him|husband|father)\b/.test(keyword)) {
    constraint.gender = 'men'
  }

  const under = keyword.match(/\bunder (?:rs\.? ?|₹)?(\d[\d,]*)/)
  if (under) constraint.maxPrice = Number(under[1].replace(/,/g, ''))

  if (/\b(wedding|bridal|bride|trousseau)\b/.test(keyword)) constraint.wedding = true

  return constraint
}

function satisfies(product: CatalogProduct, c: Constraint): boolean {
  if (c.types && !c.types.includes(product.type)) return false
  if (c.materials && !c.materials.includes(product.materialSlug)) return false
  if (c.patterns && !c.patterns.includes(product.patternSlug)) return false
  if (c.colors && !c.colors.some((slug) => product.colorSlugs.includes(slug))) return false
  if (c.gender && product.gender !== c.gender && product.gender !== 'unisex') return false
  if (c.maxPrice !== undefined && product.price > c.maxPrice) return false
  if (c.wedding && !product.collectionSlugs.includes('wedding-collection')) return false
  return true
}

const formatInr = (value: number) => `₹${value.toLocaleString('en-IN')}`

/**
 * Checks a keyword against what Pashmore actually sells. This is what stops
 * the engine recommending "black pashmina shawl" or "pashmina shawl under
 * 2000" when neither exists.
 */
export function checkStock(keyword: string, facts: CatalogFacts): StockCheck {
  const products = sellableProducts(facts)
  const constraint = parseConstraint(keyword)
  const matches = products.filter((product) => satisfies(product, constraint))
  const constrained = Object.keys(constraint).length > 0

  let rejectReason: string | null = null

  const unsold = Object.entries(UNSOLD_TYPE_TERMS).find(([, terms]) => hasAny(keyword, terms))
  if (unsold) {
    rejectReason = `Pashmore does not sell ${unsold[0]}s.`
  } else if (constraint.colors && constraint.colors.length === 0) {
    rejectReason = `No ${constraint.colorTerm} products in the catalogue.`
  } else if (constraint.colors) {
    const anyInColor = products.some((p) => constraint.colors!.some((slug) => p.colorSlugs.includes(slug)))
    if (!anyInColor) rejectReason = `No ${constraint.colorTerm} products in stock.`
  }

  if (!rejectReason && constraint.patterns && constraint.patterns.length === 0) {
    rejectReason = 'No printed or floral-print products in the catalogue.'
  }

  if (!rejectReason && constraint.maxPrice !== undefined && matches.length === 0) {
    const withoutPrice: Constraint = { ...constraint, maxPrice: undefined }
    const cheapest = products
      .filter((product) => satisfies(product, withoutPrice))
      .reduce<number | null>((min, p) => (min === null || p.price < min ? p.price : min), null)
    rejectReason =
      cheapest === null
        ? 'No matching products at any price.'
        : `Nothing under ${formatInr(constraint.maxPrice)} — the cheapest match is ${formatInr(cheapest)}.`
  }

  return {
    constraint,
    matches,
    rejectReason,
    gap: !rejectReason && constrained && matches.length === 0,
    constrained,
  }
}
