import { beforeEach, describe, expect, it, vi } from 'vitest'

import { normalizeCollection, normalizeProduct, normalizeSearch } from '@/lib/normalize/catalog'
import { normalizeCart, normalizeCustomer, normalizeOrder } from '@/lib/normalize/commerce'
import { PRODUCT_PLACEHOLDER, resolveMediaUrl } from '@/lib/media'
import { WORKER_ORIGIN, workerCart, workerProduct } from './helpers'

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.stubEnv('CLOUDFLARE_R2_PUBLIC_URL', 'https://media.test')
  vi.stubEnv('IMAGE_REMOTE_HOSTS', '')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('resolveMediaUrl', () => {
  it('accepts absolute URLs only from configured hosts', () => {
    expect(resolveMediaUrl('https://media.test/products/a.jpg')).toBe('https://media.test/products/a.jpg')
    expect(resolveMediaUrl(`${WORKER_ORIGIN}/media/x.jpg`)).toBe(`${WORKER_ORIGIN}/media/x.jpg`)
    expect(resolveMediaUrl('https://evil.example/x.jpg')).toBeNull()
  })

  it('joins Worker media paths onto the Worker origin and keys onto the R2 domain', () => {
    expect(resolveMediaUrl('/media/products/a.jpg')).toBe(`${WORKER_ORIGIN}/media/products/a.jpg`)
    expect(resolveMediaUrl('products/a.jpg')).toBe('https://media.test/products/a.jpg')
  })

  it('keeps bundled storefront assets but rejects retired demo product shots', () => {
    expect(resolveMediaUrl('/images/brand/logo.png')).toBe('/images/brand/logo.png')
    expect(resolveMediaUrl('/images/products/ivory-1.png')).toBeNull()
    expect(resolveMediaUrl('')).toBeNull()
  })
})

describe('normalizeProduct', () => {
  it('maps a Worker product onto the storefront shape', () => {
    const product = normalizeProduct(workerProduct)!
    expect(product.slug).toBe('ivory-heritage-pashmina-shawl')
    expect(product.compareAtPrice).toBe(28000)
    expect(product.badges).toEqual(['new', 'handcrafted'])
    // Negative inventory is clamped and total stock comes from the variants.
    expect(product.variants.map((variant) => variant.inventory)).toEqual([3, 0])
    expect(product.inventory).toBe(3)
    // The primary image leads.
    expect(product.images[0]).toMatchObject({ url: `${WORKER_ORIGIN}/media/products/b.jpg`, isPrimary: true })
    expect(product.images[1].url).toBe(`${WORKER_ORIGIN}/media/products/a.jpg`)
    // A zero-review product never shows a rating.
    expect(product.rating).toBeUndefined()
  })

  it('drops a compare-at price that is not a real discount', () => {
    expect(normalizeProduct({ ...workerProduct, compareAtPrice: 100 })!.compareAtPrice).toBeUndefined()
  })

  it('falls back to a placeholder when no image is usable', () => {
    const product = normalizeProduct({ ...workerProduct, images: [{ url: 'https://evil.example/a.jpg' }] })!
    expect(product.images).toHaveLength(1)
    expect(product.images[0].url).toBe(PRODUCT_PLACEHOLDER.url)
  })

  it('rejects records without identity', () => {
    expect(normalizeProduct({ name: 'No slug' })).toBeNull()
    expect(normalizeProduct(null)).toBeNull()
  })
})

describe('normalizeCollection / normalizeSearch', () => {
  it('uses the banner placeholder when the collection has no banner', () => {
    const collection = normalizeCollection({ slug: 'shawls', name: 'Shawls', group: 'CATEGORY', productCount: 4 })!
    expect(collection.group).toBe('category')
    expect(collection.productCount).toBe(4)
    expect(collection.bannerImage.url).toMatch(/^\/images\//)
  })

  it('normalises search results', () => {
    const result = normalizeSearch({
      products: [workerProduct, { slug: '' }],
      collections: [{ slug: 'shawls', name: 'Shawls' }, { slug: 'x' }],
      total: 9,
    })
    expect(result.products).toHaveLength(1)
    expect(result.collections).toEqual([{ slug: 'shawls', name: 'Shawls' }])
    expect(result.total).toBe(9)
  })
})

describe('commerce normalisers', () => {
  it('normalises a Worker cart, deriving the free-shipping gap', () => {
    const cart = normalizeCart(workerCart)
    expect(cart.items[0]).toMatchObject({ key: 'var_1', variantId: 'var_1', quantity: 2, maxQuantity: 3, inStock: true })
    expect(cart.totals).toEqual({ subtotal: 49000, discount: 0, shipping: 0, tax: 2333.33, total: 49000, itemCount: 2 })
    expect(cart.remainingForFreeShipping).toBe(0)
  })

  it('marks unavailable lines', () => {
    const cart = normalizeCart({ ...workerCart, items: [{ ...workerCart.items[0], inStock: false }] })
    expect(cart.items[0].inStock).toBe(false)
  })

  it('requires id and email for a customer', () => {
    expect(normalizeCustomer({ id: 'c1' })).toBeNull()
    expect(normalizeCustomer({ id: 'c1', email: 'a@b.co', phone: null })).toMatchObject({ id: 'c1', phone: undefined })
  })

  it('lower-cases order status and labels the payment method', () => {
    const order = normalizeOrder({
      id: 'ord_1',
      orderNumber: 'PSH-000123',
      status: 'SHIPPED',
      createdAt: '2026-01-02T03:04:05.000Z',
      items: [{ name: 'Shawl', unitPrice: 100, quantity: 1 }],
      subtotal: 100,
      shippingFee: 0,
      taxAmount: 5,
      total: 100,
      payments: [{ method: 'upi' }],
    })!
    expect(order.number).toBe('PSH-000123')
    expect(order.status).toBe('shipped')
    expect(order.paymentMethod).toBe('UPI')
    expect(order.totals.tax).toBe(5)
    expect(order.items[0].image.url).toBe(PRODUCT_PLACEHOLDER.url)
  })

  it('never invents an order status', () => {
    expect(normalizeOrder({ id: 'o', status: 'TELEPORTED' })!.status).toBe('pending')
  })
})
