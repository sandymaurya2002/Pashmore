import { normalizeCountry } from '@/lib/region'

/**
 * IP geolocation used only when the host did not send a country header.
 * Private, loopback, and documentation addresses are skipped so local
 * development stays on the India default without calling out.
 */

const LOOKUP_TIMEOUT_MS = 1200

function ipv4Parts(ip: string): number[] | null {
  const cleaned = ip.replace(/^::ffff:/i, '')
  const parts = cleaned.split('.')
  if (parts.length !== 4) return null
  const nums = parts.map((part) => Number(part))
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null
  return nums
}

/** True for a globally routable address. Documentation ranges (RFC 5737) are excluded. */
export function isPublicAddress(ip: string | null | undefined): boolean {
  if (!ip) return false
  const value = ip.trim()
  if (!value) return false
  const lower = value.toLowerCase()
  if (lower === '::1' || lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80:')) return false

  const v4 = ipv4Parts(value)
  if (!v4) return lower.includes(':')
  const [a, b, c] = v4
  if (a === 0 || a === 10 || a === 127) return false
  if (a === 169 && b === 254) return false
  if (a === 172 && b >= 16 && b <= 31) return false
  if (a === 192 && b === 168) return false
  if (a === 100 && b >= 64 && b <= 127) return false
  if (a === 192 && b === 0 && c === 2) return false
  if (a === 198 && b === 51 && c === 100) return false
  if (a === 203 && b === 0 && c === 113) return false
  if (a >= 224) return false
  return true
}

/** The visitor address from a proxy chain. The first hop is the client. */
export function clientAddress(source: { get(name: string): string | null }): string | null {
  const forwarded = source.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (forwarded) return forwarded
  return source.get('x-real-ip')?.trim() || null
}

/** Country code for a public IP, or null when the lookup cannot be trusted. */
export async function countryFromIp(ip: string | null | undefined): Promise<string | null> {
  if (!isPublicAddress(ip)) return null
  try {
    const response = await fetch(`https://get.geojs.io/v1/ip/country/${encodeURIComponent(ip!)}`, {
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
      headers: { Accept: 'text/plain' },
    })
    if (!response.ok) return null
    return normalizeCountry(await response.text())
  } catch {
    return null
  }
}
