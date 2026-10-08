/** Lowercase, straight quotes, single spaces, no trailing question mark. */
export function cleanKeyword(value: string): string {
  return value
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[?!.]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isQuestion(keyword: string): boolean {
  return /^(what|how|why|where|which|who|when|is|are|does|do|can|should)\b/.test(keyword)
}

/** Whole-word / whole-phrase test. */
export function hasTerm(keyword: string, term: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(keyword)
}

export function hasAny(keyword: string, terms: readonly string[]): boolean {
  return terms.some((term) => hasTerm(keyword, term))
}

const TOKEN_MAP: Record<string, string> = {
  womens: 'women',
  ladies: 'women',
  lady: 'women',
  mens: 'men',
  gents: 'men',
  gray: 'grey',
  shawls: 'shawl',
  scarves: 'scarf',
  scarfs: 'scarf',
  stoles: 'stole',
  wraps: 'wrap',
  gifts: 'gift',
  deals: 'deal',
  offers: 'offer',
  bengaluru: 'bangalore',
  gurugram: 'gurgaon',
  kashmir: 'kashmiri',
}

const STOPWORDS = new Set(['for', 'a', 'an', 'the', 'in', 'of', 'and', 'to'])

/**
 * Word-order, plural and possessive insensitive key. "women's pashmina shawls"
 * and "pashmina shawl for women" share a key: they are the same search and
 * belong on the same page.
 */
export function variantKey(keyword: string): string {
  const tokens = cleanKeyword(keyword)
    .replace(/'s\b/g, '')
    .replace(/[^a-z0-9% ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((token) => TOKEN_MAP[token] ?? token)
    .filter((token) => !STOPWORDS.has(token))
  return [...new Set(tokens)].sort().join(' ')
}

export function slugToPhrase(slug: string): string {
  return slug.replace(/-/g, ' ')
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
