import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { middleware } from '@/middleware'
import { WORKER_ORIGIN, failure, jwt, mockWorker, opaqueToken, request, responseCookies, success } from './helpers'

const { findRedirect } = vi.hoisted(() => ({ findRedirect: vi.fn() }))
vi.mock('@/server/redirects', () => ({ findRedirect }))

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  findRedirect.mockReset().mockResolvedValue(null)
})

describe('middleware redirects', () => {
  it('applies an admin redirect with its status code and keeps the query string', async () => {
    findRedirect.mockResolvedValue({ toPath: '/collections/shawls', statusCode: 301 })
    const response = await middleware(request('/old-shawls?utm_source=mail'))
    expect(findRedirect).toHaveBeenCalledWith('/old-shawls')
    expect(response.status).toBe(301)
    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/collections/shawls')
    expect(location.search).toBe('?utm_source=mail')
  })

  it('sends external redirects to the exact URL configured', async () => {
    findRedirect.mockResolvedValue({ toPath: 'https://blog.example.com/story', statusCode: 302 })
    const response = await middleware(request('/journal'))
    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://blog.example.com/story')
  })

  it('leaves public pages alone without touching the session', async () => {
    const { fetchMock } = mockWorker({})
    const response = await middleware(request('/about', { cookies: { pm_refresh: 'refresh-1' } }))
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.getSetCookie()).toHaveLength(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('middleware', () => {
  it('lets a live access cookie through without calling the Worker', async () => {
    const { fetchMock } = mockWorker({})
    const response = await middleware(request('/account', { cookies: { pm_session: opaqueToken() } }))
    expect(response.headers.get('location')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rotates the session once the access cookie has expired and forwards it to the render', async () => {
    const fresh = opaqueToken('fresh0000000000000000')
    mockWorker({
      'POST /auth/refresh': success({ tokens: { accessToken: fresh, refreshToken: 'refresh-2', expiresIn: 900 } }),
    })
    const response = await middleware(request('/account/orders', { cookies: { pm_refresh: 'refresh-1' } }))

    expect(response.headers.get('location')).toBeNull()
    const cookies = responseCookies(response)
    expect(cookies.pm_session.value).toBe(fresh)
    expect(cookies.pm_refresh.value).toBe('refresh-2')
    // Server Components read the overridden request cookies in the same pass.
    expect(response.headers.get('x-middleware-request-cookie')).toContain(`pm_session=${fresh}`)
  })

  it('treats an expired JWT access token like a missing one', async () => {
    const { calls } = mockWorker({
      'POST /auth/refresh': success({ tokens: { accessToken: opaqueToken(), refreshToken: 'refresh-2', expiresIn: 900 } }),
    })
    await middleware(request('/account', { cookies: { pm_session: jwt(-10), pm_refresh: 'refresh-1' } }))
    expect(calls).toHaveLength(1)
  })

  it('never spends the single-use refresh token on a prefetch', async () => {
    const { fetchMock } = mockWorker({})
    const prefetch = new NextRequest(new URL('/account', 'https://shop.test'), {
      headers: { 'next-router-prefetch': '1', cookie: 'pm_refresh=refresh-1' },
    })
    const response = await middleware(prefetch)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(response.headers.getSetCookie()).toHaveLength(0)
  })

  it('sends signed-out visitors to /login with a return path', async () => {
    const response = await middleware(request('/account/orders?page=2'))
    const location = new URL(response.headers.get('location')!)
    expect(location.pathname).toBe('/login')
    expect(location.searchParams.get('next')).toBe('/account/orders?page=2')
  })

  it('redirects when the refresh token is rejected, leaving cookies untouched', async () => {
    mockWorker({ 'POST /auth/refresh': failure(401, 'UNAUTHORIZED') })
    const response = await middleware(request('/account', { cookies: { pm_refresh: 'stale' } }))
    expect(new URL(response.headers.get('location')!).pathname).toBe('/login')
    expect(response.headers.getSetCookie()).toHaveLength(0)
  })

  it('never blocks checkout for guests', async () => {
    const response = await middleware(request('/checkout'))
    expect(response.headers.get('location')).toBeNull()
  })

  it('remembers an edge-detected country for the rest of the visit', async () => {
    const response = await middleware(request('/collections/shawls', { headers: { 'cf-ipcountry': 'US' } }))
    expect(response.headers.get('location')).toBeNull()
    const cookie = responseCookies(response).pm_geo
    expect(cookie.value).toBe('US')
    expect(cookie.attributes).toContain('httponly')
    expect(response.headers.get('x-middleware-request-cookie')).toContain('pm_geo=US')
  })

  it('does not override an explicit country choice', async () => {
    const response = await middleware(
      request('/about', { cookies: { pm_country: 'IN' }, headers: { 'cf-ipcountry': 'US' } }),
    )
    expect(responseCookies(response).pm_geo).toBeUndefined()
  })

  it('looks up a public address when the edge has no country', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        expect(String(input)).toContain('8.8.8.8')
        return new Response('DE')
      }),
    )
    const response = await middleware(request('/about', { headers: { 'x-forwarded-for': '8.8.8.8' } }))
    expect(responseCookies(response).pm_geo.value).toBe('DE')
  })

  it('keeps a remembered country without rewriting the cookie', async () => {
    const response = await middleware(request('/about', { cookies: { pm_geo: 'GB' } }))
    expect(response.headers.getSetCookie()).toHaveLength(0)
  })
})
