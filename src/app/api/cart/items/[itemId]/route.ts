import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { asNumber } from '@/lib/normalize/primitives'
import { cartCall, MAX_LINE_QUANTITY, validCartItemId } from '@/server/cart'
import { fail, readJson } from '@/server/http'

interface RouteContext {
  params: Promise<{ itemId: string }>
}

const unknownLine = () => fail(new ApiError('That item is no longer in your bag.', 404, 'NOT_FOUND'))

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { itemId } = await params
  if (!validCartItemId(itemId)) return unknownLine()

  let quantity: number
  try {
    quantity = Math.floor(asNumber((await readJson(request)).quantity, 1))
  } catch (error) {
    return fail(error)
  }

  return cartCall(request, {
    type: 'set',
    variantId: itemId,
    quantity: Math.min(Math.max(quantity, 0), MAX_LINE_QUANTITY),
  })
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const { itemId } = await params
  if (!validCartItemId(itemId)) return unknownLine()
  return cartCall(request, { type: 'remove', variantId: itemId })
}
