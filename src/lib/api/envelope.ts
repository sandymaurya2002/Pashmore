/**
 * The Worker API and the storefront's own route handlers share one response
 * envelope: `{ success: true, data, meta? }` or
 * `{ success: false, error: { code, message, details? } }`.
 *
 * This module is isomorphic — it is used by the server-side Worker client and
 * by the browser helper that talks to `/api/*`.
 */

export interface ApiErrorBody {
  code: string
  message: string
  /** Field path → message, so validation errors bind straight to form fields. */
  details?: Record<string, string>
}

export type ApiMeta = Record<string, unknown>

export type ApiEnvelope<T> =
  | { success: true; data: T; meta?: ApiMeta }
  | { success: false; error: ApiErrorBody }

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string = 'INTERNAL_ERROR',
    readonly details?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isUnauthorized(): boolean {
    return this.status === 401
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  toBody(): ApiErrorBody {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

/** Flattens whatever `details` the backend sent into `{ field: message }`. */
export function toFieldErrors(details: unknown): Record<string, string> | undefined {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return undefined
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
    if (typeof value === 'string') out[key] = value
    else if (Array.isArray(value) && typeof value[0] === 'string') out[key] = value[0]
  }
  return Object.keys(out).length ? out : undefined
}

function isEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as { success: unknown }).success === 'boolean'
  )
}

/**
 * Reads a `Response` carrying the envelope. Resolves with `data` and `meta` on
 * success and throws `ApiError` on anything else, including a malformed body.
 */
export async function readEnvelope<T>(
  response: Response,
): Promise<{ data: T; meta: ApiMeta }> {
  if (response.status === 204) return { data: undefined as T, meta: {} }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new ApiError(
      'The server returned an unexpected response.',
      response.ok ? 502 : response.status,
      'BAD_UPSTREAM_RESPONSE',
    )
  }

  if (!isEnvelope(body)) {
    throw new ApiError(
      'The server returned an unexpected response.',
      response.ok ? 502 : response.status,
      'BAD_UPSTREAM_RESPONSE',
    )
  }

  if (!body.success) {
    const error = body.error ?? { code: 'INTERNAL_ERROR', message: 'Request failed.' }
    throw new ApiError(
      error.message || 'Request failed.',
      response.ok ? 500 : response.status,
      error.code || 'INTERNAL_ERROR',
      toFieldErrors(error.details),
    )
  }

  return { data: body.data as T, meta: body.meta ?? {} }
}
