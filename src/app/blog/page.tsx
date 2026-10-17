import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { Reveal } from '@/components/motion/reveal'
import { JsonLd } from '@/components/seo/json-ld'
import { PostCard, PostMeta } from '@/components/blog/post-card'

import { blogCategories, getAllPosts } from '@/data/blog'
import { buildMetadata, pageTitle } from '@/lib/seo'
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/jsonld'
import type { Breadcrumb } from '@/types'
import { withSeoOverride } from '@/server/seo'

const DESCRIPTION =
  'The Pashmore Journal — guides to Pashmina, Kashmiri craft and Indian textiles, written by the people who make them.'

const BASE_METADATA: Metadata = buildMetadata({
  title: pageTitle('Journal — Pashmina Guides & Kashmiri Craft'),
  description: DESCRIPTION,
  path: '/blog',
})

export function generateMetadata(): Promise<Metadata> {
  return withSeoOverride('/blog', BASE_METADATA)
}

export const revalidate = 3600

const crumbs: Breadcrumb[] = [
  { name: 'Home', href: '/' },
  { name: 'Journal', href: '/blog' },
]

export default function BlogIndexPage() {
  const posts = getAllPosts()
  const [lead, ...rest] = posts

  return (
    <>
      <JsonLd
        id="blog-index"
        data={graph([
          webPageSchema({ path: '/blog', name: 'Pashmore Journal', description: DESCRIPTION }),
          breadcrumbSchema(crumbs),
        ])}
      />

      <PageTitleBanner plainClassName="container-luxe pt-10">
        <Breadcrumbs items={crumbs} />
        <header className="max-w-2xl py-12">
          <p className="eyebrow text-gold">Journal</p>
          <h1 className="mt-5 font-serif type-display text-charcoal">
            The Pashmore Journal
          </h1>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-mocha">{DESCRIPTION}</p>
        </header>
      </PageTitleBanner>

      <div className="container-luxe pb-24">
        <nav aria-label="Journal categories" className="border-y border-line py-5">
          <ul className="flex flex-wrap gap-x-6 gap-y-3">
            {blogCategories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/blog/category/${category.slug}`}
                  className="inline-block py-1.5 text-[0.6875rem] uppercase tracking-[0.14em] text-charcoal/85 transition-colors hover:text-charcoal"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {lead && (
          <Reveal className="mt-14">
            <Link href={`/blog/${lead.slug}`} className="group grid gap-8 lg:grid-cols-2 lg:gap-14">
              <div className="relative aspect-3/2 overflow-hidden bg-ivory-deep">
                <Image
                  src={lead.cover.url}
                  alt={lead.cover.alt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-col justify-center">
                <PostMeta post={lead} />
                <h2 className="mt-4 font-serif type-title text-charcoal transition-colors duration-300 group-hover:text-gold">
                  {lead.title}
                </h2>
                <p className="mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-mocha">
                  {lead.excerpt}
                </p>
                <span className="mt-7 inline-block self-start border-b border-charcoal/25 pb-1.5 text-[0.6875rem] uppercase tracking-[0.18em] text-charcoal transition-colors group-hover:border-gold group-hover:text-gold">
                  Read the article
                </span>
              </div>
            </Link>
          </Reveal>
        )}

        <ul className="mt-20 grid gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, index) => (
            <Reveal as="li" key={post.slug} delay={Math.min(index, 5) * 0.06}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </ul>
      </div>
    </>
  )
}

