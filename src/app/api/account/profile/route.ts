import type { NextRequest } from 'next/server'

import { normalizeCustomer } from '@/lib/normalize/commerce'
import { asString } from '@/lib/normalize/primitives'
import { fail, ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

export function GET(request: NextRequest) {
  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const { data } = await workerFetch<unknown>('/auth/me', { accessToken, client })
    return ok({ customer: normalizeCustomer(data) })
  })
}

export async function PATCH(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await readJson(request)
  } catch (error) {
    return fail(error)
  }

  const update: Record<string, unknown> = {}
  if (typeof body.firstName === 'string') update.firstName = asString(body.firstName)
  if (typeof body.lastName === 'string') update.lastName = asString(body.lastName)
  if (body.phone === null || typeof body.phone === 'string') {
    update.phone = asString(body.phone) || null
  }
  if (typeof body.acceptsMarketing === 'boolean') update.acceptsMarketing = body.acceptsMarketing

  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const { data } = await workerFetch<unknown>('/auth/me', {
      method: 'PATCH',
      body: update,
      accessToken,
      client,
    })
    return ok({ customer: normalizeCustomer(data) })
  })
}
