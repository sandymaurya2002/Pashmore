'use client'

import type { PaymentSession } from '@/types'

/**
 * Razorpay Checkout (https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/).
 *
 * The browser only ever receives the public key id and the Razorpay order id
 * created by the Worker. What Checkout hands back on success is *not* proof of
 * payment: it is sent to the Worker, which checks the signature with the
 * secret key and fetches the payment from Razorpay before marking the order
 * paid. The webhook does the same independently if this page is closed.
 */

const SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js'

export interface RazorpaySuccess {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

export type CheckoutResult =
  | { type: 'success'; response: RazorpaySuccess }
  | { type: 'dismissed' }
  | { type: 'failed'; message: string }

interface RazorpayInstance {
  open(): void
  on(event: 'payment.failed', handler: (response: { error?: { description?: string; reason?: string } }) => void): void
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

let loading: Promise<RazorpayConstructor> | null = null

export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Razorpay needs a browser.'))
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  loading ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () =>
      window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay did not load.'))
    script.onerror = () => {
      loading = null
      script.remove()
      reject(new Error('Razorpay could not be loaded. Check your connection and try again.'))
    }
    document.body.appendChild(script)
  })
  return loading
}

/** Opens Checkout and resolves once the customer pays, gives up, or closes it. */
export async function openRazorpayCheckout(session: PaymentSession): Promise<CheckoutResult> {
  const Razorpay = await loadRazorpay()
  return new Promise<CheckoutResult>((resolve) => {
    let settled = false
    let lastFailure: string | null = null
    const settle = (result: CheckoutResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const instance = new Razorpay({
      key: session.keyId,
      order_id: session.razorpayOrderId,
      amount: session.amount,
      currency: session.currency,
      name: session.name,
      description: session.description,
      prefill: session.prefill,
      notes: { order_number: session.orderNumber },
      theme: { color: '#1f1a17' },
      retry: { enabled: true, max_count: 3 },
      ...(session.expiresAt
        ? { timeout: Math.max(60, Math.floor((Date.parse(session.expiresAt) - Date.now()) / 1000)) }
        : {}),
      handler: (response: {
        razorpay_order_id: string
        razorpay_payment_id: string
        razorpay_signature: string
      }) =>
        settle({
          type: 'success',
          response: {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          },
        }),
      modal: {
        confirm_close: true,
        // Razorpay keeps the modal open after a failed attempt so the customer
        // can retry; only report failure once they close it.
        ondismiss: () =>
          settle(lastFailure ? { type: 'failed', message: lastFailure } : { type: 'dismissed' }),
      },
    })
    instance.on('payment.failed', (response) => {
      lastFailure =
        response.error?.description || response.error?.reason || 'The payment did not go through.'
    })
    instance.open()
  })
}
