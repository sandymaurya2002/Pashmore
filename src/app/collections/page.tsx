import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { SectionHeading } from '@/components/ui/section-heading'
import { Reveal } from '@/components/motion/reveal'
import { JsonLd } from '@/components/seo/json-ld'

import { getAllCollections } from '@/services/catalog'
import { buildMetadata, pageTitle } from '@/lib/seo'
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/jsonld'
import type { Breadcrumb, Collection, CollectionGroup } from '@/types'
import { withSeoOverride } from '@/server/seo'

const TITLE = 'All Collections'
const DESCRIPTION =
  'Browse every Pashmore collection — pure Pashmina, Kashmiri craft, fine wool, wedding pieces and gifting, for women and men.'

const BASE_METADATA: Metadata = buildMetadata({
  title: pageTitle('Collections — Pashmina, Shawls, Stoles & Gifting'),
  description: DESCRIPTION,
  path: '/collections',
})

export function generateMetadata(): Promise<Metadata> {
  return withSeoOverride('/collections', BASE_METADATA)
}

export const dynamic = 'force-dynamic'

const GROUP_ORDER: Array<{ group: CollectionGroup; label: string; description: string }> = [
  {
    group: 'collections',
    label: 'By Craft & Collection',
    description: 'Curated edits built around a fibre, a technique or an occasion.',
  },
  {
    group: 'women',
    label: 'Women',
    description: 'Shawls, Pashmina, stoles, scarves and dupattas.',
  },
  { group: 'men', label: 'Men', description: 'Shawls, stoles, scarves, jackets and accessories.' },
  { group: 'gifting', label: 'Gifting', description: 'Boxed pieces, wedding presents and corporate volumes.' },
  {
    group: 'category',
    label: 'By Product Type',
    description: 'Every shawl, stole and scarf in one place, across both genders.',
  },
]

const crumbs: Breadcrumb[] = [
  { name: 'Home', href: '/' },
  { name: 'Collections', href: '/collections' },
]

export default async function CollectionsIndexPage() {
  const collections = await getAllCollections()
  const visible = collections.filter((collection) => !collection.hidden)

  return (
    <>
      <JsonLd
        id="collections-index"
        data={graph([
          webPageSchema({ path: '/collections', name: TITLE, description: DESCRIPTION }),
          breadcrumbSchema(crumbs),
        ])}
      />

      <PageTitleBanner plainClassName="container-luxe pt-10">
        <Breadcrumbs items={crumbs} />
        <header className="max-w-2xl py-12">
          <p className="eyebrow text-gold">Collections</p>
          <h1 className="mt-5 font-serif type-display text-charcoal">
            {TITLE}
          </h1>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-mocha">{DESCRIPTION}</p>
        </header>
      </PageTitleBanner>

      <div className="container-luxe pb-24">
        <div className="flex flex-col gap-20">
          {GROUP_ORDER.map(({ group, label, description }) => {
            const entries = visible.filter((collection) => collection.group === group)
            if (!entries.length) return null

            return (
              <section key={group} aria-labelledby={`group-${group}`}>
                <SectionHeading id={`group-${group}`} title={label} description={description} />
                <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {entries.map((collection, index) => (
                    <Reveal as="li" key={collection.slug} delay={Math.min(index, 5) * 0.05}>
                      <CollectionCard collection={collection} />
                    </Reveal>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      </div>
    </>
  )
}

function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link href={`/collections/${collection.slug}`} className="group block">
      <article>
        <div className="relative aspect-3/2 overflow-hidden bg-ivory-deep">
          <Image
            src={collection.bannerImage.url}
            alt={collection.bannerImage.alt}
            fill
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-ink/20 transition-opacity duration-500 group-hover:bg-ink/32"
          />
        </div>

        <div className="flex items-baseline justify-between gap-4 pt-4">
          <h3 className="font-serif text-xl text-charcoal transition-colors duration-300 group-hover:text-gold">
            {collection.name}
          </h3>
          {collection.productCount !== undefined && (
            <span className="shrink-0 text-xs tabular-nums text-taupe">
              {collection.productCount}
            </span>
          )}
        </div>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mocha">
          {collection.description}
        </p>
      </article>
    </Link>
  )
}
