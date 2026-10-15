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
  /** The order was confirmed paid (webhook or sync) while Checkout was still open. */
  | { type: 'paid' }
  | { type: 'dismissed' }
  | { type: 'failed'; message: string }

export interface CheckoutOptions {
  /**
   * Polled while Checkout is open. UPI QR / intent payments can complete on the
   * phone without Checkout ever calling `handler`, which leaves the modal
   * stuck on "Scan the QR"; when this reports the order paid, Checkout is
   * closed and the result is `paid`. `attempt` is 0 when the customer presses
   * Continue.
   */
  isPaid?: (attempt: number) => Promise<boolean>
  pollIntervalMs?: number
}

/**
 * Desktop Checkout shows UPI as a QR code with no button of its own, so a
 * customer who has paid on their phone gets a Continue button beside it.
 */
export interface ContinuePrompt {
  checking: boolean
  notice: string | null
  confirm: () => void
}

let continuePrompt: ContinuePrompt | null = null
const promptListeners = new Set<() => void>()

function setContinuePrompt(next: ContinuePrompt | null) {
  continuePrompt = next
  promptListeners.forEach((listener) => listener())
}

export function subscribeContinuePrompt(listener: () => void) {
  promptListeners.add(listener)
  return () => {
    promptListeners.delete(listener)
  }
}

export function getContinuePrompt() {
  return continuePrompt
}

interface RazorpayInstance {
  open(): void
  close(): void
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
export async function openRazorpayCheckout(
  session: PaymentSession,
  options: CheckoutOptions = {},
): Promise<CheckoutResult> {
  const Razorpay = await loadRazorpay()
  return new Promise<CheckoutResult>((resolve) => {
    let settled = false
    let lastFailure: string | null = null
    let poll: ReturnType<typeof setTimeout> | null = null
    const settle = (result: CheckoutResult) => {
      if (settled) return
      settled = true
      if (poll) clearTimeout(poll)
      setContinuePrompt(null)
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

    const { isPaid, pollIntervalMs = 4000 } = options
    if (!isPaid) return
    const finishPaid = () => {
      settle({ type: 'paid' })
      try {
        instance.close()
      } catch {
        // Checkout may already be tearing itself down.
      }
    }
    let attempt = 0
    const check = async () => {
      if (settled) return
      attempt += 1
      const paid = await isPaid(attempt).catch(() => false)
      if (settled) return
      if (paid) {
        finishPaid()
        return
      }
      poll = setTimeout(check, pollIntervalMs)
    }
    poll = setTimeout(check, pollIntervalMs)

    if (session.currency !== 'INR') return
    const checkNow = async () => {
      if (settled || continuePrompt?.checking) return
      setContinuePrompt({ checking: true, notice: null, confirm })
      const paid = await isPaid(0).catch(() => false)
      if (settled) return
      if (paid) {
        finishPaid()
        return
      }
      setContinuePrompt({
        checking: false,
        notice: 'We haven’t received your payment yet. If you’ve just paid, wait a few seconds and try again.',
        confirm,
      })
    }
    const confirm = () => void checkNow()
    setContinuePrompt({ checking: false, notice: null, confirm })
  })
}
