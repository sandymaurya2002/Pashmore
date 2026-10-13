import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { fail, ok } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  if (!/^[a-z0-9-]{1,160}$/i.test(slug)) {
    return fail(new ApiError('Unknown product.', 400, 'VALIDATION_ERROR'))
  }

  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    await workerFetch(`/wishlist/${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      accessToken,
      client,
    })
    return ok({ removed: slug })
  })
}
