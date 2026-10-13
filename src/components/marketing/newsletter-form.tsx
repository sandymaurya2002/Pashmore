'use client'

import * as React from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input, FieldError } from '@/components/ui/input'
import { subscribeToNewsletter } from '@/services/newsletter'

const schema = z.object({
  email: z.string().email('Please enter a valid email address.'),
})

export function NewsletterForm() {
  const [email, setEmail] = React.useState('')
  const [status, setStatus] = React.useState<'idle' | 'pending' | 'done'>('idle')
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = schema.safeParse({ email })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please check your email address.')
      return
    }

    setError(null)
    setStatus('pending')
    const result = await subscribeToNewsletter(parsed.data.email)
    if (result.ok) {
      setStatus('done')
      setEmail('')
    } else {
      setStatus('idle')
      setError(result.message)
    }
  }

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="container-luxe py-20 lg:py-28"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <p className="eyebrow text-gold">Newsletter</p>
        <h2
          id="newsletter-heading"
          className="mt-5 font-serif text-[2.25rem] leading-[1.1] text-charcoal md:text-[3rem]"
        >
          Enter the World of Pashmore
        </h2>
        <p className="mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-mocha">
          Be the first to discover new collections, stories and exclusive offers.
        </p>

        {status === 'done' ? (
          <p
            role="status"
            className="mt-9 border border-gold/40 bg-gold/5 px-6 py-4 text-sm text-charcoal"
          >
            Thank you — you are on the list. A welcome note is on its way to your inbox.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            noValidate
            className="mt-9 flex w-full max-w-lg flex-col gap-3 sm:flex-row"
          >
            <div className="flex-1 text-left">
              <label htmlFor="newsletter-email" className="sr-only">
                Your email address
              </label>
              <Input
                id="newsletter-email"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Your email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'newsletter-error' : undefined}
                className="border-charcoal/20 bg-ivory"
              />
              <span id="newsletter-error">
                <FieldError>{error}</FieldError>
              </span>
            </div>
            <Button type="submit" disabled={status === 'pending'} className="sm:w-40">
              {status === 'pending' ? 'Joining…' : 'Join Us'}
            </Button>
          </form>
        )}

        <p className="mt-5 text-xs text-taupe">
          By subscribing you agree to our{' '}
          <Link href="/privacy" className="link-underline text-charcoal/85">
            privacy policy
          </Link>
          . Unsubscribe at any time.
        </p>
      </div>
    </section>
  )
}
