import type { Banner } from '@/server/content'

/**
 * Pages an every-page ("*") banner skips: the homepage has its own hero, and
 * cart, checkout, account and sign-in flows should stay uncluttered. A banner
 * aimed at one of these paths exactly still shows.
 */
const SITE_WIDE_EXCLUDED = /^\/($|cart|checkout|account|admin|login|register|forgot-password|reset-password)(\/|$)/

function normalize(path: string): string {
  const clean = path.split(/[?#]/)[0]!.replace(/\/+$/, '').toLowerCase()
  return clean || '/'
}

/**
 * The banner for a storefront path: an exact match wins over a section
 * wildcard ("/collections/*", the longest one first), which wins over "*".
 * Within each level the first banner in admin sort order is used.
 */
export function pageBannerFor(banners: Banner[], pathname: string): Banner | undefined {
  const path = normalize(pathname)
  let best: { banner: Banner; rank: number } | undefined

  for (const banner of banners) {
    const target = banner.pagePath
    if (!target) continue
    let rank = -1
    if (target === '*') {
      if (!SITE_WIDE_EXCLUDED.test(path)) rank = 0
    } else if (target.endsWith('/*')) {
      const base = normalize(target.slice(0, -2))
      if (path === base || path.startsWith(`${base}/`)) rank = 1 + base.length
    } else if (normalize(target) === path) {
      rank = Number.MAX_SAFE_INTEGER
    }
    if (rank >= 0 && (!best || rank > best.rank)) best = { banner, rank }
  }

  return best?.banner
}
