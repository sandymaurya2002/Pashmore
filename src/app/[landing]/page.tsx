import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { ProductGrid } from '@/components/product/product-grid'
import { SectionHeading } from '@/components/ui/section-heading'
import { JsonLd } from '@/components/seo/json-ld'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { landingBySlug } from '@/data/landing'
import { queryProducts } from '@/services/catalog'
import { failSoft } from '@/server/fail-soft'
import { buildMetadata, metaDescription } from '@/lib/seo'
import { landingKeywords } from '@/lib/keywords'
import { breadcrumbSchema, faqSchema, graph, webPageSchema } from '@/lib/jsonld'
import type { Breadcrumb } from '@/types'
import { withSeoOverride } from '@/server/seo'

interface PageProps {
  params: Promise<{ landing: string }>
}

/**
 * Search-intent landing pages live at the root — /pashmina-shawls,
 * /wedding-gifts — because that is what people link to and search for. Static
 * routes always win over this dynamic segment, so /collections, /blog and the
 * rest are unaffected; anything not in the landing registry 404s.
 *
 * Rendered per request so the product grid reflects live stock without the
 * build depending on the Worker.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { landing } = await params
  const page = landingBySlug.get(landing)
  if (!page) return {}

  return withSeoOverride(
    `/${page.slug}`,
    buildMetadata({
      title: page.metaTitle,
      description: metaDescription(page.metaDescription),
      path: `/${page.slug}`,
      image: page.banner,
      keywords: landingKeywords(page.slug),
    }),
  )
}

export default async function LandingPageRoute({ params }: PageProps) {
  const { landing } = await params
  const page = landingBySlug.get(landing)
  if (!page) notFound()

  const products = await failSoft(
    queryProducts({ collectionSlug: page.collectionSlug, sort: 'featured', limit: 8 }).then(
      (result) => result.products,
    ),
    [],
    `landing:${page.slug}`,
  )

  const crumbs: Breadcrumb[] = [
    { name: 'Home', href: '/' },
    { name: page.h1, href: `/${page.slug}` },
  ]

  return (
    <>
      <JsonLd
        id={`landing-${page.slug}`}
        data={graph([
          webPageSchema({
            path: `/${page.slug}`,
            name: page.h1,
            description: page.metaDescription,
          }),
          breadcrumbSchema(crumbs),
          faqSchema(page.faqs),
        ])}
      />

      <section className="relative h-[38dvh] min-h-[16rem] w-full overflow-hidden bg-charcoal md:h-[44dvh]">
        <Image
          src={page.banner.url}
          alt={page.banner.alt}
          fill
          priority
          quality={80}
          sizes="100vw"
          className="object-cover"
        />
        <span aria-hidden className="absolute inset-0 bg-ink/48" />
        <div className="container-luxe relative flex h-full flex-col justify-end pb-10">
          <Breadcrumbs items={crumbs} tone="light" className="mb-5" />
          <p className="eyebrow mb-3 text-gold-soft">{page.eyebrow}</p>
          <h1 className="font-serif text-[2.25rem] leading-[1.05] text-ivory md:text-[3.5rem]">
            {page.h1}
          </h1>
        </div>
      </section>

      <div className="container-luxe">
        <div className="max-w-3xl py-14">
          {page.intro.map((paragraph) => (
            <p
              key={paragraph.slice(0, 32)}
              className="mt-5 text-[1.0625rem] leading-relaxed text-mocha first:mt-0"
            >
              {paragraph}
            </p>
          ))}
        </div>

        {products.length > 0 && (
          <section className="pb-20" aria-labelledby="landing-products">
            <SectionHeading
              id="landing-products"
              title={page.productHeading}
              href={`/collections/${page.collectionSlug}`}
              linkLabel="View the full collection"
            />
            <ProductGrid
              products={products.slice(0, 8)}
              className="mt-12"
              priorityCount={2}
            />
          </section>
        )}
      </div>

      <section className="border-t border-line bg-cream/40 py-20">
        <div className="container-luxe max-w-3xl">
          {page.sections.map((section) => (
            <article key={section.heading} className="mt-14 first:mt-0">
              <h2 className="font-serif text-[1.75rem] leading-tight text-charcoal md:text-[2.25rem]">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="mt-5 text-[0.9375rem] leading-relaxed text-mocha"
                >
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-6 flex flex-col gap-2.5">
                  {section.list.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-[0.9375rem] text-mocha"
                    >
                      <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-20" aria-labelledby="landing-faqs">
        <div className="container-luxe max-w-3xl">
          <h2
            id="landing-faqs"
            className="font-serif text-[1.75rem] leading-tight text-charcoal md:text-[2.25rem]"
          >
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {page.faqs.map((faq, index) => (
              <AccordionItem key={faq.question} value={`faq-${index}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="border-t border-line py-16" aria-labelledby="landing-links">
        <div className="container-luxe">
          <h2 id="landing-links" className="eyebrow mb-6 text-taupe">
            Continue reading
          </h2>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {page.internalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="link-underline font-serif text-lg text-charcoal transition-colors hover:text-gold"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  )
}
