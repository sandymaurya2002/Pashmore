import type { Metadata } from 'next'
import { Mail, MapPin, Phone, Clock } from 'lucide-react'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { ContactForm } from '@/components/content/contact-form'
import { JsonLd } from '@/components/seo/json-ld'

import { buildMetadata, pageTitle } from '@/lib/seo'
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/jsonld'
import { site } from '@/lib/site'
import type { Breadcrumb } from '@/types'
import { withSeoOverride } from '@/server/seo'

const DESCRIPTION =
  'Contact Pashmore — customer care, corporate gifting, commissions and workshop visits in Srinagar, Kashmir.'

const BASE_METADATA: Metadata = buildMetadata({
  title: pageTitle('Contact'),
  description: DESCRIPTION,
  path: '/contact',
})

export function generateMetadata(): Promise<Metadata> {
  return withSeoOverride('/contact', BASE_METADATA)
}

const crumbs: Breadcrumb[] = [
  { name: 'Home', href: '/' },
  { name: 'Contact', href: '/contact' },
]

export default function ContactPage() {
  return (
    <>
      <JsonLd
        id="contact-page"
        data={graph([
          webPageSchema({ path: '/contact', name: 'Contact', description: DESCRIPTION }),
          breadcrumbSchema(crumbs),
        ])}
      />

      <PageTitleBanner plainClassName="container-luxe pt-10">
        <Breadcrumbs items={crumbs} />
        <header className="max-w-2xl py-12">
          <p className="eyebrow text-gold">Get in touch</p>
          <h1 className="mt-5 font-serif type-page text-charcoal">
            Contact Pashmore
          </h1>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-mocha">
            Our care team is in Srinagar and answers within one working day. For commissions
            and corporate volumes, tell us your timeline in the message — it is usually the
            first thing we need to know.
          </p>
        </header>
      </PageTitleBanner>

      <div className="container-luxe pb-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-[clamp(2.5rem,4vw,5.5rem)]">
          <aside>
            <ul className="flex flex-col gap-8">
              <ContactItem icon={Mail} label="Email">
                <a href={`mailto:${site.email}`} className="link-underline">
                  {site.email}
                </a>
              </ContactItem>
              <ContactItem icon={Phone} label="Telephone">
                <a href={`tel:${site.phone.replace(/\s/g, '')}`} className="link-underline">
                  {site.phone}
                </a>
              </ContactItem>
              <ContactItem icon={Clock} label="Hours">
                Monday to Saturday, 10:00 – 19:00 IST
              </ContactItem>
              <ContactItem icon={MapPin} label="Workshop">
                <address className="not-italic">
                  {site.address.street}
                  <br />
                  {site.address.city}, {site.address.region} {site.address.postalCode}
                  <br />
                  India
                </address>
              </ContactItem>
            </ul>

            <div className="mt-10 border-t border-line pt-8">
              <h2 className="eyebrow mb-3 text-taupe">Visiting</h2>
              <p className="text-sm leading-relaxed text-mocha">
                The workshop is open to visitors by appointment. Write to us a week ahead and
                we will arrange a time when the looms are running.
              </p>
            </div>
          </aside>

          <ContactForm />
        </div>
      </div>
    </>
  )
}

function ContactItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.25} aria-hidden />
      <div>
        <p className="eyebrow mb-1.5 text-taupe">{label}</p>
        <div className="text-sm leading-relaxed text-charcoal">{children}</div>
      </div>
    </li>
  )
}
