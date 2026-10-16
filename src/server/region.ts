import { cookies, headers } from 'next/headers'

import {
  currencyForCountry,
  DEFAULT_REGION,
  GEO_COOKIE,
  geoCountry,
  normalizeCountry,
  REGION_COOKIE,
  type Region,
} from '@/lib/region'

/**
 * Where the shopper is shopping from, in priority order:
 *  1. the region they picked in the selector (`pm_country` cookie),
 *  2. the edge's IP geolocation of this request (Vercel, Cloudflare or CloudFront),
 *  3. the country remembered from an earlier detection (`pm_geo` cookie),
 *  4. India.
 *
 * The result is forwarded to the Worker as `X-Client-Country` and as
 * `?currency=`. The Worker prices from the stored INR or USD amount — it
 * never converts — and checks the currency against the delivery country
 * when an order is placed.
 */

export function resolveRegion(
  choice: string | null | undefined,
  source: Headers,
  remembered?: string | null,
): Region {
  const chosen = normalizeCountry(choice)
  if (chosen) return { country: chosen, currency: currencyForCountry(chosen), source: 'choice' }
  const detected = geoCountry(source) ?? normalizeCountry(remembered)
  if (detected) return { country: detected, currency: currencyForCountry(detected), source: 'geo' }
  return DEFAULT_REGION
}

type CookieRequest = Request & { cookies?: { get(name: string): { value: string } | undefined } }

function cookieValue(request: CookieRequest, name: string): string | undefined {
  return request.cookies?.get(name)?.value ?? readCookie(request.headers.get('cookie'), name)
}

/** For route handlers, which have the request in hand. */
export function regionFromRequest(request: CookieRequest): Region {
  return resolveRegion(cookieValue(request, REGION_COOKIE), request.headers, cookieValue(request, GEO_COOKIE))
}

/**
 * The detected region, ignoring an explicit choice. Used when the shopper
 * clears the selector and we return to IP detection.
 */
export function detectedRegion(request: CookieRequest): Region {
  return resolveRegion(null, request.headers, cookieValue(request, GEO_COOKIE))
}

/** For Server Components. Reading cookies makes the page dynamic, as every priced page already is. */
export async function getRegion(): Promise<Region> {
  const [jar, source] = await Promise.all([cookies(), headers()])
  return resolveRegion(jar.get(REGION_COOKIE)?.value, source, jar.get(GEO_COOKIE)?.value)
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}
