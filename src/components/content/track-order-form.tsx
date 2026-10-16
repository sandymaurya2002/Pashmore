'use client'

import * as React from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input, FieldError, FieldLabel } from '@/components/ui/input'
import { OrderStatusChip } from '@/components/account/order-status-chip'
import { ApiError } from '@/lib/api/envelope'
import { bff, errorMessage } from '@/lib/api/browser'
import { site } from '@/lib/site'
import { formatDate, pluralise } from '@/lib/utils'
import type { OrderStatus } from '@/types'

const schema = z.object({
  orderNumber: z
    .string()
    .trim()
    .regex(/^PSH-\d{6}$/i, 'Order numbers look like PSH-104287.'),
  email: z.string().trim().email('Please enter the email address you ordered with.'),
})

interface TrackedOrder {
  number: string
  status: OrderStatus
  placedAt: string
  itemCount: number
  trackingNumber?: string
  carrier?: string
  estimatedDelivery?: string
}

type Status =
  | { kind: 'idle' }
  | { kind: 'pending' }
  | { kind: 'found'; order: TrackedOrder }
  | { kind: 'notFound' }
  | { kind: 'error'; message: string }

export function TrackOrderForm() {
  const [values, setValues] = React.useState({ orderNumber: '', email: '' })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [status, setStatus] = React.useState<Status>({ kind: 'idle' })

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = schema.safeParse(values)

    if (!result.success) {
      const next: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        if (!next[key]) next[key] = issue.message
      }
      setErrors(next)
      setStatus({ kind: 'idle' })
      return
    }

    setErrors({})
    setStatus({ kind: 'pending' })
    try {
      const { data } = await bff<{ order: TrackedOrder | null }>('/api/orders/track', {
        method: 'POST',
        body: result.data,
      })
      setStatus(data.order ? { kind: 'found', order: data.order } : { kind: 'notFound' })
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) {
        setStatus({ kind: 'notFound' })
      } else {
        if (error instanceof ApiError && error.details) setErrors(error.details)
        setStatus({
          kind: 'error',
          message: errorMessage(error, 'Order lookup is unavailable right now.'),
        })
      }
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate className="mt-10 flex flex-col gap-5">
        <div>
          <FieldLabel htmlFor="orderNumber">Order number</FieldLabel>
          <Input
            id="orderNumber"
            placeholder="PSH-104287"
            value={values.orderNumber}
            onChange={(event) =>
              setValues((v) => ({ ...v, orderNumber: event.target.value }))
            }
            aria-invalid={errors.orderNumber ? true : undefined}
          />
          <FieldError>{errors.orderNumber}</FieldError>
        </div>

        <div>
          <FieldLabel htmlFor="track-email">Email address</FieldLabel>
          <Input
            id="track-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setValues((v) => ({ ...v, email: event.target.value }))}
            aria-invalid={errors.email ? true : undefined}
          />
          <FieldError>{errors.email}</FieldError>
        </div>

        <Button
          type="submit"
          size="lg"
          className="mt-2 h-13"
          disabled={status.kind === 'pending'}
        >
          {status.kind === 'pending' ? 'Looking up…' : 'Track Order'}
        </Button>
      </form>

      {status.kind === 'found' && (
        <div role="status" className="mt-6 border border-line bg-cream/40 px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-serif text-lg text-charcoal">{status.order.number}</p>
            <OrderStatusChip status={status.order.status} />
          </div>
          <p className="mt-2 text-xs text-taupe">
            {status.order.placedAt ? `Placed ${formatDate(status.order.placedAt)} · ` : ''}
            {status.order.itemCount} {pluralise(status.order.itemCount, 'item')}
          </p>
          {status.order.trackingNumber && (
            <p className="mt-3 text-sm text-charcoal">
              Tracking number <span className="tabular-nums">{status.order.trackingNumber}</span>
              {status.order.carrier && <span className="text-mocha"> · {status.order.carrier}</span>}
            </p>
          )}
          {status.order.estimatedDelivery && (
            <p className="mt-1 text-xs text-taupe">
              Estimated delivery {formatDate(status.order.estimatedDelivery)}
            </p>
          )}
        </div>
      )}

      {(status.kind === 'notFound' || status.kind === 'error') && (
        <p role="status" className="mt-6 border border-line bg-cream/40 px-5 py-4 text-sm text-mocha">
          {status.kind === 'notFound'
            ? 'No order matches that order number and email address. Please check both and try again, or contact '
            : `${status.message} Please try again shortly, or contact `}
          <a href={`mailto:${site.email}`} className="link-underline text-charcoal">
            {site.email}
          </a>{' '}
          and we will find it for you.
        </p>
      )}
    </>
  )
}
