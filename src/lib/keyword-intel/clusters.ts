import { keywordConfig } from '@/data/keyword-config'
import { countryTerms, indianCities } from '@/data/keyword-seeds'
import type { ContentType } from '@/types/keywords'
import { hasAny, hasTerm, slugify } from './normalize'

/**
 * Topic clusters.
 *
 * One cluster = one search need = one page. Rules run top to bottom and the
 * first match wins, so specific needs (care, comparisons, price bands) are
 * claimed before broad ones (pashmina shawls). A new keyword never needs a new
 * rule unless it represents a genuinely new need.
 *
 * `target.url` is the single page that should rank for the whole cluster. When
 * that URL already exists the engine recommends optimising it; when it doesn't,
 * it recommends creating it — once, for the whole cluster.
 */

export interface ClusterTarget {
  url: string | null
  type: ContentType
  /** Set when the cluster should never get its own page. */
  noPage?: string
  /** Cover inside another page rather than as a page of its own. */
  mergeNote?: string
}

export interface ClusterDef {
  id: string
  name: string
  /** Preferred head term; falls back to the cluster's best-scoring keyword. */
  primary?: string
  match: (keyword: string) => boolean
  target: ClusterTarget
  /** Informational clusters own one article each — duplicates are conflicts. */
  informational?: boolean
  notes?: string[]
}

const OFFER = ['sale', 'discount', 'discounts', 'offer', 'offers', 'deal', 'deals', 'coupon', 'clearance']
const PURITY = ['pure', '100%', 'authentic', 'genuine', 'real', 'original', 'certified', 'gi']
const internationalTerms = Object.keys(countryTerms).filter((term) => countryTerms[term] !== 'IN')
const has = (k: string, ...terms: string[]) => hasAny(k, terms)
const isPashmina = (k: string) => has(k, 'pashmina', 'pashm', 'pashmeena')

export const clusterDefs: ClusterDef[] = [
  {
    id: 'brand-offers',
    name: 'Pashmore offers',
    match: (k) => has(k, 'pashmore') && hasAny(k, OFFER),
    target: keywordConfig.activeOffers.length
      ? { url: '/collections/sale', type: 'collection' }
      : { url: null, type: 'none', noPage: 'No active promotion — an offer page now would mislead.' },
  },
  {
    id: 'brand-reviews',
    name: 'Pashmore reviews',
    match: (k) => has(k, 'pashmore') && has(k, 'review', 'reviews'),
    target: { url: null, type: 'none', noPage: 'Earn this with genuine product reviews and third-party listings; never a self-written review page.' },
  },
  {
    id: 'brand',
    name: 'Pashmore brand',
    primary: 'pashmore',
    match: (k) => has(k, 'pashmore'),
    target: { url: '/', type: 'homepage' },
    notes: ['Brand searches should land on the homepage; product-type brand searches ("pashmore stole") still convert there via navigation.'],
  },
  {
    id: 'offers',
    name: 'Pashmina offers & sales',
    match: (k) => hasAny(k, OFFER),
    target: keywordConfig.activeOffers.length
      ? { url: '/collections/sale', type: 'collection' }
      : { url: null, type: 'none', noPage: 'No active promotion. Revisit when a genuine sale runs.' },
  },
  {
    id: 'near-me',
    name: 'Near me',
    match: (k) => k.includes('near me'),
    target: keywordConfig.physicalStore
      ? { url: null, type: 'google-business-profile' }
      : { url: null, type: 'none', noPage: 'No walk-in store. "Near me" ranks through a Google Business Profile, which needs a real address customers can visit.' },
  },
  {
    id: 'location-india-cities',
    name: 'Indian cities',
    match: (k) => hasAny(k, indianCities),
    target: { url: null, type: 'none', noPage: 'Pashmore delivers nationwide from one location — per-city pages would be doorway pages. State delivery times on /shipping instead.' },
  },
  {
    id: 'location-international',
    name: 'International delivery',
    match: (k) => hasAny(k, internationalTerms),
    target: keywordConfig.shipping.international
      ? { url: '/shipping', type: 'policy', mergeNote: 'One international delivery section (countries, times, duties). No per-country pages while prices are INR-only.' }
      : { url: null, type: 'none', noPage: 'Pashmore does not ship internationally.' },
  },
  {
    id: 'compare-pashmina-cashmere',
    name: 'Pashmina vs cashmere',
    primary: 'pashmina vs cashmere',
    informational: true,
    // "pashmina cashmere" with no product noun is someone asking how the two relate.
    match: (k) =>
      isPashmina(k) &&
      has(k, 'cashmere') &&
      (has(k, 'vs', 'or', 'difference', 'same as') || /\band\b/.test(k) || !has(k, 'shawl', 'shawls', 'stole', 'stoles', 'scarf', 'scarves', 'wrap', 'wraps')),
    target: { url: '/blog/pashmina-vs-cashmere', type: 'blog-article' },
  },
  {
    id: 'compare-pashmina-wool',
    name: 'Pashmina vs wool',
    primary: 'pashmina vs wool',
    informational: true,
    match: (k) => (isPashmina(k) || has(k, 'cashmere')) && has(k, 'wool', 'merino') && has(k, 'vs', 'or', 'difference'),
    target: { url: '/blog/pashmina-vs-wool', type: 'blog-article' },
  },
  {
    id: 'compare-shawl-stole-scarf',
    name: 'Shawl vs stole vs scarf',
    primary: 'shawl vs stole',
    informational: true,
    match: (k) => has(k, 'vs', 'difference') && has(k, 'stole', 'scarf') && has(k, 'shawl'),
    target: { url: '/blog/shawl-vs-stole-vs-scarf', type: 'blog-article' },
  },
  {
    id: 'authenticity-guide',
    name: 'Identifying real pashmina',
    primary: 'how to identify pure pashmina',
    informational: true,
    match: (k) =>
      has(k, 'identify', 'check', 'test', 'fake', 'know if', 'authenticity', 'certification', 'quality guide', 'blended') ||
      (/^(how|is|are|can)\b/.test(k) && hasAny(k, PURITY)),
    target: { url: '/blog/how-to-identify-quality-pashmina', type: 'blog-article' },
  },
  {
    id: 'care',
    name: 'Pashmina care',
    primary: 'how to wash pashmina',
    informational: true,
    match: (k) => has(k, 'wash', 'clean', 'care', 'maintain', 'stain', 'stains', 'fold') || /how (to|do i) store/.test(k),
    target: { url: '/blog/how-to-care-for-pashmina', type: 'blog-article' },
  },
  {
    id: 'styling',
    name: 'Wearing & styling',
    primary: 'how to wear a pashmina shawl',
    informational: true,
    match: (k) => /how (to|should i|do i) (wear|style|drape)|\bstyling\b|ways to wear/.test(k),
    target: { url: '/blog/styling-a-pashmina-shawl', type: 'blog-article' },
  },
  {
    id: 'what-is-pashmina',
    name: 'What is pashmina',
    primary: 'what is pashmina',
    informational: true,
    match: (k) =>
      /^(what is|what's|where does|how is)|made from|\bis pashmina\b|pashmina vs silk|^(pashmina|pashm) (wool|fabric|material|cloth)$|^wool (pashmina|pashm)$/.test(k),
    target: { url: '/blog/what-is-pashmina', type: 'blog-article' },
  },
  {
    id: 'price-guide',
    name: 'Pashmina prices',
    primary: 'pashmina shawl price',
    match: (k) => has(k, 'price', 'prices', 'cost', 'costs', 'expensive', 'cheap', 'affordable', 'how much') && !/\bunder \d/.test(k),
    target: {
      url: '/pashmina-shawls',
      type: 'landing-page',
      mergeNote: 'Expand the price section with a real price table by fibre and craft, drawn from the live catalogue.',
    },
  },
  {
    id: 'corporate-gifts',
    name: 'Corporate gifting',
    primary: 'corporate gifts',
    match: (k) => has(k, 'corporate', 'client', 'employee', 'employees'),
    target: { url: '/corporate-gifts', type: 'landing-page' },
  },
  {
    id: 'wedding-gifts',
    name: 'Wedding gifts',
    primary: 'pashmina wedding gift',
    match: (k) => has(k, 'gift', 'gifts', 'shagun') && has(k, 'wedding', 'bridal', 'shagun'),
    target: { url: '/wedding-gifts', type: 'landing-page' },
  },
  {
    id: 'gifts-for-him',
    name: 'Gifts for him',
    primary: 'pashmina gift for men',
    match: (k) => has(k, 'gift', 'gifts') && has(k, 'men', 'mens', "men's", 'him', 'husband', 'father', 'dad', 'boyfriend'),
    target: { url: '/collections/gifts-for-him', type: 'collection' },
  },
  {
    id: 'gifts-for-her',
    name: 'Gifts for her',
    primary: 'pashmina gift for women',
    match: (k) =>
      has(k, 'gift', 'gifts') &&
      has(k, 'women', 'womens', "women's", 'her', 'mother', 'mom', 'wife', 'girlfriend', 'sister', 'grandmother', "mother's day"),
    target: { url: '/collections/gifts-for-her', type: 'collection' },
  },
  {
    id: 'festive',
    name: 'Festive & holiday',
    primary: 'pashmina shawl for diwali',
    match: (k) => has(k, 'diwali', 'christmas', 'new year', 'eid', 'festival', 'festivals', 'festive', 'holiday'),
    target: { url: '/blog/festive-pashmina-gift-guide', type: 'blog-article' },
    notes: [
      keywordConfig.seasonalLeadTime.diwali,
      keywordConfig.seasonalLeadTime.christmas,
      'One evergreen guide, updated each season — not one page per festival.',
    ],
  },
  {
    id: 'gifting',
    name: 'Pashmina gifts',
    primary: 'pashmina gift',
    match: (k) => has(k, 'gift', 'gifts', 'anniversary', 'birthday'),
    target: { url: '/collections/gifting', type: 'collection' },
  },
  {
    id: 'wedding-bridal',
    name: 'Wedding & bridal shawls',
    primary: 'pashmina wedding shawl',
    match: (k) => has(k, 'wedding', 'bridal', 'bride', 'trousseau'),
    target: { url: '/collections/wedding-collection', type: 'collection' },
    notes: [keywordConfig.seasonalLeadTime.wedding],
  },
  {
    id: 'occasion-wear',
    name: 'Occasion wear',
    primary: 'pashmina shawl for party',
    match: (k) => has(k, 'party', 'evening', 'dinner', 'formal', 'office', 'travel', 'vacation'),
    target: { url: '/blog/pashmina-for-every-occasion', type: 'blog-article' },
    notes: ['One guide covering every occasion, linking to products — not a thin page per occasion.'],
  },
  {
    id: 'pure-pashmina',
    name: 'Pure pashmina',
    primary: 'pure pashmina shawl',
    match: (k) => isPashmina(k) && hasAny(k, PURITY),
    target: { url: '/pure-pashmina-shawls', type: 'landing-page' },
  },
  {
    id: 'kashmiri-shawls',
    name: 'Kashmiri shawls',
    primary: 'kashmiri shawl',
    match: (k) => has(k, 'kashmir', 'kashmiri', 'kani', 'sozni', 'jamawar', 'tilla', 'paisley'),
    target: { url: '/kashmiri-shawls', type: 'landing-page' },
  },
  {
    id: 'stoles',
    name: 'Pashmina stoles',
    primary: 'pashmina stole',
    match: (k) => has(k, 'stole', 'stoles', 'stols'),
    target: { url: '/pashmina-stoles', type: 'landing-page' },
  },
  {
    id: 'scarves',
    name: 'Scarves & mufflers',
    primary: 'pashmina scarf',
    match: (k) => has(k, 'scarf', 'scarves', 'muffler', 'mufflers'),
    target: { url: '/collections/scarves', type: 'collection' },
  },
  {
    id: 'mens-shawls',
    name: "Men's shawls",
    primary: 'pashmina shawl for men',
    match: (k) => has(k, 'men', 'mens', "men's", 'gents', 'him'),
    target: { url: '/mens-shawls', type: 'landing-page' },
  },
  {
    id: 'womens-shawls',
    name: "Women's shawls",
    primary: 'pashmina shawl for women',
    match: (k) => has(k, 'women', 'womens', "women's", 'ladies', 'her'),
    target: { url: '/womens-shawls', type: 'landing-page' },
  },
  {
    id: 'winter',
    name: 'Winter shawls',
    primary: 'winter shawl',
    match: (k) => has(k, 'winter', 'autumn', 'fall', 'warm'),
    target: { url: '/winter-shawls', type: 'landing-page' },
    notes: [keywordConfig.seasonalLeadTime.winter],
  },
  {
    id: 'cashmere',
    name: 'Cashmere',
    primary: 'cashmere shawl',
    match: (k) => has(k, 'cashmere') && !isPashmina(k),
    target: {
      url: '/pashmina-shawls',
      type: 'landing-page',
      mergeNote: 'Pashmina is the finest grade of cashmere — answer cashmere searches in a section of the pashmina guide until the cashmere range justifies its own page.',
    },
  },
  {
    id: 'fine-wool',
    name: 'Wool shawls',
    primary: 'fine wool shawl',
    match: (k) => has(k, 'wool', 'merino') && !isPashmina(k),
    target: { url: '/collections/fine-wool', type: 'collection' },
  },
  {
    id: 'luxury-shawls',
    name: 'Luxury shawls',
    primary: 'luxury shawls',
    match: (k) => has(k, 'luxury', 'heirloom', 'designer', 'premium', 'finest', 'softest') && !isPashmina(k),
    target: { url: '/luxury-shawls', type: 'landing-page' },
  },
  {
    id: 'pashmina-shawls',
    name: 'Pashmina shawls',
    primary: 'pashmina shawl',
    match: (k) => isPashmina(k) || has(k, 'wrap', 'wraps'),
    target: { url: '/pashmina-shawls', type: 'landing-page' },
  },
  {
    id: 'shawls',
    name: 'Shawls (general)',
    primary: 'shawls',
    match: (k) => has(k, 'shawl', 'shawls'),
    target: { url: '/collections/shawls', type: 'collection' },
  },
]

export const NOT_SERVED: ClusterDef = {
  id: 'not-served',
  name: 'Not served by the catalogue',
  match: () => false,
  target: { url: null, type: 'none', noPage: 'Pashmore cannot honestly satisfy these searches today.' },
}

export const UNCLUSTERED: ClusterDef = {
  id: 'unclustered',
  name: 'Needs review',
  match: () => false,
  target: { url: null, type: 'none', noPage: 'No cluster rule matched — review manually.' },
}

export const clusterById = new Map(
  [...clusterDefs, NOT_SERVED, UNCLUSTERED].map((def) => [def.id, def]),
)

export function priceBandOf(keyword: string): number | null {
  const under = keyword.match(/\bunder (\d[\d,]*)/)
  return under ? Number(under[1].replace(/,/g, '')) : null
}

/**
 * Price-band clusters: one per band, never one per product × band. A single
 * "under ₹N" page lists every product in the band, and only exists when the
 * band holds enough products to be worth browsing.
 */
export function priceBandCluster(band: number, productsInBand: number, minProducts: number): ClusterDef {
  const label = `₹${band.toLocaleString('en-IN')}`
  return {
    id: `price-under-${band}`,
    name: `Under ${label}`,
    match: () => true,
    target:
      productsInBand >= minProducts
        ? { url: `/collections/under-${band}`, type: 'collection' }
        : {
            url: '/pashmina-shawls',
            type: 'landing-page',
            mergeNote: `Only ${productsInBand} product(s) under ${label} — mention it in the price section rather than building a thin page.`,
          },
  }
}

/** Colour clusters: one per colour family, never one per colour × product. */
export function colorCluster(family: string): ClusterDef {
  return {
    id: `color-${slugify(family)}`,
    name: `${family[0].toUpperCase()}${family.slice(1)} colour family`,
    primary: `${family} pashmina shawl`,
    match: () => true,
    // Filled in by the engine from stock: a curated page, a product, or nothing.
    target: { url: null, type: 'none' },
  }
}

export function matchStaticCluster(keyword: string): ClusterDef {
  return clusterDefs.find((def) => def.match(keyword)) ?? UNCLUSTERED
}

export function isInternational(keyword: string): boolean {
  return hasAny(keyword, internationalTerms) && !hasTerm(keyword, 'india')
}
