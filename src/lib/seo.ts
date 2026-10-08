import type { Metadata } from 'next'
import { site, siteUrl } from '@/lib/site'
import { siteKeywords } from '@/lib/keywords'
import type { ProductImage } from '@/types'

interface BuildMetadataInput {
  title: string
  description: string
  /** Path only, e.g. `/collections/womens-shawls`. */
  path: string
  image?: Pick<ProductImage, 'url' | 'alt' | 'width' | 'height'>
  /** Set on cart / account / search style routes. */
  noIndex?: boolean
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  keywords?: string[]
}

export function absoluteUrl(path: string): string {
  if (path.startsWith('http')) return path
  return `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Every route builds its metadata through here so that canonical URLs, Open
 * Graph, Twitter cards and robots directives can never be forgotten on one page
 * and present on another.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  type = 'website',
  publishedTime,
  modifiedTime,
  authors,
  keywords,
}: BuildMetadataInput): Metadata {
  const url = absoluteUrl(path)
  const ogImage = image ?? site.defaultOgImage

  return {
    // Absolute: callers pass a complete title (usually via `pageTitle`), so the
    // root layout's `%s | Pashmore` template must not append the brand twice.
    title: { absolute: title },
    description,
    keywords: keywords ?? siteKeywords,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type,
      title,
      description,
      url,
      siteName: site.name,
      locale: site.locale,
      images: [
        {
          url: absoluteUrl(ogImage.url),
          width: ogImage.width,
          height: ogImage.height,
          alt: ogImage.alt,
        },
      ],
      ...(type === 'article'
        ? { publishedTime, modifiedTime, authors }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl(ogImage.url)],
      creator: '@pashmore',
      site: '@pashmore',
    },
  }
}

/** `Ivory Heritage Pashmina Shawl | Pashmore` */
export function pageTitle(value: string): string {
  return `${value} | ${site.name}`
}

/** Trims to a length search engines will actually render. */
export function metaDescription(value: string, max = 158): string {
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}
