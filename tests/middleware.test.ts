import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { middleware } from '@/middleware'
import { WORKER_ORIGIN, failure, jwt, mockWorker, opaqueToken, request, responseCookies, success } from './helpers'

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
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
})
