import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DELETE as forgetRegion, GET as getRegion, POST as chooseRegion } from '@/app/api/region/route'
import { countryCode, currencyForDestination, normalizeCountry } from '@/lib/region'
import { resolveRegion } from '@/server/region'
import { WORKER_ORIGIN, mockWorker, request, responseCookies, success } from './helpers'

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('region resolution', () => {
  it('uses India and rupees when nothing is known', () => {
    expect(resolveRegion(null, new Headers())).toEqual({ country: 'IN', currency: 'INR', source: 'default' })
  })

  it('reads the first trustworthy geolocation header', () => {
    expect(resolveRegion(null, new Headers({ 'x-vercel-ip-country': 'us' }))).toEqual({
      country: 'US',
      currency: 'USD',
      source: 'geo',
    })
    // Cloudflare's "unknown" and "Tor" codes are not countries.
    expect(resolveRegion(null, new Headers({ 'cf-ipcountry': 'XX' })).source).toBe('default')
    expect(resolveRegion(null, new Headers({ 'cf-ipcountry': 'T1' })).source).toBe('default')
  })

  it('prefers the shopper choice over geolocation', () => {
    expect(resolveRegion('IN', new Headers({ 'cf-ipcountry': 'GB' }))).toEqual({
      country: 'IN',
      currency: 'INR',
      source: 'choice',
    })
  })

  it('maps delivery countries to their invoicing currency', () => {
    expect(currencyForDestination('India')).toBe('INR')
    expect(currencyForDestination(' bharat ')).toBe('INR')
    expect(currencyForDestination('United States')).toBe('USD')
    expect(countryCode('United Kingdom')).toBe('GB')
    expect(normalizeCountry('<script>')).toBeNull()
  })
})

describe('/api/region', () => {
  const site = () => mockWorker({ 'GET /content/site': success({}) })

  it('describes the detected region with its shipping rules', async () => {
    site()
    const response = await getRegion(request('/api/region', { headers: { 'x-vercel-ip-country': 'AU' } }))
    const { data } = await response.json()
    expect(data).toMatchObject({ country: 'AU', currency: 'USD', source: 'geo', commerce: { currency: 'USD' } })
  })

  it('remembers a chosen country in an HttpOnly cookie', async () => {
    site()
    const response = await chooseRegion(request('/api/region', { method: 'POST', body: { country: 'gb' } }))
    const { data } = await response.json()
    expect(data).toMatchObject({ country: 'GB', currency: 'USD', source: 'choice', countryName: 'United Kingdom' })
    const cookie = responseCookies(response).pm_country
    expect(cookie.value).toBe('GB')
    expect(cookie.attributes).toContain('httponly')
  })

  it('rejects unknown countries', async () => {
    const { fetchMock } = mockWorker({})
    const response = await chooseRegion(request('/api/region', { method: 'POST', body: { country: 'ZZ' } }))
    expect(response.status).toBe(400)
    expect(responseCookies(response).pm_country).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forgets the choice and falls back to geolocation', async () => {
    site()
    const response = await forgetRegion(
      request('/api/region', { method: 'DELETE', cookies: { pm_country: 'US' }, headers: { 'cf-ipcountry': 'IN' } }),
    )
    expect((await response.json()).data).toMatchObject({ country: 'IN', currency: 'INR' })
    expect(responseCookies(response).pm_country.attributes).toContain('max-age=0')
  })
})
