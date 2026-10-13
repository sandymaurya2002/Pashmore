import { asString } from '@/lib/normalize/primitives'

const FIELDS = ['label', 'fullName', 'line1', 'line2', 'city', 'state', 'postalCode', 'country', 'phone'] as const

/** Keeps only the address fields the Worker accepts; the Worker validates values. */
export function pickAddressInput(body: Record<string, unknown>, partial = false) {
  const out: Record<string, unknown> = {}
  for (const field of FIELDS) {
    if (typeof body[field] === 'string') out[field] = asString(body[field])
    else if (!partial && field !== 'line2' && field !== 'label' && field !== 'country') out[field] = ''
  }
  if (out.line2 === '') out.line2 = null
  if (typeof body.isDefault === 'boolean') out.isDefault = body.isDefault
  return out
}

export function validAddressId(id: string): boolean {
  return /^[A-Za-z0-9_-]{1,64}$/.test(id)
}
