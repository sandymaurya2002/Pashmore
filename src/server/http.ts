import { NextResponse } from 'next/server'

import { ApiError, type ApiMeta } from '@/lib/api/envelope'

/**
 * Responses from the storefront's own route handlers use the same envelope as
 * the Worker, so `bff()` in the browser has exactly one shape to read.
 */

const NO_STORE = { 'Cache-Control': 'private, no-store' }

export function ok<T>(data: T, init: { status?: number; meta?: ApiMeta; headers?: HeadersInit } = {}) {
  return NextResponse.json(
    { success: true, data, ...(init.meta ? { meta: init.meta } : {}) },
    { status: init.status ?? 200, headers: init.headers ?? NO_STORE },
  )
}

export function fail(error: unknown, label = 'api'): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: error.toBody() },
      { status: error.status || 500, headers: NO_STORE },
    )
  }
  console.error(`[${label}] Unhandled error:`, error)
  return NextResponse.json(
    { success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } },
    { status: 500, headers: NO_STORE },
  )
}

/** Parses a JSON request body, rejecting anything that is not an object. */
export async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json()
    if (body && typeof body === 'object' && !Array.isArray(body)) {
      return body as Record<string, unknown>
    }
  } catch {
    // Fall through to the validation error below.
  }
  throw new ApiError('Request body must be a JSON object.', 400, 'VALIDATION_ERROR')
}

export function clientContext(request: Request): { ip?: string; userAgent?: string } {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return {
    ip: forwarded || request.headers.get('x-real-ip') || undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  }
}
