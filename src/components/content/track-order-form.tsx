'use client'

import * as React from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input, FieldError, FieldLabel } from '@/components/ui/input'

const schema = z.object({
  orderNumber: z
    .string()
    .regex(/^PSH-\d{6}$/i, 'Order numbers look like PSH-104287.'),
  email: z.string().email('Please enter the email address you ordered with.'),
})

export function TrackOrderForm() {
  const [values, setValues] = React.useState({ orderNumber: '', email: '' })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [status, setStatus] = React.useState<'idle' | 'pending' | 'notFound'>('idle')

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
      setStatus('idle')
      return
    }

    setErrors({})
    setStatus('pending')
    // Demo build: no order lookup service is connected, so every valid-looking
    // reference resolves to "not found" rather than inventing a status.
    await new Promise((resolve) => setTimeout(resolve, 700))
    setStatus('notFound')
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

        <Button type="submit" size="lg" className="mt-2 h-13" disabled={status === 'pending'}>
          {status === 'pending' ? 'Looking up…' : 'Track Order'}
        </Button>
      </form>

      {status === 'notFound' && (
        <p role="status" className="mt-6 border border-line bg-cream/40 px-5 py-4 text-sm text-mocha">
          No order matches those details in this demo build — order lookup connects to your
          commerce backend. Contact{' '}
          <a href="mailto:care@pashmore.com" className="link-underline text-charcoal">
            care@pashmore.com
          </a>{' '}
          and we will find it for you.
        </p>
      )}
    </>
  )
}
