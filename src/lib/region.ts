/**
 * Shopping regions. Visitors in India shop in rupees; everyone else shops in
 * US dollars. Both price lists are entered in the admin — nothing is ever
 * converted. The Worker re-derives the currency on every request and checks
 * it against the delivery country when an order is placed, so this module only
 * decides what to *ask* for and how to label it.
 */

export const CURRENCIES = ['INR', 'USD'] as const
export type Currency = (typeof CURRENCIES)[number]

export const HOME_COUNTRY = 'IN'
export const DEFAULT_CURRENCY: Currency = 'INR'

/** The customer's explicit choice from the region selector. */
export const REGION_COOKIE = 'pm_country'
/** Last country detected from the visitor's IP, kept so later pages stay in the same currency. */
export const GEO_COOKIE = 'pm_geo'
export const REGION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/** Edge platforms that already geolocate the visitor. The first trustworthy value wins. */
const GEO_HEADERS = ['x-vercel-ip-country', 'cf-ipcountry', 'cloudfront-viewer-country', 'x-country-code']

/** Cloudflare reports unknown visitors as XX and Tor exits as T1; neither is a country. */
const NOT_A_COUNTRY = new Set(['XX', 'T1'])

export const CURRENCY_SYMBOL: Record<Currency, string> = { INR: '₹', USD: '$' }

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (CURRENCIES as readonly string[]).includes(value)
}

/** A two-letter ISO 3166 code, upper-cased, or null. */
export function normalizeCountry(value: string | null | undefined): string | null {
  const code = value?.trim().toUpperCase()
  return code && /^[A-Z]{2}$/.test(code) && !NOT_A_COUNTRY.has(code) ? code : null
}

/** Country reported by the edge, or null when the host did not geolocate this request. */
export function geoCountry(source: { get(name: string): string | null }): string | null {
  for (const name of GEO_HEADERS) {
    const country = normalizeCountry(source.get(name))
    if (country) return country
  }
  return null
}

export function currencyForCountry(country: string | null | undefined): Currency {
  const code = normalizeCountry(country)
  if (!code) return DEFAULT_CURRENCY
  return code === HOME_COUNTRY ? 'INR' : 'USD'
}

const INDIA_NAMES = new Set(['india', 'in', 'ind', 'bharat', 'republic of india'])

/** Addresses store the country as text ("India", "United States"); mirrors the Worker. */
export function isIndia(country: string | null | undefined): boolean {
  return INDIA_NAMES.has((country ?? '').trim().toLowerCase())
}

export function currencyForDestination(country: string | null | undefined): Currency {
  return isIndia(country) ? 'INR' : 'USD'
}

/** ISO 3166-1 alpha-2 codes offered by the region and address selectors. */
const COUNTRY_CODES = (
  'AD AE AF AG AI AL AM AO AR AT AU AW AZ BA BB BD BE BF BG BH BI BJ BM BN BO BR BS BT BW BY BZ ' +
  'CA CD CG CH CI CK CL CM CN CO CR CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR ' +
  'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IS IT ' +
  'JE JM JO JP KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ' +
  'ML MM MN MO MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NZ OM PA PE PF PG PH PK PL ' +
  'PR PS PT PW PY QA RE RO RS RW SA SB SC SE SG SI SK SL SM SN SO SR SS ST SV SX SZ TC TD TG TH TJ ' +
  'TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WS XK YE YT ZA ZM ZW'
).split(' ')

const FALLBACK_NAMES: Record<string, string> = { IN: 'India', US: 'United States', GB: 'United Kingdom', XK: 'Kosovo' }

let displayNames: Intl.DisplayNames | null | undefined

/** English country name for a code, e.g. "US" → "United States". */
export function countryName(code: string): string {
  if (displayNames === undefined) {
    try {
      displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
    } catch {
      displayNames = null
    }
  }
  return FALLBACK_NAMES[code] ?? displayNames?.of(code) ?? code
}

export interface CountryOption {
  code: string
  name: string
}

/** India first, then every other country alphabetically. */
export const COUNTRIES: CountryOption[] = [
  { code: HOME_COUNTRY, name: countryName(HOME_COUNTRY) },
  ...COUNTRY_CODES.filter((code) => code !== HOME_COUNTRY)
    .map((code) => ({ code, name: countryName(code) }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en')),
]

/** Resolves free-text address countries ("United States", "us") to a code. */
export function countryCode(country: string | null | undefined): string | null {
  const text = (country ?? '').trim()
  if (!text) return null
  if (isIndia(text)) return HOME_COUNTRY
  const direct = normalizeCountry(text)
  if (direct && COUNTRY_CODES.includes(direct)) return direct
  const lower = text.toLowerCase()
  return COUNTRIES.find((entry) => entry.name.toLowerCase() === lower)?.code ?? null
}

export interface Region {
  country: string
  currency: Currency
  /** `choice` when the customer picked it, `geo` when detected, `default` otherwise. */
  source: 'choice' | 'geo' | 'default'
}

export const DEFAULT_REGION: Region = { country: HOME_COUNTRY, currency: DEFAULT_CURRENCY, source: 'default' }
