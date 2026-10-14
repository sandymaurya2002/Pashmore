import type { NextRequest } from 'next/server'

import { ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

const FIELDS = ['name', 'email', 'phone', 'subject', 'orderNumber', 'message', 'website'] as const

/**
 * Forwards an enquiry to the Worker, which validates it, stores it for the
 * admin Enquiries screen and emails the care team. A signed-in customer's
 * token is passed along so the enquiry is linked to their account.
 */
export function POST(request: NextRequest) {
  return withSession(request, { auth: 'optional' }, async ({ accessToken, client }) => {
    const raw = await readJson(request)
    const body: Record<string, string> = {}
    for (const field of FIELDS) {
      const value = raw[field]
      if (typeof value === 'string') body[field] = value
    }
    const { data } = await workerFetch<unknown>('/contact', { method: 'POST', body, accessToken, client })
    return ok(data, { status: 201 })
  })
}
