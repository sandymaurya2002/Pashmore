import { NextRequest } from 'next/server'
import { vi } from 'vitest'

export const WORKER_ORIGIN = 'https://worker.test'

export interface RecordedCall {
  url: URL
  method: string
  headers: Headers
  body: unknown
}

type Reply = { status?: number; body: unknown; headers?: Record<string, string> }
type Route = (call: RecordedCall) => Reply | Promise<Reply>

/**
 * Replaces global fetch with a fake Worker. `routes` maps "METHOD /path"
 * (path relative to /api/v1) to a reply; unmatched calls fail the test.
 */
export function mockWorker(routes: Record<string, Route | Reply>) {
  const calls: RecordedCall[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.toString())
    const method = (init.method ?? 'GET').toUpperCase()
    const call: RecordedCall = {
      url,
      method,
      headers: new Headers(init.headers),
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    }
    calls.push(call)

    const key = `${method} ${url.pathname.replace(/^\/api\/v1/, '')}`
    const route = routes[key]
    if (!route) throw new Error(`Unexpected Worker call: ${key}`)
    const reply = typeof route === 'function' ? await route(call) : route
    return new Response(JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { 'Content-Type': 'application/json', ...(reply.headers ?? {}) },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock }
}

export function success<T>(data: T, meta?: Record<string, unknown>): Reply {
  return { body: { success: true, data, ...(meta ? { meta } : {}) } }
}

export function failure(status: number, code: string, message = code): Reply {
  return { status, body: { success: false, error: { code, message } } }
}

/** A Worker access token: opaque, like the real `pat_c_…` tokens. */
export function opaqueToken(suffix = 'a1b2c3d4e5f6a7b8c9d0'): string {
  return `pat_c_${suffix}`
}

/** An unsigned JWT whose `exp` is `secondsFromNow` away — for the JWT expiry path. */
export function jwt(secondsFromNow: number, sub = 'cus_1'): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  const exp = Math.floor(Date.now() / 1000) + secondsFromNow
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub, exp })}.signature`
}

export function request(
  path: string,
  init: { method?: string; body?: unknown; cookies?: Record<string, string>; headers?: Record<string, string> } = {},
): NextRequest {
  const headers = new Headers({ 'user-agent': 'vitest', 'x-forwarded-for': '203.0.113.7', ...init.headers })
  if (init.cookies) {
    headers.set(
      'cookie',
      Object.entries(init.cookies)
        .map(([name, value]) => `${name}=${value}`)
        .join('; '),
    )
  }
  if (init.body !== undefined) headers.set('content-type', 'application/json')
  return new NextRequest(new URL(path, 'https://shop.test'), {
    method: init.method ?? 'GET',
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })
}

/** Parses every Set-Cookie header on a response into name → { value, attributes }. */
export function responseCookies(response: Response) {
  const out: Record<string, { value: string; attributes: string }> = {}
  for (const header of response.headers.getSetCookie()) {
    const [pair, ...rest] = header.split(';')
    const index = pair.indexOf('=')
    out[pair.slice(0, index).trim()] = {
      value: decodeURIComponent(pair.slice(index + 1)),
      attributes: rest.join(';').toLowerCase(),
    }
  }
  return out
}

export const workerProduct = {
  id: 'prd_1',
  slug: 'ivory-heritage-pashmina-shawl',
  name: 'Ivory Heritage Pashmina Shawl',
  tagline: 'Hand-spun, hand-woven',
  description: 'A pure pashmina shawl.',
  gender: 'women',
  categorySlug: 'shawls',
  material: 'Pure Pashmina',
  materialSlug: 'pure-pashmina',
  price: 24500,
  compareAtPrice: 28000,
  badges: ['NEW', 'handcrafted', 'not-a-badge'],
  images: [
    { url: '/media/products/a.jpg', alt: 'Back view' },
    { url: `${WORKER_ORIGIN}/media/products/b.jpg`, alt: 'Front view', isPrimary: true },
  ],
  colors: [{ name: 'Ivory', slug: 'ivory', hex: '#f5efe3' }],
  sizes: [{ name: 'Shawl', slug: 'shawl', measurement: '100 × 200 cm' }],
  variants: [
    { id: 'var_1', sku: 'PSH-IV-1', colorSlug: 'ivory', sizeSlug: 'shawl', inventory: 3 },
    { id: 'var_2', sku: 'PSH-IV-2', colorSlug: 'ivory', sizeSlug: 'stole', inventory: -2 },
  ],
  rating: { average: 0, count: 0 },
}

/** The Worker's `cartDto` shape (commerce/cart.ts). */
export const workerCart = {
  items: [
    {
      id: 'var_1',
      key: 'var_1',
      productId: 'prd_1',
      productSlug: 'ivory-heritage-pashmina-shawl',
      variantId: 'var_1',
      sku: 'PSH-IV-1',
      name: 'Ivory Heritage Pashmina Shawl',
      image: { url: `${WORKER_ORIGIN}/media/products/b.jpg`, alt: 'Front' },
      color: 'Ivory',
      size: 'Shawl',
      unitPrice: 24500,
      quantity: 2,
      maxQuantity: 3,
      inStock: true,
      available: true,
      issue: null,
      lineTotal: 49000,
    },
  ],
  totals: { subtotal: 49000, discount: 0, shipping: 0, tax: 2333.33, total: 49000, itemCount: 2 },
  coupon: null,
  freeShippingThreshold: 4999,
  remainingForFreeShipping: 0,
}

/** A `pm_cart` cookie value as the storefront writes it. */
export function guestCartCookie(lines: Array<[string, string, number]>): string {
  return encodeURIComponent(JSON.stringify(lines))
}
