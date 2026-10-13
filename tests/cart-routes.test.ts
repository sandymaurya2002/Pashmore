import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as getCart } from '@/app/api/cart/route'
import { POST as addItem } from '@/app/api/cart/items/route'
import { DELETE as removeItem, PATCH as updateItem } from '@/app/api/cart/items/[itemId]/route'
import { POST as applyCoupon } from '@/app/api/cart/coupon/route'
import {
  WORKER_ORIGIN,
  failure,
  guestCartCookie,
  mockWorker,
  opaqueToken,
  request,
  responseCookies,
  success,
  workerCart,
  workerProduct,
} from './helpers'

const SLUG = workerProduct.slug

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

function batch(products: unknown[] = [workerProduct]) {
  return success(products)
}

describe('guest bag (HttpOnly pm_cart cookie, priced from the Worker)', () => {
  it('returns an empty bag without calling the Worker or setting cookies', async () => {
    const { fetchMock } = mockWorker({})
    const response = await getCart(request('/api/cart'))
    const body = await response.json()

    expect(body.data.cart.items).toEqual([])
    expect(body.data.cart.totals).toMatchObject({ subtotal: 0, shipping: 0, total: 0, itemCount: 0 })
    expect(fetchMock).not.toHaveBeenCalled()
    expect(response.headers.getSetCookie()).toHaveLength(0)
  })

  it('adds a line priced by the Worker, ignoring any client-supplied price', async () => {
    const { calls } = mockWorker({ 'GET /products/batch': batch() })
    const response = await addItem(
      request('/api/cart/items', {
        method: 'POST',
        body: { variantId: 'var_1', productSlug: SLUG, quantity: 2.7, price: 1 },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(calls).toHaveLength(1)
    expect(calls[0].url.searchParams.get('slugs')).toBe(SLUG)
    expect(calls[0].headers.get('authorization')).toBeNull()

    expect(body.data.cart.items[0]).toMatchObject({
      key: 'var_1',
      variantId: 'var_1',
      unitPrice: 24500,
      quantity: 2,
      maxQuantity: 3,
      inStock: true,
      color: 'Ivory',
      size: 'Shawl',
    })
    // Same arithmetic as the Worker: GST-inclusive, free shipping over ₹4,999.
    expect(body.data.cart.totals).toEqual({
      subtotal: 49000,
      discount: 0,
      shipping: 0,
      tax: 2333.33,
      total: 49000,
      itemCount: 2,
    })

    const cookie = responseCookies(response).pm_cart
    expect(JSON.parse(cookie.value)).toEqual([['var_1', SLUG, 2]])
    expect(cookie.attributes).toContain('httponly')
    expect(cookie.attributes).toContain('samesite=lax')
  })

  it('charges standard shipping under the free-shipping threshold', async () => {
    mockWorker({
      'GET /products/batch': batch([
        { ...workerProduct, price: 1200, compareAtPrice: undefined },
      ]),
    })
    const response = await getCart(
      request('/api/cart', { cookies: { pm_cart: guestCartCookie([['var_1', SLUG, 1]]) } }),
    )
    const { cart } = (await response.json()).data
    expect(cart.totals).toMatchObject({ subtotal: 1200, shipping: 149, total: 1349 })
    expect(cart.remainingForFreeShipping).toBe(3799)
  })

  it('refuses more than the Worker has in stock, with the Worker wording', async () => {
    mockWorker({ 'GET /products/batch': batch() })
    const response = await addItem(
      request('/api/cart/items', {
        method: 'POST',
        body: { variantId: 'var_1', productSlug: SLUG, quantity: 2 },
        cookies: { pm_cart: guestCartCookie([['var_1', SLUG, 2]]) },
      }),
    )
    expect(response.status).toBe(409)
    expect((await response.json()).error).toMatchObject({
      code: 'INSUFFICIENT_STOCK',
      message: 'Only 3 left in stock.',
    })
    expect(response.headers.getSetCookie()).toHaveLength(0)
  })

  it('will not add an out-of-stock or unknown variant', async () => {
    mockWorker({ 'GET /products/batch': batch() })
    const soldOut = await addItem(
      request('/api/cart/items', {
        method: 'POST',
        body: { variantId: 'var_2', productSlug: SLUG, quantity: 1 },
      }),
    )
    expect(soldOut.status).toBe(409)
    expect((await soldOut.json()).error.message).toBe('This item is out of stock.')

    const unknown = await addItem(
      request('/api/cart/items', {
        method: 'POST',
        body: { variantId: 'var_9', productSlug: SLUG, quantity: 1 },
      }),
    )
    expect(unknown.status).toBe(404)
  })

  it('flags lines that went unavailable and drops products that no longer exist', async () => {
    mockWorker({ 'GET /products/batch': batch() })
    const response = await getCart(
      request('/api/cart', {
        cookies: {
          pm_cart: guestCartCookie([
            ['var_1', SLUG, 1],
            ['var_gone', SLUG, 1],
            ['var_x', 'retired-shawl', 1],
          ]),
        },
      }),
    )
    const { cart } = (await response.json()).data

    expect(cart.items.map((item: { key: string }) => item.key)).toEqual(['var_1', 'var_gone'])
    expect(cart.items[1].inStock).toBe(false)
    // Unavailable lines are shown but never charged.
    expect(cart.totals).toMatchObject({ subtotal: 24500, itemCount: 1 })
    expect(JSON.parse(responseCookies(response).pm_cart.value)).toEqual([
      ['var_1', SLUG, 1],
      ['var_gone', SLUG, 1],
    ])
  })

  it('sells products without variants by their product id', async () => {
    const plain = { ...workerProduct, colors: [], sizes: [], variants: [], inventory: 4 }
    mockWorker({ 'GET /products/batch': batch([plain]) })
    const response = await addItem(
      request('/api/cart/items', {
        method: 'POST',
        body: { variantId: 'prd_1', productSlug: SLUG, quantity: 4 },
      }),
    )
    expect(response.status).toBe(200)
    expect((await response.json()).data.cart.items[0]).toMatchObject({ key: 'prd_1', maxQuantity: 4 })
  })

  it('updates and removes lines', async () => {
    mockWorker({ 'GET /products/batch': batch() })
    const cookies = { pm_cart: guestCartCookie([['var_1', SLUG, 1]]) }

    const updated = await updateItem(
      request('/api/cart/items/var_1', { method: 'PATCH', body: { quantity: 3 }, cookies }),
      { params: Promise.resolve({ itemId: 'var_1' }) },
    )
    expect(JSON.parse(responseCookies(updated).pm_cart.value)).toEqual([['var_1', SLUG, 3]])

    const removed = await removeItem(request('/api/cart/items/var_1', { method: 'DELETE', cookies }), {
      params: Promise.resolve({ itemId: 'var_1' }),
    })
    expect((await removed.json()).data.cart.items).toEqual([])
    expect(responseCookies(removed).pm_cart.attributes).toContain('max-age=0')
  })

  it('ignores a tampered cookie', async () => {
    const { fetchMock } = mockWorker({})
    const response = await getCart(request('/api/cart', { cookies: { pm_cart: '%7Bnot-json' } }))
    expect((await response.json()).data.cart.items).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks guests to sign in before using a discount code', async () => {
    const { fetchMock } = mockWorker({})
    const response = await applyCoupon(
      request('/api/cart/coupon', { method: 'POST', body: { code: 'welcome10' } }),
    )
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('SIGN_IN_REQUIRED')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reports an unreachable Worker as 503 instead of an empty bag', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    const response = await getCart(
      request('/api/cart', { cookies: { pm_cart: guestCartCookie([['var_1', SLUG, 1]]) } }),
    )
    expect(response.status).toBe(503)
    expect((await response.json()).success).toBe(false)
    expect(response.headers.getSetCookie()).toHaveLength(0)
  })
})

describe('signed-in bag (Worker cart in D1)', () => {
  const signedIn = { pm_session: opaqueToken(), pm_refresh: 'prt_c_refresh' }

  it('reads the account cart with the customer token', async () => {
    const { calls } = mockWorker({ 'GET /cart': success(workerCart) })
    const response = await getCart(request('/api/cart', { cookies: signedIn }))
    const body = await response.json()

    expect(calls[0].headers.get('authorization')).toBe(`Bearer ${opaqueToken()}`)
    expect(body.data.cart.items[0].key).toBe('var_1')
    expect(body.data.cart.totals).toMatchObject({ subtotal: 49000, total: 49000, itemCount: 2 })
    expect(response.headers.getSetCookie()).toHaveLength(0)
  })

  it('forwards only the variant and quantity', async () => {
    const { calls } = mockWorker({ 'POST /cart/items': success(workerCart) })
    const response = await addItem(
      request('/api/cart/items', {
        method: 'POST',
        body: { variantId: 'var_1', productSlug: SLUG, quantity: 2, price: 1 },
        cookies: signedIn,
      }),
    )
    expect(response.status).toBe(200)
    expect(calls[0].body).toEqual({ variantId: 'var_1', quantity: 2 })
  })

  it('passes Worker stock errors through for the UI to show', async () => {
    mockWorker({ 'POST /cart/items': failure(409, 'INSUFFICIENT_STOCK', 'Only 1 left in stock.') })
    const response = await addItem(
      request('/api/cart/items', {
        method: 'POST',
        body: { variantId: 'var_1', productSlug: SLUG, quantity: 5 },
        cookies: signedIn,
      }),
    )
    expect(response.status).toBe(409)
    expect((await response.json()).error).toEqual({ code: 'INSUFFICIENT_STOCK', message: 'Only 1 left in stock.' })
  })

  it('forwards discount codes and surfaces "not available yet" honestly', async () => {
    mockWorker({ 'POST /cart/coupon': failure(501, 'NOT_IMPLEMENTED', 'Discount codes are not available yet.') })
    const response = await applyCoupon(
      request('/api/cart/coupon', { method: 'POST', body: { code: 'welcome10' }, cookies: signedIn }),
    )
    expect(response.status).toBe(501)
    expect((await response.json()).error.message).toBe('Discount codes are not available yet.')
  })
})

describe('validation', () => {
  it('rejects malformed line ids before calling the Worker', async () => {
    const { fetchMock } = mockWorker({})
    const response = await updateItem(
      request('/api/cart/items/..%2Fadmin', { method: 'PATCH', body: { quantity: 1 } }),
      { params: Promise.resolve({ itemId: '../admin' }) },
    )
    expect(response.status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requires a product slug and a sane quantity', async () => {
    const { fetchMock } = mockWorker({})
    const noSlug = await addItem(
      request('/api/cart/items', { method: 'POST', body: { variantId: 'var_1', quantity: 1 } }),
    )
    const tooMany = await addItem(
      request('/api/cart/items', { method: 'POST', body: { variantId: 'var_1', productSlug: SLUG, quantity: 11 } }),
    )
    expect(noSlug.status).toBe(400)
    expect(tooMany.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
