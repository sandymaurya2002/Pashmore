import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { ApiError } from '@/lib/api/envelope'
import {
  normalizeAddresses,
  normalizeCustomer,
  normalizeOrder,
  normalizeOrders,
} from '@/lib/normalize/commerce'
import { asNumber } from '@/lib/normalize/primitives'
import { SESSION_COOKIE, isAccessTokenFresh } from '@/server/session'
import { workerFetch, type WorkerRequest } from '@/server/worker'
import type { Address, Customer, Order } from '@/types'

/**
 * Account data for Server Components. Middleware has already refreshed the
 * session, so a missing or rejected token here means the customer must sign
 * in again — they are sent to /login and returned to `returnTo` afterwards.
 */

function toLogin(returnTo: string): never {
  redirect(`/login?next=${encodeURIComponent(returnTo)}`)
}

async function accountFetch<T>(
  path: string,
  returnTo: string,
  request: Omit<WorkerRequest, 'accessToken'> = {},
): Promise<{ data: T; meta: Record<string, unknown> }> {
  const accessToken = (await cookies()).get(SESSION_COOKIE)?.value
  if (!isAccessTokenFresh(accessToken)) toLogin(returnTo)

  try {
    const { data, meta } = await workerFetch<T>(path, { ...request, accessToken })
    return { data, meta }
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) toLogin(returnTo)
    throw error
  }
}

export async function getCustomer(returnTo = '/account'): Promise<Customer> {
  const { data } = await accountFetch<unknown>('/auth/me', returnTo)
  const customer = normalizeCustomer(data)
  if (!customer) {
    throw new ApiError('Your account could not be loaded.', 502, 'BAD_UPSTREAM_RESPONSE')
  }
  return customer
}

export async function getAddresses(returnTo = '/account/addresses'): Promise<Address[]> {
  const { data } = await accountFetch<unknown>('/auth/addresses', returnTo)
  return normalizeAddresses(data)
}

export const ORDERS_PAGE_SIZE = 10

export async function getOrders(
  page = 1,
  returnTo = '/account/orders',
): Promise<{ orders: Order[]; page: number; totalPages: number; total: number }> {
  const { data, meta } = await accountFetch<unknown>('/orders', returnTo, {
    query: { page, limit: ORDERS_PAGE_SIZE },
  })
  const orders = normalizeOrders(data)
  return {
    orders,
    page: asNumber(meta.page, page),
    totalPages: asNumber(meta.totalPages, 1),
    total: asNumber(meta.total, orders.length),
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null
  try {
    const { data } = await accountFetch<unknown>(
      `/orders/${encodeURIComponent(id)}`,
      `/account/orders/${id}`,
    )
    return normalizeOrder(data)
  } catch (error) {
    if (error instanceof ApiError && (error.isNotFound || error.status === 403)) return null
    throw error
  }
}
