import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/lib/api/envelope'
import { buildWorkerUrl, workerBaseUrl, workerFetch } from '@/server/worker'
import { WORKER_ORIGIN, failure, mockWorker, success } from './helpers'

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('workerBaseUrl', () => {
  it('appends /api/v1 once', () => {
    expect(workerBaseUrl()).toBe(`${WORKER_ORIGIN}/api/v1`)
    vi.stubEnv('CLOUDFLARE_API_URL', `${WORKER_ORIGIN}/api/v1/`)
    expect(workerBaseUrl()).toBe(`${WORKER_ORIGIN}/api/v1`)
  })

  it('refuses to run without configuration — there is no demo fallback', () => {
    vi.stubEnv('CLOUDFLARE_API_URL', '')
    expect(() => workerBaseUrl()).toThrowError(ApiError)
    try {
      workerBaseUrl()
    } catch (error) {
      expect(error).toMatchObject({ status: 503, code: 'API_NOT_CONFIGURED' })
    }
  })

  it('serialises query values, joining arrays and skipping empties', () => {
    const url = new URL(buildWorkerUrl('/products', { color: ['ivory', 'sand'], page: 2, q: '', sort: undefined }))
    expect(url.searchParams.get('color')).toBe('ivory,sand')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.has('q')).toBe(false)
    expect(url.searchParams.has('sort')).toBe(false)
  })
})

describe('workerFetch', () => {
  it('sends the token as a Bearer header, never in the URL or a cookie', async () => {
    vi.stubEnv('CF_ACCESS_CLIENT_ID', 'id.access')
    vi.stubEnv('CF_ACCESS_CLIENT_SECRET', 'shh')
    const { calls } = mockWorker({ 'POST /cart/items': success({ ok: true }, { message: 'Added' }) })

    const result = await workerFetch('/cart/items', {
      method: 'POST',
      body: { variantId: 'v1', quantity: 1 },
      accessToken: 'pat_c_access',
      client: { ip: '203.0.113.7', userAgent: 'vitest' },
    })

    expect(result).toMatchObject({ data: { ok: true }, meta: { message: 'Added' }, status: 200 })
    const [call] = calls
    expect(call.url.search).toBe('')
    expect(call.headers.get('authorization')).toBe('Bearer pat_c_access')
    expect(call.headers.get('cookie')).toBeNull()
    expect(call.headers.get('cf-access-client-id')).toBe('id.access')
    expect(call.headers.get('user-agent')).toBe('vitest')
    expect(call.body).toEqual({ variantId: 'v1', quantity: 1 })
  })

  it('forwards the shopper IP only alongside the gateway secret', async () => {
    const { calls } = mockWorker({ 'GET /products': success([]) })
    const client = { ip: '203.0.113.7' }

    await workerFetch('/products', { client })
    expect(calls[0].headers.get('x-client-ip')).toBeNull()
    expect(calls[0].headers.get('x-gateway-secret')).toBeNull()

    vi.stubEnv('CLOUDFLARE_GATEWAY_SECRET', 'gateway-secret')
    await workerFetch('/products', { client })
    expect(calls[1].headers.get('x-client-ip')).toBe('203.0.113.7')
    expect(calls[1].headers.get('x-gateway-secret')).toBe('gateway-secret')
  })

  it('surfaces Worker errors as ApiError with the upstream status', async () => {
    mockWorker({ 'GET /products/missing': failure(404, 'NOT_FOUND', 'Product not found') })
    await expect(workerFetch('/products/missing')).rejects.toMatchObject({
      status: 404,
      code: 'NOT_FOUND',
      message: 'Product not found',
    })
  })

  it('turns network failures into a 503 UPSTREAM_UNAVAILABLE', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    await expect(workerFetch('/products')).rejects.toMatchObject({ status: 503, code: 'UPSTREAM_UNAVAILABLE' })
  })
})