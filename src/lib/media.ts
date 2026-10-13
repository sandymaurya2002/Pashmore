import type { ProductImage } from '@/types'

/**
 * Media URL resolution for images stored in Cloudflare R2.
 *
 * The Worker may return absolute URLs (R2 custom domain / r2.dev), its own
 * `/media/*` paths, or bare object keys. `/media/*` is joined onto the Worker
 * origin and keys onto CLOUDFLARE_R2_PUBLIC_URL. Absolute URLs are
 * only accepted from hosts that next.config.mjs also allows for next/image —
 * keep `allowedImageHosts` in step with `remotePatterns` there.
 */

export const PRODUCT_PLACEHOLDER = {
  url: '/images/placeholders/product.png',
  width: 800,
  height: 1000,
} as const

export const BANNER_PLACEHOLDER = {
  url: '/images/editorial/hero-heritage.png',
  width: 2000,
  height: 1150,
} as const

function hostOf(value: string | undefined): string | null {
  if (!value) return null
  try {
    return new URL(value).hostname
  } catch {
    return null
  }
}

export function allowedImageHosts(): string[] {
  const extra = (process.env.IMAGE_REMOTE_HOSTS ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
  return [
    hostOf(process.env.CLOUDFLARE_R2_PUBLIC_URL),
    hostOf(process.env.CLOUDFLARE_API_URL),
    ...extra,
  ].filter((host): host is string => Boolean(host))
}

function mediaBaseUrl(): string {
  return (process.env.CLOUDFLARE_R2_PUBLIC_URL ?? '').trim().replace(/\/+$/, '')
}

/** Returns a URL next/image can render, or null when the value is unusable. */
export function resolveMediaUrl(value: string | undefined | null): string | null {
  const url = (value ?? '').trim()
  if (!url) return null

  // Demo product shots are no longer shipped; legacy rows pointing at them get
  // the placeholder instead of a broken image.
  if (url.startsWith('/images/products/')) {
    console.warn(`[media] Ignoring legacy demo image path: ${url}`)
    return null
  }

  // Assets bundled with the storefront (brand marks, editorial imagery).
  if (url.startsWith('/images/')) return url

  if (/^(https?:)?\/\//i.test(url)) {
    const absolute = url.startsWith('//') ? `https:${url}` : url
    const host = hostOf(absolute)
    if (host && allowedImageHosts().includes(host)) return absolute
    console.warn(`[media] Ignoring image from unconfigured host: ${host ?? absolute}`)
    return null
  }

  // The Worker serves registered R2 objects itself under /media/*.
  if (url.startsWith('/media/')) {
    const api = process.env.CLOUDFLARE_API_URL
    if (api) {
      try {
        return `${new URL(api).origin}${url}`
      } catch {
        /* fall through */
      }
    }
    console.warn('[media] CLOUDFLARE_API_URL is not set; cannot resolve a /media path.')
    return null
  }

  const base = mediaBaseUrl()
  if (!base) {
    console.warn('[media] CLOUDFLARE_R2_PUBLIC_URL is not set; cannot resolve an R2 key.')
    return null
  }
  return `${base}/${url.replace(/^\/+/, '')}`
}

export function placeholderImage(alt: string): ProductImage {
  return { ...PRODUCT_PLACEHOLDER, alt }
}
