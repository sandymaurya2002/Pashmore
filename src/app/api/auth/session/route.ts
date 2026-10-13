import type { NextRequest } from 'next/server'

import { normalizeCustomer } from '@/lib/normalize/commerce'
import { ok } from '@/server/http'
import { clearSessionCookies, readSessionCookies, withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

/**
 * The signed-in customer, or `null`. This is the one place a dead session is
 * cleaned up: if the Worker rejects both tokens, the cookies are cleared.
 */
export async function GET(request: NextRequest) {
  const stored = readSessionCookies(request.cookies)
  if (!stored.accessToken && !stored.refreshToken) return ok({ customer: null })

  const response = await withSession(request, { auth: 'required' }, async ({ accessToken }) => {
    const { data } = await workerFetch<unknown>('/auth/me', { accessToken })
    return ok({ customer: normalizeCustomer(data) })
  })

  if (response.status === 401) {
    const signedOut = ok({ customer: null })
    clearSessionCookies(signedOut.cookies)
    return signedOut
  }
  return response
}
