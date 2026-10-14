import { FREE_SHIPPING_THRESHOLD } from '@/lib/site'
import { normalizeImage } from '@/lib/normalize/catalog'
import { DEFAULT_CURRENCY, isCurrency, type Currency } from '@/lib/region'
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
  PaymentSession,
} from '@/types'

const ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'placed',
  'confirmed',
  'payment_pending',
  'payment_failed',
  'paid',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'return_requested',
  'returned',
  'refund_pending',
  'refunded',
]

const currencyOf = (value: unknown): Currency => (isCurrency(value) ? value : DEFAULT_CURRENCY)

export function normalizeOrderStatus(value: unknown): OrderStatus {
  const status = asString(value).toLowerCase() as OrderStatus
  return ORDER_STATUSES.includes(status) ? status : 'pending'
}

const PAYMENT_LABELS: Record<string, string> = {
  RAZORPAY: 'Paid online (Razorpay)',
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
    ...(raw.issue === 'REGION_UNAVAILABLE' ? { regionUnavailable: true } : {}),
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
    currency: currencyOf(raw.currency),
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
    currency: currencyOf(raw.currency),
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
    paymentMethodCode: asOptionalString(raw.paymentMethod)?.toUpperCase(),
    paymentStatus: asOptionalString(raw.paymentStatus),
    couponCode: asOptionalString(raw.couponCode),
    refunded: asOptionalNumber(asRecord(raw.totals).refunded),
    trackingNumber: asOptionalString(raw.trackingNumber),
    trackingUrl: safeHttpUrl(raw.trackingUrl),
    carrier: asOptionalString(raw.carrier),
    estimatedDelivery: asIsoDate(raw.estimatedDelivery),
    paidAt: asIsoDate(raw.paidAt),
    shippedAt: asIsoDate(raw.shippedAt),
    deliveredAt: asIsoDate(raw.deliveredAt),
    cancelledAt: asIsoDate(raw.cancelledAt),
    returnReason: asOptionalString(raw.returnReason),
    canCancel: asBoolean(raw.canCancel),
    canReturn: asBoolean(raw.canReturn),
    awaitingPayment: asBoolean(raw.awaitingPayment),
    paymentExpiresAt: asIsoDate(raw.paymentExpiresAt),
    history: Array.isArray(raw.history)
      ? asArray(raw.history).map((entry) => {
          const item = asRecord(entry)
          return {
            status: normalizeOrderStatus(item.to ?? item.status),
            note: asOptionalString(item.note),
            createdAt: asIsoDate(item.createdAt) ?? '',
          }
        })
      : undefined,
  }
}

/** Only http(s) links are rendered, so an admin-entered URL cannot inject script. */
function safeHttpUrl(value: unknown): string | undefined {
  const url = asOptionalString(value)
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : undefined
  } catch {
    return undefined
  }
}

export function normalizePaymentSession(input: unknown): PaymentSession | null {
  const raw = asRecord(input)
  const keyId = asString(raw.keyId)
  const razorpayOrderId = asString(raw.razorpayOrderId)
  if (!keyId || !razorpayOrderId) return null
  const prefill = asRecord(raw.prefill)
  return {
    provider: 'razorpay',
    keyId,
    razorpayOrderId,
    amount: asNumber(raw.amount),
    currency: currencyOf(raw.currency),
    name: asString(raw.name, 'Pashmore') || 'Pashmore',
    description: asString(raw.description),
    orderId: asString(raw.orderId),
    orderNumber: asString(raw.orderNumber),
    prefill: {
      name: asString(prefill.name),
      email: asString(prefill.email),
      contact: asString(prefill.contact),
    },
    expiresAt: asIsoDate(raw.expiresAt) ?? null,
  }
}

export function normalizeOrders(input: unknown): Order[] {
  return asArray(input)
    .map(normalizeOrder)
    .filter((order): order is Order => Boolean(order))
}
