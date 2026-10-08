import { keywordConfig } from '@/data/keyword-config'
import type { CannibalizationIssue, KeywordRecord } from '@/types/keywords'
import type { SitePage } from './catalog'
import { clusterById, matchStaticCluster } from './clusters'
import { variantKey } from './normalize'

const GENDER_TOKENS = new Set(['women', 'men'])
const PRODUCT_NOUNS = new Set([
  'shawl', 'stole', 'scarf', 'wrap', 'dupatta', 'dupattas', 'dress', 'dresses', 'suit', 'suits',
  'jacket', 'jackets', 'accessories', 'pashmina',
])

/**
 * Pages that differ only by audience ("/collections/scarves",
 * "/collections/mens-scarves", "/collections/womens-scarves") or that sell
 * different products to the same audience ("womens-shawls" vs
 * "womens-dupattas") are a hierarchy, not a clash.
 */
function isLegitimateSplit(a: string, b: string): boolean {
  const ta = new Set(a.split(' '))
  const tb = new Set(b.split(' '))
  const diff = [...ta].filter((t) => !tb.has(t)).concat([...tb].filter((t) => !ta.has(t)))
  if (diff.length > 0 && diff.every((token) => GENDER_TOKENS.has(token))) return true

  const nounsA = [...ta].filter((t) => PRODUCT_NOUNS.has(t))
  const nounsB = [...tb].filter((t) => PRODUCT_NOUNS.has(t))
  if (nounsA.length === 0 || nounsB.length === 0) return false
  if (nounsA.some((noun) => nounsB.includes(noun))) return false
  // "Pashmina" names a material sold as shawls, stoles, scarves and wraps, so
  // a pashmina page genuinely overlaps those — but not dupattas or dresses.
  const [material, other] = nounsA.includes('pashmina') ? [nounsA, nounsB] : [nounsB, nounsA]
  if (material.length === 1 && material[0] === 'pashmina') return !other.some((noun) => SHAWL_FAMILY.has(noun))
  return true
}

const SHAWL_FAMILY = new Set(['shawl', 'stole', 'scarf', 'wrap'])

const EXCLUDED_TYPE_TOKENS: Record<string, string[]> = {
  jacket: ['jacket', 'jackets'],
  suit: ['suit', 'suits'],
  blanket: ['blanket', 'blankets'],
}

function pageCluster(page: SitePage): string {
  const def = matchStaticCluster(page.primaryKeyword)
  // An article only competes with another article in a dedicated
  // informational cluster ("how to wash" vs "how to care"). Craft history and
  // a commercial guide that happen to share a topic word are different needs.
  if (page.type === 'blog-article' && !def.informational) return `page:${page.url}`
  return def.id
}

/**
 * Finds pages that compete for the same search.
 *
 *  conflict — same search, same intent: one URL should win (merge + 301, or canonical).
 *  watch    — same search, different intent (landing "help me decide" vs
 *             collection "show me products"). Legitimate only while each page
 *             keeps its own H1, copy and FAQs.
 */
export function detectCannibalization(pages: SitePage[], records: KeywordRecord[]): CannibalizationIssue[] {
  const issues: CannibalizationIssue[] = []
  const indexable = pages.filter((page) => page.type !== 'product' && page.type !== 'policy')

  const enriched = indexable.map((page) => ({
    page,
    key: variantKey(page.primaryKeyword),
    cluster: pageCluster(page),
  }))

  // 1. Pages built for the identical search.
  const byKey = new Map<string, typeof enriched>()
  for (const entry of enriched) byKey.set(entry.key, [...(byKey.get(entry.key) ?? []), entry])

  const reported = new Set<string>()
  for (const [key, group] of byKey) {
    if (group.length < 2) continue
    const urls = group.map((entry) => entry.page.url)
    urls.forEach((url) => reported.add(url))
    const intents = new Set(group.map((entry) => entry.page.intent))
    const sameType = new Set(group.map((entry) => entry.page.type)).size === 1

    issues.push(
      intents.size === 1
        ? {
            severity: 'conflict',
            cluster: group[0].cluster,
            urls,
            reason: `${urls.length} pages target "${key}" with the same intent.`,
            recommendation: sameType ? 'merge' : 'canonicalize',
            detail: sameType
              ? 'Merge the content into the stronger URL and 301-redirect the other.'
              : 'Pick one URL to rank and point the other’s canonical at it.',
          }
        : {
            severity: 'watch',
            cluster: group[0].cluster,
            urls,
            reason: `Same search "${key}", different intents (${[...intents].join(' vs ')}).`,
            recommendation: 'differentiate',
            detail:
              'Fine by design while each page keeps a distinct H1, title, copy and FAQs, and they link to each other. Merge if Search Console shows them swapping positions.',
          },
    )
  }

  // 2. Different wording, same cluster and intent.
  const byCluster = new Map<string, typeof enriched>()
  for (const entry of enriched) {
    if (entry.cluster === 'unclustered' || entry.cluster.startsWith('page:')) continue
    byCluster.set(entry.cluster, [...(byCluster.get(entry.cluster) ?? []), entry])
  }

  for (const [cluster, group] of byCluster) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]
        const b = group[j]
        if (a.key === b.key || a.page.intent !== b.page.intent) continue
        if (reported.has(a.page.url) && reported.has(b.page.url)) continue
        if (isLegitimateSplit(a.key, b.key)) continue
        const informational = clusterById.get(cluster)?.informational
        issues.push({
          severity: informational ? 'conflict' : 'watch',
          cluster,
          urls: [a.page.url, b.page.url],
          reason: `Both pages fall in the "${clusterById.get(cluster)?.name ?? cluster}" cluster with ${a.page.intent} intent.`,
          recommendation: informational ? 'merge' : 'differentiate',
          detail: informational
            ? 'Two articles answering one question split links and rankings. Merge into one and 301 the other.'
            : 'Give each a clearly different head term in its title and H1 (e.g. the subset vs the whole range) and link the narrower page from the broader one.',
        })
      }
    }
  }

  // 3. The same search resolved into different clusters — the engine would
  //    send it to two pages.
  const byVariant = new Map<string, KeywordRecord[]>()
  for (const record of records) {
    if (record.action === 'do-not-target' || record.action === 'no-page') continue
    byVariant.set(record.variantKey, [...(byVariant.get(record.variantKey) ?? []), record])
  }
  for (const group of byVariant.values()) {
    const targets = new Set(group.map((record) => record.recommendedPage).filter(Boolean))
    if (targets.size < 2) continue
    issues.push({
      severity: 'conflict',
      cluster: group[0].cluster,
      urls: [...targets] as string[],
      reason: `"${group.map((record) => record.keyword).join('", "')}" are the same search but map to different pages.`,
      recommendation: 'differentiate',
      detail: 'Choose one target page for all of them and adjust the cluster rules.',
    })
  }

  // 4. Indexable pages for product types the business does not sell.
  for (const entry of enriched) {
    const tokens = entry.key.split(' ')
    const unsold = (keywordConfig.excludedProductTypes as readonly string[]).find((type) =>
      (EXCLUDED_TYPE_TOKENS[type] ?? [type]).some((token) => tokens.includes(token)),
    )
    if (!unsold) continue
    issues.push({
      severity: 'conflict',
      cluster: 'not-served',
      urls: [entry.page.url],
      reason: `Indexable page for ${unsold}s, which Pashmore does not sell.`,
      recommendation: 'redirect',
      detail: 'Remove it from navigation and the sitemap, and 301 it to the closest relevant collection (or return 410 if nothing fits).',
    })
  }

  return issues.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'conflict' ? -1 : 1))
}
