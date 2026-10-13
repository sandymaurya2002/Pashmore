import type { NextRequest } from 'next/server'

import { normalizeAddress, normalizeAddresses } from '@/lib/normalize/commerce'
import { pickAddressInput } from '@/server/address-input'
import { fail, ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

export function GET(request: NextRequest) {
  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const { data } = await workerFetch<unknown>('/auth/addresses', { accessToken, client })
    return ok({ addresses: normalizeAddresses(data) })
  })
}

export async function POST(request: NextRequest) {
  let input: Record<string, unknown>
  try {
    input = pickAddressInput(await readJson(request))
  } catch (error) {
    return fail(error)
  }

  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const { data } = await workerFetch<unknown>('/auth/addresses', {
      method: 'POST',
      body: input,
      accessToken,
      client,
    })
    return ok({ address: normalizeAddress(data) }, { status: 201 })
  })
}
