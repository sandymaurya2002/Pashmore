import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/cart',
          '/checkout',
          '/account',
          '/account/',
          '/wishlist',
          '/login',
          '/register',
          '/forgot-password',
          '/search',
          '/api/',
          '/admin',
          // Faceted URLs are useful to customers but are near-duplicates for
          // crawlers; the canonical, unfiltered collection page is what we want
          // indexed.
          '/*?*color=',
          '/*?*material=',
          '/*?*size=',
          '/*?*pattern=',
          '/*?*availability=',
          '/*?*minPrice=',
          '/*?*sort=',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
