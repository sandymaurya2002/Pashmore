import { keywordConfig } from '@/data/keyword-config'
import type {
  ContentType,
  KeywordCluster,
  KeywordIntent,
  KeywordMetrics,
  KeywordRecord,
  KeywordReport,
  PageAction,
} from '@/types/keywords'
import { checkStock, sellableProducts, type CatalogFacts, type StockCheck } from './catalog'
import { detectCannibalization } from './cannibalization'
import { classify, type Classification } from './classify'
import {
  clusterById,
  colorCluster,
  matchStaticCluster,
  NOT_SERVED,
  priceBandCluster,
  priceBandOf,
  type ClusterDef,
} from './clusters'
import { generateCandidates } from './generate'
import { hasAny, isQuestion, variantKey } from './normalize'
import { EMPTY_METRICS, priorityFor, scoreKeyword } from './score'

export type MetricsMap = Record<string, Partial<KeywordMetrics>>

/** Product clusters where a colour in the keyword makes it a colour search. */
const PRODUCT_CLUSTERS = new Set([
  'pure-pashmina', 'kashmiri-shawls', 'stoles', 'scarves', 'mens-shawls', 'womens-shawls',
  'winter', 'cashmere', 'fine-wool', 'luxury-shawls', 'pashmina-shawls', 'shawls', 'wedding-bridal',
])

const CLAIM_TERMS = ['pure', '100%', 'authentic', 'genuine', 'original', 'certified', 'gi', 'real']

const RELATED: Record<string, string[]> = {
  'pashmina-shawls': ['pure-pashmina', 'kashmiri-shawls', 'cashmere', 'fine-wool'],
  'pure-pashmina': ['authenticity-guide', 'pashmina-shawls', 'price-guide'],
  'kashmiri-shawls': ['pashmina-shawls', 'luxury-shawls', 'wedding-bridal'],
  stoles: ['scarves', 'compare-shawl-stole-scarf'],
  scarves: ['stoles', 'compare-shawl-stole-scarf'],
  'womens-shawls': ['gifts-for-her', 'stoles', 'wedding-bridal'],
  'mens-shawls': ['gifts-for-him', 'scarves'],
  'wedding-bridal': ['wedding-gifts', 'kashmiri-shawls'],
  gifting: ['gifts-for-her', 'gifts-for-him', 'corporate-gifts', 'festive'],
  care: ['what-is-pashmina', 'authenticity-guide'],
  'what-is-pashmina': ['compare-pashmina-cashmere', 'compare-pashmina-wool', 'authenticity-guide'],
  'price-guide': ['pashmina-shawls', 'pure-pashmina'],
  winter: ['pashmina-shawls', 'womens-shawls', 'mens-shawls'],
  'authenticity-guide': ['pure-pashmina', 'what-is-pashmina'],
}

interface Resolved {
  def: ClusterDef
  url: string | null
  type: ContentType
  action: PageAction
  notes: string[]
}

function resolveTarget(
  keyword: string,
  stock: StockCheck,
  facts: CatalogFacts,
  existing: Map<string, string>,
): Resolved {
  if (stock.rejectReason) {
    return { def: NOT_SERVED, url: null, type: 'none', action: 'do-not-target', notes: [stock.rejectReason] }
  }

  const min = keywordConfig.minProductsForCuratedPage
  let def = matchStaticCluster(keyword)
  let url = def.target.url
  let type = def.target.type
  const notes = [...(def.notes ?? [])]

  const band = priceBandOf(keyword)
  if (band !== null) {
    const inBand = sellableProducts(facts).filter((product) => product.price <= band).length
    def = priceBandCluster(band, inBand, min)
    url = def.target.url
    type = def.target.type
  } else if (stock.constraint.colorFamily && PRODUCT_CLUSTERS.has(def.id)) {
    def = colorCluster(stock.constraint.colorFamily)
    const inColor = sellableProducts(facts).filter((product) =>
      stock.constraint.colors!.some((slug) => product.colorSlugs.includes(slug)),
    )
    if (inColor.length >= min) {
      url = `/collections/${stock.constraint.colorFamily}-shawls`
      type = 'collection'
      notes.push(`${inColor.length} products in this colour family — enough for one curated colour page covering shawls, stoles and scarves.`)
    } else if (stock.matches.length > 0) {
      url = `/products/${stock.matches[0].slug}`
      type = 'product'
      notes.push(`Only ${inColor.length} product(s) in this colour family — optimise the product page; a colour page would be thin.`)
    } else {
      return {
        def: NOT_SERVED,
        url: null,
        type: 'none',
        action: 'do-not-target',
        notes: [`No ${stock.constraint.colorTerm} product of this type — closest: ${inColor.map((p) => p.name).join(', ')}.`],
      }
    }
  }

  if (def.target.noPage) {
    return {
      def,
      url: null,
      type: def.target.type,
      action: def.target.type === 'google-business-profile' ? 'optimise-existing' : 'no-page',
      notes: [...notes, def.target.noPage],
    }
  }

  // Never propose a page whose URL is a near-duplicate of one that exists.
  if (url && !existing.has(url)) {
    const twin = existing.get(`key:${variantKey(url.split('/').pop() ?? '')}`)
    if (twin) url = twin
  }

  let action: PageAction = url && existing.has(url) ? 'optimise-existing' : 'create'
  if (def.target.mergeNote) {
    action = 'merge-into'
    notes.push(def.target.mergeNote)
  }
  return { def, url, type, action, notes }
}

function relevanceFor(keyword: string, c: Classification, stock: StockCheck, def: ClusterDef): { value: number; notes: string[] } {
  const notes: string[] = []
  if (stock.rejectReason) return { value: 0.05, notes }

  let value = 0.55
  if (hasAny(keyword, ['pashmina', 'pashm', 'pashmeena', 'kashmiri', 'kashmir', 'pashmore'])) value += 0.25
  else if (hasAny(keyword, ['cashmere', 'shawl', 'shawls', 'stole', 'stoles', 'stols', 'scarf', 'wrap'])) value += 0.1

  if (stock.matches.length >= keywordConfig.minProductsForCuratedPage) value += 0.1
  if (stock.gap) {
    value *= 0.5
    notes.push('Catalogue gap: no product matches every attribute in this search — a merchandising opportunity, not a page.')
  }
  if (hasAny(keyword, ['cheap', 'affordable'])) {
    value = Math.min(value, 0.25)
    notes.push('Off-positioning for a luxury brand — attracts buyers who bounce on price.')
  }
  if (c.isNearMe && !keywordConfig.physicalStore) value = Math.min(value, 0.2)
  if (c.isCity) value = Math.min(value, 0.35)
  if (def.id === 'offers' || def.id === 'brand-offers') value = Math.min(value, keywordConfig.activeOffers.length ? 0.9 : 0.15)
  if (def.id === 'location-international') value = Math.min(value, 0.5)
  // Demand you are told not to build a page for is not an opportunity yet.
  if (def.target.noPage) value = Math.min(value, 0.4)

  return { value: Math.max(0, Math.min(1, value)), notes }
}

function mergeMetrics(keyword: string, map: MetricsMap): KeywordMetrics {
  const entry = map[keyword]
  return entry ? { ...EMPTY_METRICS, ...entry } : { ...EMPTY_METRICS }
}

export function buildKeywordReport(
  facts: CatalogFacts,
  metrics: MetricsMap = {},
  metricsSource: string | null = null,
): KeywordReport {
  const { candidates, rejected } = generateCandidates(facts)

  const existing = new Map<string, string>()
  for (const page of facts.pages) {
    existing.set(page.url, page.url)
    existing.set(`key:${variantKey(page.url.split('/').pop() || 'home')}`, page.url)
  }

  // Exact duplicates across seed sections collapse into one record.
  const unique = new Map<string, KeywordRecord>()
  for (const candidate of candidates) {
    const known = unique.get(candidate.keyword)
    if (known) {
      if (known.category !== candidate.category && !known.alsoIn.includes(candidate.category)) {
        known.alsoIn.push(candidate.category)
      }
      continue
    }

    const keyword = candidate.keyword
    const c = classify(keyword)
    const stock = checkStock(keyword, facts)
    const target = resolveTarget(keyword, stock, facts, existing)
    const relevance = relevanceFor(keyword, c, stock, target.def)
    const notes = [...target.notes, ...relevance.notes]

    const claimSensitive = hasAny(keyword, CLAIM_TERMS) && c.intent !== 'informational'
    let relevanceValue = relevance.value
    if (claimSensitive && !keywordConfig.verifiedClaims.purePashmina) {
      relevanceValue = Math.max(0, relevanceValue - 0.1)
      notes.push('Claim-sensitive: confirm lab fibre / GI documentation before using this wording in titles or copy.')
    }

    let action = target.action
    if (
      isQuestion(keyword) &&
      target.url &&
      ['landing-page', 'collection', 'homepage', 'policy'].includes(target.type) &&
      action !== 'do-not-target'
    ) {
      action = 'faq-entry'
    }

    const recordMetrics = mergeMetrics(keyword, metrics)
    const { score, basis } = scoreKeyword({
      intent: c.intent,
      funnelStage: c.funnelStage,
      relevance: relevanceValue,
      metrics: recordMetrics,
    })

    unique.set(keyword, {
      keyword,
      variantKey: variantKey(keyword),
      category: candidate.category,
      alsoIn: [],
      cluster: target.def.id,
      intent: c.intent,
      funnelStage: c.funnelStage,
      country: c.country,
      language: keywordConfig.language,
      metrics: recordMetrics,
      relevance: Math.round(relevanceValue * 100) / 100,
      opportunityScore: score,
      scoreBasis: basis,
      priority: priorityFor(score),
      recommendedPage: target.url,
      recommendedContentType: target.type,
      action,
      claimSensitive,
      notes,
      origin: candidate.origin,
    })
  }

  const records = [...unique.values()]

  // Near-duplicates ("pashmina shawls" / "shawl pashmina") share one page.
  const firstByVariant = new Map<string, KeywordRecord>()
  for (const record of [...records].sort((a, b) => b.opportunityScore - a.opportunityScore)) {
    const first = firstByVariant.get(record.variantKey)
    if (!first) firstByVariant.set(record.variantKey, record)
    else record.notes.push(`Same search as "${first.keyword}" — one page serves both.`)
  }

  const clusters = summariseClusters(records)
  const issues = detectCannibalization(facts.pages, records)

  return {
    generatedAt: new Date().toISOString(),
    metricsSource,
    records: records.sort((a, b) => b.opportunityScore - a.opportunityScore || a.keyword.localeCompare(b.keyword)),
    clusters,
    issues,
    stats: {
      total: records.length,
      seed: records.filter((record) => record.origin === 'seed').length,
      generated: records.filter((record) => record.origin === 'generated').length,
      rejected,
      withMetrics: records.filter((record) => record.scoreBasis !== 'estimated').length,
    },
  }
}

export function summariseClusters(records: KeywordRecord[]): KeywordCluster[] {
  const groups = new Map<string, KeywordRecord[]>()
  for (const record of records) groups.set(record.cluster, [...(groups.get(record.cluster) ?? []), record])

  const primaryOf = new Map<string, string>()
  const clusters: KeywordCluster[] = []

  for (const [id, group] of groups) {
    const sorted = [...group].sort((a, b) => b.opportunityScore - a.opportunityScore)
    const def = clusterById.get(id)
    const preferred = def?.primary && group.find((record) => record.keyword === def.primary)
    const primary = preferred || sorted[0]
    primaryOf.set(id, primary.keyword)

    const intentCounts = new Map<KeywordIntent, number>()
    for (const record of group) intentCounts.set(record.intent, (intentCounts.get(record.intent) ?? 0) + 1)
    const intent = [...intentCounts.entries()].sort((a, b) => b[1] - a[1])[0][0]

    const actionable = group.filter((record) => record.action !== 'faq-entry' && record.action !== 'do-not-target')
    const representative = actionable.find((record) => record === primary) ?? actionable[0] ?? primary
    // Small colour families map each keyword to its own best product.
    const perKeyword = new Set(actionable.map((record) => record.recommendedPage)).size > 1

    clusters.push({
      id,
      name: def?.name ?? group[0].cluster.replace(/-/g, ' '),
      primaryKeyword: primary.keyword,
      targetUrl: perKeyword ? null : representative.recommendedPage,
      targetType: representative.recommendedContentType,
      action: representative.action,
      intent,
      keywordCount: group.length,
      secondary: sorted
        .filter((record) => record !== primary && !isQuestion(record.keyword))
        .slice(0, 10)
        .map((record) => record.keyword),
      questions: sorted.filter((record) => isQuestion(record.keyword)).map((record) => record.keyword),
      related: [],
      topScore: sorted[0].opportunityScore,
      notes: perKeyword
        ? ['Each keyword maps to its best-matching product page.']
        : [...new Set(representative.notes.filter((note) => !note.startsWith('Same search')))],
    })
  }

  for (const cluster of clusters) {
    cluster.related = (RELATED[cluster.id] ?? [])
      .map((id) => primaryOf.get(id))
      .filter((value): value is string => Boolean(value))
  }

  return clusters.sort((a, b) => b.topScore - a.topScore)
}

/**
 * Re-scores a report with newly imported metrics. Runs in the browser when an
 * admin imports a Keyword Planner / Search Console export.
 */
export function applyMetrics(report: KeywordReport, metrics: MetricsMap, source: string | null): KeywordReport {
  const records = report.records.map((record) => {
    const merged: KeywordMetrics = { ...record.metrics, ...(metrics[record.keyword] ?? {}) }
    const { score, basis } = scoreKeyword({
      intent: record.intent,
      funnelStage: record.funnelStage,
      relevance: record.relevance,
      metrics: merged,
    })
    return { ...record, metrics: merged, opportunityScore: score, scoreBasis: basis, priority: priorityFor(score) }
  })
  records.sort((a, b) => b.opportunityScore - a.opportunityScore || a.keyword.localeCompare(b.keyword))

  return {
    ...report,
    metricsSource: source ?? report.metricsSource,
    records,
    clusters: summariseClusters(records),
    stats: { ...report.stats, withMetrics: records.filter((record) => record.scoreBasis !== 'estimated').length },
  }
}

export type { CatalogFacts, CatalogProduct, SitePage } from './catalog'
export { productTypeOf } from './catalog'
