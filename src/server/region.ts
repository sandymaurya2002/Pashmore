import { cookies, headers } from 'next/headers'

import {
  currencyForCountry,
  DEFAULT_REGION,
  normalizeCountry,
  REGION_COOKIE,
  type Region,
} from '@/lib/region'

/**
 * Where the shopper is shopping from, in priority order:
 *  1. the region they picked in the selector (`pm_country` cookie),
 *  2. the edge's IP geolocation of the visitor (Vercel, Cloudflare or CloudFront),
 *  3. India.
 *
 * The result is forwarded to the Worker as `X-Client-Country`; the Worker
 * prices everything from it and enforces it again at checkout.
 */

const GEO_HEADERS = ['x-vercel-ip-country', 'cf-ipcountry', 'cloudfront-viewer-country', 'x-country-code']

export function geoCountry(source: Headers): string | null {
  for (const name of GEO_HEADERS) {
    const country = normalizeCountry(source.get(name))
    if (country) return country
  }
  return null
}

export function resolveRegion(choice: string | null | undefined, source: Headers): Region {
  const chosen = normalizeCountry(choice)
  if (chosen) return { country: chosen, currency: currencyForCountry(chosen), source: 'choice' }
  const detected = geoCountry(source)
  if (detected) return { country: detected, currency: currencyForCountry(detected), source: 'geo' }
  return DEFAULT_REGION
}

/** For route handlers and middleware, which have the request in hand. */
export function regionFromRequest(request: Request & { cookies?: { get(name: string): { value: string } | undefined } }): Region {
  const choice = request.cookies?.get(REGION_COOKIE)?.value ?? readCookie(request.headers.get('cookie'), REGION_COOKIE)
  return resolveRegion(choice, request.headers)
}

/** For Server Components. Reading cookies makes the page dynamic, as every priced page already is. */
export async function getRegion(): Promise<Region> {
  const [jar, source] = await Promise.all([cookies(), headers()])
  return resolveRegion(jar.get(REGION_COOKIE)?.value, source)
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}
