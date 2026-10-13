import { NextResponse, type NextRequest } from 'next/server'

import {
  SESSION_COOKIE,
  REFRESH_COOKIE,
  isAccessTokenFresh,
  readSessionCookies,
  refreshSession,
  setSessionCookies,
} from '@/server/session'

/**
 * Keeps the customer session alive for server-rendered account pages.
 *
 * Server Components cannot set cookies, so an expiring access token is rotated
 * here: the new tokens are written to the response *and* to the forwarded
 * request, so the page renders with the fresh session in the same round trip.
 * Visitors with no session are sent to /login and returned afterwards.
 */
export async function middleware(request: NextRequest) {
  const stored = readSessionCookies(request.cookies)
  const protectedPath = request.nextUrl.pathname.startsWith('/account')

  if (isAccessTokenFresh(stored.accessToken)) return NextResponse.next()

  // A prefetch racing a real request would present the same single-use
  // refresh token twice, which the Worker treats as theft.
  if (isPrefetch(request)) return NextResponse.next()

  if (stored.refreshToken) {
    try {
      const tokens = await refreshSession(stored.refreshToken, {
        ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') ?? undefined,
      })
      request.cookies.set(SESSION_COOKIE, tokens.accessToken)
      request.cookies.set(REFRESH_COOKIE, tokens.refreshToken)
      const response = NextResponse.next({ request: { headers: request.headers } })
      setSessionCookies(response.cookies, tokens, stored.remember)
      return response
    } catch (error) {
      // A rejected token, or the Worker being unreachable. Cookies are left
      // alone: a parallel request may have rotated them a moment ago.
      console.error('[middleware] Session refresh failed:', (error as Error)?.message)
    }
  }

  if (protectedPath) {
    const login = new URL('/login', request.url)
    login.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(login)
  }
  return NextResponse.next()
}

function isPrefetch(request: NextRequest): boolean {
  return (
    request.headers.has('next-router-prefetch') ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('sec-purpose')?.includes('prefetch') === true
  )
}

export const config = {
  matcher: ['/account/:path*', '/checkout'],
}
