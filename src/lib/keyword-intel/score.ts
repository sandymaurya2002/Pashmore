import type {
  FunnelStage,
  KeywordIntent,
  KeywordMetrics,
  Priority,
  ScoreBasis,
} from '@/types/keywords'

/**
 * SEO opportunity score, 0–100.
 *
 *   + search volume      up to 25   (market data)
 *   + commercial intent  up to 15   (classifier)
 *   + CPC                up to 10   (market data)
 *   + trend              up to  5   (market data)
 *   + Pashmore relevance up to 25   (catalogue check)
 *   + conversion         up to 20   (funnel × relevance)
 *   − SEO difficulty     up to 15   (market data)
 *   − competition        up to  5   (market data)
 *
 * Missing market data is never treated as zero or guessed. The score is
 * normalised over the components that are actually known and labelled
 * `estimated` (on-site signals only) or `partial` (some market data), so an
 * estimated 80 means "strong fit for Pashmore", not "proven demand".
 */

export const SCORE_WEIGHTS = {
  volume: 25,
  intent: 15,
  cpc: 10,
  trend: 5,
  relevance: 25,
  conversion: 20,
  difficulty: 15,
  competition: 5,
} as const

const INTENT_VALUE: Record<KeywordIntent, number> = {
  transactional: 1,
  commercial: 0.8,
  brand: 0.75,
  navigational: 0.6,
  local: 0.55,
  informational: 0.35,
}

const FUNNEL_VALUE: Record<FunnelStage, number> = { BOFU: 1, MOFU: 0.6, TOFU: 0.3 }

/** Volume at which the volume component maxes out. */
const VOLUME_CEILING = 50_000
/** CPC (INR) at which the CPC component maxes out. */
const CPC_CEILING = 60

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

export function scoreKeyword(input: {
  intent: KeywordIntent
  funnelStage: FunnelStage
  relevance: number
  metrics: KeywordMetrics
}): { score: number; basis: ScoreBasis } {
  const { metrics } = input
  let positive = 0
  let positiveMax = 0
  let penalty = 0
  let known = 0

  positive += INTENT_VALUE[input.intent] * SCORE_WEIGHTS.intent
  positive += clamp(input.relevance) * SCORE_WEIGHTS.relevance
  positive += FUNNEL_VALUE[input.funnelStage] * clamp(input.relevance) * SCORE_WEIGHTS.conversion
  positiveMax += SCORE_WEIGHTS.intent + SCORE_WEIGHTS.relevance + SCORE_WEIGHTS.conversion

  if (metrics.searchVolume !== null) {
    positive += clamp(Math.log10(metrics.searchVolume + 1) / Math.log10(VOLUME_CEILING + 1)) * SCORE_WEIGHTS.volume
    positiveMax += SCORE_WEIGHTS.volume
    known++
  }
  if (metrics.cpc !== null) {
    positive += clamp(metrics.cpc / CPC_CEILING) * SCORE_WEIGHTS.cpc
    positiveMax += SCORE_WEIGHTS.cpc
    known++
  }
  if (metrics.trend !== null) {
    positive += ((clamp(metrics.trend, -1, 1) + 1) / 2) * SCORE_WEIGHTS.trend
    positiveMax += SCORE_WEIGHTS.trend
    known++
  }
  if (metrics.seoDifficulty !== null) {
    penalty += clamp(metrics.seoDifficulty / 100) * SCORE_WEIGHTS.difficulty
    known++
  }
  if (metrics.competition !== null) {
    penalty += clamp(metrics.competition) * SCORE_WEIGHTS.competition
    known++
  }

  // Penalties are scaled by the same factor as the positives so a keyword
  // with full data and one with partial data sit on the same 0–100 scale.
  const scale = 100 / positiveMax
  const score = Math.round(clamp((positive - penalty) * scale, 0, 100))
  const basis: ScoreBasis = known === 5 ? 'measured' : known === 0 ? 'estimated' : 'partial'
  return { score, basis }
}

export function priorityFor(score: number): Priority {
  if (score >= 90) return 'very-high'
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  if (score >= 25) return 'low'
  return 'very-low'
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  'very-high': '🔥 Very High',
  high: '🟢 High',
  medium: '🟡 Medium',
  low: '🟠 Low',
  'very-low': '🔴 Very Low',
}

export const EMPTY_METRICS: KeywordMetrics = {
  searchVolume: null,
  cpc: null,
  competition: null,
  seoDifficulty: null,
  trend: null,
}
