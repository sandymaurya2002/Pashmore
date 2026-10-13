import type { NextRequest } from 'next/server'

import { asRecord, asStringArray } from '@/lib/normalize/primitives'
import { fail, ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

/** Carries a guest's on-device wishlist into their account after sign-in. */
export async function POST(request: NextRequest) {
  let slugs: string[]
  try {
    slugs = asStringArray((await readJson(request)).slugs)
      .filter((slug) => /^[a-z0-9-]{1,160}$/i.test(slug))
      .slice(0, 200)
  } catch (error) {
    return fail(error)
  }

  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const { data } = await workerFetch<unknown>('/wishlist/merge', {
      method: 'POST',
      body: { slugs },
      accessToken,
      client,
    })
    return ok({ slugs: asStringArray(asRecord(data).slugs) })
  })
}
