import type { NextRequest, NextResponse } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { asNumber, asRecord, asString } from '@/lib/normalize/primitives'
import { fail, clientContext } from '@/server/http'
import { workerFetch } from '@/server/worker'

/**
 * Customer session, held entirely in HttpOnly cookies set by the storefront's
 * own route handlers:
 *
 *   pm_session   Worker access token (opaque, short-lived). The cookie expires
 *                slightly before the token does, so its presence means "fresh".
 *   pm_refresh   Worker refresh token (single-use, rotated on every refresh)
 *   pm_remember  "Keep me signed in" — refresh cookie persists for 30 days
 *
 * No token is ever readable by page scripts, and the browser never talks to the
 * Worker directly. Used by route handlers and middleware (Edge-safe: no Node APIs).
 *
 * The Worker treats a reused refresh token as theft and revokes the whole
 * session family, so refreshing is kept to as few places as possible and never
 * happens for prefetches.
 */

export const SESSION_COOKIE = 'pm_session'
export const REFRESH_COOKIE = 'pm_refresh'
export const REMEMBER_COOKIE = 'pm_remember'

const REFRESH_MAX_AGE = 60 * 60 * 24 * 30
const DEFAULT_ACCESS_TTL = 15 * 60
/** Retire the access cookie this long before the token itself expires. */
const EXPIRY_SKEW_SECONDS = 30

export interface CookieReader {
  get(name: string): { value: string } | undefined
}

type CookieWriter = NextResponse['cookies']

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  /** Seconds until the access token expires, as reported by the Worker. */
  expiresIn: number
}

/** HttpOnly, SameSite=Lax, Secure in production — shared by every storefront cookie. */
export function baseCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }
}

/* ------------------------------------------------------------------ *
 * Tokens
 * ------------------------------------------------------------------ */

/** `exp` from a JWT access token, or null for opaque tokens. Unverified — the Worker verifies. */
export function accessTokenExpiry(token: string | undefined): number | null {
  const payload = token?.split('.')[1]
  if (!payload) return null
  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '='))
    const exp = (JSON.parse(json) as { exp?: unknown }).exp
    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

/**
 * Opaque tokens are fresh while their cookie exists (the cookie's lifetime is
 * the token's, minus a safety margin). JWTs are also checked against `exp`.
 */
export function isAccessTokenFresh(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false
  const exp = accessTokenExpiry(token)
  return exp === null || exp - EXPIRY_SKEW_SECONDS > now / 1000
}

export function readTokens(raw: unknown): AuthTokens {
  const tokens = asRecord(asRecord(raw).tokens ?? raw)
  const accessToken = asString(tokens.accessToken)
  const refreshToken = asString(tokens.refreshToken)
  if (!accessToken || !refreshToken) {
    throw new ApiError('The sign-in service returned an unexpected response.', 502, 'BAD_UPSTREAM_RESPONSE')
  }
  return { accessToken, refreshToken, expiresIn: asNumber(tokens.expiresIn, DEFAULT_ACCESS_TTL) }
}

export async function refreshSession(
  refreshToken: string,
  client?: { ip?: string; userAgent?: string },
): Promise<AuthTokens> {
  const { data } = await workerFetch<unknown>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    client,
  })
  return readTokens(data)
}

/* ------------------------------------------------------------------ *
 * Cookies
 * ------------------------------------------------------------------ */

export function readSessionCookies(jar: CookieReader) {
  return {
    accessToken: jar.get(SESSION_COOKIE)?.value || undefined,
    refreshToken: jar.get(REFRESH_COOKIE)?.value || undefined,
    remember: jar.get(REMEMBER_COOKIE)?.value === '1',
  }
}

function accessCookieMaxAge(tokens: AuthTokens): number {
  const exp = accessTokenExpiry(tokens.accessToken)
  const lifetime = exp ? exp - Date.now() / 1000 : tokens.expiresIn
  return Math.max(1, Math.floor(lifetime - EXPIRY_SKEW_SECONDS))
}

export function setSessionCookies(cookies: CookieWriter, tokens: AuthTokens, remember: boolean) {
  cookies.set(SESSION_COOKIE, tokens.accessToken, {
    ...baseCookie(),
    maxAge: accessCookieMaxAge(tokens),
  })
  cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookie(),
    // Without "keep me signed in" the refresh cookie ends with the browser session.
    ...(remember ? { maxAge: REFRESH_MAX_AGE } : {}),
  })
  if (remember) {
    cookies.set(REMEMBER_COOKIE, '1', { ...baseCookie(), maxAge: REFRESH_MAX_AGE })
  } else {
    cookies.delete(REMEMBER_COOKIE)
  }
}

export function clearSessionCookies(cookies: CookieWriter) {
  for (const name of [SESSION_COOKIE, REFRESH_COOKIE, REMEMBER_COOKIE]) {
    cookies.set(name, '', { ...baseCookie(), maxAge: 0 })
  }
}

/** Seconds-precision ISO timestamp for when a freshly issued access token expires. */
export function accessTokenExpiresAt(tokens: AuthTokens): string {
  const exp = accessTokenExpiry(tokens.accessToken) ?? Date.now() / 1000 + tokens.expiresIn
  return new Date(Math.floor(exp) * 1000).toISOString()
}

/* ------------------------------------------------------------------ *
 * Route handler wrapper
 * ------------------------------------------------------------------ */

export interface SessionContext {
  accessToken?: string
  client: { ip?: string; userAgent?: string }
}

export interface SessionOptions {
  /** `required` answers 401 SESSION_EXPIRED when there is no usable session. */
  auth: 'required' | 'optional'
}

export function sessionExpired(): ApiError {
  return new ApiError('Your session has expired. Please sign in again.', 401, 'SESSION_EXPIRED')
}

function isAuthRejection(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 400)
}

/**
 * Runs a route handler with the customer's Worker credentials.
 *
 * An expired access token is refreshed up front; a 401 from the Worker
 * triggers one refresh-and-retry. Rotated tokens are written to the response.
 * A failed refresh leaves the cookies untouched — a concurrent request may
 * already have rotated them — and reports SESSION_EXPIRED instead.
 */
export async function withSession(
  request: NextRequest,
  options: SessionOptions,
  handler: (session: SessionContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  const stored = readSessionCookies(request.cookies)
  const client = clientContext(request)

  let accessToken = isAccessTokenFresh(stored.accessToken) ? stored.accessToken : undefined
  const state: { rotated: AuthTokens | null } = { rotated: null }
  let refreshAttempted = false

  async function tryRefresh(): Promise<boolean> {
    refreshAttempted = true
    if (!stored.refreshToken) return false
    try {
      state.rotated = await refreshSession(stored.refreshToken, client)
      accessToken = state.rotated.accessToken
      return true
    } catch (error) {
      if (isAuthRejection(error)) return false
      throw error
    }
  }

  let response: NextResponse
  try {
    if (!accessToken && stored.refreshToken) await tryRefresh()
    if (options.auth === 'required' && !accessToken) throw sessionExpired()

    try {
      response = await handler({ accessToken, client })
    } catch (error) {
      const unauthorised = error instanceof ApiError && error.status === 401
      if (!unauthorised || !accessToken) throw error
      if (refreshAttempted || !(await tryRefresh())) throw sessionExpired()
      response = await handler({ accessToken, client })
    }
  } catch (error) {
    response = fail(
      error instanceof ApiError &&
        error.status === 401 &&
        (options.auth === 'required' || accessToken !== undefined)
        ? sessionExpired()
        : error,
      'session',
    )
  }

  if (state.rotated) setSessionCookies(response.cookies, state.rotated, stored.remember)
  return response
}
