import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

/** What `cookies()` / `headers()` see: the incoming page request. */
const incoming = vi.hoisted(() => ({ cookies: new Map<string, string>(), headers: new Headers() }))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (incoming.cookies.has(name) ? { name, value: incoming.cookies.get(name) } : undefined),
  }),
  headers: async () => incoming.headers,
}))

import { revalidateTag } from 'next/cache'
import { GET as productsRoute } from '@/app/api/products/route'
import { POST as revalidate } from '@/app/api/revalidate/route'
import { GET as searchRoute } from '@/app/api/search/route'
import {
  getProductBySlug,
  getProductsBySlugs,
  queryProducts,
  searchCatalog,
} from '@/services/catalog'
import { WORKER_ORIGIN, failure, mockWorker, request, success, workerProduct } from './helpers'

beforeEach(() => {
  incoming.cookies.clear()
  incoming.headers = new Headers()
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('catalogue service', () => {
  it('returns null for an unknown product rather than throwing', async () => {
    mockWorker({ 'GET /products/nope': failure(404, 'NOT_FOUND') })
    await expect(getProductBySlug('nope')).resolves.toBeNull()
  })

  it('propagates outages instead of falling back to demo data', async () => {
    mockWorker({ 'GET /products/anything': failure(500, 'INTERNAL_ERROR') })
    await expect(getProductBySlug('anything')).rejects.toMatchObject({ status: 500 })
  })

  it('caches reads in the Next Data Cache with catalogue tags', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true, data: workerProduct })))
    vi.stubGlobal('fetch', fetchMock)
    await getProductBySlug(workerProduct.slug)
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit & { next?: unknown }])[1]
    expect(init.next).toEqual({
      revalidate: 60,
      tags: ['catalog', 'products', `product:${workerProduct.slug}`],
    })
  })

  it('maps filters, sort, search and paging onto the Worker query', async () => {
    const { calls } = mockWorker({
      'GET /collections/shawls/products': success([workerProduct], {
        page: 2,
        limit: 48,
        total: 50,
        totalPages: 2,
        facets: { color: [{ value: 'ivory', label: 'Ivory', count: 3 }], priceRange: { min: 1, max: 9 } },
      }),
    })
    const result = await queryProducts({
      collectionSlug: 'shawls',
      filters: {
        category: [],
        color: ['ivory', 'sand'],
        material: [],
        size: [],
        pattern: [],
        collection: [],
        availability: ['in-stock'],
        minPrice: 1000,
      },
      sort: 'price-low',
      search: '  kani ',
      page: 2,
    })

    const query = calls[0].url.searchParams
    expect(query.get('color')).toBe('ivory,sand')
    expect(query.get('availability')).toBe('in-stock')
    expect(query.get('minPrice')).toBe('1000')
    expect(query.get('sort')).toBe('price-low')
    expect(query.has('category')).toBe(false)
    expect(query.get('q')).toBe('kani')
    expect(query.get('page')).toBe('2')
    expect(result).toMatchObject({ total: 50, page: 2, totalPages: 2 })
    expect(result.facets.color[0]).toMatchObject({ value: 'ivory', count: 3 })
  })

  it('treats an unknown collection as empty rather than an outage', async () => {
    mockWorker({ 'GET /collections/ghost/products': failure(404, 'NOT_FOUND') })
    await expect(queryProducts({ collectionSlug: 'ghost' })).resolves.toMatchObject({ products: [], total: 0 })
  })

  it('batches slug lookups in chunks of 24 and keeps the requested order', async () => {
    const slugs = Array.from({ length: 30 }, (_, index) => `p-${index}`)
    const { calls } = mockWorker({
      'GET /products/batch': (call) =>
        success(
          (call.url.searchParams.get('slugs') ?? '')
            .split(',')
            .reverse()
            .map((slug) => ({ ...workerProduct, slug })),
        ),
    })
    const products = await getProductsBySlugs([...slugs, 'p-0'])
    expect(calls).toHaveLength(2)
    expect(products.map((product) => product.slug)).toEqual(slugs)
  })

  it('does not call the Worker for an empty search', async () => {
    const { fetchMock } = mockWorker({})
    await expect(searchCatalog('   ')).resolves.toEqual({ products: [], collections: [], total: 0 })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('regional pricing', () => {
  const productRoute = () => ({
    'GET /products/ivory-heritage-pashmina-shawl': (call: { url: URL }) =>
      success({
        ...workerProduct,
        price: call.url.searchParams.get('currency') === 'USD' ? 299 : 24500,
        compareAtPrice: null,
        currency: call.url.searchParams.get('currency'),
        availableInRegion: true,
      }),
  })

  it('prices visitors in India, or of unknown location, in rupees', async () => {
    const { calls } = mockWorker(productRoute())
    const product = await getProductBySlug(workerProduct.slug)
    expect(calls[0].url.searchParams.get('currency')).toBe('INR')
    expect(product).toMatchObject({ price: 24500, currency: 'INR' })
  })

  it('prices visitors outside India in dollars from the geolocation header', async () => {
    incoming.headers = new Headers({ 'x-vercel-ip-country': 'US' })
    const { calls } = mockWorker(productRoute())
    const product = await getProductBySlug(workerProduct.slug)
    expect(calls[0].url.searchParams.get('currency')).toBe('USD')
    expect(product).toMatchObject({ price: 299, currency: 'USD', availableInRegion: true })
    // The currency, not the country, keys the request so the Data Cache holds one copy per currency.
    expect(calls[0].headers.get('x-client-country')).toBeNull()
  })

  it('lets a chosen country override geolocation', async () => {
    incoming.headers = new Headers({ 'cf-ipcountry': 'IN' })
    incoming.cookies.set('pm_country', 'GB')
    const { calls } = mockWorker(productRoute())
    await getProductBySlug(workerProduct.slug)
    expect(calls[0].url.searchParams.get('currency')).toBe('USD')
  })

  it('marks a product without a price in the region as unavailable', async () => {
    incoming.headers = new Headers({ 'x-vercel-ip-country': 'FR' })
    mockWorker({
      'GET /products/ivory-heritage-pashmina-shawl': success({
        ...workerProduct,
        price: null,
        compareAtPrice: null,
        currency: 'USD',
        availableInRegion: false,
      }),
    })
    const product = await getProductBySlug(workerProduct.slug)
    expect(product).toMatchObject({ currency: 'USD', availableInRegion: false })
  })
})

describe('catalogue route handlers', () => {
  it('GET /api/products validates slugs and wraps the result in the envelope', async () => {
    const { calls } = mockWorker({ 'GET /products/batch': success([workerProduct]) })
    const response = await productsRoute(
      request(`/api/products?slugs=${workerProduct.slug},../../etc,`),
    )
    expect(calls[0].url.searchParams.get('slugs')).toBe(workerProduct.slug)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.products[0].slug).toBe(workerProduct.slug)
  })

  it('GET /api/search surfaces an outage as an error envelope', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    const response = await searchRoute(request('/api/search?q=pashmina'))
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ success: false, error: { code: 'UPSTREAM_UNAVAILABLE' } })
  })
})

describe('POST /api/revalidate', () => {
  it('is disabled without a secret', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '')
    const response = await revalidate(request('/api/revalidate', { method: 'POST', body: {} }))
    expect(response.status).toBe(401)
  })

  it('purges only allow-listed tags', async () => {
    vi.stubEnv('REVALIDATE_SECRET', 'top-secret')
    const req = request('/api/revalidate', {
      method: 'POST',
      body: { tags: ['product:ivory-shawl', 'evil tag', 'collections'] },
    })
    req.headers.set('authorization', 'Bearer top-secret')
    const response = await revalidate(req)
    expect((await response.json()).data.revalidated).toEqual(['product:ivory-shawl', 'collections'])
    expect(revalidateTag).toHaveBeenCalledTimes(2)
  })
})
