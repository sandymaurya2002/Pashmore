import { BANNER_PLACEHOLDER, placeholderImage, resolveMediaUrl } from '@/lib/media'
import { DEFAULT_CURRENCY, isCurrency } from '@/lib/region'
import {
  asArray,
  asBoolean,
  asNumber,
  asOptionalNumber,
  asOptionalString,
  asRecord,
  asString,
  asStringArray,
  isRecord,
  type Raw,
} from '@/lib/normalize/primitives'
import type {
  Collection,
  CollectionGroup,
  FilterFacets,
  FilterOption,
  Gender,
  Product,
  ProductBadge,
  ProductColor,
  ProductFaq,
  ProductImage,
  ProductSize,
  ProductSpecification,
  ProductVariant,
  SearchResult,
} from '@/types'

const BADGES: ProductBadge[] = ['new', 'bestseller', 'limited', 'handcrafted', 'exclusive']
const GENDERS: Gender[] = ['women', 'men', 'unisex']
const GROUPS: CollectionGroup[] = ['women', 'men', 'collections', 'gifting', 'category']

export function normalizeImage(
  raw: unknown,
  fallbackAlt: string,
  fallbackSize: { width: number; height: number } = { width: 1200, height: 1500 },
): ProductImage | null {
  const record = typeof raw === 'string' ? { url: raw } : asRecord(raw)
  const url = resolveMediaUrl(asString(record.url))
  if (!url) return null
  return {
    url,
    alt: asOptionalString(record.alt) ?? fallbackAlt,
    width: asOptionalNumber(record.width) || fallbackSize.width,
    height: asOptionalNumber(record.height) || fallbackSize.height,
    ...(asBoolean(record.isPrimary) ? { isPrimary: true } : {}),
  }
}

function normalizeImages(raw: Raw, name: string): ProductImage[] {
  const images = asArray(raw.images)
    .map((entry) => normalizeImage(entry, name))
    .filter((entry): entry is ProductImage => Boolean(entry))

  if (!images.length && raw.primaryImage) {
    const primary = normalizeImage(raw.primaryImage, name)
    if (primary) images.push(primary)
  }

  // The primary image leads: cards, carts and Open Graph all use images[0].
  images.sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)))
  return images.length ? images : [placeholderImage(name)]
}

function normalizeColors(value: unknown): ProductColor[] {
  return asArray(value)
    .map(asRecord)
    .map((entry) => ({
      name: asString(entry.name),
      slug: asString(entry.slug),
      hex: asString(entry.hex, '#d8c7ae'),
    }))
    .filter((entry) => entry.slug && entry.name)
}

function normalizeSizes(value: unknown): ProductSize[] {
  return asArray(value)
    .map(asRecord)
    .map((entry) => ({
      name: asString(entry.name),
      slug: asString(entry.slug),
      ...(asOptionalString(entry.measurement)
        ? { measurement: asOptionalString(entry.measurement) }
        : {}),
    }))
    .filter((entry) => entry.slug && entry.name)
}

function normalizeVariants(value: unknown, productPrice: number): ProductVariant[] {
  return asArray(value)
    .map(asRecord)
    .map((entry) => {
      const price = asOptionalNumber(entry.price) ?? productPrice
      const compareAtPrice = asOptionalNumber(entry.compareAtPrice)
      return {
        id: asString(entry.id),
        sku: asString(entry.sku),
        colorSlug: asOptionalString(entry.colorSlug),
        sizeSlug: asOptionalString(entry.sizeSlug),
        price,
        compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : undefined,
        inventory: Math.max(0, Math.floor(asNumber(entry.inventory))),
      }
    })
    .filter((entry) => entry.id)
}

function normalizeFaqs(value: unknown): ProductFaq[] {
  return asArray(value)
    .map(asRecord)
    .map((entry) => ({ question: asString(entry.question), answer: asString(entry.answer) }))
    .filter((entry) => entry.question && entry.answer)
}

function normalizeSpecifications(value: unknown): ProductSpecification[] {
  return asArray(value)
    .map(asRecord)
    .map((entry) => ({ label: asString(entry.label), value: asString(entry.value) }))
    .filter((entry) => entry.label && entry.value)
}

/**
 * Maps a Worker product (full detail or trimmed card DTO) onto `Product`.
 * Returns null for records without the identity a page needs.
 */
export function normalizeProduct(input: unknown): Product | null {
  const raw = asRecord(input)
  const slug = asString(raw.slug)
  const name = asString(raw.name)
  if (!slug || !name) return null

  const price = asNumber(raw.price)
  const compareAtPrice = asOptionalNumber(raw.compareAtPrice)
  const variants = normalizeVariants(raw.variants, price)
  const variantStock = variants.reduce((sum, variant) => sum + variant.inventory, 0)
  const inventory =
    variants.length > 0
      ? variantStock
      : Math.max(0, Math.floor(asNumber(raw.inventory)))

  const badges = asStringArray(raw.badges)
    .map((badge) => badge.toLowerCase())
    .filter((badge): badge is ProductBadge => BADGES.includes(badge as ProductBadge))

  const gender = asString(raw.gender).toLowerCase() as Gender
  const tagline = asString(raw.tagline)
  const rating = asRecord(raw.rating)
  const ratingCount = asNumber(rating.count)
  const ratingAverage = asNumber(rating.average)
  const faqs = normalizeFaqs(raw.faqs)

  return {
    id: asString(raw.id, slug),
    slug,
    name,
    tagline,
    description: asString(raw.description) || tagline,
    story: asStringArray(raw.story, /\n{2,}/),
    gender: GENDERS.includes(gender) ? gender : 'unisex',
    categorySlug: asString(raw.categorySlug),
    categoryName: asOptionalString(raw.categoryName),
    collectionSlugs: asStringArray(raw.collectionSlugs),
    material: asString(raw.material),
    materialSlug: asString(raw.materialSlug),
    pattern: asString(raw.pattern),
    patternSlug: asString(raw.patternSlug),
    craft: asString(raw.craft),
    price,
    compareAtPrice: compareAtPrice && compareAtPrice > price ? compareAtPrice : undefined,
    currency: isCurrency(raw.currency) ? raw.currency : DEFAULT_CURRENCY,
    availableInRegion: raw.availableInRegion === undefined ? true : asBoolean(raw.availableInRegion),
    images: normalizeImages(raw, name),
    colors: normalizeColors(raw.colors),
    sizes: normalizeSizes(raw.sizes),
    variants,
    inventory,
    badges,
    specifications: normalizeSpecifications(raw.specifications),
    careInstructions: asStringArray(raw.careInstructions),
    countryOfOrigin: asString(raw.countryOfOrigin, 'India') || 'India',
    publishedAt: asString(raw.publishedAt),
    popularity: asNumber(raw.popularity),
    ...(faqs.length ? { faqs } : {}),
    // Only genuine review data is surfaced — never a fabricated score.
    ...(ratingCount > 0 && ratingAverage > 0
      ? { rating: { average: ratingAverage, count: ratingCount } }
      : {}),
    relatedSlugs: asStringArray(raw.relatedSlugs),
  }
}

export function normalizeProducts(input: unknown): Product[] {
  return asArray(input)
    .map(normalizeProduct)
    .filter((product): product is Product => Boolean(product))
}

export function normalizeCollection(input: unknown): Collection | null {
  const raw = asRecord(input)
  const slug = asString(raw.slug)
  const name = asString(raw.name)
  if (!slug || !name) return null

  const group = asString(raw.group).toLowerCase() as CollectionGroup
  const bannerRaw = isRecord(raw.bannerImage)
    ? raw.bannerImage
    : { url: raw.bannerUrl, alt: raw.bannerAlt }
  const bannerAlt = `${name} collection — handcrafted Indian textiles`
  const banner = normalizeImage(bannerRaw, bannerAlt, { width: 1800, height: 620 }) ?? {
    ...BANNER_PLACEHOLDER,
    alt: bannerAlt,
  }
  const faqs = normalizeFaqs(raw.faqs)
  const seoContent = asStringArray(raw.seoContent, /\n{2,}/)
  const productCount = asOptionalNumber(raw.productCount)

  return {
    slug,
    name,
    heading: asOptionalString(raw.heading),
    description: asString(raw.description),
    ...(seoContent.length ? { seoContent } : {}),
    group: GROUPS.includes(group) ? group : 'collections',
    bannerImage: banner,
    includeCategorySlugs: asStringArray(raw.includeCategorySlugs),
    relatedSlugs: asStringArray(raw.relatedSlugs),
    ...(faqs.length ? { faqs } : {}),
    hidden: asBoolean(raw.hidden),
    featured: asBoolean(raw.featured),
    ...(productCount !== undefined ? { productCount } : {}),
  }
}

export function normalizeCollections(input: unknown): Collection[] {
  return asArray(input)
    .map(normalizeCollection)
    .filter((collection): collection is Collection => Boolean(collection))
}

function normalizeOptions(value: unknown): FilterOption[] {
  return asArray(value)
    .map(asRecord)
    .map((entry) => ({
      label: asString(entry.label) || asString(entry.value),
      value: asString(entry.value),
      count: asNumber(entry.count),
      ...(asOptionalString(entry.hex) ? { hex: asOptionalString(entry.hex) } : {}),
    }))
    .filter((entry) => entry.value)
}

export const EMPTY_FACETS: FilterFacets = {
  category: [],
  color: [],
  material: [],
  size: [],
  pattern: [],
  collection: [],
  availability: [],
  priceRange: { min: 0, max: 0 },
  currency: DEFAULT_CURRENCY,
}

export function normalizeFacets(input: unknown): FilterFacets {
  if (!isRecord(input)) return EMPTY_FACETS
  const priceRange = asRecord(input.priceRange)
  return {
    category: normalizeOptions(input.category),
    color: normalizeOptions(input.color),
    material: normalizeOptions(input.material),
    size: normalizeOptions(input.size),
    pattern: normalizeOptions(input.pattern),
    collection: normalizeOptions(input.collection),
    availability: normalizeOptions(input.availability),
    priceRange: { min: asNumber(priceRange.min), max: asNumber(priceRange.max) },
    currency: isCurrency(input.currency) ? input.currency : DEFAULT_CURRENCY,
  }
}

export function normalizeSearch(input: unknown): SearchResult {
  const raw = asRecord(input)
  const products = normalizeProducts(raw.products)
  return {
    products,
    collections: asArray(raw.collections)
      .map(asRecord)
      .map((entry) => ({ slug: asString(entry.slug), name: asString(entry.name) }))
      .filter((entry) => entry.slug && entry.name),
    total: asNumber(raw.total, products.length),
  }
}
