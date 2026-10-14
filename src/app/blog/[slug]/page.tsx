import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { BlockRenderer } from '@/components/blog/block-renderer'
import { PostCard } from '@/components/blog/post-card'
import { ProductGrid } from '@/components/product/product-grid'
import { SectionHeading } from '@/components/ui/section-heading'
import { JsonLd } from '@/components/seo/json-ld'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { blogCategoryBySlug, getPostBySlug, getRelatedPosts } from '@/data/blog'
import { getAllCollections, getProductsBySlugs } from '@/services/catalog'
import { failSoft } from '@/server/fail-soft'
import { buildMetadata, metaDescription, pageTitle } from '@/lib/seo'
import { blogKeywords } from '@/lib/keywords'
import { blogPostingSchema, breadcrumbSchema, faqSchema, graph } from '@/lib/jsonld'
import { formatDate } from '@/lib/utils'
import type { Breadcrumb } from '@/types'
import { withSeoOverride } from '@/server/seo'

interface PageProps {
  params: Promise<{ slug: string }>
}

// The article is static content, but the "pieces mentioned" grid shows live
// stock and prices, so the page renders per request.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  return withSeoOverride(
    `/blog/${post.slug}`,
    buildMetadata({
      title: pageTitle(post.title),
      description: metaDescription(post.excerpt),
      path: `/blog/${post.slug}`,
      image: post.cover,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      keywords: blogKeywords(post),
    }),
  )
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const category = blogCategoryBySlug.get(post.category)
  const related = getRelatedPosts(post, 3)
  const [products, allCollections] = await Promise.all([
    failSoft(getProductsBySlugs(post.relatedProductSlugs ?? []), [], 'blog:products'),
    post.relatedCollectionSlugs?.length
      ? failSoft(getAllCollections(), [], 'blog:collections')
      : Promise.resolve([]),
  ])
  const collections = (post.relatedCollectionSlugs ?? [])
    .map((entry) => allCollections.find((collection) => collection.slug === entry))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))

  const crumbs: Breadcrumb[] = [
    { name: 'Home', href: '/' },
    { name: 'Journal', href: '/blog' },
    ...(category
      ? [{ name: category.name, href: `/blog/category/${category.slug}` }]
      : []),
    { name: post.title, href: `/blog/${post.slug}` },
  ]

  return (
    <>
      <JsonLd
        id={`post-${post.slug}`}
        data={graph([
          blogPostingSchema(post),
          breadcrumbSchema(crumbs),
          ...(post.faqs?.length ? [faqSchema(post.faqs)] : []),
        ])}
      />

      <article>
        <div className="container-luxe pt-10">
          <Breadcrumbs items={crumbs} />
        </div>

        <header className="container-luxe max-w-3xl py-12 text-center">
          {category && (
            <Link
              href={`/blog/category/${category.slug}`}
              className="eyebrow text-gold transition-opacity hover:opacity-70"
            >
              {category.name}
            </Link>
          )}
          <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.08] text-charcoal md:text-[3.25rem]">
            {post.title}
          </h1>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-mocha">{post.excerpt}</p>
          <p className="mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.625rem] uppercase tracking-[0.16em] text-taupe">
            <span>{post.author}</span>
            <span aria-hidden>·</span>
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} min read</span>
          </p>
        </header>

        <div className="container-luxe">
          <div className="relative aspect-3/2 w-full overflow-hidden bg-ivory-deep md:aspect-video">
            <Image
              src={post.cover.url}
              alt={post.cover.alt}
              fill
              priority
              quality={82}
              sizes="(min-width: 1600px) 100rem, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="container-luxe max-w-[44rem] py-16">
          <BlockRenderer blocks={post.blocks} />

          {post.faqs?.length ? (
            <section className="mt-16" aria-labelledby="post-faqs">
              <h2
                id="post-faqs"
                className="font-serif text-[1.625rem] leading-tight text-charcoal md:text-[2rem]"
              >
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="mt-6">
                {post.faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`faq-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ) : null}

          {collections.length > 0 && (
            <nav aria-label="Related collections" className="mt-14 border-t border-line pt-8">
              <p className="eyebrow mb-4 text-taupe">Related collections</p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {collections.map((collection) => (
                  <li key={collection.slug}>
                    <Link
                      href={`/collections/${collection.slug}`}
                      className="link-underline text-sm text-charcoal/90 hover:text-charcoal"
                    >
                      {collection.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </article>

      {products.length > 0 && (
        <section
          className="container-luxe border-t border-line py-20"
          aria-labelledby="post-products"
        >
          <SectionHeading
            id="post-products"
            eyebrow="From the collection"
            title="Pieces mentioned in this article"
          />
          <ProductGrid products={products} className="mt-12" columns={3} />
        </section>
      )}

      {related.length > 0 && (
        <section
          className="container-luxe border-t border-line py-20"
          aria-labelledby="related-articles"
        >
          <SectionHeading
            id="related-articles"
            title="Continue reading"
            href="/blog"
            linkLabel="All articles"
          />
          <ul className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-3">
            {related.map((entry) => (
              <li key={entry.slug}>
                <PostCard post={entry} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
