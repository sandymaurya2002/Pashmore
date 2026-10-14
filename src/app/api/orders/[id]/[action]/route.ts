import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { normalizeOrder, normalizePaymentSession } from '@/lib/normalize/commerce'
import { asRecord, asString } from '@/lib/normalize/primitives'
import { ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

const ID = /^[A-Za-z0-9_-]{1,64}$/

interface RouteContext {
  params: Promise<{ id: string; action: string }>
}

/**
 * Customer actions on their own order:
 *
 *   pay      start or retry online payment → Razorpay Checkout options
 *   verify   hand Razorpay's success callback to the Worker for verification
 *   sync     ask the Worker to re-check the payment with Razorpay
 *   cancel   cancel before dispatch
 *   return   request a return after delivery
 *
 * The Worker checks ownership, state and (for payments) the Razorpay
 * signature and the payment itself; this handler only forwards.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id, action } = await context.params

  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    if (!ID.test(id)) throw new ApiError('Order not found.', 404, 'NOT_FOUND')
    const base = `/orders/${encodeURIComponent(id)}`
    const call = (path: string, body: unknown = {}) =>
      workerFetch<unknown>(path, { method: 'POST', body, accessToken, client, timeoutMs: 20_000 })

    switch (action) {
      case 'pay': {
        const { data } = await call(`${base}/pay`)
        return ok({ payment: normalizePaymentSession(data) })
      }
      case 'verify': {
        const raw = await readJson(request)
        const { data } = await call(`${base}/payment/verify`, {
          razorpayOrderId: asString(raw.razorpayOrderId),
          razorpayPaymentId: asString(raw.razorpayPaymentId),
          razorpaySignature: asString(raw.razorpaySignature),
        })
        const record = asRecord(data)
        return ok({ outcome: asString(record.outcome), order: normalizeOrder(record.order) })
      }
      case 'sync': {
        const { data } = await call(`${base}/payment/sync`)
        return ok({ order: normalizeOrder(data) })
      }
      case 'cancel': {
        const raw = await readJson(request).catch(() => ({}) as Record<string, unknown>)
        const reason = typeof raw.reason === 'string' ? raw.reason.trim().slice(0, 500) : undefined
        const { data } = await call(`${base}/cancel`, reason ? { reason } : {})
        return ok({ order: normalizeOrder(data) })
      }
      case 'return': {
        const raw = await readJson(request)
        const { data } = await call(`${base}/return`, {
          reason: typeof raw.reason === 'string' ? raw.reason.trim().slice(0, 1000) : '',
        })
        return ok({ order: normalizeOrder(data) })
      }
      default:
        throw new ApiError('Not found.', 404, 'NOT_FOUND')
    }
  })
}
