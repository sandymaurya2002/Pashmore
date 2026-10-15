import { cache } from 'react'

import { ApiError } from '@/lib/api/envelope'
import {
  asArray,
  asBoolean,
  asNumber,
  asOptionalString,
  asRecord,
  asString,
} from '@/lib/normalize/primitives'
import { resolveMediaUrl } from '@/lib/media'
import type { Currency } from '@/lib/region'
import { announcements as staticAnnouncements, FREE_SHIPPING_THRESHOLD } from '@/lib/site'
import { failSoft } from '@/server/fail-soft'
import { workerFetch } from '@/server/worker'

/**
 * Website content managed from the admin dashboard (settings, homepage
 * banners and sections, CMS pages, SEO overrides, redirects).
 *
 * Reads are cached in the Next Data Cache under the `content` tag; the Worker
 * calls /api/revalidate with that tag after every admin change, so edits show
 * up within seconds. Every reader falls back to the site's built-in content if
 * the Worker is unreachable, so the storefront never breaks on a CMS outage.
 */

const CONTENT_CACHE = { revalidate: 300, tags: ['content'] }

export interface CommerceRules {
  /** The currency every amount below is in. */
  currency: Currency
  freeShippingThreshold: number
  standardShippingFee: number
  expressShippingFee: number
  /** Zero where cash on delivery is not offered (outside India). */
  codLimit: number
  returnWindowDays: number
}

export interface SiteContent {
  announcement: { enabled: boolean; messages: string[] }
  /** India (INR) rules. */
  commerce: CommerceRules
  /** Shipping and payment rules for each shopping region's currency. */
  commerceByCurrency: Record<Currency, CommerceRules>
  payments: { online: boolean; cod: boolean }
  settings: Record<string, unknown>
}

const DEFAULT_INR_RULES: CommerceRules = {
  currency: 'INR',
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  standardShippingFee: 149,
  expressShippingFee: 499,
  codLimit: 20000,
  returnWindowDays: 14,
}

/** Mirrors the Worker's defaults for international orders. */
const DEFAULT_USD_RULES: CommerceRules = {
  currency: 'USD',
  freeShippingThreshold: 250,
  standardShippingFee: 25,
  expressShippingFee: 45,
  codLimit: 0,
  returnWindowDays: 14,
}

/** Used until the admin's settings have loaded. */
export const DEFAULT_COMMERCE: Record<Currency, CommerceRules> = { INR: DEFAULT_INR_RULES, USD: DEFAULT_USD_RULES }

const DEFAULT_SITE: SiteContent = {
  announcement: { enabled: true, messages: [...staticAnnouncements] },
  commerce: DEFAULT_INR_RULES,
  commerceByCurrency: DEFAULT_COMMERCE,
  payments: { online: false, cod: false },
  settings: {},
}

function normalizeRules(input: unknown, fallback: CommerceRules): CommerceRules {
  const raw = asRecord(input)
  return {
    currency: fallback.currency,
    freeShippingThreshold: asNumber(raw.freeShippingThreshold, fallback.freeShippingThreshold),
    standardShippingFee: asNumber(raw.standardShippingFee, fallback.standardShippingFee),
    expressShippingFee: asNumber(raw.expressShippingFee, fallback.expressShippingFee),
    codLimit: asNumber(raw.codLimit, fallback.codLimit),
    returnWindowDays: asNumber(raw.returnWindowDays, fallback.returnWindowDays),
  }
}

async function loadSite(): Promise<SiteContent> {
  const { data } = await workerFetch<unknown>('/content/site', {
    cache: CONTENT_CACHE,
  })
  const raw = asRecord(data)
  const announcement = asRecord(raw.announcement)
  const byCurrency = asRecord(raw.commerceByCurrency)
  const payments = asRecord(raw.payments)
  const messages = asArray(announcement.messages)
    .map((message) => asString(message).trim())
    .filter(Boolean)
  const inr = normalizeRules(byCurrency.INR ?? raw.commerce, DEFAULT_INR_RULES)
  return {
    announcement: {
      enabled: announcement.enabled === undefined ? true : asBoolean(announcement.enabled),
      messages: messages.length ? messages : DEFAULT_SITE.announcement.messages,
    },
    commerce: inr,
    commerceByCurrency: { INR: inr, USD: normalizeRules(byCurrency.USD, DEFAULT_USD_RULES) },
    payments: {
      online: asBoolean(payments.razorpay),
      cod: asBoolean(payments.cod),
    },
    settings: asRecord(raw.settings),
  }
}

export const getSiteContent = cache(() => failSoft(loadSite(), DEFAULT_SITE, 'content/site'))

/* ------------------------------------------------------------------ *
 * Homepage
 * ------------------------------------------------------------------ */

export interface Banner {
  id: string
  placement: string
  heading: string
  subheading?: string
  eyebrow?: string
  ctaLabel?: string
  href?: string
  secondaryCtaLabel?: string
  secondaryHref?: string
  mediaType: 'IMAGE' | 'VIDEO'
  imageUrl?: string
  mobileImageUrl?: string
  videoUrl?: string
  imageAlt: string
  /** PAGE_BANNER only: "*", an exact path, or a section wildcard such as "/collections/*". */
  pagePath?: string
}

/** One entry of a repeated list: a heritage chapter, category card, Instagram tile or menu card. */
export interface HomeSectionItem {
  /** Fixed slot the entry belongs to, e.g. the menu ("Men") of a menu card. */
  key?: string
  eyebrow?: string
  heading?: string
  /** Paragraphs separated by a blank line. */
  body?: string
  imageUrl?: string
  imageAlt?: string
  href?: string
  linkLabel?: string
}

/**
 * A homepage block as edited in the admin (Website → Homepage). Every copy
 * field is optional; components fall back to their built-in text.
 */
export interface HomeSection {
  key: string
  type: string
  heading?: string
  subheading?: string
  eyebrow?: string
  /** Extra paragraph(s) below `subheading`. */
  body?: string
  imageUrl?: string
  imageAlt?: string
  href?: string
  linkLabel?: string
  secondaryHref?: string
  secondaryLinkLabel?: string
  items?: HomeSectionItem[]
  isActive: boolean
}

export interface HomeContent {
  sections: HomeSection[]
  banners: Record<string, Banner[]>
}

/** Only same-site paths and http(s) URLs are allowed as banner links and media. */
export function safeUrl(value: unknown): string | undefined {
  const url = asOptionalString(value)?.trim()
  if (!url) return undefined
  if (url.startsWith('/') && !url.startsWith('//')) return url
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.toString()
      : undefined
  } catch {
    return undefined
  }
}

function normalizeBanner(input: unknown): Banner | null {
  const raw = asRecord(input)
  const id = asString(raw.id)
  if (!id) return null
  const videoUrl = resolveMediaUrl(asOptionalString(raw.videoUrl)) ?? undefined
  const imageUrl = resolveMediaUrl(asOptionalString(raw.imageUrl)) ?? undefined
  if (!imageUrl && !videoUrl) return null
  const heading = asString(raw.heading)
  return {
    id,
    placement: asString(raw.placement),
    heading,
    subheading: asOptionalString(raw.subheading),
    eyebrow: asOptionalString(raw.eyebrow),
    ctaLabel: asOptionalString(raw.ctaLabel),
    href: safeUrl(raw.href),
    secondaryCtaLabel: asOptionalString(raw.secondaryCtaLabel),
    secondaryHref: safeUrl(raw.secondaryHref),
    mediaType: asString(raw.mediaType).toUpperCase() === 'VIDEO' && videoUrl ? 'VIDEO' : 'IMAGE',
    imageUrl,
    mobileImageUrl: resolveMediaUrl(asOptionalString(raw.mobileImageUrl)) ?? undefined,
    videoUrl,
    imageAlt: asString(raw.imageAlt) || heading,
    pagePath: asOptionalString(raw.pagePath),
  }
}

async function loadHome(): Promise<HomeContent> {
  const { data } = await workerFetch<unknown>('/content/home', {
    cache: CONTENT_CACHE,
  })
  const raw = asRecord(data)
  const banners: Record<string, Banner[]> = {}
  for (const [placement, list] of Object.entries(asRecord(raw.banners))) {
    banners[placement] = asArray(list)
      .map(normalizeBanner)
      .filter((banner): banner is Banner => Boolean(banner))
  }
  const sections = asArray(raw.sections).map((entry): HomeSection => {
    const section = asRecord(entry)
    const heading = asOptionalString(section.heading)
    const subheading = asOptionalString(section.subheading)
    return {
      key: asString(section.key),
      type: asString(section.type),
      heading: heading && SEED_HEADINGS.has(heading) ? undefined : heading,
      subheading: subheading?.startsWith('Placement:') ? undefined : subheading,
      eyebrow: asOptionalString(section.eyebrow),
      body: asOptionalString(section.body),
      imageUrl: resolveMediaUrl(asOptionalString(section.imageUrl)) ?? undefined,
      imageAlt: asOptionalString(section.imageAlt),
      href: safeUrl(section.href),
      linkLabel: asOptionalString(section.linkLabel),
      secondaryHref: safeUrl(section.secondaryHref),
      secondaryLinkLabel: asOptionalString(section.secondaryLinkLabel),
      items: asArray(section.items).map(normalizeSectionItem),
      isActive: section.isActive === undefined ? true : asBoolean(section.isActive),
    }
  })
  return { sections, banners }
}

/** The admin labels the sections were seeded with; never shown to customers. */
const SEED_HEADINGS = new Set([
  'Hero',
  'Editorial introduction',
  'Shop by category',
  'Featured banner',
  'Heritage story',
  'Gift packaging banner',
  'Gifting banner',
  'Trust bar',
  'Recently viewed',
  'Social grid',
])

function normalizeSectionItem(input: unknown): HomeSectionItem {
  const item = asRecord(input)
  return {
    key: asOptionalString(item.key),
    eyebrow: asOptionalString(item.eyebrow),
    heading: asOptionalString(item.heading),
    body: asOptionalString(item.body),
    imageUrl: resolveMediaUrl(asOptionalString(item.imageUrl)) ?? undefined,
    imageAlt: asOptionalString(item.imageAlt),
    href: safeUrl(item.href),
    linkLabel: asOptionalString(item.linkLabel),
  }
}

export const getHomeContent = cache(() =>
  failSoft<HomeContent | null>(loadHome(), null, 'content/home'),
)

async function loadPageBanners(): Promise<Banner[]> {
  const { data } = await workerFetch<unknown>('/content/banners', {
    query: { placement: 'PAGE_BANNER' },
    cache: CONTENT_CACHE,
  })
  return asArray(data)
    .map(normalizeBanner)
    .filter((banner): banner is Banner => Boolean(banner?.pagePath))
}

/** Every live page banner; the layout picks the one for the current path. */
export const getPageBanners = cache(() => failSoft(loadPageBanners(), [], 'content/page-banners'))

/* ------------------------------------------------------------------ *
 * CMS pages
 * ------------------------------------------------------------------ */

export interface CmsPage {
  slug: string
  title: string
  eyebrow?: string
  intro?: string
  updatedLabel?: string
  sections: Array<{ heading: string; body: string[]; list?: string[] }>
  faqs: Array<{ question: string; answer: string }>
  metaTitle?: string
  metaDescription?: string
}

function normalizePage(input: unknown): CmsPage | null {
  const raw = asRecord(input)
  const slug = asString(raw.slug)
  const title = asString(raw.title)
  if (!slug || !title) return null
  const sections = asArray(raw.sections).map((entry) => {
    const section = asRecord(entry)
    const list = asArray(section.list)
      .map((item) => asString(item))
      .filter(Boolean)
    return {
      heading: asString(section.heading),
      body: asArray(section.body)
        .map((paragraph) => asString(paragraph))
        .filter(Boolean),
      ...(list.length ? { list } : {}),
    }
  })
  const faqs = asArray(raw.faqs)
    .map((entry) => {
      const faq = asRecord(entry)
      return { question: asString(faq.question), answer: asString(faq.answer) }
    })
    .filter((faq) => faq.question && faq.answer)
  return {
    slug,
    title,
    eyebrow: asOptionalString(raw.eyebrow),
    intro: asOptionalString(raw.intro),
    updatedLabel: asOptionalString(raw.updatedLabel),
    sections,
    faqs,
    metaTitle: asOptionalString(raw.metaTitle),
    metaDescription: asOptionalString(raw.metaDescription),
  }
}

/** A published CMS page, or null when the page is not managed in the CMS (or the CMS is down). */
export const getCmsPage = cache(async (slug: string): Promise<CmsPage | null> => {
  try {
    const { data } = await workerFetch<unknown>(`/content/pages/${encodeURIComponent(slug)}`, {
      cache: CONTENT_CACHE,
    })
    return normalizePage(data)
  } catch (error) {
    if (!(error instanceof ApiError && error.isNotFound)) {
      console.error('[content/page]', slug, (error as Error)?.message)
    }
    return null
  }
})

/* ------------------------------------------------------------------ *
 * SEO overrides and redirects
 * ------------------------------------------------------------------ */

export interface SeoOverride {
  title?: string
  description?: string
  keywords: string[]
  canonicalUrl?: string
  ogImageUrl?: string
  robotsIndex: boolean
  robotsFollow: boolean
}

export const getSeoOverride = cache(async (path: string): Promise<SeoOverride | null> => {
  const result = await failSoft(
    workerFetch<unknown>('/content/seo', {
      query: { path },
      cache: CONTENT_CACHE,
    }),
    null,
    'content/seo',
  )
  if (!result?.data) return null
  const raw = asRecord(result.data)
  return {
    title: asOptionalString(raw.title),
    description: asOptionalString(raw.description),
    keywords: asArray(raw.keywords)
      .map((keyword) => asString(keyword))
      .filter(Boolean),
    canonicalUrl: safeUrl(raw.canonicalUrl),
    ogImageUrl: resolveMediaUrl(asOptionalString(raw.ogImageUrl)) ?? undefined,
    robotsIndex: raw.robotsIndex === undefined ? true : asBoolean(raw.robotsIndex),
    robotsFollow: raw.robotsFollow === undefined ? true : asBoolean(raw.robotsFollow),
  }
})
