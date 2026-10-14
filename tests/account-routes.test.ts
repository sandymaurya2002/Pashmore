import { beforeEach, describe, expect, it, vi } from 'vitest'

import { POST as toggleWishlist } from '@/app/api/wishlist/toggle/route'
import { GET as getWishlist } from '@/app/api/wishlist/route'
import { POST as trackOrder } from '@/app/api/orders/track/route'
import { POST as contact } from '@/app/api/contact/route'
import { POST as subscribe } from '@/app/api/newsletter/route'
import { POST as forgotPassword } from '@/app/api/auth/forgot-password/route'
import { WORKER_ORIGIN, failure, mockWorker, opaqueToken, request, success } from './helpers'

const signedIn = { pm_session: opaqueToken() }

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('wishlist route handlers', () => {
  it('requires a session for the server-side wishlist', async () => {
    const { fetchMock } = mockWorker({})
    const response = await toggleWishlist(
      request('/api/wishlist/toggle', { method: 'POST', body: { slug: 'ivory-shawl' } }),
    )
    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('validates the slug before calling the Worker', async () => {
    const { fetchMock } = mockWorker({})
    const response = await toggleWishlist(
      request('/api/wishlist/toggle', { method: 'POST', body: { slug: '../admin' }, cookies: signedIn }),
    )
    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("maps the Worker's toggle result", async () => {
    mockWorker({
      'POST /wishlist/toggle': success({ slug: 'ivory-shawl', saved: true, slugs: ['ivory-shawl'] }),
    })
    const response = await toggleWishlist(
      request('/api/wishlist/toggle', { method: 'POST', body: { slug: 'ivory-shawl' }, cookies: signedIn }),
    )
    expect(await response.json()).toEqual({ success: true, data: { added: true } })
  })

  it('reads the saved slugs', async () => {
    mockWorker({ 'GET /wishlist/slugs': success(['ivory-shawl', 'sand-stole']) })
    const response = await getWishlist(request('/api/wishlist', { cookies: signedIn }))
    expect((await response.json()).data.slugs).toEqual(['ivory-shawl', 'sand-stole'])
  })
})

describe('POST /api/orders/track', () => {
  it('rejects malformed order numbers locally', async () => {
    const { fetchMock } = mockWorker({})
    const response = await trackOrder(
      request('/api/orders/track', { method: 'POST', body: { orderNumber: 'nope', email: 'a@b.co' } }),
    )
    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("maps the Worker's tracking summary", async () => {
    const { calls } = mockWorker({
      'POST /orders/track': success({
        orderNumber: 'PSH-104287',
        status: 'shipped',
        placedAt: '2026-10-01T09:30:00.000Z',
        items: [
          { name: 'Ivory Heritage Pashmina Shawl', quantity: 2 },
          { name: 'Sand Stole', quantity: 1 },
        ],
        trackingNumber: 'BD123456789IN',
        carrier: 'Blue Dart',
      }),
    })
    const response = await trackOrder(
      request('/api/orders/track', {
        method: 'POST',
        body: { orderNumber: 'psh-104287', email: 'asha@example.com' },
      }),
    )
    expect(calls[0].body).toEqual({ orderNumber: 'PSH-104287', email: 'asha@example.com' })
    expect((await response.json()).data.order).toEqual({
      number: 'PSH-104287',
      status: 'shipped',
      placedAt: '2026-10-01T09:30:00.000Z',
      itemCount: 3,
      trackingNumber: 'BD123456789IN',
      carrier: 'Blue Dart',
    })
  })

  it('passes "not found" through', async () => {
    mockWorker({ 'POST /orders/track': failure(404, 'NOT_FOUND', 'Order not found.') })
    const response = await trackOrder(
      request('/api/orders/track', {
        method: 'POST',
        body: { orderNumber: 'PSH-000001', email: 'asha@example.com' },
      }),
    )
    expect(response.status).toBe(404)
  })
})

describe('contact and newsletter forms', () => {
  it('forwards an enquiry to the Worker, keeping only known fields', async () => {
    const { calls } = mockWorker({
      'POST /contact': { status: 201, body: { success: true, data: { received: true } } },
    })
    const sent = await contact(
      request('/api/contact', {
        method: 'POST',
        body: {
          name: 'Asha Rao',
          email: 'asha@example.com',
          subject: 'Order enquiry',
          message: 'Could you tell me when my shawl will be dispatched, please?',
          isAdmin: true,
        },
      }),
    )
    expect(sent.status).toBe(201)
    const forwarded = calls[0]?.body as Record<string, unknown>
    expect(forwarded).toMatchObject({ name: 'Asha Rao', subject: 'Order enquiry' })
    expect(forwarded).not.toHaveProperty('isAdmin')
  })

  it('passes Worker validation errors through to the contact form', async () => {
    mockWorker({
      'POST /contact': {
        status: 400,
        body: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Please check the form.',
            details: { message: 'Please give us a little more detail.' },
          },
        },
      },
    })
    const sent = await contact(
      request('/api/contact', { method: 'POST', body: { name: 'A', email: 'x', subject: 'Hi', message: 'short' } }),
    )
    expect(sent.status).toBe(400)
    expect((await sent.json()).error.details.message).toContain('more detail')
  })

  it('subscribes to the newsletter through the Worker', async () => {
    const { calls } = mockWorker({ 'POST /newsletter': success({ subscribed: true }) })
    const subscribed = await subscribe(
      request('/api/newsletter', { method: 'POST', body: { email: 'asha@example.com', source: 'footer' } }),
    )
    expect(subscribed.status).toBe(200)
    expect((await subscribed.json()).data).toEqual({ subscribed: true })
    expect(calls[0]?.body).toEqual({
      email: 'asha@example.com',
      source: 'footer',
    })
  })

  it("passes the Worker's password-reset 501 through to the form", async () => {
    mockWorker({
      'POST /auth/forgot-password': failure(
        501,
        'NOT_IMPLEMENTED',
        'Password reset by email is not available yet. Please contact support.',
      ),
    })
    const response = await forgotPassword(
      request('/api/auth/forgot-password', { method: 'POST', body: { email: 'asha@example.com' } }),
    )
    expect(response.status).toBe(501)
    expect((await response.json()).error.message).toContain('not available yet')
  })
})
