import type { MetadataRoute } from 'next'
import { getAllCollections, getAllProducts } from '@/services/catalog'
import { getAllPosts, blogCategories } from '@/data/blog'
import { landingPages } from '@/data/landing'
import { siteUrl } from '@/lib/site'

/**
 * Public pages only. Cart, checkout, account, wishlist, login and internal
 * search are deliberately absent — they are transactional surfaces with nothing
 * to index, and robots.txt disallows them too.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, collections] = await Promise.all([getAllProducts(), getAllCollections()])
  const posts = getAllPosts()
  const now = new Date()

  const staticPages: MetadataRoute.Sitemap = (
    [
      { url: `${siteUrl}/`, changeFrequency: 'daily', priority: 1 },
      { url: `${siteUrl}/collections`, changeFrequency: 'weekly', priority: 0.9 },
      { url: `${siteUrl}/blog`, changeFrequency: 'weekly', priority: 0.8 },
      { url: `${siteUrl}/about`, changeFrequency: 'yearly', priority: 0.6 },
      { url: `${siteUrl}/craftsmanship`, changeFrequency: 'yearly', priority: 0.6 },
      { url: `${siteUrl}/contact`, changeFrequency: 'yearly', priority: 0.5 },
      { url: `${siteUrl}/shipping`, changeFrequency: 'yearly', priority: 0.4 },
      { url: `${siteUrl}/returns`, changeFrequency: 'yearly', priority: 0.4 },
      { url: `${siteUrl}/faqs`, changeFrequency: 'monthly', priority: 0.5 },
      { url: `${siteUrl}/track-order`, changeFrequency: 'yearly', priority: 0.3 },
      { url: `${siteUrl}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
      { url: `${siteUrl}/terms`, changeFrequency: 'yearly', priority: 0.2 },
    ] satisfies MetadataRoute.Sitemap
  ).map((entry) => ({ ...entry, lastModified: now }))

  return [
    ...staticPages,
    ...landingPages.map((page) => ({
      url: `${siteUrl}/${page.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...collections
      .filter((collection) => !collection.hidden)
      .map((collection) => ({
        url: `${siteUrl}/collections/${collection.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: collection.featured ? 0.9 : 0.7,
      })),
    ...products.map((product) => ({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: new Date(product.publishedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...blogCategories.map((category) => ({
      url: `${siteUrl}/blog/category/${category.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt ?? post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]
}
