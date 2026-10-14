import type { Metadata } from 'next'

import { absoluteUrl } from '@/lib/seo'
import { getSeoOverride } from '@/server/content'

/**
 * Applies the SEO override saved for `path` in the admin dashboard (SEO &
 * Redirects) on top of a page's own metadata. Fields left empty in the admin
 * keep the page's defaults; with no override, or if the CMS is unreachable,
 * the page's metadata is returned unchanged.
 */
export async function withSeoOverride(path: string, base: Metadata): Promise<Metadata> {
  const override = await getSeoOverride(path)
  if (!override) return base

  const title = override.title
  const description = override.description
  const canonical = override.canonicalUrl ? absoluteUrl(override.canonicalUrl) : undefined
  const image = override.ogImageUrl ? absoluteUrl(override.ogImageUrl) : undefined
  const robotsChanged = !override.robotsIndex || !override.robotsFollow

  return {
    ...base,
    ...(title ? { title: { absolute: title } } : {}),
    ...(description ? { description } : {}),
    ...(override.keywords.length ? { keywords: override.keywords } : {}),
    ...(canonical ? { alternates: { ...base.alternates, canonical } } : {}),
    ...(robotsChanged
      ? {
          robots: {
            index: override.robotsIndex,
            follow: override.robotsFollow,
          },
        }
      : {}),
    openGraph: {
      ...base.openGraph,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(canonical ? { url: canonical } : {}),
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      ...base.twitter,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(image ? { images: [image] } : {}),
    },
  }
}
