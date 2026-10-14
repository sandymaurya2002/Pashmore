'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { FieldLabel, Textarea } from '@/components/ui/input'
import { isSessionError } from '@/context/session-context'
import { useToast } from '@/context/toast-context'
import { bff, errorMessage } from '@/lib/api/browser'
import { runOrderPayment } from '@/lib/order-payment'
import { formatDate } from '@/lib/utils'

interface OrderActionsProps {
  orderId: string
  awaitingPayment: boolean
  paymentExpiresAt?: string
  canCancel: boolean
  canReturn: boolean
  /** The order is paid online but still waiting on the gateway's confirmation. */
  confirming: boolean
}

/**
 * Pay now / cancel / request a return. Every action is checked again by the
 * Worker; these buttons only appear when the API says the action is allowed.
 */
export function OrderActions({
  orderId,
  awaitingPayment,
  paymentExpiresAt,
  canCancel,
  canReturn,
  confirming,
}: OrderActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = React.useState<'pay' | 'cancel' | 'return' | null>(null)
  const [panel, setPanel] = React.useState<'cancel' | 'return' | null>(null)
  const [reason, setReason] = React.useState('')
  const path = `/api/orders/${encodeURIComponent(orderId)}`

  // While a payment is being confirmed, re-check every few seconds (webhook or sync).
  React.useEffect(() => {
    if (!confirming) return
    let attempts = 0
    const timer = setInterval(async () => {
      attempts += 1
      await bff(`${path}/sync`, { method: 'POST', body: {} }).catch(() => null)
      router.refresh()
      if (attempts >= 6) clearInterval(timer)
    }, 5000)
    return () => clearInterval(timer)
  }, [confirming, path, router])

  function handleError(error: unknown, title: string) {
    if (isSessionError(error)) {
      router.replace(`/login?next=/account/orders/${orderId}`)
      return
    }
    toast({ title, description: errorMessage(error, 'Please try again.'), tone: 'error' })
  }

  async function pay() {
    setBusy('pay')
    try {
      const result = await runOrderPayment(orderId)
      if (result.status === 'paid') {
        toast({ title: 'Payment received', description: 'Thank you — your order is confirmed.' })
      } else if (result.status === 'confirming') {
        toast({ title: 'Confirming your payment', description: result.message, tone: 'info' })
      } else if (result.status === 'failed') {
        toast({ title: 'Payment not completed', description: result.message, tone: 'error' })
      }
      router.refresh()
    } catch (error) {
      handleError(error, 'Payment could not start')
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  async function submit(kind: 'cancel' | 'return') {
    if (kind === 'return' && reason.trim().length < 3) {
      toast({ title: 'Please tell us why you’re returning it', tone: 'error' })
      return
    }
    setBusy(kind)
    try {
      await bff(`${path}/${kind}`, { method: 'POST', body: { reason: reason.trim() || undefined } })
      toast({
        title: kind === 'cancel' ? 'Order cancelled' : 'Return requested',
        description:
          kind === 'cancel'
            ? 'If you paid online, your refund is on its way to the original payment method.'
            : 'Our team will contact you to arrange collection.',
      })
      setPanel(null)
      setReason('')
      router.refresh()
    } catch (error) {
      handleError(error, kind === 'cancel' ? 'Could not cancel' : 'Could not request a return')
    } finally {
      setBusy(null)
    }
  }

  if (!awaitingPayment && !canCancel && !canReturn) return null

  return (
    <div className="mt-6 border border-line p-5">
      <div className="flex flex-wrap items-center gap-3">
        {awaitingPayment && (
          <Button onClick={() => void pay()} disabled={busy !== null}>
            {busy === 'pay' ? 'Opening payment…' : 'Pay Now'}
          </Button>
        )}
        {canCancel && (
          <Button
            variant="outline"
            onClick={() => setPanel(panel === 'cancel' ? null : 'cancel')}
            disabled={busy !== null}
          >
            Cancel Order
          </Button>
        )}
        {canReturn && (
          <Button
            variant="outline"
            onClick={() => setPanel(panel === 'return' ? null : 'return')}
            disabled={busy !== null}
          >
            Request a Return
          </Button>
        )}
      </div>
      {awaitingPayment && paymentExpiresAt && (
        <p className="mt-3 text-xs text-taupe">
          Complete payment by {formatDate(paymentExpiresAt)}{' '}
          {new Date(paymentExpiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}, after
          which the order is released.
        </p>
      )}

      {panel && (
        <div className="mt-5 border-t border-line pt-5">
          <FieldLabel htmlFor="order-reason">
            {panel === 'cancel' ? 'Reason (optional)' : 'Why are you returning it?'}
          </FieldLabel>
          <Textarea
            id="order-reason"
            rows={3}
            maxLength={panel === 'cancel' ? 500 : 1000}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={busy !== null}
          />
          <p className="mt-2 text-xs text-taupe">
            {panel === 'cancel'
              ? 'Cancelling releases the pieces. Online payments are refunded to the original method.'
              : 'Pieces must be unworn, with tags and packaging intact.'}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => void submit(panel)} disabled={busy !== null}>
              {busy === panel ? 'Working…' : panel === 'cancel' ? 'Confirm Cancellation' : 'Submit Return Request'}
            </Button>
            <Button variant="ghost" onClick={() => setPanel(null)} disabled={busy !== null}>
              Keep Order
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
