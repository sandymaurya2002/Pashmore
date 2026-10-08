'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, ChevronLeft, ShoppingBag } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input, FieldError, FieldLabel } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { OrderSummary } from '@/components/cart/order-summary'
import { TrustBar } from '@/components/marketing/trust-bar'
import { useCart } from '@/context/cart-context'
import { placeOrder } from '@/services/orders'
import { cn, formatPrice } from '@/lib/utils'

const STEPS = ['Address', 'Shipping', 'Payment', 'Confirmation'] as const
type Step = (typeof STEPS)[number]

const addressSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name.'),
  email: z.string().email('Please enter a valid email address.'),
  phone: z.string().regex(/^[0-9+\-\s]{10,15}$/, 'Please enter a valid phone number.'),
  line1: z.string().min(4, 'Please enter your address.'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Please enter your city.'),
  state: z.string().min(2, 'Please enter your state.'),
  postalCode: z.string().regex(/^[0-9]{6}$/, 'Please enter a valid 6-digit PIN code.'),
})

type AddressForm = z.infer<typeof addressSchema>

const EMPTY_ADDRESS: AddressForm = {
  fullName: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
}

const SHIPPING_METHODS = [
  {
    id: 'standard',
    name: 'Standard',
    detail: '3–6 working days across India',
    price: 0,
  },
  {
    id: 'express',
    name: 'Express',
    detail: '1–2 working days, metro cities',
    price: 399,
  },
] as const

const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI', detail: 'GPay, PhonePe, Paytm and any UPI app' },
  { id: 'card', name: 'Credit / Debit Card', detail: 'Visa, Mastercard, RuPay, Amex' },
  { id: 'netbanking', name: 'Net Banking', detail: 'All major Indian banks' },
  { id: 'wallet', name: 'Wallets', detail: 'Paytm, Amazon Pay, Mobikwik' },
  { id: 'cod', name: 'Cash on Delivery', detail: 'Available on orders under ₹20,000' },
] as const

const COD_LIMIT = 20000

export function CheckoutFlow() {
  const { items, totals, coupon, hydrated, clear } = useCart()

  const [step, setStep] = React.useState<Step>('Address')
  const [address, setAddress] = React.useState<AddressForm>(EMPTY_ADDRESS)
  const [errors, setErrors] = React.useState<Partial<Record<keyof AddressForm, string>>>({})
  const [shipping, setShipping] = React.useState<(typeof SHIPPING_METHODS)[number]['id']>('standard')
  const [payment, setPayment] = React.useState<(typeof PAYMENT_METHODS)[number]['id']>('upi')
  const [submitting, setSubmitting] = React.useState(false)
  const [orderNumber, setOrderNumber] = React.useState<string | null>(null)

  const shippingMethod = SHIPPING_METHODS.find((method) => method.id === shipping)!
  const shippingCost = totals.shipping + (shipping === 'express' ? shippingMethod.price : 0)
  const grandTotal = totals.total + (shipping === 'express' ? shippingMethod.price : 0)
  const codAvailable = grandTotal <= COD_LIMIT

  React.useEffect(() => {
    if (!codAvailable && payment === 'cod') setPayment('upi')
  }, [codAvailable, payment])

  if (!hydrated) {
    return (
      <div className="container-luxe py-20">
        <div className="skeleton h-96 w-full" />
      </div>
    )
  }

  if (!items.length && !orderNumber) {
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

  function validateAddress(): boolean {
    const result = addressSchema.safeParse(address)
    if (result.success) {
      setErrors({})
      return true
    }
    const next: Partial<Record<keyof AddressForm, string>> = {}
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof AddressForm
      if (!next[field]) next[field] = issue.message
    }
    setErrors(next)
    return false
  }

  async function onPlaceOrder() {
    setSubmitting(true)
    const result = await placeOrder({
      items,
      address,
      shippingMethod: shippingMethod.name,
      paymentMethod: PAYMENT_METHODS.find((method) => method.id === payment)!.name,
      totals: { ...totals, shipping: shippingCost, total: grandTotal },
      couponCode: coupon?.code,
    })
    setSubmitting(false)

    if (result.ok) {
      setOrderNumber(result.orderNumber)
      setStep('Confirmation')
      clear()
    }
  }

  if (orderNumber) {
    return <Confirmation orderNumber={orderNumber} email={address.email} />
  }

  const stepIndex = STEPS.indexOf(step)

  return (
    <div className="container-luxe py-10 lg:py-14">
      <ol className="mb-12 flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="Checkout progress">
        {STEPS.map((entry, index) => (
          <li key={entry} className="flex items-center gap-3">
            <span
              className={cn(
                'flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.16em]',
                index === stepIndex
                  ? 'text-charcoal'
                  : index < stepIndex
                    ? 'text-gold'
                    : 'text-taupe',
              )}
              aria-current={index === stepIndex ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full border text-[0.5625rem]',
                  index === stepIndex
                    ? 'border-charcoal bg-charcoal text-ivory'
                    : index < stepIndex
                      ? 'border-gold bg-gold text-ivory'
                      : 'border-line-strong',
                )}
              >
                {index < stepIndex ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : index + 1}
              </span>
              {entry}
            </span>
            {index < STEPS.length - 1 && (
              <span aria-hidden className="hidden h-px w-8 bg-line-strong sm:block" />
            )}
          </li>
        ))}
      </ol>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          {step === 'Address' && (
            <section aria-labelledby="address-heading">
              <h1 id="address-heading" className="font-serif text-[1.75rem] text-charcoal md:text-[2.25rem]">
                Delivery Address
              </h1>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field
                  id="fullName"
                  label="Full name"
                  autoComplete="name"
                  value={address.fullName}
                  error={errors.fullName}
                  onChange={(value) => setAddress((a) => ({ ...a, fullName: value }))}
                />
                <Field
                  id="phone"
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  value={address.phone}
                  error={errors.phone}
                  onChange={(value) => setAddress((a) => ({ ...a, phone: value }))}
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  className="sm:col-span-2"
                  value={address.email}
                  error={errors.email}
                  onChange={(value) => setAddress((a) => ({ ...a, email: value }))}
                />
                <Field
                  id="line1"
                  label="Address line 1"
                  autoComplete="address-line1"
                  className="sm:col-span-2"
                  value={address.line1}
                  error={errors.line1}
                  onChange={(value) => setAddress((a) => ({ ...a, line1: value }))}
                />
                <Field
                  id="line2"
                  label="Address line 2 (optional)"
                  autoComplete="address-line2"
                  className="sm:col-span-2"
                  value={address.line2 ?? ''}
                  onChange={(value) => setAddress((a) => ({ ...a, line2: value }))}
                />
                <Field
                  id="city"
                  label="City"
                  autoComplete="address-level2"
                  value={address.city}
                  error={errors.city}
                  onChange={(value) => setAddress((a) => ({ ...a, city: value }))}
                />
                <Field
                  id="state"
                  label="State"
                  autoComplete="address-level1"
                  value={address.state}
                  error={errors.state}
                  onChange={(value) => setAddress((a) => ({ ...a, state: value }))}
                />
                <Field
                  id="postalCode"
                  label="PIN code"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={address.postalCode}
                  error={errors.postalCode}
                  onChange={(value) => setAddress((a) => ({ ...a, postalCode: value }))}
                />
              </div>

              <Button
                size="lg"
                className="mt-9 h-13 w-full sm:w-auto sm:px-12"
                onClick={() => validateAddress() && setStep('Shipping')}
              >
                Continue to Shipping
              </Button>
            </section>
          )}

          {step === 'Shipping' && (
            <section aria-labelledby="shipping-heading">
              <BackLink onClick={() => setStep('Address')}>Back to address</BackLink>
              <h1 id="shipping-heading" className="mt-5 font-serif text-[1.75rem] text-charcoal md:text-[2.25rem]">
                Shipping Method
              </h1>

              <fieldset className="mt-8 flex flex-col gap-3">
                <legend className="sr-only">Choose a shipping method</legend>
                {SHIPPING_METHODS.map((method) => (
                  <OptionRow
                    key={method.id}
                    name="shipping"
                    checked={shipping === method.id}
                    onChange={() => setShipping(method.id)}
                    title={method.name}
                    detail={method.detail}
                    trailing={
                      method.price === 0 && totals.shipping === 0
                        ? 'Complimentary'
                        : formatPrice(method.price + (method.id === 'standard' ? totals.shipping : 0))
                    }
                  />
                ))}
              </fieldset>

              <p className="mt-6 text-xs leading-relaxed text-taupe">
                Dispatched from Srinagar. Every order ships in a hand-bound box with a muslin
                sleeve and craft certificate.
              </p>

              <Button
                size="lg"
                className="mt-9 h-13 w-full sm:w-auto sm:px-12"
                onClick={() => setStep('Payment')}
              >
                Continue to Payment
              </Button>
            </section>
          )}

          {step === 'Payment' && (
            <section aria-labelledby="payment-heading">
              <BackLink onClick={() => setStep('Shipping')}>Back to shipping</BackLink>
              <h1 id="payment-heading" className="mt-5 font-serif text-[1.75rem] text-charcoal md:text-[2.25rem]">
                Payment
              </h1>

              <fieldset className="mt-8 flex flex-col gap-3">
                <legend className="sr-only">Choose a payment method</legend>
                {PAYMENT_METHODS.map((method) => {
                  const disabled = method.id === 'cod' && !codAvailable
                  return (
                    <OptionRow
                      key={method.id}
                      name="payment"
                      checked={payment === method.id}
                      disabled={disabled}
                      onChange={() => setPayment(method.id)}
                      title={method.name}
                      detail={
                        disabled
                          ? `Not available above ${formatPrice(COD_LIMIT)}`
                          : method.detail
                      }
                    />
                  )
                })}
              </fieldset>

              <p className="mt-6 text-xs leading-relaxed text-taupe">
                Payments are processed by Razorpay over an encrypted connection. Pashmore never
                stores your card details.
              </p>

              <Button
                size="lg"
                className="mt-9 h-13 w-full sm:w-auto sm:px-12"
                onClick={onPlaceOrder}
                disabled={submitting}
              >
                {submitting ? 'Placing order…' : `Pay ${formatPrice(grandTotal)}`}
              </Button>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <ul className="mb-6 flex flex-col gap-4 border border-line bg-cream/30 p-5">
            {items.map((item) => (
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
                    {[item.color, item.size].filter(Boolean).join(' · ')} · Qty {item.quantity}
                  </span>
                </span>
                <span className="shrink-0 text-sm text-charcoal">
                  {formatPrice(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <OrderSummary
            totals={{ ...totals, shipping: shippingCost, total: grandTotal }}
            coupon={coupon}
          />

          <div className="mt-8 border-t border-line pt-8">
            <TrustBar compact />
          </div>
        </aside>
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  className,
  ...props
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id'>) {
  return (
    <div className={className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <span id={`${id}-error`}>
        <FieldError>{error}</FieldError>
      </span>
    </div>
  )
}

function OptionRow({
  name,
  checked,
  onChange,
  title,
  detail,
  trailing,
  disabled,
}: {
  name: string
  checked: boolean
  onChange: () => void
  title: string
  detail: string
  trailing?: string
  disabled?: boolean
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-4 border px-5 py-4 transition-colors duration-200',
        checked ? 'border-charcoal' : 'border-line-strong hover:border-taupe',
        disabled && 'cursor-not-allowed opacity-45',
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
          checked ? 'border-charcoal' : 'border-line-strong',
        )}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-charcoal" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-charcoal">{title}</span>
        <span className="block text-xs text-taupe">{detail}</span>
      </span>
      {trailing && <span className="shrink-0 text-sm text-charcoal">{trailing}</span>}
    </label>
  )
}

function BackLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-taupe transition-colors hover:text-charcoal"
    >
      <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
      {children}
    </button>
  )
}

function Confirmation({ orderNumber, email }: { orderNumber: string; email: string }) {
  return (
    <div className="container-luxe flex min-h-[60dvh] flex-col items-center justify-center py-20 text-center">
      <span
        aria-hidden
        className="flex h-14 w-14 items-center justify-center rounded-full border border-gold text-gold"
      >
        <Check className="h-6 w-6" strokeWidth={1.25} />
      </span>
      <p className="eyebrow mt-8 text-gold">Order confirmed</p>
      <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.05] text-charcoal md:text-[3rem]">
        Thank you
      </h1>
      <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-mocha">
        Your order <span className="text-charcoal">{orderNumber}</span> has been placed. A
        confirmation is on its way to {email || 'your inbox'}, and your pieces will be dispatched
        from Srinagar within 48 hours.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button asChild size="lg">
          <Link href="/account/orders">View Orders</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/collections">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  )
}
