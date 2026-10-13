import type { NextRequest, NextResponse } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { placeholderImage } from '@/lib/media'
import { normalizeProducts } from '@/lib/normalize/catalog'
import { normalizeCart } from '@/lib/normalize/commerce'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/site'
import { ok } from '@/server/http'
import { baseCookie, withSession, type CookieReader } from '@/server/session'
import { workerFetch, type WorkerRequest } from '@/server/worker'
import type { Cart, CartItem, Product } from '@/types'

/**
 * The bag.
 *
 * Signed-in customers use the Worker cart (D1). The Worker has no guest carts,
 * so a guest's bag is a short list of `[variantId, productSlug, quantity]` in an
 * HttpOnly cookie. It is priced here from live Worker product data using the
 * Worker's own rules, and merged into the account cart at sign-in.
 */

export const GUEST_CART_COOKIE = 'pm_cart'
const GUEST_CART_MAX_AGE = 60 * 60 * 24 * 30
/** Keeps the cookie well under the 4 KB limit. */
export const MAX_GUEST_LINES = 20
/** Mirrors the Worker's per-line cap and pricing (commerce/cart.ts). */
export const MAX_LINE_QUANTITY = 10
const STANDARD_SHIPPING_PAISE = 149_00
const GST_RATE = 0.05

const LINE_ID = /^[A-Za-z0-9_-]{1,64}$/
const SLUG = /^[a-z0-9-]{1,160}$/i

export interface GuestLine {
  variantId: string
  productSlug: string
  quantity: number
}

export type CartOperation =
  | { type: 'get' }
  | { type: 'add'; variantId: string; productSlug: string; quantity: number }
  | { type: 'set'; variantId: string; quantity: number }
  | { type: 'remove'; variantId: string }
  | { type: 'clear' }

export function validCartItemId(id: string): boolean {
  return LINE_ID.test(id)
}

export function validProductSlug(slug: string): boolean {
  return SLUG.test(slug)
}

/* ------------------------------------------------------------------ *
 * Guest cookie
 * ------------------------------------------------------------------ */

export function readGuestCart(jar: CookieReader): GuestLine[] {
  const raw = jar.get(GUEST_CART_COOKIE)?.value
  if (!raw) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const lines: GuestLine[] = []
  const seen = new Set<string>()
  for (const entry of parsed) {
    if (!Array.isArray(entry)) continue
    const [variantId, productSlug, quantity] = entry as unknown[]
    if (typeof variantId !== 'string' || !LINE_ID.test(variantId) || seen.has(variantId)) continue
    if (typeof productSlug !== 'string' || !SLUG.test(productSlug)) continue
    const count = Math.floor(Number(quantity))
    if (!Number.isFinite(count) || count < 1) continue
    seen.add(variantId)
    lines.push({ variantId, productSlug, quantity: Math.min(count, MAX_LINE_QUANTITY) })
    if (lines.length >= MAX_GUEST_LINES) break
  }
  return lines
}

function writeGuestCart(response: NextResponse, lines: GuestLine[]) {
  if (!lines.length) {
    clearGuestCart(response)
    return
  }
  const value = JSON.stringify(lines.map((line) => [line.variantId, line.productSlug, line.quantity]))
  response.cookies.set(GUEST_CART_COOKIE, value, { ...baseCookie(), maxAge: GUEST_CART_MAX_AGE })
}

export function clearGuestCart(response: NextResponse) {
  response.cookies.set(GUEST_CART_COOKIE, '', { ...baseCookie(), maxAge: 0 })
}

/* ------------------------------------------------------------------ *
 * Guest pricing
 * ------------------------------------------------------------------ */

interface Target {
  product: Product
  available: boolean
  price: number
  compareAtPrice?: number
  stock: number
  sku?: string
  color?: string
  size?: string
}

/** Variant ids are product ids for products without variants, as in the Worker. */
function resolveTarget(product: Product | undefined, variantId: string): Target | null {
  if (!product) return null
  const unavailable: Target = { product, available: false, price: product.price, stock: 0 }

  if (!product.variants.length) {
    if (variantId !== product.id) return unavailable
    return {
      product,
      available: true,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.inventory,
    }
  }

  const variant = product.variants.find((entry) => entry.id === variantId)
  if (!variant) return unavailable
  return {
    product,
    available: true,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    stock: variant.inventory,
    sku: variant.sku || undefined,
    color: product.colors.find((color) => color.slug === variant.colorSlug)?.name,
    size: product.sizes.find((size) => size.slug === variant.sizeSlug)?.name,
  }
}

const toPaise = (rupees: number) => Math.round(rupees * 100)
const toRupees = (paise: number) => paise / 100

export function priceGuestCart(
  lines: GuestLine[],
  products: Map<string, Product>,
): { cart: Cart; lines: GuestLine[] } {
  const items: CartItem[] = []
  const kept: GuestLine[] = []
  let subtotal = 0
  let itemCount = 0

  for (const line of lines) {
    const target = resolveTarget(products.get(line.productSlug), line.variantId)
    // A product that is gone entirely has nothing left to show; drop the line.
    if (!target) continue
    kept.push(line)

    const { product } = target
    items.push({
      key: line.variantId,
      productSlug: product.slug,
      variantId: line.variantId,
      sku: target.sku,
      name: product.name,
      image: product.images[0] ?? placeholderImage(product.name),
      color: target.color,
      size: target.size,
      unitPrice: target.price,
      compareAtPrice: target.compareAtPrice,
      quantity: line.quantity,
      maxQuantity: Math.max(1, Math.min(MAX_LINE_QUANTITY, target.stock)),
      inStock: target.available && target.stock >= line.quantity,
    })
    if (target.available) {
      subtotal += toPaise(target.price) * line.quantity
      itemCount += line.quantity
    }
  }

  const threshold = toPaise(FREE_SHIPPING_THRESHOLD)
  const shipping = subtotal === 0 || subtotal >= threshold ? 0 : STANDARD_SHIPPING_PAISE
  const tax = Math.round(subtotal - subtotal / (1 + GST_RATE))

  return {
    lines: kept,
    cart: {
      items,
      totals: {
        subtotal: toRupees(subtotal),
        discount: 0,
        shipping: toRupees(shipping),
        tax: toRupees(tax),
        total: toRupees(subtotal + shipping),
        itemCount,
      },
      coupon: null,
      freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
      remainingForFreeShipping: toRupees(Math.max(0, threshold - subtotal)),
    },
  }
}

async function loadProducts(
  slugs: string[],
  client: WorkerRequest['client'],
): Promise<Map<string, Product>> {
  const unique = Array.from(new Set(slugs))
  if (!unique.length) return new Map()
  const { data } = await workerFetch<unknown>('/products/batch', { query: { slugs: unique }, client })
  return new Map(normalizeProducts(data).map((product) => [product.slug, product]))
}

function stockError(stock: number): ApiError {
  return new ApiError(
    stock > 0 ? `Only ${stock} left in stock.` : 'This item is out of stock.',
    409,
    'INSUFFICIENT_STOCK',
    { quantity: stock > 0 ? `Only ${stock} available.` : 'Out of stock.' },
  )
}

const productGone = () => new ApiError('This piece is no longer available.', 404, 'NOT_FOUND')
const lineGone = () => new ApiError('That item is no longer in your bag.', 404, 'NOT_FOUND')

async function guestCart(
  current: GuestLine[],
  operation: CartOperation,
  client: WorkerRequest['client'],
): Promise<{ cart: Cart; lines: GuestLine[] }> {
  let lines = current

  switch (operation.type) {
    case 'add': {
      const products = await loadProducts(
        [...lines.map((line) => line.productSlug), operation.productSlug],
        client,
      )
      const target = resolveTarget(products.get(operation.productSlug), operation.variantId)
      if (!target?.available) throw productGone()
      const existing = lines.find((line) => line.variantId === operation.variantId)
      if (!existing && lines.length >= MAX_GUEST_LINES) {
        throw new ApiError(
          `Your bag can hold up to ${MAX_GUEST_LINES} different pieces. Sign in to add more.`,
          400,
          'VALIDATION_ERROR',
        )
      }
      const desired = Math.min(MAX_LINE_QUANTITY, (existing?.quantity ?? 0) + operation.quantity)
      if (desired > target.stock) throw stockError(target.stock)
      lines = existing
        ? lines.map((line) => (line === existing ? { ...line, quantity: desired } : line))
        : [...lines, { variantId: operation.variantId, productSlug: target.product.slug, quantity: desired }]
      return priceGuestCart(lines, products)
    }

    case 'set': {
      const existing = lines.find((line) => line.variantId === operation.variantId)
      if (!existing) throw lineGone()
      if (operation.quantity <= 0) {
        lines = lines.filter((line) => line !== existing)
        break
      }
      const products = await loadProducts(lines.map((line) => line.productSlug), client)
      const target = resolveTarget(products.get(existing.productSlug), existing.variantId)
      if (!target?.available) throw productGone()
      const desired = Math.min(MAX_LINE_QUANTITY, operation.quantity)
      if (desired > target.stock) throw stockError(target.stock)
      lines = lines.map((line) => (line === existing ? { ...line, quantity: desired } : line))
      return priceGuestCart(lines, products)
    }

    case 'remove':
      lines = lines.filter((line) => line.variantId !== operation.variantId)
      break

    case 'clear':
      lines = []
      break

    case 'get':
      break
  }

  const products = await loadProducts(lines.map((line) => line.productSlug), client)
  return priceGuestCart(lines, products)
}

/* ------------------------------------------------------------------ *
 * Route handler entry points
 * ------------------------------------------------------------------ */

function workerCartRequest(operation: CartOperation): Pick<WorkerRequest, 'method' | 'body'> & { path: string } {
  switch (operation.type) {
    case 'get':
      return { path: '/cart', method: 'GET' }
    case 'add':
      return {
        path: '/cart/items',
        method: 'POST',
        body: { variantId: operation.variantId, quantity: operation.quantity },
      }
    case 'set':
      return {
        path: `/cart/items/${encodeURIComponent(operation.variantId)}`,
        method: 'PATCH',
        body: { quantity: Math.max(0, operation.quantity) },
      }
    case 'remove':
      return { path: `/cart/items/${encodeURIComponent(operation.variantId)}`, method: 'DELETE' }
    case 'clear':
      return { path: '/cart', method: 'DELETE' }
  }
}

export function cartCall(request: NextRequest, operation: CartOperation) {
  return withSession(request, { auth: 'optional' }, async ({ accessToken, client }) => {
    if (accessToken) {
      const { path, ...init } = workerCartRequest(operation)
      const { data } = await workerFetch<unknown>(path, { ...init, accessToken, client })
      return ok({ cart: normalizeCart(data) })
    }

    const stored = readGuestCart(request.cookies)
    const result = await guestCart(stored, operation, client)
    const response = ok({ cart: result.cart })
    if (result.lines.length || request.cookies.has(GUEST_CART_COOKIE)) {
      writeGuestCart(response, result.lines)
    }
    return response
  })
}

/**
 * Moves a guest bag into the account cart right after sign-in. Failure is
 * logged, not fatal: the guest bag stays on the device for the next attempt.
 */
export async function mergeGuestCart(
  request: NextRequest,
  accessToken: string,
  client: WorkerRequest['client'],
): Promise<boolean> {
  const lines = readGuestCart(request.cookies)
  if (!lines.length) return false
  try {
    await workerFetch('/cart/merge', {
      method: 'POST',
      body: { items: lines.map(({ variantId, quantity }) => ({ variantId, quantity })) },
      accessToken,
      client,
    })
    return true
  } catch (error) {
    console.error('[cart] Could not merge the guest bag:', (error as Error)?.message)
    return false
  }
}
