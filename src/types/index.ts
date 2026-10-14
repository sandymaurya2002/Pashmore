/**
 * Pashmore domain model.
 *
 * These types are the contract between the UI and the Cloudflare Worker API.
 * Nothing in `src/components` may reach for a concrete data source — it consumes
 * these shapes only. Worker responses are mapped onto them by `src/lib/normalize`.
 */

export type { Currency } from '@/lib/region'
import type { Currency } from '@/lib/region'

export type Gender = 'women' | 'men' | 'unisex'

export type ProductBadge =
  | 'new'
  | 'bestseller'
  | 'limited'
  | 'handcrafted'
  | 'exclusive'

export type Availability = 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order'

export interface ProductImage {
  /** Path under /public or an absolute CDN URL. */
  url: string
  /** Meaningful, human-written alt text. Never a filename. */
  alt: string
  width: number
  height: number
  /** Primary listing image. Exactly one per product. */
  isPrimary?: boolean
}

export interface ProductColor {
  name: string
  /** URL-safe token used in filter query strings. */
  slug: string
  /** CSS colour used for the swatch. */
  hex: string
}

export interface ProductSize {
  name: string
  slug: string
  /** e.g. "100 × 200 cm" */
  measurement?: string
}

export interface ProductVariant {
  id: string
  sku: string
  colorSlug?: string
  sizeSlug?: string
  price: number
  compareAtPrice?: number
  inventory: number
}

export interface ProductSpecification {
  label: string
  value: string
}

export interface ProductFaq {
  question: string
  answer: string
}

export interface Product {
  id: string
  slug: string
  name: string
  /** One-line editorial hook used on cards and meta descriptions. */
  tagline: string
  description: string
  /** Long-form editorial copy, rendered as paragraphs. */
  story: string[]
  gender: Gender
  /** Primary category slug — drives breadcrumbs and canonical collection. */
  categorySlug: string
  categoryName?: string
  /** Every collection this product belongs to. */
  collectionSlugs: string[]
  material: string
  materialSlug: string
  pattern: string
  patternSlug: string
  craft: string
  price: number
  compareAtPrice?: number
  /** The currency `price` is in: the shopper's region (INR for India, USD elsewhere). */
  currency: Currency
  /** False when the product has no price for the shopper's region and cannot be bought there. */
  availableInRegion: boolean
  images: ProductImage[]
  colors: ProductColor[]
  sizes: ProductSize[]
  variants: ProductVariant[]
  inventory: number
  badges: ProductBadge[]
  specifications: ProductSpecification[]
  careInstructions: string[]
  countryOfOrigin: string
  /** ISO date — powers "Newest" sorting and New Arrivals. */
  publishedAt: string
  /** Relative popularity, 0–100. Powers "Best selling" sorting. */
  popularity: number
  faqs?: ProductFaq[]
  /** Only present where genuine review data exists. Never fabricated. */
  rating?: ProductRating
  relatedSlugs?: string[]
}

export interface ProductRating {
  average: number
  count: number
}

export interface Review {
  id: string
  productSlug: string
  author: string
  rating: number
  title: string
  body: string
  createdAt: string
  verifiedPurchase: boolean
}

export interface Category {
  slug: string
  name: string
  gender?: Gender
  description: string
}

export type CollectionGroup =
  | 'women'
  | 'men'
  | 'collections'
  | 'gifting'
  | 'category'

export interface Collection {
  slug: string
  name: string
  /** Shown as the page <h1>; falls back to `name`. */
  heading?: string
  /** SEO description and the intro paragraph under the H1. */
  description: string
  /** Extra long-form copy rendered below the grid for search intent. */
  seoContent?: string[]
  group: CollectionGroup
  bannerImage: ProductImage
  /**
   * Aggregate collections (e.g. "Shawls" across both genders) pull in every
   * product whose primary category is listed here, in addition to products
   * that name the collection directly.
   */
  includeCategorySlugs?: string[]
  /** Slugs of sibling collections, for internal linking. */
  relatedSlugs: string[]
  faqs?: ProductFaq[]
  /** Excludes the collection from /collections index listings. */
  hidden?: boolean
  featured?: boolean
  /** Published products in the collection, when the API supplies it. */
  productCount?: number
}

/* ---------------------------------------------------------------- *
 * Cart / checkout
 * ---------------------------------------------------------------- */

export interface CartItem {
  /** Server-side cart line id. */
  key: string
  productSlug: string
  variantId: string
  sku?: string
  name: string
  image: ProductImage
  color?: string
  size?: string
  unitPrice: number
  compareAtPrice?: number
  quantity: number
  maxQuantity: number
  inStock: boolean
  /** Not sold in the shopper's region (no price in its currency). */
  regionUnavailable?: boolean
}

export interface Cart {
  currency: Currency
  items: CartItem[]
  totals: CartTotals
  coupon: Coupon | null
  freeShippingThreshold: number
  remainingForFreeShipping: number
}

export interface CartTotals {
  subtotal: number
  discount: number
  shipping: number
  tax: number
  total: number
  itemCount: number
}

export interface Coupon {
  code: string
  label: string
  type: 'percent' | 'fixed'
  value: number
  minimumSubtotal?: number
}

/* ---------------------------------------------------------------- *
 * Customer
 * ---------------------------------------------------------------- */

export interface Address {
  id: string
  label: string
  fullName: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
  isDefault?: boolean
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  acceptsMarketing: boolean
  createdAt: string
}

export type AddressInput = Omit<Address, 'id'>

export type OrderStatus =
  | 'pending'
  | 'placed'
  | 'confirmed'
  | 'payment_pending'
  | 'payment_failed'
  | 'paid'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refund_pending'
  | 'refunded'

export interface OrderHistoryEntry {
  status: OrderStatus
  note?: string
  createdAt: string
}

export interface OrderItem {
  productSlug: string
  name: string
  image: ProductImage
  color?: string
  size?: string
  unitPrice: number
  quantity: number
}

export interface Order {
  id: string
  number: string
  placedAt: string
  status: OrderStatus
  /** Fixed when the order is placed; every amount on the order is in it. */
  currency: Currency
  items: OrderItem[]
  totals: CartTotals
  shippingAddress: Omit<Address, 'id' | 'label'>
  shippingMethod?: string
  /** Human label, e.g. "Cash on Delivery". */
  paymentMethod?: string
  /** Raw method code from the API: `RAZORPAY` or `COD`. */
  paymentMethodCode?: string
  paymentStatus?: string
  couponCode?: string
  refunded?: number
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  estimatedDelivery?: string
  paidAt?: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  returnReason?: string
  canCancel?: boolean
  canReturn?: boolean
  /** An online payment is still owed and can be (re)tried until `paymentExpiresAt`. */
  awaitingPayment?: boolean
  paymentExpiresAt?: string
  history?: OrderHistoryEntry[]
}

/** What the Worker hands back to open Razorpay Checkout for an order. */
export interface PaymentSession {
  provider: 'razorpay'
  keyId: string
  razorpayOrderId: string
  /** In the currency's minor unit (paise, cents). */
  amount: number
  currency: Currency
  name: string
  description: string
  orderId: string
  orderNumber: string
  prefill: { name: string; email: string; contact: string }
  expiresAt: string | null
}

export interface WishlistEntry {
  productSlug: string
  addedAt: string
}

/* ---------------------------------------------------------------- *
 * Content
 * ---------------------------------------------------------------- */

export type BlogCategorySlug =
  | 'pashmina-guide'
  | 'kashmiri-craft'
  | 'indian-textiles'
  | 'fashion'
  | 'care-guide'
  | 'gift-guide'
  | 'style-guide'
  | 'craftsmanship'

export interface BlogCategory {
  slug: BlogCategorySlug
  name: string
  description: string
}

export type BlogBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'subheading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'productLink'; slug: string; label: string }
  | { type: 'collectionLink'; slug: string; label: string }

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  category: BlogCategorySlug
  author: string
  publishedAt: string
  updatedAt?: string
  readingMinutes: number
  cover: ProductImage
  blocks: BlogBlock[]
  faqs?: ProductFaq[]
  relatedProductSlugs?: string[]
  relatedCollectionSlugs?: string[]
}

/* ---------------------------------------------------------------- *
 * Merchandising
 * ---------------------------------------------------------------- */

export interface Banner {
  id: string
  eyebrow?: string
  heading: string
  subheading?: string
  image: ProductImage
  href: string
  ctaLabel: string
  secondaryHref?: string
  secondaryCtaLabel?: string
}

export interface HomepageSection {
  id: string
  type:
    | 'hero'
    | 'intro'
    | 'categories'
    | 'carousel'
    | 'featured'
    | 'heritage'
    | 'grid'
    | 'gifting'
    | 'social'
    | 'newsletter'
  heading?: string
  subheading?: string
  href?: string
}

/* ---------------------------------------------------------------- *
 * Browsing
 * ---------------------------------------------------------------- */

export type SortKey =
  | 'featured'
  | 'newest'
  | 'price-low'
  | 'price-high'
  | 'best-selling'

export interface ProductFilters {
  category: string[]
  color: string[]
  material: string[]
  size: string[]
  pattern: string[]
  collection: string[]
  availability: string[]
  minPrice?: number
  maxPrice?: number
}

export interface FilterOption {
  label: string
  value: string
  count: number
  hex?: string
}

export interface FilterFacets {
  category: FilterOption[]
  color: FilterOption[]
  material: FilterOption[]
  size: FilterOption[]
  pattern: FilterOption[]
  collection: FilterOption[]
  availability: FilterOption[]
  priceRange: { min: number; max: number }
  currency: Currency
}

export interface ProductQueryResult {
  products: Product[]
  total: number
  page: number
  totalPages: number
  facets: FilterFacets
}

export interface SearchResult {
  products: Product[]
  collections: Array<{ slug: string; name: string }>
  total: number
}

export interface Breadcrumb {
  name: string
  href: string
}
