import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { normalizeAddress } from '@/lib/normalize/commerce'
import { pickAddressInput, validAddressId } from '@/server/address-input'
import { fail, ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

interface RouteContext {
  params: Promise<{ id: string }>
}

const notFound = () => fail(new ApiError('Address not found.', 404, 'NOT_FOUND'))

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  if (!validAddressId(id)) return notFound()

  let input: Record<string, unknown>
  try {
    input = pickAddressInput(await readJson(request), true)
  } catch (error) {
    return fail(error)
  }

  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const { data } = await workerFetch<unknown>(`/auth/addresses/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: input,
      accessToken,
      client,
    })
    return ok({ address: normalizeAddress(data) })
  })
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { id } = await params
  if (!validAddressId(id)) return notFound()

  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    await workerFetch(`/auth/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      accessToken,
      client,
    })
    return ok({ deleted: true })
  })
}
