import { apiConfigured, apiFetch } from '@/services/api'
import type { CartItem, CartTotals, Order } from '@/types'

/**
 * Order placement.
 *
 * In demo mode this resolves locally with a plausible order number so the
 * confirmation step can be exercised end to end. Wiring a real backend means
 * setting NEXT_PUBLIC_API_BASE_URL and, for live payments, creating a Razorpay
 * order server-side and opening the checkout handler here with the returned
 * order id — the UI flow above does not change.
 */

export interface PlaceOrderInput {
  items: CartItem[]
  address: {
    fullName: string
    email: string
    phone: string
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
  }
  shippingMethod: string
  paymentMethod: string
  totals: CartTotals
  couponCode?: string
}

export type PlaceOrderResult =
  | { ok: true; orderNumber: string }
  | { ok: false; message: string }

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (apiConfigured()) {
    try {
      const order = await apiFetch<{ number: string }>('/orders', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return { ok: true, orderNumber: order.number }
    } catch {
      return {
        ok: false,
        message: 'We could not place your order. No payment has been taken — please try again.',
      }
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 900))
  const suffix = Math.floor(100000 + Math.random() * 899999)
  return { ok: true, orderNumber: `PSH-${suffix}` }
}

export async function getOrders(): Promise<Order[]> {
  if (apiConfigured()) {
    return apiFetch<Order[]>('/orders', { revalidate: 0 })
  }
  const { demoOrders } = await import('@/data/account')
  return demoOrders
}

export async function getOrderById(id: string): Promise<Order | null> {
  const orders = await getOrders()
  return orders.find((order) => order.id === id || order.number === id) ?? null
}
