import { revalidateTag } from 'next/cache'
import { timingSafeEqual } from 'node:crypto'

import { ApiError } from '@/lib/api/envelope'
import { CATALOG_TAG } from '@/services/catalog'
import { fail, ok, readJson } from '@/server/http'

/**
 * Cache purge hook for the Worker/admin: POST with
 * `Authorization: Bearer <REVALIDATE_SECRET>` and an optional body
 * `{ "tags": ["product:some-slug"] }`. Without tags the whole catalogue is
 * purged. Disabled unless REVALIDATE_SECRET is set.
 */

const ALLOWED_TAG = /^(catalog|products|collections|(product|collection):[a-z0-9-]{1,160})$/i

function authorised(request: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) return false
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  const a = Buffer.from(supplied)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: Request) {
  try {
    if (!authorised(request)) {
      throw new ApiError('Not authorised.', 401, 'UNAUTHORIZED')
    }
    const body = await readJson(request).catch(() => ({}) as Record<string, unknown>)
    const requested = Array.isArray(body.tags) ? body.tags.map(String) : [CATALOG_TAG]
    const tags = requested.filter((tag) => ALLOWED_TAG.test(tag)).slice(0, 50)
    if (!tags.length) throw new ApiError('No valid tags supplied.', 400, 'VALIDATION_ERROR')

    for (const tag of tags) revalidateTag(tag)
    return ok({ revalidated: tags })
  } catch (error) {
    return fail(error, 'api/revalidate')
  }
}
