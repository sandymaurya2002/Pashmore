import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { PostCard } from '@/components/blog/post-card'
import { EmptyState } from '@/components/ui/empty-state'
import { JsonLd } from '@/components/seo/json-ld'

import { blogCategories, blogCategoryBySlug, getPostsByCategory } from '@/data/blog'
import { buildMetadata, metaDescription, pageTitle } from '@/lib/seo'
import { blogCategoryKeywords } from '@/lib/keywords'
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/jsonld'
import type { Breadcrumb } from '@/types'

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return blogCategories.map((category) => ({ slug: category.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const category = blogCategoryBySlug.get(slug)
  if (!category) return {}

  return buildMetadata({
    title: pageTitle(`${category.name} — Journal`),
    description: metaDescription(category.description),
    path: `/blog/category/${category.slug}`,
    keywords: blogCategoryKeywords(category.slug),
  })
}

export default async function BlogCategoryPage({ params }: PageProps) {
  const { slug } = await params
  const category = blogCategoryBySlug.get(slug)
  if (!category) notFound()

  const posts = getPostsByCategory(category.slug)

  const crumbs: Breadcrumb[] = [
    { name: 'Home', href: '/' },
    { name: 'Journal', href: '/blog' },
    { name: category.name, href: `/blog/category/${category.slug}` },
  ]

  return (
    <>
      <JsonLd
        id={`blog-category-${category.slug}`}
        data={graph([
          webPageSchema({
            path: `/blog/category/${category.slug}`,
            name: category.name,
            description: category.description,
          }),
          breadcrumbSchema(crumbs),
        ])}
      />

      <PageTitleBanner plainClassName="container-luxe pt-10">
        <Breadcrumbs items={crumbs} />
        <header className="max-w-2xl py-12">
          <p className="eyebrow text-gold">Journal</p>
          <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.05] text-charcoal md:text-[3.25rem]">
            {category.name}
          </h1>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-mocha">
            {category.description}
          </p>
        </header>
      </PageTitleBanner>

      <div className="container-luxe pb-24">
        <nav aria-label="Journal categories" className="border-y border-line py-5">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            <li>
              <Link
                href="/blog"
                className="inline-block py-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-charcoal/85 transition-colors hover:text-charcoal"
              >
                All
              </Link>
            </li>
            {blogCategories.map((entry) => (
              <li key={entry.slug}>
                <Link
                  href={`/blog/category/${entry.slug}`}
                  aria-current={entry.slug === category.slug ? 'page' : undefined}
                  className={
                    entry.slug === category.slug
                      ? 'inline-block py-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-charcoal'
                      : 'inline-block py-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-charcoal/85 transition-colors hover:text-charcoal'
                  }
                >
                  {entry.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {posts.length > 0 ? (
          <ul className="mt-16 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.slug}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            className="mt-10"
            title="Nothing here yet"
            description="We are still writing for this section. In the meantime, the rest of the journal is worth your time."
            actionHref="/blog"
            actionLabel="All articles"
          />
        )}
      </div>
    </>
  )
}
