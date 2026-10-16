import { NextResponse, type NextRequest } from 'next/server'

import { clientAddress, countryFromIp } from '@/lib/geo-ip'
import { GEO_COOKIE, geoCountry, normalizeCountry, REGION_COOKIE, REGION_COOKIE_MAX_AGE } from '@/lib/region'
import {
  SESSION_COOKIE,
  REFRESH_COOKIE,
  baseCookie,
  isAccessTokenFresh,
  readSessionCookies,
  refreshSession,
  setSessionCookies,
} from '@/server/session'
import { findRedirect } from '@/server/redirects'

const SESSION_PATHS = /^\/(account(\/|$)|checkout$)/

/**
 * Applies the redirects managed in the admin dashboard, then keeps the
 * customer session alive for server-rendered account pages.
 *
 * Server Components cannot set cookies, so an expiring access token is rotated
 * here: the new tokens are written to the response *and* to the forwarded
 * request, so the page renders with the fresh session in the same round trip.
 * Visitors with no session are sent to /login and returned afterwards.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const detected = await rememberCountry(request)

  if (request.method === 'GET' || request.method === 'HEAD') {
    const redirect = await findRedirect(pathname)
    if (redirect) {
      const target = new URL(redirect.toPath, request.url)
      if (redirect.toPath.startsWith('/') && !target.search) target.search = request.nextUrl.search
      return withCountry(NextResponse.redirect(target, redirect.statusCode), detected)
    }
  }

  if (!SESSION_PATHS.test(pathname)) return withCountry(forward(request), detected)

  const stored = readSessionCookies(request.cookies)
  const protectedPath = pathname.startsWith('/account')

  if (isAccessTokenFresh(stored.accessToken)) return withCountry(forward(request), detected)

  // A prefetch racing a real request would present the same single-use
  // refresh token twice, which the Worker treats as theft.
  if (isPrefetch(request)) return withCountry(forward(request), detected)

  if (stored.refreshToken) {
    try {
      const tokens = await refreshSession(stored.refreshToken, {
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') ?? undefined,
      })
      request.cookies.set(SESSION_COOKIE, tokens.accessToken)
      request.cookies.set(REFRESH_COOKIE, tokens.refreshToken)
      const response = forward(request)
      setSessionCookies(response.cookies, tokens, stored.remember)
      return withCountry(response, detected)
    } catch (error) {
      // A rejected token, or the Worker being unreachable. Cookies are left
      // alone: a parallel request may have rotated them a moment ago.
      console.error('[middleware] Session refresh failed:', (error as Error)?.message)
    }
  }

  if (protectedPath) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return withCountry(NextResponse.redirect(login), detected)
  }
  return withCountry(forward(request), detected)
}

/**
 * Detects the visitor's country and writes it onto this request so the page
 * renders in that currency immediately. An explicit region choice is left alone.
 * Returns the country only when the response still needs to store it.
 */
async function rememberCountry(request: NextRequest): Promise<string | null> {
  if (normalizeCountry(request.cookies.get(REGION_COOKIE)?.value)) return null
  const live = geoCountry(request.headers)
  const remembered = normalizeCountry(request.cookies.get(GEO_COOKIE)?.value)
  const country = live ?? remembered ?? (isPrefetch(request) ? null : await countryFromIp(clientAddress(request.headers)))
  if (!country || request.cookies.get(GEO_COOKIE)?.value === country) return null
  request.cookies.set(GEO_COOKIE, country)
  return country
}

function forward(request: NextRequest) {
  return NextResponse.next({ request: { headers: request.headers } })
}

function withCountry(response: NextResponse, country: string | null) {
  if (country) response.cookies.set(GEO_COOKIE, country, { ...baseCookie(), maxAge: REGION_COOKIE_MAX_AGE })
  return response
}

function isPrefetch(request: NextRequest): boolean {
  return (
    request.headers.has('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('sec-purpose')?.includes('prefetch') === true
  )
}

export const config = {
  // Every page, but not Next internals, API routes or files with an extension.
  matcher: ['/((?!_next/|api/|.*\\.[A-Za-z0-9]+$).*)'],
}
