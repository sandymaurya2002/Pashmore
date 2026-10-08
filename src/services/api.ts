/**
 * Thin HTTP client for the future commerce backend.
 *
 * Nothing in the demo build calls this — every service falls back to the local
 * catalogue while `NEXT_PUBLIC_API_BASE_URL` is unset. It exists so that
 * swapping in a Node/Express API, a Next route handler, or a headless commerce
 * platform is a configuration change rather than a refactor.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? ''

export function apiConfigured(): boolean {
  return BASE_URL.length > 0
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface ApiRequestInit extends Omit<RequestInit, 'body'> {
  body?: BodyInit | null
  /** Seconds. Maps to the Next fetch cache. */
  revalidate?: number
  tags?: string[]
}

export async function apiFetch<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  if (!apiConfigured()) {
    throw new ApiError('NEXT_PUBLIC_API_BASE_URL is not configured', 0)
  }

  const { revalidate, tags, headers, ...rest } = init

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.API_TOKEN ? { Authorization: `Bearer ${process.env.API_TOKEN}` } : {}),
      ...headers,
    },
    next: revalidate !== undefined || tags ? { revalidate, tags } : undefined,
  })

  if (!response.ok) {
    let body: unknown
    try {
      body = await response.json()
    } catch {
      body = await response.text().catch(() => undefined)
    }
    throw new ApiError(
      `Request to ${path} failed with ${response.status}`,
      response.status,
      body,
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
