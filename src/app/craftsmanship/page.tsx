import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { Reveal } from '@/components/motion/reveal'
import { ProductGrid } from '@/components/product/product-grid'
import { SectionHeading } from '@/components/ui/section-heading'
import { JsonLd } from '@/components/seo/json-ld'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { queryProducts } from '@/services/catalog'
import { failSoft } from '@/server/fail-soft'
import { buildMetadata, pageTitle } from '@/lib/seo'
import { breadcrumbSchema, faqSchema, graph, webPageSchema } from '@/lib/jsonld'
import type { Breadcrumb, ProductFaq } from '@/types'
import { withSeoOverride } from '@/server/seo'

const DESCRIPTION =
  'How a Pashmore piece is made: hand-combing pashm in Ladakh, charkha spinning, handloom weaving, sozni and kani work, natural dyeing and certification.'

const BASE_METADATA: Metadata = buildMetadata({
  title: pageTitle('Craftsmanship'),
  description: DESCRIPTION,
  path: '/craftsmanship',
  image: {
    url: '/images/editorial/editorial-loom.png',
    alt: 'A wooden handloom in the Pashmore workshop',
    width: 1400,
    height: 1000,
  },
})

export function generateMetadata(): Promise<Metadata> {
  return withSeoOverride('/craftsmanship', BASE_METADATA)
}

const crumbs: Breadcrumb[] = [
  { name: 'Home', href: '/' },
  { name: 'Craftsmanship', href: '/craftsmanship' },
]

const STAGES = [
  {
    step: '01',
    heading: 'Combing',
    duration: 'Two weeks each spring',
    body: 'Changthangi goats moult as the plateau thaws. Herders comb the underfleece out by hand, taking around 150 grams per animal. Nothing is shorn — shearing mixes coarse outer hair into the pashm and cannot be undone.',
    image: {
      url: '/images/editorial/editorial-kashmir.png',
      alt: 'The Changthang plateau in early spring where Pashmina fibre is hand-combed',
    },
  },
  {
    step: '02',
    heading: 'Dehairing and spinning',
    duration: 'Six to nine weeks',
    body: 'Raw pashm is dehaired by hand to remove the coarse guard hair, then spun on a charkha at a few grams an hour. Mill spinning breaks fibre this fine, which is why this stage has never been mechanised in Kashmir.',
    image: {
      url: '/images/editorial/editorial-atelier.png',
      alt: 'Hand-spun Pashmina yarn wound onto bobbins in the Pashmore atelier',
    },
  },
  {
    step: '03',
    heading: 'Weaving',
    duration: 'Four to six weeks, or two years',
    body: 'A plain shawl takes four to six weeks on a wooden handloom. A full-field kani shawl — pattern built thread by thread from a coded talim script — can occupy two weavers for close to two years.',
    image: {
      url: '/images/editorial/editorial-loom.png',
      alt: 'A weaver passing weft through a wooden handloom in Srinagar',
    },
  },
  {
    step: '04',
    heading: 'Embroidery and finishing',
    duration: 'Three months to two years',
    body: 'Sozni is worked with a single needle in silk thread, and a master covers about a square inch a day. Tilla couches flattened metallic thread onto the surface. Fringes are knotted and edges rolled by hand.',
    image: {
      url: '/images/editorial/editorial-artisan.png',
      alt: 'An artisan finishing sozni embroidery on a cream Pashmina shawl',
    },
  },
]

const FAQS: ProductFaq[] = [
  {
    question: 'How long does one shawl take to make?',
    answer:
      'A plain pure Pashmina shawl takes roughly three months end to end — combing, dehairing, spinning, weaving and finishing. A fully embroidered sozni piece takes twelve to twenty-four months, and a full-field kani shawl up to two years.',
  },
  {
    question: 'Do you use natural dyes?',
    answer:
      'Where the colour allows. Walnut husk, indigo, madder and turmeric are used for our heritage shades; deeper and more consistent tones use low-impact reactive dyes in small batches, which we say so on the product page.',
  },
  {
    question: 'What is on the craft certificate?',
    answer:
      'The fibre grade in microns, the technique, the loom number, the date the piece came off the loom, and the name of the weaver or embroiderer who finished it.',
  },
  {
    question: 'Are the artisans paid fairly?',
    answer:
      'We pay by the piece at rates agreed before work begins, directly to the family doing the work, with no intermediary. Handwork survives only where the people doing it can make a living from it.',
  },
]

export const dynamic = 'force-dynamic'

export default async function CraftsmanshipPage() {
  const products = await failSoft(
    queryProducts({ collectionSlug: 'heritage-collection', limit: 4 }).then(
      (result) => result.products,
    ),
    [],
    'craftsmanship:heritage',
  )

  return (
    <>
      <JsonLd
        id="craftsmanship-page"
        data={graph([
          webPageSchema({
            path: '/craftsmanship',
            name: 'Craftsmanship',
            description: DESCRIPTION,
          }),
          breadcrumbSchema(crumbs),
          faqSchema(FAQS),
        ])}
      />

      <PageTitleBanner plainClassName="container-luxe pt-10">
        <Breadcrumbs items={crumbs} />
        <header className="max-w-3xl py-14">
          <p className="eyebrow text-gold">Craftsmanship</p>
          <h1 className="mt-5 font-serif type-section text-charcoal">
            Four stages, three hundred kilometres, one shawl
          </h1>
          <p className="mt-7 text-[1.0625rem] leading-relaxed text-mocha">
            Between a Changthangi goat on the Ladakh plateau and a finished shawl in a box lie
            four distinct crafts, practised by four different sets of hands. None of them can be
            hurried, and every shortcut shows in the surface of the cloth.
          </p>
        </header>
      </PageTitleBanner>

      <div className="flex flex-col gap-20 pb-24 lg:gap-32">
        {STAGES.map((stage, index) => (
          <section
            key={stage.step}
            className="container-luxe grid items-center gap-8 lg:grid-cols-2 lg:gap-[clamp(2.5rem,4vw,6rem)]"
            aria-labelledby={`stage-${stage.step}`}
          >
            <Reveal className={index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}>
              <div className="relative aspect-4/3 w-full overflow-hidden bg-ivory-deep">
                <Image
                  src={stage.image.url}
                  alt={stage.image.alt}
                  fill
                  sizes="(min-width: 1024px) 46vw, 92vw"
                  className="object-cover"
                />
              </div>
            </Reveal>

            <Reveal delay={0.1} className={index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}>
              <p className="font-serif text-3xl text-gold">{stage.step}</p>
              <h2
                id={`stage-${stage.step}`}
                className="mt-4 font-serif type-chapter text-charcoal"
              >
                {stage.heading}
              </h2>
              <p className="eyebrow mt-3 text-taupe">{stage.duration}</p>
              <p className="mt-6 max-w-lg text-[0.9375rem] leading-relaxed text-mocha">
                {stage.body}
              </p>
            </Reveal>
          </section>
        ))}
      </div>

      <section className="border-t border-line bg-cream/40 py-20" aria-labelledby="craft-faqs">
        <div className="container-luxe max-w-3xl">
          <h2
            id="craft-faqs"
            className="font-serif type-chapter text-charcoal"
          >
            Questions about how we work
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {products.length > 0 && (
        <section className="container-luxe py-20" aria-labelledby="heritage-products">
          <SectionHeading
            id="heritage-products"
            eyebrow="Made this way"
            title="The Heritage Collection"
            href="/collections/heritage-collection"
            linkLabel="View the collection"
          />
          <ProductGrid products={products.slice(0, 4)} className="mt-12" />
        </section>
      )}

      <section className="container-luxe border-t border-line py-16">
        <h2 className="eyebrow mb-6 text-taupe">Read more</h2>
        <ul className="flex flex-wrap gap-x-8 gap-y-3">
          {[
            ['What is Pashmina?', '/blog/what-is-pashmina'],
            ['The kani weave, explained', '/blog/the-kani-weave-explained'],
            ['A short history of the Kashmiri shawl', '/blog/history-of-kashmiri-shawls'],
            ['Our story', '/about'],
          ].map(([label, href]) => (
            <li key={href}>
              <Link
                href={href}
                className="link-underline font-serif text-lg text-charcoal transition-colors hover:text-gold"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}
