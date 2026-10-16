import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { Reveal } from '@/components/motion/reveal'
import { Button } from '@/components/ui/button'
import { JsonLd } from '@/components/seo/json-ld'

import { buildMetadata, pageTitle } from '@/lib/seo'
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/jsonld'
import { site } from '@/lib/site'
import type { Breadcrumb } from '@/types'
import { withSeoOverride } from '@/server/seo'

const DESCRIPTION =
  'Pashmore has woven Pashmina and Kashmiri textiles in Srinagar since 1978. Our story, our workshop and the families who make every piece.'

const BASE_METADATA: Metadata = buildMetadata({
  title: pageTitle('Our Story'),
  description: DESCRIPTION,
  path: '/about',
  image: {
    url: '/images/editorial/about-hero.png',
    alt: 'The Pashmore workshop in Srinagar, Kashmir',
    width: 2000,
    height: 1000,
  },
})

export function generateMetadata(): Promise<Metadata> {
  return withSeoOverride('/about', BASE_METADATA)
}

const crumbs: Breadcrumb[] = [
  { name: 'Home', href: '/' },
  { name: 'Our Story', href: '/about' },
]

const MILESTONES = [
  {
    year: '1978',
    heading: 'A single loom on the Boulevard',
    body: 'Pashmore begins as one wooden handloom and three weavers in a workshop overlooking Dal Lake, supplying trousseau shawls to families across the valley.',
  },
  {
    year: '1994',
    heading: 'The pattern books are bound',
    body: 'Two decades of commissions — fibre grades, setts, pick counts, dye recipes — are collected into ledgers that still govern how the Heritage Collection is made.',
  },
  {
    year: '2011',
    heading: 'Kani returns to the workshop',
    body: 'After a long decline in the technique, we bring two kani weavers from Kanihama onto our own looms and begin recording talim scripts that had never been written down twice.',
  },
  {
    year: '2019',
    heading: 'Every piece signed',
    body: 'We begin issuing a craft certificate with every shawl, naming the weaver, the loom and the date it came off it. It has been our single most requested change.',
  },
  {
    year: '2026',
    heading: 'Direct from Srinagar',
    body: 'Pashmore ships worldwide from the same workshop, with no intermediary between the weaver and the person who will wear the piece.',
  },
]

export default function AboutPage() {
  return (
    <>
      <JsonLd
        id="about-page"
        data={graph([
          webPageSchema({ path: '/about', name: 'Our Story', description: DESCRIPTION }),
          breadcrumbSchema(crumbs),
        ])}
      />

      <PageTitleBanner
        image={{
          url: '/images/editorial/about-hero.png',
          alt: 'The Pashmore workshop in Srinagar at first light, looms strung and waiting',
        }}
      >
        <Breadcrumbs items={crumbs} tone="light" className="mb-5" />
        <p className="eyebrow mb-3 text-gold-soft">Since {site.founded}</p>
        <h1 className="max-w-3xl font-serif text-[2.25rem] leading-[1.05] text-ivory md:text-[3.5rem]">
          Timeless Indian craftsmanship, woven for modern luxury
        </h1>
      </PageTitleBanner>

      <section className="container-luxe py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <h2 className="font-serif text-[1.875rem] leading-[1.1] text-charcoal md:text-[2.5rem]">
              We are a workshop before we are a brand
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-[1.0625rem] leading-relaxed text-mocha">
              Pashmore was founded in 1978 with one loom, three weavers and a room on the
              Boulevard in Srinagar. Nearly fifty years later we are in the same trade, in
              largely the same way: pashm combed by hand on the Changthang plateau, spun on a
              charkha, woven on wood, finished by people whose parents did the same work.
            </p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-mocha">
              What has changed is who we sell to. For most of our history the shawls left the
              valley through intermediaries who neither knew nor cared who had woven them. Now
              they go directly, with a certificate carrying the weaver’s name — which is the
              part of this business we are most pleased about.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-cream/40 py-20 lg:py-28" aria-labelledby="milestones">
        <div className="container-luxe">
          <Reveal>
            <p className="eyebrow text-gold">Our history</p>
            <h2
              id="milestones"
              className="mt-5 max-w-xl font-serif text-[1.875rem] leading-[1.1] text-charcoal md:text-[2.5rem]"
            >
              Five moments that shaped the workshop
            </h2>
          </Reveal>

          <ol className="mt-16 flex flex-col">
            {MILESTONES.map((milestone, index) => (
              <Reveal
                as="li"
                key={milestone.year}
                delay={Math.min(index, 4) * 0.06}
                className="grid gap-4 border-t border-line py-8 md:grid-cols-[8rem_minmax(0,1fr)] md:gap-12"
              >
                <p className="font-serif text-2xl text-gold">{milestone.year}</p>
                <div>
                  <h3 className="font-serif text-xl text-charcoal">{milestone.heading}</h3>
                  <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-mocha">
                    {milestone.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-luxe py-20 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="relative aspect-4/3 w-full overflow-hidden bg-ivory-deep">
              <Image
                src="/images/editorial/editorial-artisan.png"
                alt="A Kashmiri embroiderer working sozni needlework by window light"
                fill
                sizes="(min-width: 1024px) 46vw, 92vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="eyebrow text-gold">The people</p>
            <h2 className="mt-5 font-serif text-[1.875rem] leading-[1.1] text-charcoal md:text-[2.5rem]">
              Forty-one families, four generations
            </h2>
            <p className="mt-6 text-[0.9375rem] leading-relaxed text-mocha">
              Our weavers, spinners, embroiderers and dyers are not employees in a factory;
              they are families we have worked with for decades, most of them working from
              their own homes and workshops around Srinagar.
            </p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-mocha">
              We pay by the piece, at rates agreed before work begins, and we publish the
              weaver’s name on every certificate. Handwork only survives where the people
              doing it can make a living from it.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button asChild size="lg">
                <Link href="/craftsmanship">Inside the Workshop</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/collections/heritage-collection">Heritage Collection</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
