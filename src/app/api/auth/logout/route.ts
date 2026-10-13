import type { NextRequest } from 'next/server'

import { clientContext, ok } from '@/server/http'
import { clearSessionCookies, readSessionCookies } from '@/server/session'
import { workerFetch } from '@/server/worker'

/** Always signs the browser out locally, even if revoking upstream fails. */
export async function POST(request: NextRequest) {
  const { refreshToken, accessToken } = readSessionCookies(request.cookies)

  if (refreshToken) {
    try {
      await workerFetch('/auth/logout', {
        method: 'POST',
        body: { refreshToken },
        accessToken,
        client: clientContext(request),
      })
    } catch (error) {
      console.error('[api/auth/logout] Could not revoke the refresh token:', (error as Error)?.message)
    }
  }

  const response = ok({ signedOut: true })
  clearSessionCookies(response.cookies)
  return response
}
