import { site } from '@/lib/site'
import { absoluteUrl } from '@/lib/seo'
import { brandAlternateNames, knowsAbout, productKeywords, siteKeywords } from '@/lib/keywords'
import type { BlogPost, Breadcrumb, Collection, Product, ProductFaq } from '@/types'

/**
 * JSON-LD builders.
 *
 * Rules applied here, deliberately:
 *  - AggregateRating is emitted only when real rating data exists on the product.
 *  - FAQPage is emitted only when the same questions are visible on the page.
 *  - Every graph node carries an @id so pages can cross-reference the brand.
 */

type Json = Record<string, unknown>

export const organisationId = `${site.url}/#organization`
export const websiteId = `${site.url}/#website`

export function organisationSchema(): Json {
  return {
    '@type': 'Organization',
    '@id': organisationId,
    name: site.name,
    legalName: site.legalName,
    alternateName: [...brandAlternateNames],
    url: site.url,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl('/images/brand/pashmore-logo-512.png'),
      width: 512,
      height: 512,
    },
    description: site.description,
    foundingDate: site.founded,
    knowsAbout: [...knowsAbout],
    email: site.email,
    telephone: site.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: site.address.country,
    },
    sameAs: Object.values(site.social),
  }
}

export function websiteSchema(): Json {
  return {
    '@type': 'WebSite',
    '@id': websiteId,
    url: site.url,
    name: site.name,
    alternateName: [...brandAlternateNames],
    keywords: siteKeywords.join(', '),
    description: site.description,
    inLanguage: site.language,
    publisher: { '@id': organisationId },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${site.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function webPageSchema(input: {
  path: string
  name: string
  description: string
}): Json {
  return {
    '@type': 'WebPage',
    '@id': `${absoluteUrl(input.path)}#webpage`,
    url: absoluteUrl(input.path),
    name: input.name,
    description: input.description,
    isPartOf: { '@id': websiteId },
    inLanguage: site.language,
    about: { '@id': organisationId },
  }
}

export function breadcrumbSchema(items: Breadcrumb[]): Json {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  }
}

export function faqSchema(faqs: ProductFaq[]): Json {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
}

export function productSchema(product: Product): Json {
  const url = absoluteUrl(`/products/${product.slug}`)
  const inStock = product.inventory > 0

  const schema: Json = {
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: product.description,
    sku: product.variants[0]?.sku ?? product.slug.toUpperCase(),
    mpn: product.slug,
    url,
    image: product.images.map((image) => absoluteUrl(image.url)),
    brand: { '@type': 'Brand', name: site.name },
    manufacturer: { '@id': organisationId },
    material: product.material,
    pattern: product.pattern,
    keywords: productKeywords(product).join(', '),
    countryOfOrigin: product.countryOfOrigin,
    category: product.categorySlug,
    color: product.colors.map((color) => color.name).join(', '),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: product.currency,
      price: product.price,
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': organisationId },
      priceValidUntil: priceValidUntil(),
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: site.country,
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn',
      },
    },
  }

  // Only claim ratings when the data source actually supplied them.
  if (product.rating && product.rating.count > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: product.rating.average,
      reviewCount: product.rating.count,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return schema
}

function priceValidUntil(): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

export function collectionPageSchema(input: {
  collection: Collection
  path: string
  products: Product[]
}): Json {
  const url = absoluteUrl(input.path)
  return {
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: input.collection.heading ?? input.collection.name,
    description: input.collection.description,
    isPartOf: { '@id': websiteId },
    inLanguage: site.language,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: input.products.length,
      itemListElement: input.products.slice(0, 30).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/products/${product.slug}`),
        name: product.name,
      })),
    },
  }
}

export function blogPostingSchema(post: BlogPost): Json {
  const url = absoluteUrl(`/blog/${post.slug}`)
  return {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: post.title,
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { '@type': 'Person', name: post.author },
    publisher: { '@id': organisationId },
    image: [absoluteUrl(post.cover.url)],
    inLanguage: site.language,
    articleSection: post.category,
    wordCount: post.blocks
      .map((block) => ('text' in block ? block.text : ''))
      .join(' ')
      .split(/\s+/)
      .filter(Boolean).length,
  }
}

/** Wraps nodes into a single @graph so one script tag serves the whole page. */
export function graph(nodes: Json[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': nodes,
  })
}
