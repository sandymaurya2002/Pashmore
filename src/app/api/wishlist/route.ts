import type { NextRequest } from 'next/server'

import { asStringArray } from '@/lib/normalize/primitives'
import { ok } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

export function GET(request: NextRequest) {
  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const { data } = await workerFetch<unknown>('/wishlist/slugs', { accessToken, client })
    return ok({ slugs: asStringArray(data) })
  })
}

export function DELETE(request: NextRequest) {
  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    await workerFetch('/wishlist', { method: 'DELETE', accessToken, client })
    return ok({ slugs: [] })
  })
}
