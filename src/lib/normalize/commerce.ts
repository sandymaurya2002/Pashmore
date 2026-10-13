import { FREE_SHIPPING_THRESHOLD } from '@/lib/site'
import { normalizeImage } from '@/lib/normalize/catalog'
import { placeholderImage } from '@/lib/media'
import {
  asArray,
  asBoolean,
  asIsoDate,
  asNumber,
  asOptionalNumber,
  asOptionalString,
  asRecord,
  asString,
  isRecord,
} from '@/lib/normalize/primitives'
import type {
  Address,
  Cart,
  CartItem,
  CartTotals,
  Coupon,
  Customer,
  Order,
  OrderItem,
  OrderStatus,
} from '@/types'

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'placed',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'returned',
]

export function normalizeOrderStatus(value: unknown): OrderStatus {
  const status = asString(value).toLowerCase() as OrderStatus
  return ORDER_STATUSES.includes(status) ? status : 'pending'
}

const PAYMENT_LABELS: Record<string, string> = {
  UPI: 'UPI',
  CARD: 'Credit / Debit Card',
  NETBANKING: 'Net Banking',
  WALLET: 'Wallet',
  COD: 'Cash on Delivery',
}

function normalizeTotals(input: unknown, itemCount: number): CartTotals {
  const raw = asRecord(input)
  return {
    subtotal: asNumber(raw.subtotal),
    discount: asNumber(raw.discount),
    shipping: asNumber(raw.shipping ?? raw.shippingFee),
    tax: asNumber(raw.tax ?? raw.taxAmount),
    total: asNumber(raw.total),
    itemCount: asOptionalNumber(raw.itemCount) ?? itemCount,
  }
}

function normalizeCoupon(input: unknown): Coupon | null {
  if (!isRecord(input)) return null
  const code = asString(input.code)
  if (!code) return null
  return {
    code,
    label: asString(input.label, code),
    type: asString(input.type).toLowerCase() === 'fixed' ? 'fixed' : 'percent',
    value: asNumber(input.value),
  }
}

function normalizeCartItem(input: unknown): CartItem | null {
  const raw = asRecord(input)
  const key = asString(raw.id) || asString(raw.key)
  // Products sold without variants are keyed by product id in the Worker.
  const variantId = asString(raw.variantId) || key
  const name = asString(raw.name)
  if (!key || !variantId || !name) return null

  const maxQuantity = Math.max(1, Math.floor(asNumber(raw.maxQuantity, 1)))
  const compareAtPrice = asOptionalNumber(raw.compareAtPrice)
  const unitPrice = asNumber(raw.unitPrice)

  return {
    key,
    productSlug: asString(raw.productSlug),
    variantId,
    sku: asOptionalString(raw.sku),
    name,
    image: normalizeImage(raw.image, name) ?? placeholderImage(name),
    color: asOptionalString(raw.color),
    size: asOptionalString(raw.size),
    unitPrice,
    compareAtPrice: compareAtPrice && compareAtPrice > unitPrice ? compareAtPrice : undefined,
    quantity: Math.max(1, Math.floor(asNumber(raw.quantity, 1))),
    maxQuantity,
    inStock: raw.inStock === undefined ? true : asBoolean(raw.inStock),
  }
}

export function normalizeCart(input: unknown): Cart {
  const raw = asRecord(input)
  const items = asArray(raw.items)
    .map(normalizeCartItem)
    .filter((item): item is CartItem => Boolean(item))
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const totals = normalizeTotals(raw.totals, itemCount)
  const threshold = asOptionalNumber(raw.freeShippingThreshold) ?? FREE_SHIPPING_THRESHOLD

  return {
    items,
    totals,
    coupon: normalizeCoupon(raw.coupon),
    freeShippingThreshold: threshold,
    remainingForFreeShipping:
      asOptionalNumber(raw.remainingForFreeShipping) ?? Math.max(0, threshold - totals.subtotal),
  }
}

export const EMPTY_CART: Cart = normalizeCart({})

export function normalizeCustomer(input: unknown): Customer | null {
  const raw = asRecord(input)
  const id = asString(raw.id)
  const email = asString(raw.email)
  if (!id || !email) return null
  return {
    id,
    email,
    firstName: asString(raw.firstName),
    lastName: asString(raw.lastName),
    phone: asOptionalString(raw.phone),
    acceptsMarketing: asBoolean(raw.acceptsMarketing),
    createdAt: asIsoDate(raw.createdAt) ?? '',
  }
}

export function normalizeAddress(input: unknown): Address | null {
  const raw = asRecord(input)
  const id = asString(raw.id)
  if (!id) return null
  return {
    id,
    label: asString(raw.label, 'Home') || 'Home',
    fullName: asString(raw.fullName),
    line1: asString(raw.line1),
    line2: asOptionalString(raw.line2),
    city: asString(raw.city),
    state: asString(raw.state),
    postalCode: asString(raw.postalCode),
    country: asString(raw.country, 'India') || 'India',
    phone: asString(raw.phone),
    isDefault: asBoolean(raw.isDefault),
  }
}

export function normalizeAddresses(input: unknown): Address[] {
  return asArray(input)
    .map(normalizeAddress)
    .filter((address): address is Address => Boolean(address))
}

function normalizeOrderItem(input: unknown): OrderItem | null {
  const raw = asRecord(input)
  const name = asString(raw.name)
  if (!name) return null
  const image =
    normalizeImage(raw.image ?? { url: raw.imageUrl, alt: raw.imageAlt }, name) ??
    placeholderImage(name)
  return {
    productSlug: asString(raw.productSlug) || asString(raw.slug),
    name,
    image,
    color: asOptionalString(raw.color ?? raw.colorName),
    size: asOptionalString(raw.size ?? raw.sizeName),
    unitPrice: asNumber(raw.unitPrice),
    quantity: Math.max(1, Math.floor(asNumber(raw.quantity, 1))),
  }
}

function paymentMethodOf(raw: Record<string, unknown>): string | undefined {
  const direct = asOptionalString(raw.paymentMethod)
  const fromPayments = asOptionalString(asRecord(asArray(raw.payments)[0]).method)
  const method = direct ?? fromPayments
  if (!method) return undefined
  return PAYMENT_LABELS[method.toUpperCase()] ?? method
}

export function normalizeOrder(input: unknown): Order | null {
  const raw = asRecord(input)
  const id = asString(raw.id)
  if (!id) return null

  const items = asArray(raw.items)
    .map(normalizeOrderItem)
    .filter((item): item is OrderItem => Boolean(item))
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const address = asRecord(raw.shippingAddress)

  return {
    id,
    number: asString(raw.orderNumber) || asString(raw.number) || id,
    placedAt: asIsoDate(raw.placedAt) ?? asIsoDate(raw.createdAt) ?? '',
    status: normalizeOrderStatus(raw.status),
    items,
    totals: normalizeTotals(isRecord(raw.totals) ? raw.totals : raw, itemCount),
    shippingAddress: {
      fullName: asString(address.fullName),
      line1: asString(address.line1),
      line2: asOptionalString(address.line2),
      city: asString(address.city),
      state: asString(address.state),
      postalCode: asString(address.postalCode),
      country: asString(address.country, 'India') || 'India',
      phone: asString(address.phone),
    },
    shippingMethod: asOptionalString(raw.shippingMethod),
    paymentMethod: paymentMethodOf(raw),
    trackingNumber: asOptionalString(raw.trackingNumber),
    carrier: asOptionalString(raw.carrier),
    estimatedDelivery: asIsoDate(raw.estimatedDelivery),
  }
}

export function normalizeOrders(input: unknown): Order[] {
  return asArray(input)
    .map(normalizeOrder)
    .filter((order): order is Order => Boolean(order))
}
