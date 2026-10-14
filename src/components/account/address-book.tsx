'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input, FieldError, FieldLabel } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/context/toast-context'
import { isSessionError } from '@/context/session-context'
import { ApiError } from '@/lib/api/envelope'
import { bff, errorMessage } from '@/lib/api/browser'
import { COUNTRIES, countryCode, countryName, HOME_COUNTRY, isIndia } from '@/lib/region'
import { useRegion } from '@/context/region-context'
import type { Address, AddressInput } from '@/types'

const EMPTY: AddressInput = {
  label: 'Home',
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
  phone: '',
  isDefault: false,
}

/** Mirrors the Worker's rules: Indian addresses need a PIN and state; others a postcode. */
function validate(input: AddressInput): Record<string, string> {
  const errors: Record<string, string> = {}
  if (input.fullName.trim().length < 2) errors.fullName = 'Please enter the full name.'
  if (input.line1.trim().length < 4) errors.line1 = 'Please enter the address.'
  if (input.city.trim().length < 2) errors.city = 'Please enter the city.'
  if (isIndia(input.country)) {
    if (input.state.trim().length < 2) errors.state = 'Please enter the state.'
    if (!/^[0-9]{6}$/.test(input.postalCode.trim())) {
      errors.postalCode = 'Please enter a valid 6-digit PIN code.'
    }
    if (!/^[0-9+\-\s]{10,15}$/.test(input.phone.trim())) {
      errors.phone = 'Please enter a valid phone number.'
    }
  } else {
    if (!/^[A-Za-z0-9][A-Za-z0-9 -]{1,11}$/.test(input.postalCode.trim())) {
      errors.postalCode = 'Please enter a valid postal code.'
    }
    if (!/^\+?[0-9][0-9\-\s().]{5,22}$/.test(input.phone.trim())) {
      errors.phone = 'Please enter a valid phone number, with the country code.'
    }
  }
  return errors
}

export function AddressBook({ initialAddresses }: { initialAddresses: Address[] }) {
  const { toast } = useToast()
  const router = useRouter()
  const { region } = useRegion()
  const [addresses, setAddresses] = React.useState(initialAddresses)
  const [editing, setEditing] = React.useState<'new' | string | null>(null)
  const [form, setForm] = React.useState<AddressInput>(EMPTY)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [busy, setBusy] = React.useState<string | null>(null)

  React.useEffect(() => setAddresses(initialAddresses), [initialAddresses])

  async function reload() {
    const { data } = await bff<{ addresses: Address[] }>('/api/account/addresses')
    setAddresses(data.addresses)
  }

  function handleError(error: unknown, title: string) {
    if (isSessionError(error)) {
      router.replace('/login?next=/account/addresses')
      return
    }
    if (error instanceof ApiError && error.details) setErrors(error.details)
    toast({ title, description: errorMessage(error, 'Please try again.'), tone: 'error' })
  }

  function startEdit(address?: Address) {
    setErrors({})
    if (address) {
      const { id, ...rest } = address
      setForm({ ...EMPTY, ...rest, line2: rest.line2 ?? '' })
      setEditing(id)
    } else {
      setForm({
        ...EMPTY,
        country: countryName(region?.country ?? HOME_COUNTRY),
        isDefault: addresses.length === 0,
      })
      setEditing('new')
    }
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    const next = validate(form)
    setErrors(next)
    if (Object.keys(next).length) return

    setBusy('save')
    try {
      if (editing === 'new') {
        await bff('/api/account/addresses', { method: 'POST', body: form })
      } else if (editing) {
        await bff(`/api/account/addresses/${encodeURIComponent(editing)}`, {
          method: 'PATCH',
          body: form,
        })
      }
      await reload()
      setEditing(null)
      toast({ title: 'Address saved' })
    } catch (error) {
      handleError(error, 'Address not saved')
    } finally {
      setBusy(null)
    }
  }

  async function onRemove(address: Address) {
    setBusy(address.id)
    try {
      await bff(`/api/account/addresses/${encodeURIComponent(address.id)}`, { method: 'DELETE' })
      await reload()
      toast({ title: 'Address removed', tone: 'info' })
    } catch (error) {
      handleError(error, 'Address not removed')
    } finally {
      setBusy(null)
    }
  }

  async function onMakeDefault(address: Address) {
    setBusy(address.id)
    try {
      await bff(`/api/account/addresses/${encodeURIComponent(address.id)}/default`, {
        method: 'POST',
      })
      await reload()
    } catch (error) {
      handleError(error, 'Default not updated')
    } finally {
      setBusy(null)
    }
  }

  function field(name: keyof AddressInput, label: string, props: React.ComponentProps<typeof Input> = {}) {
    return (
      <div className={props.className}>
        <FieldLabel htmlFor={`address-${name}`}>{label}</FieldLabel>
        <Input
          {...props}
          className={undefined}
          id={`address-${name}`}
          value={String(form[name] ?? '')}
          onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
          aria-invalid={errors[name] ? true : undefined}
        />
        <FieldError>{errors[name]}</FieldError>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl text-charcoal">Saved Addresses</h2>
        {editing === null && (
          <Button variant="outline" size="sm" onClick={() => startEdit()}>
            Add Address
          </Button>
        )}
      </div>

      {editing !== null && (
        <form onSubmit={onSave} noValidate className="mt-8 border border-line p-6">
          <h3 className="eyebrow mb-6 text-taupe">
            {editing === 'new' ? 'New address' : 'Edit address'}
          </h3>
          <div className="grid gap-5 sm:grid-cols-2">
            {field('label', 'Label', { placeholder: 'Home, Office…' })}
            {field('fullName', 'Full name', { autoComplete: 'name' })}
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="address-country">Country</FieldLabel>
              <select
                id="address-country"
                value={countryCode(form.country) ?? HOME_COUNTRY}
                onChange={(event) =>
                  setForm((current) => ({ ...current, country: countryName(event.target.value) }))
                }
                autoComplete="country"
                className="h-12 w-full border border-line-strong bg-transparent px-4 text-sm text-charcoal focus:border-charcoal focus:outline-none"
              >
                {COUNTRIES.map((entry) => (
                  <option key={entry.code} value={entry.code}>
                    {entry.name}
                  </option>
                ))}
              </select>
              <FieldError>{errors.country}</FieldError>
            </div>
            {field('line1', 'Address', { autoComplete: 'address-line1', className: 'sm:col-span-2' })}
            {field('line2', 'Apartment, landmark (optional)', {
              autoComplete: 'address-line2',
              className: 'sm:col-span-2',
            })}
            {field('city', 'City', { autoComplete: 'address-level2' })}
            {field('state', isIndia(form.country) ? 'State' : 'State / province / region', {
              autoComplete: 'address-level1',
            })}
            {isIndia(form.country)
              ? field('postalCode', 'PIN code', { autoComplete: 'postal-code', inputMode: 'numeric' })
              : field('postalCode', 'Postal code', { autoComplete: 'postal-code' })}
            {field('phone', isIndia(form.country) ? 'Phone' : 'Phone (with country code)', {
              autoComplete: 'tel',
              type: 'tel',
            })}
          </div>

          <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm text-mocha">
            <Checkbox
              checked={Boolean(form.isDefault)}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, isDefault: checked === true }))
              }
            />
            Use as my default delivery address
          </label>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button type="submit" disabled={busy === 'save'}>
              {busy === 'save' ? 'Saving…' : 'Save Address'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {addresses.length === 0 && editing === null ? (
        <p className="mt-8 text-sm leading-relaxed text-mocha">
          You have no saved addresses yet. Add one to make checkout quicker.
        </p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id} className="border border-line p-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="eyebrow text-taupe">{address.label}</p>
                {address.isDefault && (
                  <span className="text-[0.625rem] uppercase tracking-[0.14em] text-gold">
                    Default
                  </span>
                )}
              </div>

              <address className="mt-4 text-sm not-italic leading-relaxed text-mocha">
                <span className="text-charcoal">{address.fullName}</span>
                <br />
                {address.line1}
                <br />
                {address.line2 && (
                  <>
                    {address.line2}
                    <br />
                  </>
                )}
                {address.city}, {address.state} {address.postalCode}
                <br />
                {address.country}
                <br />
                {address.phone}
              </address>

              <div className="mt-5 flex flex-wrap gap-5">
                <button
                  type="button"
                  onClick={() => startEdit(address)}
                  disabled={busy !== null}
                  className="text-[0.6875rem] uppercase tracking-[0.14em] text-charcoal underline underline-offset-4 hover:text-gold disabled:opacity-50"
                >
                  Edit
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => onMakeDefault(address)}
                    disabled={busy !== null}
                    className="text-[0.6875rem] uppercase tracking-[0.14em] text-charcoal underline underline-offset-4 hover:text-gold disabled:opacity-50"
                  >
                    Make default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(address)}
                  disabled={busy !== null}
                  className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline underline-offset-4 hover:text-burgundy disabled:opacity-50"
                >
                  {busy === address.id ? 'Working…' : 'Remove'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
