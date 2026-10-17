'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { PageTitleBanner } from '@/components/layout/page-title-banner'
import { usePageBanner } from '@/components/layout/page-banner-provider'
import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import type { Breadcrumb } from '@/types'

function hasPhoto(banner: ReturnType<typeof usePageBanner>): boolean {
  return Boolean(banner?.imageUrl || banner?.videoUrl)
}

/**
 * When this product has an admin page banner, the photograph sits behind the
 * breadcrumbs and the product name. Otherwise the breadcrumbs stay as a
 * slim row above the gallery.
 */
export function ProductPageBanner({
  crumbs,
  name,
  eyebrow,
  eyebrowHref,
}: {
  crumbs: Breadcrumb[]
  name: string
  eyebrow?: string
  eyebrowHref?: string
}) {
  const banner = usePageBanner()
  if (!hasPhoto(banner)) {
    return (
      <div className="container-luxe pt-6">
        <Breadcrumbs items={crumbs} />
      </div>
    )
  }

  return (
    <PageTitleBanner>
      <Breadcrumbs items={crumbs} tone="light" className="mb-5" />
      {eyebrow && eyebrowHref ? (
        <Link href={eyebrowHref} className="eyebrow text-gold-soft">
          {eyebrow}
        </Link>
      ) : null}
      <h1 className="mt-4 max-w-3xl font-serif type-title text-ivory">
        {name}
      </h1>
    </PageTitleBanner>
  )
}

/** The in-column title. Hidden when the same title is already on the page banner. */
export function ProductColumnHeading({
  name,
  eyebrow,
  eyebrowHref,
  children,
}: {
  name: string
  eyebrow?: string
  eyebrowHref?: string
  children?: ReactNode
}) {
  const banner = usePageBanner()
  const onPhoto = hasPhoto(banner)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {!onPhoto && eyebrow && eyebrowHref ? (
          <Link
            href={eyebrowHref}
            className="eyebrow text-taupe transition-colors hover:text-charcoal"
          >
            {eyebrow}
          </Link>
        ) : null}
        {children}
      </div>
      {!onPhoto && (
        <h1 className="mt-4 font-serif type-title text-charcoal">
          {name}
        </h1>
      )}
    </>
  )
}
