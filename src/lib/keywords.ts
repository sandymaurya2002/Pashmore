import type { BlogCategorySlug, BlogPost, Product } from '@/types'

/**
 * Search keyword library.
 *
 * The brand is spelled "Pashmore"; the product people search for is spelled
 * "Pashmina" (and misspelled a dozen ways). Both have to be covered: brand
 * terms so the store wins navigational searches, product terms so it ranks for
 * what customers actually type.
 *
 * Google ignores `<meta name="keywords">`; Bing and Yandex give it a little
 * weight. These lists also feed JSON-LD `keywords` / `alternateName` /
 * `knowsAbout`, which do help search engines understand the entity. Rankings
 * still come from titles, H1s and page copy — keep the misspellings here and
 * out of visible text.
 */

/** Navigational searches for the store itself. */
export const brandKeywords = [
  'pashmore',
  'pashmore shawls',
  'pashmore kashmir',
  'pashmore online',
  'pashmore store',
  'pashmore srinagar',
] as const

/** Alternate brand names for Organization / WebSite JSON-LD. */
export const brandAlternateNames = [
  'Pashmore Kashmir',
  'Pashmore Shawls',
  'Pashmore Textiles',
] as const

/** Common misspellings and transliterations of the product name. */
export const spellingVariants = [
  'pashmina',
  'pashmeena',
  'pashmena',
  'pasmina',
  'pashmeena shawl',
  'pasmina shawl',
  'pashmina shawl',
  'pashm',
  'pashm shawl',
] as const

/** The head terms — the product itself. */
export const pashminaKeywords = [
  'pashmina shawl',
  'pashmina shawls',
  'pure pashmina',
  'pure pashmina shawl',
  'real pashmina shawl',
  'genuine pashmina',
  'original pashmina shawl',
  'authentic kashmiri pashmina',
  'gi certified pashmina',
  'handwoven pashmina',
  'hand spun pashmina',
  'changthangi pashmina',
  'ladakhi pashmina',
  'pashmina wrap',
  'pashmina stole',
  'pashmina scarf',
  'cashmere shawl',
  'buy pashmina online',
  'pashmina shawl online india',
  'pashmina shawl price',
] as const

export const kashmiriKeywords = [
  'kashmiri shawl',
  'kashmiri shawls',
  'kashmiri pashmina shawl',
  'shawls from kashmir',
  'kani shawl',
  'kani pashmina shawl',
  'sozni shawl',
  'sozni embroidered shawl',
  'jamawar shawl',
  'tilla embroidery',
  'kashmiri embroidery',
  'kashmiri handicrafts',
  'handloom shawl',
] as const

export const womenKeywords = [
  'pashmina shawl for women',
  'womens shawls',
  'ladies shawl',
  'ladies pashmina shawl',
  'pashmina stole for women',
  'womens scarves',
  'pashmina dupatta',
  'designer shawl for women',
  'winter shawl for women',
] as const

export const menKeywords = [
  'pashmina shawl for men',
  'mens shawl',
  'gents shawl',
  'mens pashmina stole',
  'mens muffler',
  'mens scarf',
  'shawl for men wedding',
  'winter shawl for men',
] as const

export const giftingKeywords = [
  'pashmina gift',
  'luxury gifts india',
  'gift for mother',
  'gift for wife',
  'gift for her',
  'gift for him',
  'anniversary gift',
  'diwali gift',
  'luxury gift box',
  'corporate gifts',
  'corporate gifting india',
] as const

export const weddingKeywords = [
  'bridal shawl',
  'wedding shawl',
  'bridal pashmina',
  'wedding gifts',
  'trousseau shawl',
  'shagun gift',
  'wedding shawl india',
] as const

export const luxuryKeywords = [
  'luxury shawls',
  'luxury pashmina',
  'heirloom shawl',
  'handmade shawl',
  'premium shawls india',
  'luxury indian fashion',
] as const

/** Keyword sets per collection slug. Unlisted slugs fall back to the head terms. */
const collectionKeywordMap: Record<string, readonly string[]> = {
  'womens-shawls': womenKeywords,
  'womens-pashmina': ['pashmina for women', ...womenKeywords],
  'womens-stoles': ['stoles for women', 'pashmina stole for women', 'ladies stole', 'silk stole'],
  'womens-scarves': ['womens scarves', 'pashmina scarf for women', 'cashmere scarf women'],
  'womens-dupattas': ['pashmina dupatta', 'embroidered dupatta', 'kashmiri dupatta', 'banarasi dupatta'],
  'womens-dresses': ['kashmiri dress', 'ethnic dresses', 'woollen kurti'],
  'mens-shawls': menKeywords,
  'mens-stoles': ['mens stole', 'mens pashmina stole', 'pashmina stole for men'],
  'mens-scarves': ['mens scarf', 'mens muffler', 'cashmere muffler', 'pashmina muffler'],
  'mens-accessories': ['mens accessories', 'pocket square', 'pashmina muffler'],
  shawls: ['shawls', 'shawls online', 'woollen shawl', 'winter shawls', ...kashmiriKeywords.slice(0, 4)],
  stoles: ['stoles', 'pashmina stole', 'stoles online', 'lightweight stole', 'woollen stole'],
  scarves: ['scarves', 'pashmina scarf', 'cashmere scarf', 'muffler'],
  accessories: ['luxury accessories', 'pashmina accessories'],
  'gift-sets': ['gift sets', ...giftingKeywords],
  'new-arrivals': ['new arrivals', 'new pashmina shawls', 'latest shawl designs'],
  'best-sellers': ['best selling shawls', 'popular pashmina shawls', 'best pashmina brand'],
  'heritage-collection': ['heritage shawl', 'heirloom shawl', 'antique shawl design', ...kashmiriKeywords.slice(4, 9)],
  'fine-wool': ['fine wool shawl', 'merino wool shawl', 'woollen shawl', 'handloom wool shawl'],
  'pure-pashmina': pashminaKeywords,
  'kashmiri-collection': kashmiriKeywords,
  'wedding-collection': weddingKeywords,
  'luxury-collection': luxuryKeywords,
  pashmina: [...pashminaKeywords, ...spellingVariants],
  gifting: giftingKeywords,
  'gifts-for-her': ['gift for her', 'gift for wife', 'gift for mother', 'pashmina gift for her'],
  'gifts-for-him': ['gift for him', 'gift for husband', 'gift for father', 'pashmina gift for men'],
  'wedding-gifts': ['wedding gifts', 'wedding gift ideas', 'shagun gift', ...weddingKeywords],
  'corporate-gifts': ['corporate gifts', 'corporate gifting india', 'client gifts', 'employee gifts', 'diwali corporate gifts'],
  'luxury-gift-boxes': ['luxury gift box', 'gift hamper', 'pashmina gift box'],
}

/** Landing pages are keyed by their own slug, which differs from the collection's. */
const landingKeywordMap: Record<string, readonly string[]> = {
  'pashmina-shawls': [...pashminaKeywords, ...spellingVariants],
  'kashmiri-shawls': kashmiriKeywords,
  'pure-pashmina-shawls': ['100% pure pashmina', 'how to identify real pashmina', ...pashminaKeywords],
  'womens-shawls': womenKeywords,
  'mens-shawls': menKeywords,
  'pashmina-stoles': ['pashmina stole', 'pashmina stoles online', 'lightweight pashmina stole', 'pashmina scarf'],
  'luxury-shawls': [...luxuryKeywords, 'kani shawl', 'sozni shawl'],
  'wedding-gifts': collectionKeywordMap['wedding-gifts'],
  'corporate-gifts': collectionKeywordMap['corporate-gifts'],
}

const blogCategoryKeywordMap: Record<BlogCategorySlug, readonly string[]> = {
  'pashmina-guide': ['what is pashmina', 'pashmina guide', 'real vs fake pashmina', 'pashmina vs cashmere'],
  'kashmiri-craft': ['kashmiri craft', 'kani weave', 'sozni embroidery', 'history of kashmiri shawls'],
  'indian-textiles': ['indian textiles', 'handloom india', 'indian weaves'],
  fashion: ['how to style a shawl', 'shawl fashion', 'pashmina outfit ideas'],
  'care-guide': ['how to wash pashmina', 'pashmina care', 'how to store shawls'],
  'gift-guide': ['pashmina gift ideas', 'luxury gift guide', 'wedding gift ideas'],
  'style-guide': ['how to wear a pashmina', 'shawl draping styles', 'stole styling'],
  craftsmanship: ['handwoven shawl', 'artisan made', 'charkha spinning', 'handloom weaving'],
}

const MAX_KEYWORDS = 30

/**
 * Merges groups, lowercases, de-duplicates and caps the list. The brand name is
 * always included so every page reinforces it.
 */
export function mergeKeywords(...groups: ReadonlyArray<readonly string[] | undefined>): string[] {
  const seen = new Set<string>()
  for (const group of [...groups, ['pashmore']]) {
    for (const keyword of group ?? []) {
      const clean = keyword.toLowerCase().replace(/\s+/g, ' ').trim()
      if (clean) seen.add(clean)
    }
  }
  return [...seen].slice(0, MAX_KEYWORDS)
}

/** Site-wide default: brand + head terms + spelling variants. */
export const siteKeywords = mergeKeywords(
  brandKeywords,
  pashminaKeywords.slice(0, 10),
  kashmiriKeywords.slice(0, 5),
  spellingVariants.slice(0, 4),
)

/** Topics the business is an authority on — feeds Organization `knowsAbout`. */
export const knowsAbout = [
  'Pashmina',
  'Pashmina shawls',
  'Kashmiri shawls',
  'Kani weaving',
  'Sozni embroidery',
  'Jamawar',
  'Cashmere',
  'Handloom textiles',
] as const

export function collectionKeywords(slug: string): string[] {
  return mergeKeywords(collectionKeywordMap[slug] ?? pashminaKeywords.slice(0, 8), brandKeywords.slice(0, 2))
}

export function landingKeywords(slug: string): string[] {
  return mergeKeywords(landingKeywordMap[slug] ?? pashminaKeywords.slice(0, 8), brandKeywords.slice(0, 2))
}

export function blogKeywords(post: Pick<BlogPost, 'title' | 'category'>): string[] {
  return mergeKeywords([post.title], blogCategoryKeywordMap[post.category], ['pashmina', 'kashmiri shawl'])
}

export function blogCategoryKeywords(slug: BlogCategorySlug): string[] {
  return mergeKeywords(blogCategoryKeywordMap[slug], ['pashmina', 'kashmiri shawl'])
}

/** Product keywords are derived from its attributes, so new products need no upkeep. */
export function productKeywords(product: Product): string[] {
  const name = product.name.toLowerCase()
  const material = product.material.toLowerCase()
  const pattern = product.pattern.toLowerCase()
  const isPashmina = product.materialSlug.includes('pashmina')
  const type =
    ['shawl', 'stole', 'scarf', 'dupatta', 'wrap', 'muffler'].find((word) =>
      name.includes(word),
    ) ?? 'shawl'

  const audience =
    product.gender === 'women'
      ? [`${type} for women`, `ladies ${type}`]
      : product.gender === 'men'
        ? [`${type} for men`, `mens ${type}`]
        : [`unisex ${type}`]

  return mergeKeywords(
    [name, `${material} ${type}`, `${pattern} ${type}`, `${product.colors[0]?.name ?? ''} ${type}`],
    audience,
    isPashmina ? ['pashmina ' + type, 'pure pashmina', 'kashmiri pashmina', 'pashmeena'] : [],
    pattern === 'solid' ? [] : [`kashmiri ${pattern}`],
    [`buy ${type} online`, `kashmiri ${type}`, 'handwoven in kashmir', 'pashmore'],
  )
}
