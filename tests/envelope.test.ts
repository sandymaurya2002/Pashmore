import { describe, expect, it } from 'vitest'

import { ApiError, readEnvelope, toFieldErrors } from '@/lib/api/envelope'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('readEnvelope', () => {
  it('returns data and meta from a success envelope', async () => {
    const result = await readEnvelope(json({ success: true, data: [1, 2], meta: { page: 2 } }))
    expect(result).toEqual({ data: [1, 2], meta: { page: 2 } })
  })

  it('defaults meta to an empty object', async () => {
    const result = await readEnvelope(json({ success: true, data: { ok: 1 } }))
    expect(result.meta).toEqual({})
  })

  it('throws ApiError with status, code and field details on an error envelope', async () => {
    const response = json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { email: ['Enter a valid email'], password: 'Too short', ignored: 3 },
        },
      },
      422,
    )
    const error = await readEnvelope(response).catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: { email: 'Enter a valid email', password: 'Too short' },
    })
  })

  it('treats a non-envelope body as a bad upstream response', async () => {
    const error = await readEnvelope(json({ products: [] })).catch((reason: unknown) => reason)
    expect(error).toMatchObject({ status: 502, code: 'BAD_UPSTREAM_RESPONSE' })
  })

  it('keeps the upstream status when a failing response is not JSON', async () => {
    const error = await readEnvelope(new Response('<html>Bad gateway</html>', { status: 504 })).catch(
      (reason: unknown) => reason,
    )
    expect(error).toMatchObject({ status: 504, code: 'BAD_UPSTREAM_RESPONSE' })
  })

  it('resolves 204 responses with undefined data', async () => {
    const result = await readEnvelope(new Response(null, { status: 204 }))
    expect(result.data).toBeUndefined()
  })
})

describe('toFieldErrors', () => {
  it('returns undefined when nothing is usable', () => {
    expect(toFieldErrors(null)).toBeUndefined()
    expect(toFieldErrors(['a'])).toBeUndefined()
    expect(toFieldErrors({ a: 1 })).toBeUndefined()
  })
})

describe('ApiError', () => {
  it('serialises to the envelope error body', () => {
    const error = new ApiError('Nope', 404, 'NOT_FOUND')
    expect(error.isNotFound).toBe(true)
    expect(error.isUnauthorized).toBe(false)
    expect(error.toBody()).toEqual({ code: 'NOT_FOUND', message: 'Nope' })
  })
})
