import { notFound } from 'next/navigation'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { policyBySlug } from '@/data/policies'
import { breadcrumbSchema, faqSchema, graph, webPageSchema } from '@/lib/jsonld'
import type { Breadcrumb } from '@/types'

/**
 * Shipping, returns, privacy and terms share this template and one data source
 * in `data/policies`. They stay as separate routes rather than one dynamic
 * segment because the root already has a dynamic segment for landing pages —
 * Next allows only one slug name per path position.
 */
export function PolicyView({ slug }: { slug: string }) {
  const policy = policyBySlug.get(slug)
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

      <div className="container-luxe pb-24 pt-10">
        <Breadcrumbs items={crumbs} />

        <header className="max-w-2xl py-12">
          <p className="eyebrow text-gold">{policy.eyebrow}</p>
          <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.05] text-charcoal md:text-[3rem]">
            {policy.title}
          </h1>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-mocha">{policy.intro}</p>
          <p className="mt-4 text-xs text-taupe">Last updated {policy.updated}</p>
        </header>

        <div className="max-w-3xl">
          {policy.sections.map((section) => (
            <section key={section.heading} className="mt-12 first:mt-0">
              <h2 className="font-serif text-[1.5rem] leading-tight text-charcoal md:text-[1.875rem]">
                {section.heading}
              </h2>
              {section.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 32)}
                  className="mt-4 text-[0.9375rem] leading-relaxed text-mocha"
                >
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className="mt-5 flex flex-col gap-2.5">
                  {section.list.map((item) => (
                    <li
                      key={item}
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
