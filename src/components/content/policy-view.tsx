import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { JsonLd } from '@/components/seo/json-ld'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { policyBySlug, type PolicyPage } from '@/data/policies'
import { breadcrumbSchema, faqSchema, graph, webPageSchema } from '@/lib/jsonld'
import { buildMetadata, metaDescription } from '@/lib/seo'
import { getCmsPage } from '@/server/content'
import { withSeoOverride } from '@/server/seo'
import type { Breadcrumb } from '@/types'

/**
 * The policy as edited in the admin dashboard (Pages), falling back field by
 * field to the copy bundled in `data/policies` — so the page is never empty
 * if the CMS is unreachable or a field was left blank.
 */
export async function loadPolicy(slug: string): Promise<PolicyPage | null> {
  const fallback = policyBySlug.get(slug) ?? null
  const cms = await getCmsPage(slug)
  if (!cms) return fallback
  return {
    slug,
    title: cms.title,
    metaTitle: cms.metaTitle ?? fallback?.metaTitle ?? `${cms.title} | Pashmore`,
    metaDescription: cms.metaDescription ?? fallback?.metaDescription ?? cms.intro ?? cms.title,
    eyebrow: cms.eyebrow ?? fallback?.eyebrow ?? '',
    intro: cms.intro ?? fallback?.intro ?? '',
    updated: cms.updatedLabel ?? fallback?.updated ?? '',
    sections: cms.sections.length ? cms.sections : (fallback?.sections ?? []),
    faqs: cms.faqs.length ? cms.faqs : fallback?.faqs,
  }
}

export async function policyMetadata(slug: string) {
  const policy = await loadPolicy(slug)
  if (!policy) return {}
  const path = `/${slug}`
  return withSeoOverride(
    path,
    buildMetadata({
      title: policy.metaTitle,
      description: metaDescription(policy.metaDescription),
      path,
    }),
  )
}

/**
 * Shipping, returns, privacy and terms share this template. They stay as
 * separate routes rather than one dynamic segment because the root already has
 * a dynamic segment for landing pages — Next allows only one slug name per
 * path position.
 */
export async function PolicyView({ slug }: { slug: string }) {
  const policy = await loadPolicy(slug)
  if (!policy) notFound()

  const crumbs: Breadcrumb[] = [
    { name: 'Home', href: '/' },
    { name: policy.title, href: `/${policy.slug}` },
  ]

  return (
    <>
      <JsonLd
        id={`policy-${policy.slug}`}
        data={graph([
          webPageSchema({
            path: `/${policy.slug}`,
            name: policy.title,
            description: policy.metaDescription,
          }),
          breadcrumbSchema(crumbs),
          ...(policy.faqs?.length ? [faqSchema(policy.faqs)] : []),
        ])}
      />

      <PageTitleBanner plainClassName="container-luxe pt-10">
        <Breadcrumbs items={crumbs} />
        <header className="max-w-2xl py-12">
          <p className="eyebrow text-gold">{policy.eyebrow}</p>
          <h1 className="mt-5 font-serif type-page text-charcoal">
            {policy.title}
          </h1>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-mocha">{policy.intro}</p>
          {policy.updated && (
            <p className="mt-4 text-xs text-taupe">Last updated {policy.updated}</p>
          )}
        </header>
      </PageTitleBanner>

      <div className="container-luxe pb-24">
        <div className="max-w-3xl">
          {policy.sections.map((section, index) => (
            <section key={`${index}-${section.heading}`} className="mt-12 first:mt-0">
              <h2 className="font-serif text-[1.5rem] leading-tight text-charcoal md:text-[1.875rem]">
                {section.heading}
              </h2>
              {section.body.map((paragraph, paragraphIndex) => (
                <p
                  key={`${paragraphIndex}-${paragraph.slice(0, 32)}`}
                  className="mt-4 text-[0.9375rem] leading-relaxed text-mocha"
                >
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-5 flex flex-col gap-2.5">
                  {section.list.map((item, itemIndex) => (
                    <li
                      key={`${itemIndex}-${item.slice(0, 32)}`}
                      className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-mocha"
                    >
                      <span aria-hidden className="mt-2.5 h-px w-3 shrink-0 bg-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {policy.faqs?.length ? (
            <section className="mt-16 border-t border-line pt-12" aria-labelledby="policy-faqs">
              <h2
                id="policy-faqs"
                className="font-serif text-[1.5rem] leading-tight text-charcoal md:text-[1.875rem]"
              >
                Frequently Asked Questions
              </h2>
              <Accordion type="single" collapsible className="mt-6">
                {policy.faqs.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`faq-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ) : null}
        </div>
      </div>
    </>
  )
}

export function policyMetadataFor(slug: string) {
  const policy = policyBySlug.get(slug)
  if (!policy) return null
  return {
    title: policy.metaTitle,
    description: policy.metaDescription,
    path: `/${policy.slug}`,
  }
}
