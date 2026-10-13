import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { validAddressId } from '@/server/address-input'
import { fail, ok } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!validAddressId(id)) return fail(new ApiError('Address not found.', 404, 'NOT_FOUND'))

  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    await workerFetch(`/auth/addresses/${encodeURIComponent(id)}/default`, {
      method: 'POST',
      accessToken,
      client,
    })
    return ok({ updated: true })
  })
}
