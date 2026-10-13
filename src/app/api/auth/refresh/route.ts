import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { clientContext, fail, ok } from '@/server/http'
import {
  accessTokenExpiresAt,
  clearSessionCookies,
  readSessionCookies,
  refreshSession,
  sessionExpired,
  setSessionCookies,
} from '@/server/session'

/** Explicitly rotates the session. A rejected refresh token signs the browser out. */
export async function POST(request: NextRequest) {
  const { refreshToken, remember } = readSessionCookies(request.cookies)
  if (!refreshToken) return fail(sessionExpired())

  try {
    const tokens = await refreshSession(refreshToken, clientContext(request))
    const response = ok({ expiresAt: accessTokenExpiresAt(tokens) })
    setSessionCookies(response.cookies, tokens, remember)
    return response
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const response = fail(sessionExpired())
      clearSessionCookies(response.cookies)
      return response
    }
    return fail(error, 'api/auth/refresh')
  }
}
