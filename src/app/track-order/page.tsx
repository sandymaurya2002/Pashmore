import type { Metadata } from 'next'
import Link from 'next/link'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { TrackOrderForm } from '@/components/content/track-order-form'
import { JsonLd } from '@/components/seo/json-ld'

import { buildMetadata, pageTitle } from '@/lib/seo'
import { breadcrumbSchema, graph, webPageSchema } from '@/lib/jsonld'
import type { Breadcrumb } from '@/types'
import { withSeoOverride } from '@/server/seo'

const DESCRIPTION = 'Track a Pashmore order using your order number and email address.'

const BASE_METADATA: Metadata = buildMetadata({
  title: pageTitle('Track Your Order'),
  description: DESCRIPTION,
  path: '/track-order',
})

export function generateMetadata(): Promise<Metadata> {
  return withSeoOverride('/track-order', BASE_METADATA)
}

const crumbs: Breadcrumb[] = [
  { name: 'Home', href: '/' },
  { name: 'Track Order', href: '/track-order' },
]

export default function TrackOrderPage() {
  return (
    <>
      <JsonLd
        id="track-order-page"
        data={graph([
          webPageSchema({ path: '/track-order', name: 'Track Order', description: DESCRIPTION }),
          breadcrumbSchema(crumbs),
        ])}
      />

      <PageTitleBanner plainClassName="container-luxe pt-10">
        <Breadcrumbs items={crumbs} />
        <header className="mx-auto max-w-lg py-12">
          <p className="eyebrow text-gold">Customer Care</p>
          <h1 className="mt-5 font-serif type-page text-charcoal">
            Track your order
          </h1>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-mocha">
            Enter the order number from your confirmation email — it looks like PSH-104287 —
            together with the email address you ordered with.
          </p>
        </header>
      </PageTitleBanner>

      <div className="container-luxe pb-24">
        <div className="mx-auto max-w-lg">
          <TrackOrderForm />
          <p className="mt-10 text-sm text-mocha">
            Signed in?{' '}
            <Link href="/account/orders" className="link-underline text-charcoal">
              See all your orders
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  )
}
