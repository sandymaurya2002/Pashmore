'use client'

import { bff, errorMessage } from '@/lib/api/browser'
import { openRazorpayCheckout } from '@/lib/razorpay'
import type { Order, PaymentSession } from '@/types'

export type PaymentRunResult =
  | { status: 'paid'; order: Order | null }
  /** Razorpay accepted the payment but the Worker has not confirmed it yet (webhook will). */
  | { status: 'confirming'; order: Order | null; message: string }
  | { status: 'failed'; message: string }
  | { status: 'dismissed' }

/**
 * Opens Razorpay Checkout for an order and reports the verified outcome.
 *
 * "paid" is only returned when the Worker says so after checking the
 * signature and the payment with Razorpay. A closed or failed checkout asks
 * the Worker to re-check, so a payment that went through just as the window
 * closed is still picked up.
 */
export async function runOrderPayment(orderId: string, session?: PaymentSession | null): Promise<PaymentRunResult> {
  let payment = session ?? null
  if (!payment) {
    const { data } = await bff<{ payment: PaymentSession | null }>(
      `/api/orders/${encodeURIComponent(orderId)}/pay`,
      { method: 'POST', body: {} },
    )
    payment = data.payment
  }
  if (!payment) return { status: 'failed', message: 'Online payment is not available right now.' }

  let result
  try {
    result = await openRazorpayCheckout(payment)
  } catch (error) {
    return { status: 'failed', message: errorMessage(error, (error as Error)?.message || 'Payment could not start.') }
  }

  if (result.type === 'success') {
    try {
      const { data } = await bff<{ outcome: string; order: Order | null }>(
        `/api/orders/${encodeURIComponent(orderId)}/verify`,
        { method: 'POST', body: result.response },
      )
      if (data.outcome === 'PAID' || data.outcome === 'ALREADY_PAID') return { status: 'paid', order: data.order }
      if (data.outcome === 'FAILED') return { status: 'failed', message: 'The payment did not go through.' }
      return {
        status: 'confirming',
        order: data.order,
        message: 'Your payment is being confirmed with the bank. This page will update shortly.',
      }
    } catch (error) {
      return {
        status: 'confirming',
        order: null,
        message: errorMessage(error, 'Your payment is being confirmed. This page will update shortly.'),
      }
    }
  }

  // Closed or failed: let the Worker look at Razorpay's record of the attempt.
  const synced = await bff<{ order: Order | null }>(`/api/orders/${encodeURIComponent(orderId)}/sync`, {
    method: 'POST',
    body: {},
  }).catch(() => null)
  const order = synced?.data.order ?? null
  if (order?.paymentStatus === 'PAID') return { status: 'paid', order }
  return result.type === 'failed' ? { status: 'failed', message: result.message } : { status: 'dismissed' }
}
