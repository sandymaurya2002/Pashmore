import type { NextRequest } from 'next/server'

import { cartCall } from '@/server/cart'

export function GET(request: NextRequest) {
  return cartCall(request, { type: 'get' })
}

export function DELETE(request: NextRequest) {
  return cartCall(request, { type: 'clear' })
}
