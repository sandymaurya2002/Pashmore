import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET as checkoutOptions, POST as placeOrder } from '@/app/api/checkout/route'
import { POST as orderAction } from '@/app/api/orders/[id]/[action]/route'
import { WORKER_ORIGIN, failure, mockWorker, opaqueToken, request, success } from './helpers'

const signedIn = { pm_session: opaqueToken() }
const KEY = 'chk_0123456789abcdef'

const workerOrder = {
  id: 'ord_1',
  orderNumber: 'PSH-104300',
  status: 'payment_pending',
  paymentMethod: 'RAZORPAY',
  paymentStatus: 'PENDING',
  createdAt: '2026-10-14T06:00:00.000Z',
  items: [],
  totals: { subtotal: 24500, discount: 0, shipping: 0, tax: 1166.67, total: 24500, refunded: 0 },
  awaitingPayment: true,
  canCancel: true,
  canReturn: false,
  history: [],
}

const razorpaySession = {
  keyId: 'rzp_test_abc',
  razorpayOrderId: 'order_RZP1',
  amount: 2450000,
  currency: 'INR',
  name: 'Pashmore',
  description: 'Order PSH-104300',
  orderId: 'ord_1',
  orderNumber: 'PSH-104300',
  prefill: { name: 'Asha', email: 'asha@example.com', contact: '9876543210' },
  expiresAt: '2026-10-14T06:30:00.000Z',
}

const address = {
  fullName: 'Asha Rao',
  phone: '9876543210',
  line1: '12 Residency Road',
  line2: '',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560025',
  country: 'India',
}

const action = (id: string, name: string, body?: unknown, cookies = signedIn) =>
  orderAction(request(`/api/orders/${id}/${name}`, { method: 'POST', body, cookies }), {
    params: Promise.resolve({ id, action: name }),
  })

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('checkout route', () => {
  it('requires a signed-in customer', async () => {
    const { fetchMock } = mockWorker({})
    const response = await placeOrder(
      request('/api/checkout', { method: 'POST', body: { idempotencyKey: KEY } }),
    )
    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns payment options, shipping rules and saved addresses', async () => {
    mockWorker({
      'GET /payments/methods': success({ razorpay: true, cod: true }),
      'GET /auth/addresses': success([]),
      'GET /content/site': success({ commerce: { codLimit: 15000, expressShippingFee: 399 } }),
    })
    const response = await checkoutOptions(request('/api/checkout', { cookies: signedIn }))
    const { data } = await response.json()
    expect(response.status).toBe(200)
    expect(data.payments).toEqual({ online: true, cod: true })
    expect(data.commerce).toMatchObject({ codLimit: 15000, expressShippingFee: 399 })
    expect(data.addresses).toEqual([])
  })

  it('offers international shoppers dollar shipping rules and no cash on delivery', async () => {
    mockWorker({
      'GET /payments/methods': success({ razorpay: true, cod: true }),
      'GET /auth/addresses': success([]),
      'GET /content/site': success({
        commerceByCurrency: { USD: { freeShippingThreshold: 300, standardShippingFee: 30 } },
      }),
    })
    const response = await checkoutOptions(
      request('/api/checkout', { cookies: { ...signedIn, pm_country: 'US' } }),
    )
    const { data } = await response.json()
    expect(data.region).toEqual({ country: 'US', currency: 'USD' })
    expect(data.payments).toEqual({ online: true, cod: false })
    expect(data.commerce).toMatchObject({ currency: 'USD', freeShippingThreshold: 300, standardShippingFee: 30 })
  })

  it('sends the bag currency and shopper country so the Worker can check them', async () => {
    const { calls } = mockWorker({
      'POST /orders': {
        status: 201,
        body: { success: true, data: { ...workerOrder, currency: 'USD', payment: null } },
      },
    })
    await placeOrder(
      request('/api/checkout', {
        method: 'POST',
        cookies: { ...signedIn, pm_country: 'US' },
        body: {
          idempotencyKey: KEY,
          paymentMethod: 'RAZORPAY',
          currency: 'USD',
          address: { ...address, country: 'United States' },
        },
      }),
    )
    expect(calls[0].headers.get('x-client-country')).toBe('US')
    expect(calls[0].body).toMatchObject({ currency: 'USD', address: { country: 'United States' } })
  })

  it('refuses to place an order without an idempotency key', async () => {
    const { fetchMock } = mockWorker({})
    const response = await placeOrder(
      request('/api/checkout', { method: 'POST', body: { address }, cookies: signedIn }),
    )
    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards only whitelisted fields and never any price from the browser', async () => {
    const { calls } = mockWorker({
      'POST /orders': { status: 201, body: { success: true, data: { ...workerOrder, payment: razorpaySession } } },
    })
    const response = await placeOrder(
      request('/api/checkout', {
        method: 'POST',
        cookies: signedIn,
        body: {
          idempotencyKey: KEY,
          paymentMethod: 'RAZORPAY',
          shippingMethod: 'express',
          address: { ...address, isAdmin: true },
          customerNote: '  Gift wrap please  ',
          total: 1,
          items: [{ price: 1 }],
        },
      }),
    )
    const { data } = await response.json()

    expect(response.status).toBe(201)
    expect(calls[0].headers.get('idempotency-key')).toBe(KEY)
    expect(calls[0].headers.get('authorization')).toBe(`Bearer ${opaqueToken()}`)
    expect(calls[0].body).toEqual({
      shippingMethod: 'express',
      paymentMethod: 'RAZORPAY',
      address: { ...address, line2: null },
      customerNote: 'Gift wrap please',
    })
    expect(data.order).toMatchObject({ id: 'ord_1', number: 'PSH-104300', status: 'payment_pending' })
    expect(data.payment).toMatchObject({
      provider: 'razorpay',
      keyId: 'rzp_test_abc',
      razorpayOrderId: 'order_RZP1',
      amount: 2450000,
    })
  })

  it('places a cash-on-delivery order against a saved address', async () => {
    const { calls } = mockWorker({
      'POST /orders': {
        status: 201,
        body: { success: true, data: { ...workerOrder, status: 'pending', paymentMethod: 'COD', payment: null } },
      },
    })
    const response = await placeOrder(
      request('/api/checkout', {
        method: 'POST',
        cookies: signedIn,
        body: { idempotencyKey: KEY, paymentMethod: 'COD', addressId: 'adr_1' },
      }),
    )
    const { data } = await response.json()
    expect(calls[0].body).toEqual({ shippingMethod: 'standard', paymentMethod: 'COD', addressId: 'adr_1' })
    expect(data.payment).toBeNull()
  })

  it("passes the Worker's stock error through to the shopper", async () => {
    mockWorker({ 'POST /orders': failure(409, 'INSUFFICIENT_STOCK', 'Only 1 left in stock.') })
    const response = await placeOrder(
      request('/api/checkout', {
        method: 'POST',
        cookies: signedIn,
        body: { idempotencyKey: KEY, addressId: 'adr_1' },
      }),
    )
    const body = await response.json()
    expect(response.status).toBe(409)
    expect(body.error.code).toBe('INSUFFICIENT_STOCK')
  })
})

describe('order action routes', () => {
  it('rejects unknown actions and malformed ids without calling the Worker', async () => {
    const { fetchMock } = mockWorker({})
    expect((await action('ord_1', 'mark-paid')).status).toBe(404)
    expect((await action('../admin', 'pay')).status).toBe(404)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requires a session', async () => {
    const { fetchMock } = mockWorker({})
    const response = await action('ord_1', 'pay', undefined, {} as typeof signedIn)
    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reopens payment with a fresh Razorpay session', async () => {
    mockWorker({ 'POST /orders/ord_1/pay': success(razorpaySession) })
    const { data } = await (await action('ord_1', 'pay')).json()
    expect(data.payment).toMatchObject({ razorpayOrderId: 'order_RZP1', orderNumber: 'PSH-104300' })
  })

  it('sends only the three Razorpay fields for server-side verification', async () => {
    const { calls } = mockWorker({
      'POST /orders/ord_1/payment/verify': success({
        outcome: 'PAID',
        order: { ...workerOrder, status: 'paid', paymentStatus: 'PAID', awaitingPayment: false },
      }),
    })
    const response = await action('ord_1', 'verify', {
      razorpayOrderId: 'order_RZP1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'sig',
      status: 'PAID',
      amount: 1,
    })
    const { data } = await response.json()
    expect(calls[0].body).toEqual({
      razorpayOrderId: 'order_RZP1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'sig',
    })
    expect(data.outcome).toBe('PAID')
    expect(data.order.status).toBe('paid')
  })

  it('reports a signature mismatch from the Worker as an error', async () => {
    mockWorker({
      'POST /orders/ord_1/payment/verify': failure(400, 'PAYMENT_VERIFICATION_FAILED', 'Payment could not be verified.'),
    })
    const response = await action('ord_1', 'verify', {
      razorpayOrderId: 'order_RZP1',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'forged',
    })
    expect(response.status).toBe(400)
  })

  it('cancels with an optional, trimmed reason', async () => {
    const { calls } = mockWorker({
      'POST /orders/ord_1/cancel': success({ ...workerOrder, status: 'cancelled' }),
    })
    const { data } = await (await action('ord_1', 'cancel', { reason: '  Ordered twice ' })).json()
    expect(calls[0].body).toEqual({ reason: 'Ordered twice' })
    expect(data.order.status).toBe('cancelled')
  })

  it('requests a return with the reason given', async () => {
    const { calls } = mockWorker({
      'POST /orders/ord_1/return': success({ ...workerOrder, status: 'return_requested' }),
    })
    const { data } = await (await action('ord_1', 'return', { reason: 'Colour differs' })).json()
    expect(calls[0].body).toEqual({ reason: 'Colour differs' })
    expect(data.order.status).toBe('return_requested')
  })
})
