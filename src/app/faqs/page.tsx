import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { JsonLd } from '@/components/seo/json-ld'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { generalFaqs } from '@/data/policies'
import { buildMetadata, pageTitle } from '@/lib/seo'
import { breadcrumbSchema, faqSchema, graph, webPageSchema } from '@/lib/jsonld'
import type { Breadcrumb } from '@/types'
import { withSeoOverride } from '@/server/seo'

const DESCRIPTION =
  'Answers to the questions we are asked most — authenticity, delivery, returns, care and gifting.'

const BASE_METADATA: Metadata = buildMetadata({
  title: pageTitle('Frequently Asked Questions'),
  description: DESCRIPTION,
  path: '/faqs',
})

export function generateMetadata(): Promise<Metadata> {
  return withSeoOverride('/faqs', BASE_METADATA)
}

const crumbs: Breadcrumb[] = [
  { name: 'Home', href: '/' },
  { name: 'FAQs', href: '/faqs' },
]

export default function FaqsPage() {
  const allFaqs = generalFaqs.flatMap((group) => group.items)

  return (
    <>
      <JsonLd
        id="faqs-page"
        data={graph([
          webPageSchema({ path: '/faqs', name: 'FAQs', description: DESCRIPTION }),
          breadcrumbSchema(crumbs),
          faqSchema(allFaqs),
        ])}
      />

      <div className="container-luxe pb-24 pt-10">
        <Breadcrumbs items={crumbs} />

        <header className="max-w-2xl py-12">
          <p className="eyebrow text-gold">Customer Care</p>
          <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.05] text-charcoal md:text-[3rem]">
            Frequently Asked Questions
          </h1>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-mocha">{DESCRIPTION}</p>
        </header>

        <div className="max-w-3xl">
          {generalFaqs.map((group) => (
            <section key={group.heading} className="mt-14 first:mt-0">
              <h2 className="font-serif text-[1.5rem] leading-tight text-charcoal md:text-[1.875rem]">
                {group.heading}
              </h2>
              <Accordion type="single" collapsible className="mt-6">
                {group.items.map((faq, index) => (
                  <AccordionItem key={faq.question} value={`${group.heading}-${index}`}>
                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}

          <section className="mt-16 border-t border-line pt-10">
            <h2 className="font-serif text-xl text-charcoal">Still need help?</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-mocha">
              Our care team in Srinagar answers within one working day.{' '}
              <Link href="/contact" className="link-underline text-charcoal">
                Get in touch
              </Link>
              , or read our{' '}
              <Link href="/shipping" className="link-underline text-charcoal">
                shipping
              </Link>{' '}
              and{' '}
              <Link href="/returns" className="link-underline text-charcoal">
                returns
              </Link>{' '}
              policies in full.
            </p>
          </section>
        </div>
      </div>
    </>
  )
}
