import { countryTerms, indianCities } from '@/data/keyword-seeds'
import { keywordConfig } from '@/data/keyword-config'
import type { FunnelStage, KeywordIntent } from '@/types/keywords'
import { hasAny, hasTerm, isQuestion } from './normalize'

export interface Classification {
  intent: KeywordIntent
  funnelStage: FunnelStage
  country: string
  isCity: boolean
  isNearMe: boolean
  isBrand: boolean
}

const TRANSACTIONAL = [
  'buy', 'order', 'shop', 'shopping', 'store', 'sale', 'discount', 'offer', 'offers', 'deal',
  'deals', 'coupon', 'clearance', 'online',
]
const PRICE = ['price', 'prices', 'cost', 'costs', 'cheap', 'affordable', 'expensive', 'how much']
const COMMERCIAL = [
  'best', 'top', 'review', 'reviews', 'premium', 'luxury', 'designer', 'gift', 'brand',
  'finest', 'softest', 'high quality',
]
/** Comparison and verification questions sit in the consideration stage. */
const CONSIDERATION = [
  'vs', 'or', 'difference', 'same as', 'identify', 'check', 'test', 'fake', 'real', 'know if',
  'quality', 'best', 'authentic', 'genuine', 'certification', 'authenticity', 'expensive',
  'cost', 'how much', 'warm',
]

export function detectCountry(keyword: string): { country: string; isCity: boolean } {
  if (hasAny(keyword, indianCities)) return { country: 'IN', isCity: true }
  const term = Object.keys(countryTerms)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => hasTerm(keyword, candidate))
  return { country: term ? countryTerms[term] : keywordConfig.homeCountry, isCity: false }
}

/**
 * Rule-based intent classification. Rules run most-specific first; the first
 * that fires wins. Deterministic on purpose — the same keyword always lands in
 * the same bucket, so reports are comparable over time.
 */
export function classify(keyword: string): Classification {
  const { country, isCity } = detectCountry(keyword)
  const isNearMe = keyword.includes('near me')
  const isBrand = hasTerm(keyword, 'pashmore')

  const result = (intent: KeywordIntent, funnelStage: FunnelStage): Classification => ({
    intent,
    funnelStage,
    country,
    isCity,
    isNearMe,
    isBrand,
  })

  if (isBrand) {
    return /^pashmore( (official|website|store|shop|online))?$/.test(keyword)
      ? result('navigational', 'BOFU')
      : result('brand', 'BOFU')
  }
  if (isNearMe || isCity) return result('local', 'BOFU')

  if (/\b(where (to|can i) buy|best place to buy)\b/.test(keyword)) return result('commercial', 'BOFU')

  if (isQuestion(keyword) || hasAny(keyword, ['vs', 'guide', 'explained', 'history'])) {
    return result('informational', hasAny(keyword, CONSIDERATION) ? 'MOFU' : 'TOFU')
  }
  if (/\bor\b/.test(keyword)) return result('informational', 'MOFU')

  if (hasAny(keyword, TRANSACTIONAL) || /\bunder \d/.test(keyword)) return result('transactional', 'BOFU')
  if (hasAny(keyword, PRICE)) return result('commercial', 'BOFU')
  if (hasAny(keyword, COMMERCIAL)) return result('commercial', 'MOFU')

  // A bare material or concept ("pashmina", "pashmina fabric") is mostly
  // research; a product noun ("pashmina shawl") is mostly shopping.
  if (/^(pashmina|pashm|cashmere)( (wool|fabric|material|cloth|quality|authenticity|certification))?$/.test(keyword)) {
    return result('informational', hasAny(keyword, CONSIDERATION) ? 'MOFU' : 'TOFU')
  }
  return result('commercial', 'MOFU')
}
