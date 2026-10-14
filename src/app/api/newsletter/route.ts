import type { NextRequest } from 'next/server'

import { ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

/**
 * Newsletter sign-up, stored by the Worker. The answer is the same whether or
 * not the address was already subscribed, so the form cannot be used to probe
 * the list.
 */
export function POST(request: NextRequest) {
  return withSession(request, { auth: 'optional' }, async ({ accessToken, client }) => {
    const raw = await readJson(request)
    const { data } = await workerFetch<unknown>('/newsletter', {
      method: 'POST',
      body: {
        email: typeof raw.email === 'string' ? raw.email : '',
        source: typeof raw.source === 'string' ? raw.source.slice(0, 60) : undefined,
      },
      accessToken,
      client,
    })
    return ok(data)
  })
}
