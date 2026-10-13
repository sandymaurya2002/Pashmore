/**
 * Tolerant readers for Worker payloads.
 *
 * D1 is SQLite: decimals may arrive as strings, booleans as 0/1 and JSON
 * columns as serialised text. These helpers accept all of those so a schema
 * detail in the Worker never becomes a crash in a page.
 */

export type Raw = Record<string, unknown>

export function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseJsonText(value: string): unknown {
  const trimmed = value.trim()
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return undefined
  try {
    return JSON.parse(trimmed)
  } catch {
    return undefined
  }
}

export function asRecord(value: unknown): Raw {
  if (isRecord(value)) return value
  if (typeof value === 'string') {
    const parsed = parseJsonText(value)
    if (isRecord(parsed)) return parsed
  }
  return {}
}

export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    const parsed = parseJsonText(value)
    if (Array.isArray(parsed)) return parsed
  }
  return []
}

export function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

export function asOptionalString(value: unknown): string | undefined {
  const result = asString(value)
  return result ? result : undefined
}

export function asOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined
  const result = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(result) ? result : undefined
}

export function asNumber(value: unknown, fallback = 0): number {
  return asOptionalNumber(value) ?? fallback
}

export function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === '1' || value === 'true'
}

/** Accepts a string array, a JSON array string, or newline-separated text. */
export function asStringArray(value: unknown, splitText = /\n+/): string[] {
  if (typeof value === 'string' && !value.trim().startsWith('[')) {
    return value
      .split(splitText)
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return asArray(value)
    .map((entry) => asString(entry))
    .filter(Boolean)
}

export function asIsoDate(value: unknown): string | undefined {
  const text = asOptionalString(value)
  if (!text) return undefined
  const date = new Date(text)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}
