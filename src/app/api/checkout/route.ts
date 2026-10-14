import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { normalizeAddresses, normalizeOrder, normalizePaymentSession } from '@/lib/normalize/commerce'
import { asBoolean, asRecord, asString } from '@/lib/normalize/primitives'
import { currencyForCountry, HOME_COUNTRY, isCurrency } from '@/lib/region'
import { getSiteContent } from '@/server/content'
import { ok, readJson } from '@/server/http'
import { withSession } from '@/server/session'
import { workerFetch } from '@/server/worker'

const ADDRESS_FIELDS = ['fullName', 'email', 'phone', 'line1', 'line2', 'city', 'state', 'postalCode', 'country'] as const
const IDEMPOTENCY_KEY = /^[A-Za-z0-9_-]{8,100}$/
const ID = /^[A-Za-z0-9_-]{1,64}$/

/** Payment options and saved addresses for the checkout form. */
export function GET(request: NextRequest) {
  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const [methods, addresses, site] = await Promise.all([
      workerFetch<unknown>('/payments/methods', { client }),
      workerFetch<unknown>('/auth/addresses', { accessToken, client }),
      getSiteContent(),
    ])
    const raw = asRecord(methods.data)
    const country = client.country ?? HOME_COUNTRY
    const currency = currencyForCountry(country)
    return ok({
      payments: {
        online: asBoolean(raw.razorpay),
        // Cash on delivery is offered in India only.
        cod: asBoolean(raw.cod) && currency === 'INR',
      },
      region: { country, currency },
      commerce: site.commerceByCurrency[currency],
      addresses: normalizeAddresses(addresses.data),
    })
  })
}

/**
 * Places the order. Prices, stock, coupon and shipping are all recomputed by
 * the Worker from the customer's server-side bag; nothing the browser sends
 * about money is trusted. For online payment the response carries the
 * Razorpay order to open Checkout with — the order only becomes "paid" once
 * the Worker has verified the payment with Razorpay.
 */
export function POST(request: NextRequest) {
  return withSession(request, { auth: 'required' }, async ({ accessToken, client }) => {
    const raw = await readJson(request)

    const body: Record<string, unknown> = {
      shippingMethod: raw.shippingMethod === 'express' ? 'express' : 'standard',
      paymentMethod: raw.paymentMethod === 'COD' ? 'COD' : 'RAZORPAY',
    }
    if (typeof raw.addressId === 'string' && ID.test(raw.addressId)) {
      body.addressId = raw.addressId
    } else {
      const source = asRecord(raw.address)
      const address: Record<string, unknown> = {}
      for (const field of ADDRESS_FIELDS) {
        if (typeof source[field] === 'string') address[field] = asString(source[field])
      }
      if (address.line2 === '') address.line2 = null
      body.address = address
    }
    if (typeof raw.customerNote === 'string' && raw.customerNote.trim()) {
      body.customerNote = raw.customerNote.trim().slice(0, 1000)
    }
    // The currency the customer saw; the Worker refuses the order if its prices are in another.
    if (isCurrency(raw.currency)) body.currency = raw.currency

    const key = typeof raw.idempotencyKey === 'string' ? raw.idempotencyKey : ''
    if (!IDEMPOTENCY_KEY.test(key)) {
      throw new ApiError('Please refresh the page and try again.', 400, 'VALIDATION_ERROR')
    }

    const { data, status } = await workerFetch<unknown>('/orders', {
      method: 'POST',
      body,
      accessToken,
      client,
      idempotencyKey: key,
      timeoutMs: 20_000,
    })
    const record = asRecord(data)
    return ok(
      { order: normalizeOrder(record), payment: normalizePaymentSession(record.payment) },
      { status },
    )
  })
}
