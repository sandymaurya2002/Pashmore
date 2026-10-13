import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { asNumber, asString } from '@/lib/normalize/primitives'
import { cartCall, MAX_LINE_QUANTITY, validCartItemId, validProductSlug } from '@/server/cart'
import { fail, readJson } from '@/server/http'

export async function POST(request: NextRequest) {
  let variantId: string
  let productSlug: string
  let quantity: number
  try {
    const body = await readJson(request)
    variantId = asString(body.variantId)
    productSlug = asString(body.productSlug)
    quantity = Math.floor(asNumber(body.quantity, 1))
    if (!validCartItemId(variantId) || !validProductSlug(productSlug)) {
      throw new ApiError('Please choose a colour and size.', 400, 'VALIDATION_ERROR')
    }
    if (quantity < 1 || quantity > MAX_LINE_QUANTITY) {
      throw new ApiError(`Choose between 1 and ${MAX_LINE_QUANTITY}.`, 400, 'VALIDATION_ERROR', {
        quantity: `Choose between 1 and ${MAX_LINE_QUANTITY}.`,
      })
    }
  } catch (error) {
    return fail(error)
  }

  return cartCall(request, { type: 'add', variantId, productSlug, quantity })
}
