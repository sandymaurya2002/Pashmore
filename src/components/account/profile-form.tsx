'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input, FieldLabel } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/context/toast-context'
import type { Customer } from '@/types'

export function ProfileForm({ customer }: { customer: Customer }) {
  const { toast } = useToast()
  const [form, setForm] = React.useState({
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone ?? '',
    newsletter: true,
  })

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    // Demo build: no persistence layer. Wire `services/account` to your API and
    // this becomes an await plus an error branch.
    toast({
      title: 'Profile saved',
      description: 'Demo mode — changes are not persisted.',
      tone: 'info',
    })
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 max-w-lg">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="firstName">First name</FieldLabel>
          <Input
            id="firstName"
            autoComplete="given-name"
            value={form.firstName}
            onChange={(event) => setForm((f) => ({ ...f, firstName: event.target.value }))}
          />
        </div>
        <div>
          <FieldLabel htmlFor="lastName">Last name</FieldLabel>
          <Input
            id="lastName"
            autoComplete="family-name"
            value={form.lastName}
            onChange={(event) => setForm((f) => ({ ...f, lastName: event.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((f) => ({ ...f, email: event.target.value }))}
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="phone">Phone</FieldLabel>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(event) => setForm((f) => ({ ...f, phone: event.target.value }))}
          />
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

      <Button type="submit" size="lg" className="mt-9 h-13 w-full sm:w-auto sm:px-12">
        Save Changes
      </Button>
    </form>
  )
}
