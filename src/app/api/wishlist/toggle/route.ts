import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { asBoolean, asRecord, asString } from '@/lib/normalize/primitives'
import { fail, ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

export async function POST(request: NextRequest) {
  let slug: string
  try {
    slug = asString((await readJson(request)).slug)
    if (!/^[a-z0-9-]{1,160}$/i.test(slug)) {
      throw new ApiError('Unknown product.', 400, 'VALIDATION_ERROR')
    }
  } catch (error) {
    return fail(error)
  }

  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const { data } = await workerFetch<unknown>('/wishlist/toggle', {
      method: 'POST',
      body: { slug },
      accessToken,
      client,
    })
    return ok({ added: asBoolean(asRecord(data).saved) })
  })
}
