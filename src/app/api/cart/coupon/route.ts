import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { normalizeCart } from '@/lib/normalize/commerce'
import { asString } from '@/lib/normalize/primitives'
import { fail, ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

/** Discount codes belong to the account cart in the Worker; guests are asked to sign in. */
function couponCall(request: NextRequest, init: { method: 'POST' | 'DELETE'; body?: unknown }) {
  return withSession(request, { auth: 'optional' }, async ({ accessToken, client }) => {
    if (!accessToken) {
      throw new ApiError('Please sign in to use a discount code.', 400, 'SIGN_IN_REQUIRED')
    }
    const { data, meta } = await workerFetch<unknown>('/cart/coupon', { ...init, accessToken, client })
    const message = asString(meta.message)
    return ok({ cart: normalizeCart(data), ...(message ? { message } : {}) })
  })
}

export async function POST(request: NextRequest) {
  let code: string
  try {
    code = asString((await readJson(request)).code).slice(0, 40)
  } catch (error) {
    return fail(error)
  }
  return couponCall(request, { method: 'POST', body: { code } })
}

export function DELETE(request: NextRequest) {
  return couponCall(request, { method: 'DELETE' })
}
