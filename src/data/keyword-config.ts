/**
 * Business facts the keyword engine needs and cannot read from the catalogue.
 *
 * Keep these honest — they decide which keywords Pashmore is allowed to
 * target. Flip a flag only when it is true in the real business.
 */
export const keywordConfig = {
  /** Product types Pashmore does not sell, even if demo data contains them. */
  excludedProductTypes: ['jacket', 'suit', 'blanket'],

  /**
   * A walk-in showroom. "Near me" and city searches are only worth pursuing
   * through a Google Business Profile, and only if this is true.
   */
  physicalStore: false,

  /** Running promotions. Offer/sale/coupon keywords stay `no-page` while empty. */
  activeOffers: [] as string[],

  /**
   * Set to true only when lab fibre reports / GI certificates exist for the
   * products. Until then, "100% pure", "GI certified" and similar keywords are
   * flagged for verification rather than recommended.
   */
  verifiedClaims: {
    purePashmina: false,
    giCertified: false,
  },

  /** Mirrors the shipping policy in data/policies.ts. */
  shipping: { india: true, international: true },

  /** Prices are INR-only; per-country pages would be doorway pages. */
  localisedPricing: false,

  /** A curated price-band or colour page needs at least this many products. */
  minProductsForCuratedPage: 4,

  priceBands: [1000, 2000, 5000, 10000, 20000],

  /** Language of the site copy. */
  language: 'en',
  /** Home market — keywords with no location are attributed here. */
  homeCountry: 'IN',

  /** Months before a season's search peak by which content should be live. */
  seasonalLeadTime: {
    winter: 'Publish by early September — Indian winter demand builds from October.',
    diwali: 'Publish 6–8 weeks before Diwali; gifting searches start rising a month out.',
    wedding: 'Wedding season runs Oct–Feb; refresh content by August.',
    christmas: 'Publish by mid-October for international gifting and shipping times.',
    eid: 'Publish 6 weeks ahead; the date moves ~11 days earlier each year.',
    mothersDay: 'Publish by early April.',
  },
} as const

/**
 * Colour families: the words people search with, and the catalogue colour
 * slugs that honestly answer them. One family = at most one colour page, so
 * "white", "ivory" and "off white" never become three pages of the same
 * products. A family only matches products that use one of its colour slugs.
 */
export const colorFamilies: Record<string, { terms: string[]; slugs: string[] }> = {
  white: {
    terms: ['white', 'off white', 'ivory', 'cream', 'champagne'],
    slugs: ['white', 'off-white', 'ivory', 'cream', 'champagne'],
  },
  beige: {
    terms: ['beige', 'camel', 'sand', 'tan', 'nude', 'khaki'],
    slugs: ['beige', 'sand', 'camel', 'tan', 'nude', 'khaki'],
  },
  brown: {
    terms: ['brown', 'taupe', 'chocolate', 'bronze'],
    slugs: ['brown', 'taupe', 'chocolate', 'bronze'],
  },
  grey: { terms: ['grey', 'gray', 'charcoal'], slugs: ['grey', 'charcoal', 'slate', 'mist'] },
  blue: {
    terms: ['blue', 'navy', 'royal blue', 'sky blue', 'teal', 'turquoise', 'indigo', 'aqua'],
    slugs: ['blue', 'navy', 'royal-blue', 'sky-blue', 'teal', 'turquoise', 'indigo', 'aqua', 'midnight'],
  },
  red: {
    terms: ['red', 'maroon', 'burgundy', 'wine', 'rust', 'terracotta'],
    slugs: ['red', 'maroon', 'wine', 'crimson', 'burgundy', 'rust', 'terracotta'],
  },
  pink: {
    terms: ['pink', 'dusty pink', 'rose', 'blush', 'hot pink'],
    slugs: ['pink', 'rose', 'blush', 'hot-pink'],
  },
  green: {
    terms: ['green', 'olive', 'emerald', 'mint', 'sage', 'lime'],
    slugs: ['green', 'emerald', 'olive', 'mint', 'sage', 'forest-green', 'lime'],
  },
  orange: {
    terms: ['orange', 'mustard', 'saffron', 'coral', 'copper'],
    slugs: ['orange', 'mustard', 'saffron', 'coral', 'copper'],
  },
  gold: { terms: ['gold', 'golden', 'rose gold'], slugs: ['gold', 'rose-gold'] },
  black: { terms: ['black'], slugs: ['black'] },
  purple: {
    terms: ['purple', 'lavender', 'lilac', 'plum', 'violet'],
    slugs: ['purple', 'lavender', 'lilac', 'plum', 'violet'],
  },
  silver: { terms: ['silver'], slugs: ['silver'] },
  yellow: { terms: ['yellow'], slugs: ['yellow'] },
  peach: { terms: ['peach'], slugs: ['peach'] },
  magenta: { terms: ['magenta', 'fuchsia'], slugs: ['magenta', 'fuchsia'] },
  multicolour: {
    terms: ['multicolour', 'multicolor', 'multi colour', 'multi color'],
    slugs: ['multicolour'],
  },
}

/** Search term → catalogue slugs and family. */
export const colorSearchTerms: Record<string, { family: string; slugs: string[] }> = Object.fromEntries(
  Object.entries(colorFamilies).flatMap(([family, { terms, slugs }]) =>
    terms.map((term) => [term, { family, slugs }]),
  ),
)
