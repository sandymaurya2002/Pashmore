import 'server-only'

import { getAllPosts } from '@/data/blog'
import { landingPages } from '@/data/landing'
import staticMetrics from '@/data/keyword-metrics.json'
import { getAllCollections, getAllProducts, getAvailability } from '@/services/catalog'
import { buildKeywordReport, productTypeOf, type CatalogFacts, type MetricsMap, type SitePage } from '@/lib/keyword-intel'
import { slugToPhrase } from '@/lib/keyword-intel/normalize'
import type { KeywordReport } from '@/types/keywords'

/**
 * The keyword service is the only module that knows where keyword facts and
 * metrics come from. Today: the live Worker catalogue plus a static metrics JSON.
 * To move to a database or a metrics API (Keyword Planner, Search Console,
 * DataForSEO…), replace `getMetrics` and nothing else changes.
 */

async function getCatalogFacts(): Promise<CatalogFacts> {
  const [products, collections] = await Promise.all([getAllProducts(), getAllCollections()])

  const pages: SitePage[] = [
    { url: '/', type: 'homepage', primaryKeyword: 'pashmore', intent: 'brand' },
    ...landingPages.map<SitePage>((page) => ({
      url: `/${page.slug}`,
      type: 'landing-page',
      primaryKeyword: slugToPhrase(page.slug),
      intent: 'commercial',
    })),
    ...collections
      .filter((collection) => !collection.hidden)
      .map<SitePage>((collection) => ({
        url: `/collections/${collection.slug}`,
        type: 'collection',
        primaryKeyword: slugToPhrase(collection.slug),
        intent: 'transactional',
      })),
    ...getAllPosts().map<SitePage>((post) => ({
      url: `/blog/${post.slug}`,
      type: 'blog-article',
      primaryKeyword: slugToPhrase(post.slug),
      intent: 'informational',
    })),
    ...products.map<SitePage>((product) => ({
      url: `/products/${product.slug}`,
      type: 'product',
      primaryKeyword: product.name.toLowerCase(),
      intent: 'transactional',
    })),
    ...['shipping', 'returns', 'faqs', 'craftsmanship', 'about', 'contact'].map<SitePage>((slug) => ({
      url: `/${slug}`,
      type: slug === 'faqs' ? 'faq' : 'policy',
      primaryKeyword: slug,
      intent: 'informational',
    })),
  ]

  return {
    products: products.map((product) => ({
      slug: product.slug,
      name: product.name,
      type: productTypeOf(product.name, product.categorySlug),
      gender: product.gender,
      materialSlug: product.materialSlug,
      patternSlug: product.patternSlug,
      colorSlugs: product.colors.map((color) => color.slug),
      collectionSlugs: product.collectionSlugs,
      price: product.price,
      inStock: getAvailability(product) !== 'out-of-stock',
    })),
    pages,
  }
}

async function getMetrics(): Promise<{ metrics: MetricsMap; source: string | null }> {
  return {
    metrics: (staticMetrics.metrics ?? {}) as MetricsMap,
    source: staticMetrics.source,
  }
}

export async function getKeywordReport(): Promise<KeywordReport> {
  const [facts, { metrics, source }] = await Promise.all([getCatalogFacts(), getMetrics()])
  return buildKeywordReport(facts, metrics, source)
}
