import type { NextRequest } from 'next/server'

import { normalizeCustomer } from '@/lib/normalize/commerce'
import { asOptionalString, asRecord, asString } from '@/lib/normalize/primitives'
import { clearGuestCart, mergeGuestCart } from '@/server/cart'
import { clientContext, fail, ok, readJson } from '@/server/http'
import { readTokens, setSessionCookies } from '@/server/session'
import { workerFetch } from '@/server/worker'

export async function POST(request: NextRequest) {
  try {
    const body = await readJson(request)
    const client = clientContext(request)

    const { data } = await workerFetch<unknown>('/auth/register', {
      method: 'POST',
      body: {
        firstName: asString(body.firstName),
        lastName: asString(body.lastName),
        email: asString(body.email),
        password: String(body.password ?? ''),
        phone: asOptionalString(body.phone),
        acceptsMarketing: body.acceptsMarketing === true,
      },
      client,
    })

    const tokens = readTokens(data)
    const merged = await mergeGuestCart(request, tokens.accessToken, client)

    const response = ok({ customer: normalizeCustomer(asRecord(data).user) }, { status: 201 })
    setSessionCookies(response.cookies, tokens, true)
    if (merged) clearGuestCart(response)
    return response
  } catch (error) {
    return fail(error, 'api/auth/register')
  }
}
