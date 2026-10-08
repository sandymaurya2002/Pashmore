import { colorSearchTerms, keywordConfig } from '@/data/keyword-config'
import { keywordSeeds } from '@/data/keyword-seeds'
import type { KeywordCategory } from '@/types/keywords'
import { checkStock, type CatalogFacts } from './catalog'
import { cleanKeyword, hasTerm } from './normalize'

export interface Candidate {
  keyword: string
  category: KeywordCategory
  origin: 'seed' | 'generated'
}

export interface GenerationResult {
  candidates: Candidate[]
  /** Combinations considered and discarded (not stocked, off-positioning). */
  rejected: number
}

/** Product heads combinations are built on. Only stocked heads are used. */
const PRODUCT_HEADS = [
  'pashmina shawl',
  'pashmina stole',
  'pashmina scarf',
  'pashmina wrap',
  'kashmiri shawl',
  'cashmere stole',
  'cashmere wrap',
  'wool shawl',
  'wool stole',
  'pashmina dupatta',
]

const COLOR_TEMPLATES = [
  'pashmina shawl',
  'pashmina stole',
  'pashmina scarf',
  'pashmina wrap',
  'cashmere shawl',
  'kashmiri shawl',
]

/** Section 22 long-tail templates. `{p}` is the product head. */
const LONG_TAIL = [
  'best {p} for women',
  'best {p} for men',
  'best {p} for wedding',
  'buy {p} online',
  '{p} price',
  '{p} price in india',
  '{p} for women',
  '{p} for men',
  '{p} for wedding',
  '{p} for winter',
  '{p} as a gift',
  '{p} online india',
  'where to buy {p}',
  'best {p} brand',
  'how to wash {p}',
  'how to store {p}',
  'how to wear {p}',
]
const LONG_TAIL_INTERNATIONAL = ['{p} online usa', '{p} online uk', '{p} online uae', '{p} online canada', '{p} online australia']
const LONG_TAIL_PASHMINA = ['how to identify real {p}', '{p} vs cashmere']
const LONG_TAIL_STORE = ['{p} near me']

/**
 * Section 25 modifier matrix. Not every modifier suits every head: purity words
 * only go on Pashmina heads, and positioning-breaking words are never used.
 */
const MODIFIERS = {
  quality: ['best', 'top', 'premium', 'luxury', 'handmade', 'handwoven', 'designer', 'traditional', 'modern', 'soft', 'warm', 'lightweight'],
  purity: ['authentic', 'genuine', 'pure', 'original'],
  occasion: ['winter', 'wedding', 'bridal'],
  commerce: ['buy', 'shop', 'order'],
  suffix: ['online', 'price', 'guide', 'gift', 'india'],
  /** A luxury brand chasing "cheap" attracts the wrong buyer and bounces. */
  offPositioning: ['cheap', 'affordable'],
  offers: ['sale', 'discount'],
} as const

export function generateCandidates(facts: CatalogFacts): GenerationResult {
  const candidates: Candidate[] = []
  let rejected = 0

  for (const [category, keywords] of Object.entries(keywordSeeds) as Array<[KeywordCategory, string[]]>) {
    for (const keyword of keywords) {
      candidates.push({ keyword: cleanKeyword(keyword), category, origin: 'seed' })
    }
  }

  const add = (keyword: string, category: KeywordCategory) => {
    const clean = cleanKeyword(keyword)
    const stock = checkStock(clean, facts)
    if (stock.rejectReason || (stock.constrained && stock.matches.length === 0)) {
      rejected++
      return
    }
    candidates.push({ keyword: clean, category, origin: 'generated' })
  }

  const heads = PRODUCT_HEADS.filter((head) => checkStock(head, facts).matches.length > 0)
  rejected += PRODUCT_HEADS.length - heads.length

  // Colour × product, for colours that exist in the catalogue.
  for (const [color, { slugs }] of Object.entries(colorSearchTerms)) {
    if (slugs.length === 0) {
      rejected += COLOR_TEMPLATES.length
      continue
    }
    for (const template of COLOR_TEMPLATES) add(`${color} ${template}`, 'color')
  }

  for (const head of heads) {
    const isPashmina = hasTerm(head, 'pashmina')

    const templates = [
      ...LONG_TAIL,
      ...(keywordConfig.shipping.international ? LONG_TAIL_INTERNATIONAL : []),
      ...(isPashmina ? LONG_TAIL_PASHMINA : []),
      ...(keywordConfig.physicalStore ? LONG_TAIL_STORE : []),
    ]
    for (const template of templates) add(template.replace('{p}', head), 'long-tail')

    const prefixes = [
      ...MODIFIERS.quality,
      ...(isPashmina ? MODIFIERS.purity : []),
      ...MODIFIERS.occasion,
      ...MODIFIERS.commerce,
    ]
    for (const modifier of prefixes) {
      if (hasTerm(head, modifier)) continue
      add(`${modifier} ${head}`, 'modifier')
    }
    for (const modifier of MODIFIERS.suffix) add(`${head} ${modifier}`, 'modifier')

    rejected += MODIFIERS.offPositioning.length
    if (keywordConfig.activeOffers.length) {
      for (const modifier of MODIFIERS.offers) add(`${head} ${modifier}`, 'modifier')
    } else {
      rejected += MODIFIERS.offers.length
    }

    for (const band of keywordConfig.priceBands) add(`${head} under ${band}`, 'price')
  }

  return { candidates, rejected }
}
