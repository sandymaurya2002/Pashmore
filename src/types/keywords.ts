/* ---------------------------------------------------------------- *
 * Keyword intelligence
 * ---------------------------------------------------------------- */

export type KeywordIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational'
  | 'brand'
  | 'local'

/** TOFU = awareness, MOFU = consideration, BOFU = purchase. */
export type FunnelStage = 'TOFU' | 'MOFU' | 'BOFU'

export type KeywordCategory =
  | 'core'
  | 'brand'
  | 'transactional'
  | 'product'
  | 'material'
  | 'kashmiri'
  | 'women'
  | 'men'
  | 'color'
  | 'style'
  | 'occasion'
  | 'seasonal'
  | 'price'
  | 'offer'
  | 'gift'
  | 'location'
  | 'near-me'
  | 'informational'
  | 'comparison'
  | 'authenticity'
  | 'quality'
  | 'long-tail'
  | 'question'
  | 'modifier'

export type Priority = 'very-high' | 'high' | 'medium' | 'low' | 'very-low'

/**
 * `measured` only when every market metric came from a real data source;
 * otherwise the score is built from on-site signals alone and is `estimated`.
 */
export type ScoreBasis = 'measured' | 'partial' | 'estimated'

export type PageAction =
  /** An existing page already targets this — optimise it. */
  | 'optimise-existing'
  /** No page covers this cluster yet and it justifies one. */
  | 'create'
  /** Too thin for its own page — cover it as a section of another page. */
  | 'merge-into'
  /** A question best answered as an FAQ entry on the target page. */
  | 'faq-entry'
  /** Real demand, but no page should exist (city, near-me, offers). */
  | 'no-page'
  /** Pashmore cannot honestly serve this (not stocked, unsupported claim). */
  | 'do-not-target'

export type ContentType =
  | 'homepage'
  | 'landing-page'
  | 'collection'
  | 'product'
  | 'blog-article'
  | 'faq'
  | 'policy'
  | 'google-business-profile'
  | 'none'

/**
 * Market metrics. Every field is `null` until a real source supplies it —
 * nothing here is ever estimated or invented.
 */
export interface KeywordMetrics {
  /** Average monthly searches. */
  searchVolume: number | null
  /** Cost per click in INR. */
  cpc: number | null
  /** Paid competition, 0–1. */
  competition: number | null
  /** Organic difficulty, 0–100. */
  seoDifficulty: number | null
  /** 12-month trend, −1 (falling) to 1 (rising). */
  trend: number | null
  source?: string
}

export interface KeywordRecord {
  keyword: string
  /** Word-order and plural-insensitive key; equal keys are the same search. */
  variantKey: string
  category: KeywordCategory
  /** Other seed sections the same keyword appeared in. */
  alsoIn: KeywordCategory[]
  cluster: string
  intent: KeywordIntent
  funnelStage: FunnelStage
  country: string
  language: string
  metrics: KeywordMetrics
  /** 0–1: how well Pashmore's real catalogue can satisfy this search. */
  relevance: number
  opportunityScore: number
  scoreBasis: ScoreBasis
  priority: Priority
  recommendedPage: string | null
  recommendedContentType: ContentType
  action: PageAction
  /** Uses words like "pure", "authentic" or "certified" that need documentation. */
  claimSensitive: boolean
  notes: string[]
  origin: 'seed' | 'generated'
}

export interface KeywordCluster {
  id: string
  name: string
  primaryKeyword: string
  targetUrl: string | null
  targetType: ContentType
  action: PageAction
  intent: KeywordIntent
  keywordCount: number
  secondary: string[]
  questions: string[]
  related: string[]
  topScore: number
  notes: string[]
}

export type CannibalizationFix = 'merge' | 'canonicalize' | 'redirect' | 'differentiate'

export interface CannibalizationIssue {
  severity: 'conflict' | 'watch'
  cluster: string
  urls: string[]
  reason: string
  recommendation: CannibalizationFix
  detail: string
}

export interface KeywordReport {
  generatedAt: string
  metricsSource: string | null
  records: KeywordRecord[]
  clusters: KeywordCluster[]
  issues: CannibalizationIssue[]
  stats: {
    total: number
    seed: number
    generated: number
    rejected: number
    withMetrics: number
  }
}
