'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Lock, ShoppingBag } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Input, FieldError, FieldLabel, Textarea } from '@/components/ui/input'
import { OrderSummary } from '@/components/cart/order-summary'
import { TrustBar } from '@/components/marketing/trust-bar'
import { useCart } from '@/context/cart-context'
import { isSessionError, useSession } from '@/context/session-context'
import { useToast } from '@/context/toast-context'
import { ApiError } from '@/lib/api/envelope'
import { bff, errorMessage } from '@/lib/api/browser'
import { runOrderPayment } from '@/lib/order-payment'
import {
  COUNTRIES,
  countryCode,
  countryName,
  CURRENCY_SYMBOL,
  currencyForDestination,
  HOME_COUNTRY,
  type Currency,
} from '@/lib/region'
import { cn, formatPrice } from '@/lib/utils'
import { useRegion } from '@/context/region-context'
import type { Address, Order, PaymentSession } from '@/types'

interface CheckoutOptions {
  payments: { online: boolean; cod: boolean }
  /** The shopping region the bag is priced for. */
  region: { country: string; currency: Currency }
  commerce: {
    currency: Currency
    freeShippingThreshold: number
    standardShippingFee: number
    expressShippingFee: number
    codLimit: number
    returnWindowDays: number
  }
  addresses: Address[]
}

interface NewAddress {
  fullName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  /** ISO code; sent to the Worker as the English country name. */
  country: string
}

const EMPTY_ADDRESS: NewAddress = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: HOME_COUNTRY,
}

/** Mirrors the Worker's rules: Indian addresses need a PIN and state; others a postcode. */
function validateAddress(input: NewAddress): Record<string, string> {
  const errors: Record<string, string> = {}
  const india = input.country === HOME_COUNTRY
  if (input.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.'
  if (input.line1.trim().length < 4) errors.line1 = 'Please enter your address.'
  if (input.city.trim().length < 2) errors.city = 'Please enter your city.'
  if (india) {
    if (input.state.trim().length < 2) errors.state = 'Please enter your state.'
    if (!/^[0-9]{6}$/.test(input.postalCode.trim())) errors.postalCode = 'Please enter a valid 6-digit PIN code.'
    if (!/^[0-9+\-\s]{10,15}$/.test(input.phone.trim())) errors.phone = 'Please enter a valid phone number.'
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

function readDraft(): NewAddress | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    window.sessionStorage.removeItem(DRAFT_KEY)
    const parsed = JSON.parse(raw) as Partial<NewAddress>
    return { ...EMPTY_ADDRESS, ...parsed }
  } catch {
    return null
  }
}

function writeDraft(address: NewAddress) {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(address))
  } catch {
    /* storage unavailable: the customer re-enters the address */
  }
}

function clearDraft() {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* storage unavailable */
  }
}

function newIdempotencyKey(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** A new address survives the reload that switching region needs. */
const DRAFT_KEY = 'pashmore.checkout.address'

export function CheckoutFlow() {
  const { currency, items, totals, coupon, hydrated, error, reload } = useCart()
  const { status, customer } = useSession()
  const { setCountry, changing: switchingRegion } = useRegion()
  const { toast } = useToast()
  const router = useRouter()

  const [options, setOptions] = React.useState<CheckoutOptions | null>(null)
  const [optionsError, setOptionsError] = React.useState<string | null>(null)
  const [addressId, setAddressId] = React.useState<string | 'new'>('new')
  const [address, setAddress] = React.useState<NewAddress>(EMPTY_ADDRESS)
  const [shippingMethod, setShippingMethod] = React.useState<'standard' | 'express'>('standard')
  const [paymentMethod, setPaymentMethod] = React.useState<'RAZORPAY' | 'COD'>('RAZORPAY')
  const [note, setNote] = React.useState('')
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [stage, setStage] = React.useState<'idle' | 'placing' | 'paying' | 'redirecting'>('idle')
  // Placing the order empties the bag, so the summary keeps what was bought while payment runs.
  const [placed, setPlaced] = React.useState<{
    items: typeof items
    totals: typeof totals
    coupon: typeof coupon
    currency: Currency
  } | null>(null)
  const idempotencyKey = React.useRef<string | null>(null)

  const loadOptions = React.useCallback(async () => {
    setOptionsError(null)
    try {
      const { data } = await bff<CheckoutOptions>('/api/checkout')
      setOptions(data)
      const draft = readDraft()
      if (draft) {
        setAddress(draft)
        setAddressId('new')
      } else {
        setAddress((current) => ({ ...current, country: data.region.country }))
        const preferred = data.addresses.find((entry) => entry.isDefault) ?? data.addresses[0]
        setAddressId(preferred ? preferred.id : 'new')
      }
      if (!data.payments.online && data.payments.cod) setPaymentMethod('COD')
      if (!data.payments.cod) setPaymentMethod('RAZORPAY')
    } catch (reason) {
      if (isSessionError(reason)) {
        router.replace('/login?next=/checkout')
        return
      }
      setOptionsError(errorMessage(reason, 'Checkout could not be loaded.'))
    }
  }, [router])

  React.useEffect(() => {
    if (status === 'authenticated') void loadOptions()
  }, [status, loadOptions])

  React.useEffect(() => {
    if (customer) {
      setAddress((current) => ({
        ...current,
        fullName: current.fullName || `${customer.firstName} ${customer.lastName}`.trim(),
        phone: current.phone || customer.phone || '',
      }))
    }
  }, [customer])

  if (!hydrated || status === 'loading') {
    return (
      <div className="container-luxe py-20">
        <div className="skeleton h-96 w-full" />
      </div>
    )
  }

  if (error && !items.length) {
    return (
      <div className="container-luxe">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" strokeWidth={1} />}
          title="We couldn’t load your bag"
          description={error}
          action={
            <Button variant="outline" onClick={() => void reload()}>
              Try again
            </Button>
          }
        />
      </div>
    )
  }

  if (!items.length && stage === 'idle') {
    return (
      <div className="container-luxe">
        <EmptyState
          icon={<ShoppingBag className="h-6 w-6" strokeWidth={1} />}
          title="Your bag is empty"
          description="There is nothing to check out. Choose a piece and we will keep the box warm."
          actionHref="/collections/best-sellers"
          actionLabel="Shop Best Sellers"
        />
      </div>
    )
  }

  const hasUnavailable = items.some((item) => !item.inStock)
  const commerce = options?.commerce
  const shipping =
    shippingMethod === 'express' && commerce ? commerce.expressShippingFee : totals.shipping
  const shownTotals = { ...totals, shipping, total: totals.total - totals.shipping + shipping }
  const codAllowed = Boolean(options?.payments.cod) && (!commerce || shownTotals.total <= commerce.codLimit)
  const onlineAllowed = Boolean(options?.payments.online)
  const busy = stage !== 'idle' || switchingRegion

  // India is invoiced in rupees and everywhere else in dollars, so the delivery
  // country has to match the region the bag is priced for.
  const savedAddress = addressId === 'new' ? undefined : options?.addresses.find((entry) => entry.id === addressId)
  const destination = addressId === 'new' ? countryName(address.country) : savedAddress?.country
  const destinationCode = addressId === 'new' ? address.country : countryCode(savedAddress?.country)
  const destinationCurrency = currencyForDestination(destination)
  const regionMismatch = Boolean(options) && destination !== undefined && destinationCurrency !== currency

  function switchRegion() {
    if (addressId === 'new') writeDraft(address)
    void setCountry(destinationCode ?? (destinationCurrency === 'INR' ? HOME_COUNTRY : 'US'))
  }

  async function placeOrder() {
    if (!options) return
    setFormError(null)

    if (addressId === 'new') {
      const next = validateAddress(address)
      setErrors(next)
      if (Object.keys(next).length) {
        setFormError('Please check your delivery address.')
        return
      }
    }
    if (regionMismatch) {
      setFormError(
        `Orders delivered to ${destination} are priced in ${destinationCurrency}. Switch your shopping region to continue.`,
      )
      return
    }
    if (paymentMethod === 'COD' && !codAllowed) {
      setFormError('Cash on delivery is not available for this order. Please pay online.')
      return
    }
    if (paymentMethod === 'RAZORPAY' && !onlineAllowed) {
      setFormError('Online payment is not available right now.')
      return
    }

    idempotencyKey.current ??= newIdempotencyKey()
    setStage('placing')
    let order: Order | null = null
    let payment: PaymentSession | null = null
    try {
      const { data } = await bff<{ order: Order | null; payment: PaymentSession | null }>('/api/checkout', {
        method: 'POST',
        body: {
          idempotencyKey: idempotencyKey.current,
          shippingMethod,
          paymentMethod,
          currency,
          customerNote: note.trim() || undefined,
          ...(addressId === 'new'
            ? {
                address: {
                  ...address,
                  email: customer?.email ?? '',
                  country: countryName(address.country),
                },
              }
            : { addressId }),
        },
      })
      order = data.order
      payment = data.payment
    } catch (reason) {
      setStage('idle')
      if (isSessionError(reason)) {
        router.replace('/login?next=/checkout')
        return
      }
      // Nothing was created, so a corrected form may be submitted as a new attempt.
      idempotencyKey.current = null
      if (reason instanceof ApiError && reason.details) setErrors(reason.details)
      setFormError(errorMessage(reason, 'Your order could not be placed. Please try again.'))
      // The region changed (for example in another tab): show the bag in its new prices.
      if (reason instanceof ApiError && reason.code === 'CURRENCY_CHANGED') void loadOptions()
      void reload()
      return
    }

    clearDraft()
    // The order now exists and holds the stock; the bag has been emptied server-side.
    setPlaced({ items, totals: shownTotals, coupon, currency })
    void reload()
    if (!order) {
      router.push('/account/orders')
      return
    }
    const orderPath = `/account/orders/${encodeURIComponent(order.id)}`

    if (paymentMethod === 'COD' || !payment) {
      setStage('redirecting')
      router.push(`${orderPath}?placed=1`)
      return
    }

    setStage('paying')
    const result = await runOrderPayment(order.id, payment).catch((reason) => ({
      status: 'failed' as const,
      message: errorMessage(reason, 'Payment could not start.'),
    }))
    setStage('redirecting')
    if (result.status === 'paid') {
      router.push(`${orderPath}?placed=1`)
    } else if (result.status === 'confirming') {
      toast({ title: 'Confirming your payment', description: result.message, tone: 'info' })
      router.push(`${orderPath}?placed=1`)
    } else if (result.status === 'failed') {
      toast({ title: 'Payment not completed', description: result.message, tone: 'error' })
      router.push(`${orderPath}?payment=failed`)
    } else {
      router.push(`${orderPath}?payment=cancelled`)
    }
  }

  function addressField(name: keyof NewAddress, label: string, props: React.ComponentProps<typeof Input> = {}) {
    const { className, ...rest } = props
    return (
      <div className={className}>
        <FieldLabel htmlFor={`checkout-${name}`}>{label}</FieldLabel>
        <Input
          {...rest}
          id={`checkout-${name}`}
          value={address[name]}
          onChange={(event) => setAddress((current) => ({ ...current, [name]: event.target.value }))}
          aria-invalid={errors[name] ? true : undefined}
          disabled={busy}
        />
        <FieldError>{errors[name]}</FieldError>
      </div>
    )
  }

  return (
    <div className="container-luxe py-10 lg:py-14">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
        <section aria-labelledby="checkout-heading">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-taupe transition-colors hover:text-charcoal"
          >
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            Back to bag
          </Link>
          <h1
            id="checkout-heading"
            className="mt-5 font-serif text-[1.75rem] text-charcoal md:text-[2.25rem]"
          >
            Checkout
          </h1>

          {status !== 'authenticated' ? (
            <div className="mt-8 border border-line bg-cream/40 p-6 md:p-8">
              <p className="eyebrow flex items-center gap-2 text-gold">
                <Lock className="h-3 w-3" strokeWidth={1.5} aria-hidden />
                Secure checkout
              </p>
              <h2 className="mt-4 font-serif text-2xl text-charcoal">Sign in to place your order</h2>
              <p className="mt-4 max-w-lg text-[0.9375rem] leading-relaxed text-mocha">
                An account lets you follow your order, download your invoice and request a return.
                Your bag comes with you when you sign in.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-13 sm:px-10">
                  <Link href="/login?next=/checkout">Sign In</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-13 sm:px-10">
                  <Link href="/register?next=/checkout">Create an Account</Link>
                </Button>
              </div>
            </div>
          ) : optionsError ? (
            <div className="mt-8 border border-burgundy/30 bg-burgundy/5 p-6" role="alert">
              <p className="text-sm text-burgundy">{optionsError}</p>
              <Button variant="outline" className="mt-4" onClick={() => void loadOptions()}>
                Try again
              </Button>
            </div>
          ) : !options ? (
            <div className="skeleton mt-8 h-96 w-full" />
          ) : (
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault()
                void placeOrder()
              }}
              className="mt-8 flex flex-col gap-10"
            >
              {/* Delivery address */}
              <fieldset disabled={busy}>
                <legend className="eyebrow mb-5 text-taupe">1 · Delivery address</legend>
                {options.addresses.length > 0 && (
                  <div role="radiogroup" aria-label="Saved addresses" className="mb-5 grid gap-3 sm:grid-cols-2">
                    {options.addresses.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        role="radio"
                        aria-checked={addressId === entry.id}
                        onClick={() => setAddressId(entry.id)}
                        className={cn(
                          'border p-4 text-left text-sm transition-colors',
                          addressId === entry.id ? 'border-charcoal bg-cream/40' : 'border-line hover:border-taupe',
                        )}
                      >
                        <span className="eyebrow block text-taupe">{entry.label}</span>
                        <span className="mt-2 block text-charcoal">{entry.fullName}</span>
                        <span className="mt-1 block leading-relaxed text-mocha">
                          {entry.line1}
                          {entry.line2 ? `, ${entry.line2}` : ''}, {entry.city}, {entry.state}{' '}
                          {entry.postalCode}, {entry.country}
                        </span>
                        <span className="mt-1 block text-xs text-taupe">{entry.phone}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={addressId === 'new'}
                      onClick={() => setAddressId('new')}
                      className={cn(
                        'border border-dashed p-4 text-left text-sm transition-colors',
                        addressId === 'new' ? 'border-charcoal bg-cream/40' : 'border-line hover:border-taupe',
                      )}
                    >
                      <span className="text-charcoal">Deliver to a new address</span>
                    </button>
                  </div>
                )}

                {addressId === 'new' && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FieldLabel htmlFor="checkout-country">Country</FieldLabel>
                      <select
                        id="checkout-country"
                        value={address.country}
                        onChange={(event) => setAddress((current) => ({ ...current, country: event.target.value }))}
                        autoComplete="country"
                        disabled={busy}
                        className="h-12 w-full border border-line-strong bg-transparent px-4 text-sm text-charcoal focus:border-charcoal focus:outline-none disabled:opacity-60"
                      >
                        {COUNTRIES.map((entry) => (
                          <option key={entry.code} value={entry.code}>
                            {entry.name}
                          </option>
                        ))}
                      </select>
                      <FieldError>{errors.country}</FieldError>
                    </div>
                    {addressField('fullName', 'Full name', { autoComplete: 'name' })}
                    {addressField('phone', address.country === HOME_COUNTRY ? 'Phone' : 'Phone (with country code)', {
                      autoComplete: 'tel',
                      type: 'tel',
                    })}
                    {addressField('line1', 'Address', { autoComplete: 'address-line1', className: 'sm:col-span-2' })}
                    {addressField('line2', 'Apartment, landmark (optional)', {
                      autoComplete: 'address-line2',
                      className: 'sm:col-span-2',
                    })}
                    {addressField('city', 'City', { autoComplete: 'address-level2' })}
                    {addressField('state', address.country === HOME_COUNTRY ? 'State' : 'State / province / region', {
                      autoComplete: 'address-level1',
                    })}
                    {address.country === HOME_COUNTRY
                      ? addressField('postalCode', 'PIN code', { autoComplete: 'postal-code', inputMode: 'numeric' })
                      : addressField('postalCode', 'Postal code', { autoComplete: 'postal-code' })}
                    <p className="self-end pb-3 text-xs text-taupe">
                      Order updates go to {customer?.email}.
                    </p>
                  </div>
                )}
                <FieldError>{errors.address ?? errors.addressId}</FieldError>

                {regionMismatch && (
                  <div role="status" className="mt-5 border border-gold/40 bg-gold/5 p-4 text-sm text-mocha">
                    <p>
                      Orders delivered to <span className="text-charcoal">{destination}</span> are priced in{' '}
                      {CURRENCY_SYMBOL[destinationCurrency]} {destinationCurrency}, but your bag is priced in{' '}
                      {CURRENCY_SYMBOL[currency]} {currency}. Switch your shopping region to see the{' '}
                      {destinationCurrency === 'INR' ? 'India' : 'international'} prices before you pay.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-3"
                      onClick={switchRegion}
                      disabled={switchingRegion}
                    >
                      {switchingRegion
                        ? 'Switching…'
                        : `Shop in ${CURRENCY_SYMBOL[destinationCurrency]} ${destinationCurrency}`}
                    </Button>
                  </div>
                )}
              </fieldset>

              {/* Shipping */}
              <fieldset disabled={busy}>
                <legend className="eyebrow mb-5 text-taupe">2 · Delivery speed</legend>
                <div role="radiogroup" aria-label="Delivery speed" className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ['standard', 'Standard', '4–7 working days', totals.shipping],
                      ['express', 'Express', '1–3 working days', options.commerce.expressShippingFee],
                    ] as const
                  ).map(([value, label, eta, fee]) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={shippingMethod === value}
                      onClick={() => setShippingMethod(value)}
                      className={cn(
                        'flex items-baseline justify-between gap-3 border p-4 text-left text-sm transition-colors',
                        shippingMethod === value ? 'border-charcoal bg-cream/40' : 'border-line hover:border-taupe',
                      )}
                    >
                      <span>
                        <span className="block text-charcoal">{label}</span>
                        <span className="block text-xs text-taupe">{eta}</span>
                      </span>
                      <span className="text-charcoal">{fee === 0 ? 'Complimentary' : formatPrice(fee, currency)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Payment */}
              <fieldset disabled={busy}>
                <legend className="eyebrow mb-5 text-taupe">3 · Payment</legend>
                <div role="radiogroup" aria-label="Payment method" className="grid gap-3">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === 'RAZORPAY'}
                    disabled={!onlineAllowed}
                    onClick={() => setPaymentMethod('RAZORPAY')}
                    className={cn(
                      'border p-4 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                      paymentMethod === 'RAZORPAY' ? 'border-charcoal bg-cream/40' : 'border-line hover:border-taupe',
                    )}
                  >
                    <span className="block text-charcoal">Pay online</span>
                    <span className="block text-xs text-taupe">
                      {!onlineAllowed
                        ? 'Online payment is not available right now.'
                        : currency === 'INR'
                          ? 'UPI, cards, net banking and wallets — secured by Razorpay.'
                          : `International cards, charged in US dollars — secured by Razorpay.`}
                    </span>
                  </button>
                  {options.payments.cod && (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={paymentMethod === 'COD'}
                      disabled={!codAllowed}
                      onClick={() => setPaymentMethod('COD')}
                      className={cn(
                        'border p-4 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                        paymentMethod === 'COD' ? 'border-charcoal bg-cream/40' : 'border-line hover:border-taupe',
                      )}
                    >
                      <span className="block text-charcoal">Cash on delivery</span>
                      <span className="block text-xs text-taupe">
                        {codAllowed
                          ? 'Pay the courier when your order arrives.'
                          : `Available on orders up to ${formatPrice(options.commerce.codLimit, currency)}.`}
                      </span>
                    </button>
                  )}
                </div>
                {!onlineAllowed && !options.payments.cod && (
                  <p className="mt-4 text-sm text-burgundy">
                    Checkout is temporarily unavailable. Please contact client care to order.
                  </p>
                )}
              </fieldset>

              <div>
                <FieldLabel htmlFor="checkout-note">Order note (optional)</FieldLabel>
                <Textarea
                  id="checkout-note"
                  rows={3}
                  maxLength={1000}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Delivery instructions or a gift message"
                  disabled={busy}
                />
              </div>

              {hasUnavailable && (
                <p className="text-sm text-burgundy">
                  Some pieces in your bag are no longer available.{' '}
                  <Link href="/cart" className="underline underline-offset-4">
                    Update your bag
                  </Link>{' '}
                  to continue.
                </p>
              )}

              {formError && (
                <p role="alert" className="border border-burgundy/30 bg-burgundy/5 px-4 py-3 text-sm text-burgundy">
                  {formError}
                </p>
              )}

              <div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-13 w-full sm:w-auto sm:px-12"
                  disabled={busy || hasUnavailable || regionMismatch || (!onlineAllowed && !codAllowed)}
                >
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
                  {stage === 'placing'
                    ? 'Placing your order…'
                    : stage === 'paying'
                      ? 'Waiting for payment…'
                      : stage === 'redirecting'
                        ? 'One moment…'
                        : paymentMethod === 'COD'
                          ? `Place Order · ${formatPrice(shownTotals.total, currency)}`
                          : `Pay ${formatPrice(shownTotals.total, currency)}`}
                </Button>
                <p className="mt-3 text-xs leading-relaxed text-taupe">
                  Prices, stock and discounts are confirmed on our server when you place the order.
                  Returns are accepted within {options.commerce.returnWindowDays} days of delivery.
                </p>
              </div>
            </form>
          )}
        </section>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <ul className="mb-6 flex flex-col gap-4 border border-line bg-cream/30 p-5">
            {(placed?.items ?? items).map((item) => (
              <li key={item.key} className="flex gap-4">
                <span className="relative aspect-4/5 w-14 shrink-0 overflow-hidden bg-ivory-deep">
                  <Image
                    src={item.image.url}
                    alt={item.image.alt}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-charcoal">{item.name}</span>
                  <span className="block text-xs text-taupe">
                    {[item.color, item.size, `Qty ${item.quantity}`].filter(Boolean).join(' · ')}
                  </span>
                  {!item.inStock && (
                    <span className="block text-xs text-burgundy">
                      {item.regionUnavailable ? 'Not available in your region' : 'No longer available'}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm text-charcoal">
                  {item.regionUnavailable ? '—' : formatPrice(item.unitPrice * item.quantity, placed?.currency ?? currency)}
                </span>
              </li>
            ))}
          </ul>

          <OrderSummary
            totals={placed?.totals ?? shownTotals}
            currency={placed?.currency ?? currency}
            coupon={placed ? placed.coupon : coupon}
          />

          <div className="mt-8 border-t border-line pt-8">
            <TrustBar compact />
          </div>
        </aside>
      </div>
    </div>
  )
}
