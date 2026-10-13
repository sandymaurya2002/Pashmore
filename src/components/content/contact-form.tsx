'use client'

import * as React from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input, Textarea, FieldError, FieldLabel } from '@/components/ui/input'
import { ApiError } from '@/lib/api/envelope'
import { bff, errorMessage } from '@/lib/api/browser'

const schema = z.object({
  name: z.string().min(2, 'Please enter your name.'),
  email: z.string().email('Please enter a valid email address.'),
  subject: z.string().min(3, 'Please give your message a subject.'),
  message: z.string().min(20, 'Please give us a little more detail — at least 20 characters.'),
})

const SUBJECTS = [
  'Order enquiry',
  'Product question',
  'Returns or exchange',
  'Corporate gifting',
  'Commission',
  'Workshop visit',
  'Something else',
]

export function ContactForm() {
  const [values, setValues] = React.useState({
    name: '',
    email: '',
    subject: SUBJECTS[0],
    message: '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [status, setStatus] = React.useState<'idle' | 'pending' | 'sent'>('idle')
  const [formError, setFormError] = React.useState<string | null>(null)

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
      return
    }

    setErrors({})
    setFormError(null)
    setStatus('pending')
    try {
      await bff('/api/contact', { method: 'POST', body: result.data })
      setStatus('sent')
    } catch (error) {
      if (error instanceof ApiError && error.details) setErrors(error.details)
      setFormError(errorMessage(error, 'Your message could not be sent. Please try again.'))
      setStatus('idle')
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-gold/40 bg-gold/5 p-8">
        <h2 className="font-serif text-2xl text-charcoal">Message received</h2>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-mocha">
          Thank you. Our care team in Srinagar will reply within one working day. If it is
          urgent, call us on the number opposite.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="name">Your name</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => setValues((v) => ({ ...v, name: event.target.value }))}
            aria-invalid={errors.name ? true : undefined}
          />
          <FieldError>{errors.name}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="contact-email">Email</FieldLabel>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setValues((v) => ({ ...v, email: event.target.value }))}
            aria-invalid={errors.email ? true : undefined}
          />
          <FieldError>{errors.email}</FieldError>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="subject">Subject</FieldLabel>
        <select
          id="subject"
          value={values.subject}
          onChange={(event) => setValues((v) => ({ ...v, subject: event.target.value }))}
          className="h-11 w-full border border-line-strong bg-transparent px-4 text-sm text-charcoal transition-colors hover:border-taupe focus:border-charcoal focus:outline-none"
        >
          {SUBJECTS.map((subject) => (
            <option key={subject} value={subject}>
              {subject}
            </option>
          ))}
        </select>
      </div>

      <div>
        <FieldLabel htmlFor="message">Message</FieldLabel>
        <Textarea
          id="message"
          rows={7}
          value={values.message}
          onChange={(event) => setValues((v) => ({ ...v, message: event.target.value }))}
          aria-invalid={errors.message ? true : undefined}
        />
        <FieldError>{errors.message}</FieldError>
      </div>

      {formError && (
        <p role="alert" className="text-sm leading-relaxed text-burgundy">
          {formError}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="mt-2 h-13 self-start px-12"
        disabled={status === 'pending'}
      >
        {status === 'pending' ? 'Sending…' : 'Send Message'}
      </Button>
    </form>
  )
}
