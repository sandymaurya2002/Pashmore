import { ApiError, readEnvelope, type ApiMeta } from '@/lib/api/envelope'

/**
 * Browser-side helper for the storefront's own `/api/*` route handlers.
 *
 * The browser never talks to the Worker or the database directly: every call
 * goes through a same-origin route handler that holds the HttpOnly session
 * cookies and forwards to the Worker server-side.
 */
export async function bff<T>(
  path: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<{ data: T; meta: ApiMeta }> {
  let response: Response
  try {
    response = await fetch(path, {
      method: init.method ?? 'GET',
      credentials: 'same-origin',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
      cache: 'no-store',
    })
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') throw error
    throw new ApiError(
      'We could not reach Pashmore. Check your connection and try again.',
      0,
      'NETWORK_ERROR',
    )
  }
  return readEnvelope<T>(response)
}

export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.message) return error.message
  return fallback
}
