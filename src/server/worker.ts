import { ApiError, readEnvelope, type ApiMeta } from '@/lib/api/envelope'

/**
 * HTTP client for the Cloudflare Worker API (D1 + R2).
 *
 * Server-side only: route handlers, Server Components and middleware call it;
 * the browser never does. CLOUDFLARE_API_URL and the optional Cloudflare Access
 * service token are read from server environment variables and never reach the
 * client bundle. There is deliberately no fallback data source — if the Worker
 * is not configured or not reachable, callers get an `ApiError`.
 */

const API_PREFIX = '/api/v1'
const DEFAULT_TIMEOUT_MS = 10_000

export type QueryValue = string | number | boolean | string[] | undefined | null

export interface ClientContext {
  ip?: string
  userAgent?: string
  /** The shopper's region (ISO country). The Worker prices the request in its currency. */
  country?: string
}

export interface WorkerRequest {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  query?: Record<string, QueryValue>
  body?: unknown
  /** Customer access token, sent as a Bearer header. */
  accessToken?: string
  /**
   * End-customer context, so Worker rate limits and audit logs see the shopper
   * rather than this server. The Worker only trusts the forwarded IP when the
   * request carries its GATEWAY_SECRET.
   */
  client?: ClientContext
  /** Public catalogue reads are cached in the Next Data Cache; everything else is not. */
  cache?: { revalidate: number; tags?: string[] } | 'no-store'
  timeoutMs?: number
  /** Lets the Worker recognise a retried order submission and return the original order. */
  idempotencyKey?: string
}

export interface WorkerResult<T> {
  data: T
  meta: ApiMeta
  status: number
}

export function workerBaseUrl(): string {
  const raw = process.env.CLOUDFLARE_API_URL?.trim()
  if (!raw) {
    throw new ApiError(
      'The store service is not configured. Set CLOUDFLARE_API_URL.',
      503,
      'API_NOT_CONFIGURED',
    )
  }
  const base = raw.replace(/\/+$/, '')
  return base.endsWith(API_PREFIX) ? base : `${base}${API_PREFIX}`
}

export function buildWorkerUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${workerBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      if (value.length) url.searchParams.set(key, value.join(','))
    } else {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

function buildHeaders(request: WorkerRequest): Headers {
  const headers = new Headers({ Accept: 'application/json' })
  if (request.body !== undefined) headers.set('Content-Type', 'application/json')
  if (request.accessToken) headers.set('Authorization', `Bearer ${request.accessToken}`)
  if (request.idempotencyKey) headers.set('Idempotency-Key', request.idempotencyKey)

  const gatewaySecret = process.env.CLOUDFLARE_GATEWAY_SECRET
  if (gatewaySecret && request.client?.ip) {
    headers.set('X-Gateway-Secret', gatewaySecret)
    headers.set('X-Client-IP', request.client.ip)
  }
  if (request.client?.userAgent) headers.set('User-Agent', request.client.userAgent)
  // Without it the Worker would geolocate this server, not the shopper.
  if (request.client?.country) headers.set('X-Client-Country', request.client.country)

  // Optional Cloudflare Access service token, so only this server can call the Worker.
  if (process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET) {
    headers.set('CF-Access-Client-Id', process.env.CF_ACCESS_CLIENT_ID)
    headers.set('CF-Access-Client-Secret', process.env.CF_ACCESS_CLIENT_SECRET)
  }
  return headers
}

export async function workerFetch<T>(
  path: string,
  request: WorkerRequest = {},
): Promise<WorkerResult<T>> {
  const method = request.method ?? 'GET'
  const url = buildWorkerUrl(path, request.query)
  const cacheable = typeof request.cache === 'object' && method === 'GET'

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers: buildHeaders(request),
      body: request.body !== undefined ? JSON.stringify(request.body) : undefined,
      signal: AbortSignal.timeout(request.timeoutMs ?? DEFAULT_TIMEOUT_MS),
      ...(cacheable && typeof request.cache === 'object'
        ? { next: { revalidate: request.cache.revalidate, tags: request.cache.tags } }
        : { cache: 'no-store' as const }),
    })
  } catch (error) {
    const reason = (error as Error)?.name === 'TimeoutError' ? 'timed out' : 'failed'
    console.error(`[worker] ${method} ${path} ${reason}:`, (error as Error)?.message)
    throw new ApiError(
      'The store is temporarily unavailable. Please try again shortly.',
      503,
      'UPSTREAM_UNAVAILABLE',
    )
  }

  try {
    const { data, meta } = await readEnvelope<T>(response)
    return { data, meta, status: response.status }
  } catch (error) {
    if (error instanceof ApiError && error.status >= 500 && error.status !== 501) {
      console.error(`[worker] ${method} ${path} -> ${error.status} ${error.code}: ${error.message}`)
    }
    throw error
  }
}
