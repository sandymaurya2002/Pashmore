'use client'

import Image from 'next/image'
import type { ReactNode } from 'react'

import { usePageBanner } from '@/components/layout/page-banner-provider'
import { cn } from '@/lib/utils'

/**
 * The page's own title, drawn on top of the admin page-banner image.
 * Banner heading, eyebrow and buttons are not shown — the page keeps its
 * own breadcrumbs and heading. When the route has no page banner and no
 * fallback image, children render in normal page flow.
 */
export function PageTitleBanner({
  image,
  plainClassName,
  children,
}: {
  /** Shown when this route has no admin page banner. */
  image?: { url: string; alt: string }
  /** Wrapper used when there is no photo, so the title keeps its place in the page. */
  plainClassName?: string
  children: ReactNode
}) {
  const banner = usePageBanner()
  const video = banner?.mediaType === 'VIDEO' ? banner.videoUrl : undefined
  const src = banner?.imageUrl ?? image?.url
  const mobile = banner?.mobileImageUrl
  const alt = banner?.imageAlt || image?.alt || ''

  if (!src && !video) {
    if (!plainClassName) return children
    return <div className={plainClassName}>{children}</div>
  }

  return (
    <section className="relative min-h-[16rem] w-full overflow-hidden bg-charcoal md:min-h-[18rem]">
      {video ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={video}
          poster={src}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={alt || undefined}
        />
      ) : (
        src && (
          <>
            <Image
              src={src}
              alt={alt}
              fill
              priority
              quality={80}
              sizes="100vw"
              className={cn('object-cover', mobile && 'hidden md:block')}
            />
            {mobile && (
              <Image
                src={mobile}
                alt={alt}
                fill
                priority
                quality={80}
                sizes="100vw"
                className="object-cover md:hidden"
              />
            )}
          </>
        )
      )}
      <span aria-hidden className="absolute inset-0 bg-ink/45" />
      <div
        className={cn(
          'container-luxe relative flex min-h-[38dvh] flex-col justify-end pb-10 pt-16 md:min-h-[46dvh]',
          '[&_h1]:!text-ivory [&_.eyebrow]:!text-gold-soft [&_p]:!text-ivory/85',
          '[&_nav[aria-label=Breadcrumb]_a]:!text-ivory/65',
          '[&_nav[aria-label=Breadcrumb]_span]:!text-ivory',
          '[&_nav[aria-label=Breadcrumb]_svg]:!text-ivory/45',
        )}
      >
        {children}
      </div>
    </section>
  )
}
