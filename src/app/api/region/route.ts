import type { NextRequest } from 'next/server'

import { ApiError } from '@/lib/api/envelope'
import { asString } from '@/lib/normalize/primitives'
import {
  COUNTRIES,
  countryName,
  normalizeCountry,
  REGION_COOKIE,
  REGION_COOKIE_MAX_AGE,
  type Region,
} from '@/lib/region'
import { getSiteContent } from '@/server/content'
import { fail, ok, readJson } from '@/server/http'
import { detectedRegion, regionFromRequest, resolveRegion } from '@/server/region'
import { baseCookie } from '@/server/session'

/**
 * The shopping region: detected from the visitor's IP, or chosen in the
 * region selector. Choosing one only changes which price list is shown; the
 * Worker still checks the currency against the delivery country at checkout.
 */

async function describe(region: Region) {
  const { commerceByCurrency } = await getSiteContent()
  return { ...region, countryName: countryName(region.country), commerce: commerceByCurrency[region.currency] }
}

export async function GET(request: NextRequest) {
  try {
    return ok(await describe(regionFromRequest(request)))
  } catch (error) {
    return fail(error, 'region')
  }
}

export async function POST(request: NextRequest) {
  try {
    const country = normalizeCountry(asString((await readJson(request)).country))
    if (!country || !COUNTRIES.some((entry) => entry.code === country)) {
      throw new ApiError('Please choose a country.', 400, 'VALIDATION_ERROR', { country: 'Unknown country.' })
    }
    const response = ok(await describe(resolveRegion(country, request.headers)))
    response.cookies.set(REGION_COOKIE, country, { ...baseCookie(), maxAge: REGION_COOKIE_MAX_AGE })
    return response
  } catch (error) {
    return fail(error, 'region')
  }
}

/** Forgets the choice, going back to the detected region. */
export async function DELETE(request: NextRequest) {
  try {
    const response = ok(await describe(detectedRegion(request)))
    response.cookies.set(REGION_COOKIE, '', { ...baseCookie(), maxAge: 0 })
    return response
  } catch (error) {
    return fail(error, 'region')
  }
}
