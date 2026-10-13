'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input, FieldError, FieldLabel } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/context/toast-context'
import { isSessionError, useSession } from '@/context/session-context'
import { ApiError } from '@/lib/api/envelope'
import { bff, errorMessage } from '@/lib/api/browser'
import type { Customer } from '@/types'

export function ProfileForm({ customer }: { customer: Customer }) {
  const { toast } = useToast()
  const { setCustomer } = useSession()
  const router = useRouter()
  const [form, setForm] = React.useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone ?? '',
    newsletter: customer.acceptsMarketing,
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [saving, setSaving] = React.useState(false)

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (form.firstName.trim().length < 2) next.firstName = 'Please enter your first name.'
    if (!form.lastName.trim()) next.lastName = 'Please enter your last name.'
    if (form.phone.trim() && !/^[0-9+\-\s]{10,15}$/.test(form.phone.trim())) {
      next.phone = 'Please enter a valid phone number.'
    }
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      const { data } = await bff<{ customer: Customer }>('/api/account/profile', {
        method: 'PATCH',
        body: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || null,
          acceptsMarketing: form.newsletter,
        },
      })
      setCustomer({ ...customer, ...data.customer, createdAt: customer.createdAt })
      toast({ title: 'Profile saved' })
      router.refresh()
    } catch (error) {
      if (isSessionError(error)) {
        router.replace('/login?next=/account/profile')
        return
      }
      if (error instanceof ApiError && error.details) setErrors(error.details)
      toast({
        title: 'Profile not saved',
        description: errorMessage(error, 'Please try again.'),
        tone: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 max-w-lg">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="firstName">First name</FieldLabel>
          <Input
            id="firstName"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(event) => setForm((f) => ({ ...f, firstName: event.target.value }))}
            aria-invalid={errors.firstName ? true : undefined}
          />
          <FieldError>{errors.firstName}</FieldError>
        </div>
        <div>
          <FieldLabel htmlFor="lastName">Last name</FieldLabel>
          <Input
            id="lastName"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(event) => setForm((f) => ({ ...f, lastName: event.target.value }))}
            aria-invalid={errors.lastName ? true : undefined}
          />
          <FieldError>{errors.lastName}</FieldError>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" value={customer.email} readOnly disabled />
          <p className="mt-1.5 text-xs text-taupe">
            To change the email on your account, please contact us.
          </p>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
            aria-invalid={errors.phone ? true : undefined}
          />
          <FieldError>{errors.phone}</FieldError>
        </div>
      </div>

      <label className="mt-7 flex cursor-pointer items-start gap-3 text-sm text-mocha">
        <Checkbox
          checked={form.newsletter}
          onCheckedChange={(checked) =>
            setForm((f) => ({ ...f, newsletter: checked === true }))
          }
          className="mt-0.5"
        />
        Send me the Pashmore journal and news of new collections.
      </label>

      <Button
        type="submit"
        size="lg"
        className="mt-9 h-13 w-full sm:w-auto sm:px-12"
        disabled={saving}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}
