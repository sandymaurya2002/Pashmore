import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as login } from '@/app/api/auth/login/route'
import { POST as logout } from '@/app/api/auth/logout/route'
import { POST as refresh } from '@/app/api/auth/refresh/route'
import { GET as session } from '@/app/api/auth/session/route'
import { GET as profile, PATCH as updateProfile } from '@/app/api/account/profile/route'
import { POST as register } from '@/app/api/auth/register/route'
import {
  WORKER_ORIGIN,
  failure,
  guestCartCookie,
  mockWorker,
  opaqueToken,
  request,
  responseCookies,
  success,
} from './helpers'

const user = { id: 'cus_1', email: 'asha@example.com', firstName: 'Asha', lastName: 'Kaul' }
const ACCESS = opaqueToken()

function tokens(accessSeconds = 900, refreshToken = 'refresh-2') {
  return { tokens: { accessToken: ACCESS, refreshToken, expiresIn: accessSeconds } }
}

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('POST /api/auth/login', () => {
  it('sets HttpOnly session cookies and never returns tokens to the browser', async () => {
    const { calls } = mockWorker({ 'POST /auth/login': success({ user, ...tokens() }) })

    const response = await login(
      request('/api/auth/login', {
        method: 'POST',
        body: { email: 'asha@example.com', password: 'Secret123', remember: true },
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true, data: { customer: expect.objectContaining({ id: 'cus_1' }) } })
    expect(JSON.stringify(body)).not.toContain('refresh-2')
    expect(JSON.stringify(body)).not.toContain(ACCESS)

    const cookies = responseCookies(response)
    expect(cookies.pm_session.value).toBe(ACCESS)
    expect(cookies.pm_session.attributes).toContain('httponly')
    expect(cookies.pm_session.attributes).toContain('samesite=lax')
    // The access cookie retires 30s before the opaque token does.
    expect(cookies.pm_session.attributes).toContain('max-age=870')
    expect(cookies.pm_refresh).toMatchObject({ value: 'refresh-2' })
    expect(cookies.pm_refresh.attributes).toContain('max-age=2592000')
    expect(cookies.pm_remember.value).toBe('1')
    // No guest bag, so no merge call.
    expect(calls).toHaveLength(1)
  })

  it('merges the guest bag into the account and clears it', async () => {
    const { calls } = mockWorker({
      'POST /auth/login': success({ user, ...tokens() }),
      'POST /cart/merge': success({ items: [], skipped: [] }),
    })
    const response = await login(
      request('/api/auth/login', {
        method: 'POST',
        body: { email: 'asha@example.com', password: 'Secret123' },
        cookies: { pm_cart: guestCartCookie([['var_1', 'ivory-heritage-pashmina-shawl', 2]]) },
      }),
    )
    expect(response.status).toBe(200)
    expect(calls[1].headers.get('authorization')).toBe(`Bearer ${ACCESS}`)
    expect(calls[1].body).toEqual({ items: [{ variantId: 'var_1', quantity: 2 }] })
    expect(responseCookies(response).pm_cart.attributes).toContain('max-age=0')
  })

  it('still signs in, keeping the guest bag, when the merge fails', async () => {
    mockWorker({
      'POST /auth/login': success({ user, ...tokens() }),
      'POST /cart/merge': failure(500, 'INTERNAL_ERROR'),
    })
    const response = await login(
      request('/api/auth/login', {
        method: 'POST',
        body: { email: 'asha@example.com', password: 'Secret123' },
        cookies: { pm_cart: guestCartCookie([['var_1', 'ivory-heritage-pashmina-shawl', 2]]) },
      }),
    )
    expect(response.status).toBe(200)
    const cookies = responseCookies(response)
    expect(cookies.pm_session.value).toBe(ACCESS)
    expect(cookies.pm_cart).toBeUndefined()
  })

  it('keeps the refresh cookie to the browser session without "remember me"', async () => {
    mockWorker({ 'POST /auth/login': success({ user, ...tokens() }) })
    const response = await login(
      request('/api/auth/login', {
        method: 'POST',
        body: { email: 'asha@example.com', password: 'Secret123', remember: false },
      }),
    )
    expect(responseCookies(response).pm_refresh.attributes).not.toContain('max-age')
  })

  it('passes Worker auth failures through in the envelope without setting cookies', async () => {
    mockWorker({ 'POST /auth/login': failure(401, 'UNAUTHORIZED', 'Incorrect email or password.') })
    const response = await login(
      request('/api/auth/login', { method: 'POST', body: { email: 'a@b.co', password: 'wrong' } }),
    )
    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Incorrect email or password.' },
    })
    expect(response.headers.getSetCookie()).toHaveLength(0)
  })

  it('reports a clear 503 when the Worker is not configured', async () => {
    vi.stubEnv('CLOUDFLARE_API_URL', '')
    const response = await login(
      request('/api/auth/login', { method: 'POST', body: { email: 'a@b.co', password: 'x' } }),
    )
    expect(response.status).toBe(503)
    expect((await response.json()).error.code).toBe('API_NOT_CONFIGURED')
  })

  it('rejects a non-JSON body', async () => {
    const response = await login(request('/api/auth/login', { method: 'POST', body: ['nope'] }))
    expect(response.status).toBe(400)
  })
})

describe('POST /api/auth/register', () => {
  it('creates the account with only the fields the Worker accepts and signs in', async () => {
    const { calls } = mockWorker({ 'POST /auth/register': { status: 201, ...success({ user, ...tokens() }) } })
    const response = await register(
      request('/api/auth/register', {
        method: 'POST',
        body: {
          firstName: 'Asha',
          lastName: 'Kaul',
          email: 'asha@example.com',
          password: 'Secret123',
          role: 'admin',
        },
      }),
    )
    expect(response.status).toBe(201)
    expect(calls[0].body).toEqual({
      firstName: 'Asha',
      lastName: 'Kaul',
      email: 'asha@example.com',
      password: 'Secret123',
      acceptsMarketing: false,
    })
    expect(responseCookies(response).pm_session.value).toBe(ACCESS)
  })
})

describe('GET /api/auth/session', () => {
  it('returns a null customer without calling the Worker when signed out', async () => {
    const { fetchMock } = mockWorker({})
    const response = await session(request('/api/auth/session'))
    expect(await response.json()).toEqual({ success: true, data: { customer: null } })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refreshes an expired access token and rotates the cookies', async () => {
    const { calls } = mockWorker({
      'POST /auth/refresh': (call) => {
        expect(call.body).toEqual({ refreshToken: 'refresh-1' })
        return success(tokens(900, 'refresh-2'))
      },
      'GET /auth/me': (call) => {
        expect(call.headers.get('authorization')).toMatch(/^Bearer /)
        return success(user)
      },
    })

    const response = await session(
      request('/api/auth/session', { cookies: { pm_refresh: 'refresh-1' } }),
    )

    expect((await response.json()).data.customer.email).toBe('asha@example.com')
    expect(calls.map((call) => `${call.method} ${call.url.pathname}`)).toEqual([
      'POST /api/v1/auth/refresh',
      'GET /api/v1/auth/me',
    ])
    expect(responseCookies(response).pm_refresh.value).toBe('refresh-2')
  })

  it('retries once after a Worker 401 on a token that looked fresh', async () => {
    let meCalls = 0
    mockWorker({
      'GET /auth/me': () => (++meCalls === 1 ? failure(401, 'UNAUTHORIZED') : success(user)),
      'POST /auth/refresh': success(tokens()),
    })
    const response = await session(
      request('/api/auth/session', { cookies: { pm_session: ACCESS, pm_refresh: 'refresh-1' } }),
    )
    expect(response.status).toBe(200)
    expect(meCalls).toBe(2)
  })

  it('clears every session cookie when the refresh token is rejected', async () => {
    mockWorker({ 'POST /auth/refresh': failure(401, 'INVALID_REFRESH_TOKEN') })
    const response = await session(
      request('/api/auth/session', { cookies: { pm_refresh: 'stale' } }),
    )
    expect(await response.json()).toEqual({ success: true, data: { customer: null } })
    const cookies = responseCookies(response)
    for (const name of ['pm_session', 'pm_refresh', 'pm_remember']) {
      expect(cookies[name].attributes).toContain('max-age=0')
    }
  })

  it('does not sign the customer out when the Worker is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    const response = await session(
      request('/api/auth/session', { cookies: { pm_refresh: 'refresh-1' } }),
    )
    expect(response.status).toBe(503)
    expect(response.headers.getSetCookie()).toHaveLength(0)
  })
})

describe('POST /api/auth/refresh', () => {
  it('answers SESSION_EXPIRED without a refresh cookie', async () => {
    const response = await refresh(request('/api/auth/refresh', { method: 'POST' }))
    expect(response.status).toBe(401)
    expect((await response.json()).error.code).toBe('SESSION_EXPIRED')
  })

  it('preserves the "remember me" lifetime when rotating', async () => {
    mockWorker({ 'POST /auth/refresh': success(tokens(900, 'refresh-3')) })
    const response = await refresh(
      request('/api/auth/refresh', { method: 'POST', cookies: { pm_refresh: 'r', pm_remember: '1' } }),
    )
    const body = await response.json()
    expect(body.data.expiresAt).toEqual(expect.any(String))
    expect(responseCookies(response).pm_refresh.attributes).toContain('max-age=2592000')
  })
})

describe('POST /api/auth/logout', () => {
  it('revokes upstream and clears cookies', async () => {
    const { calls } = mockWorker({ 'POST /auth/logout': success({ loggedOut: true }) })
    const response = await logout(
      request('/api/auth/logout', { method: 'POST', cookies: { pm_session: ACCESS, pm_refresh: 'refresh-1' } }),
    )
    expect(calls[0].body).toEqual({ refreshToken: 'refresh-1' })
    expect(responseCookies(response).pm_session.attributes).toContain('max-age=0')
  })

  it('still signs out locally when the Worker cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
    const response = await logout(request('/api/auth/logout', { method: 'POST', cookies: { pm_refresh: 'r' } }))
    expect(response.status).toBe(200)
    expect(responseCookies(response).pm_refresh.attributes).toContain('max-age=0')
  })
})

describe('/api/account/profile', () => {
  it('requires a session', async () => {
    const { fetchMock } = mockWorker({})
    const response = await profile(request('/api/account/profile'))
    expect(response.status).toBe(401)
    expect((await response.json()).error.code).toBe('SESSION_EXPIRED')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards only editable fields and survives a refresh-and-retry', async () => {
    let patches = 0
    mockWorker({
      'PATCH /auth/me': (call) => {
        patches += 1
        expect(call.body).toEqual({ firstName: 'Asha', phone: null })
        return patches === 1 ? failure(401, 'UNAUTHORIZED') : success({ ...user, phone: null })
      },
      'POST /auth/refresh': success(tokens()),
    })
    const response = await updateProfile(
      request('/api/account/profile', {
        method: 'PATCH',
        body: { firstName: 'Asha', phone: '', email: 'hijack@example.com', role: 'admin' },
        cookies: { pm_session: ACCESS, pm_refresh: 'refresh-1' },
      }),
    )
    expect(response.status).toBe(200)
    expect(patches).toBe(2)
  })
})
