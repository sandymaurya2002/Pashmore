import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Banner } from '@/server/content'

/**
 * A banner managed from the admin dashboard (Homepage & Banners). Images and
 * looping, muted videos are both supported; a separate mobile image is used
 * below the md breakpoint when one is set. `hero` is the full-width opener
 * and carries the page's h1; `page` is a shorter opener above a page's own
 * content (which keeps its h1); `feature` is the full-bleed editorial band.
 */
export function CmsBanner({
  banner,
  variant,
  priority = false,
}: {
  banner: Banner
  variant: 'hero' | 'page' | 'feature'
  priority?: boolean
}) {
  const headingId = `banner-${banner.id}`
  const Heading = variant === 'hero' ? 'h1' : 'h2'
  // Homepage art has the wordmark painted in, and uploads are not a fixed
  // 16:9 (desktop is a wide banner, mobile is a portrait). Covering them
  // inside a 16:9 frame clips the title. Show that artwork at its own ratio.
  const natural = variant === 'hero'

  const media = (
    <>
      {banner.mediaType === 'VIDEO' && banner.videoUrl ? (
        <video
          className={cn(
            natural ? 'block h-auto w-full' : 'absolute inset-0 h-full w-full object-cover',
          )}
          src={banner.videoUrl}
          poster={banner.imageUrl}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={banner.imageAlt}
        />
      ) : banner.imageUrl ? (
        natural ? (
          <>
            <Image
              src={banner.imageUrl}
              alt={banner.imageAlt}
              fill
              sizes="100vw"
              quality={82}
              priority={priority}
              fetchPriority={priority ? 'high' : undefined}
              className="hidden object-cover object-[center_30%] md:block"
            />
            <Image
              src={banner.mobileImageUrl ?? banner.imageUrl}
              alt={banner.imageAlt}
              width={0}
              height={0}
              sizes="100vw"
              quality={82}
              priority={priority}
              fetchPriority={priority ? 'high' : undefined}
              style={{ width: '100%', height: 'auto' }}
              className="block h-auto w-full md:hidden"
            />
          </>
        ) : (
          <>
            <Image
              src={banner.imageUrl}
              alt={banner.imageAlt}
              fill
              sizes="100vw"
              quality={82}
              priority={priority}
              fetchPriority={priority ? 'high' : undefined}
              className={cn('object-cover', banner.mobileImageUrl && 'hidden md:block')}
            />
            {banner.mobileImageUrl && (
              <Image
                src={banner.mobileImageUrl}
                alt={banner.imageAlt}
                fill
                sizes="100vw"
                quality={82}
                priority={priority}
                className="object-cover md:hidden"
              />
            )}
          </>
        )
      ) : null}
      <span
        aria-hidden
        className={cn(
          'absolute inset-0',
          variant === 'feature'
            ? 'bg-gradient-to-r from-ink/70 via-ink/30 to-transparent'
            : 'bg-gradient-to-t from-ink/70 via-ink/20 to-transparent',
          // Desktop hero keeps the same bottom fade, a little deeper, so the
          // overlay stays readable without dimming the painted wordmark.
          variant === 'hero' && 'md:from-ink/80 md:via-ink/15 md:to-transparent',
        )}
      />
    </>
  )

  if (variant === 'hero' || variant === 'page') {
    return (
      <section className="relative w-full bg-charcoal" aria-labelledby={headingId}>
        <div
          className={cn(
            'relative overflow-hidden',
            // The phone artwork is a tall portrait with the wordmark painted
            // at the top. A viewport-height frame with object-cover slices
            // that name off, so the image keeps its own ratio. On desktop the
            // frame tracks viewport height so a laptop and a large monitor
            // each get a banner that fits the screen.
            variant === 'hero' && 'frame-hero',
            variant === 'page' && 'banner-page w-full',
          )}
        >
          {media}
          <div
            className={cn(
              'container-luxe flex flex-col items-center text-center',
              variant === 'hero'
                ? 'absolute inset-x-0 bottom-0 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-12 lg:pb-16'
                : 'absolute inset-x-0 bottom-0 pb-10 md:pb-14',
            )}
          >
            {banner.eyebrow && <p className="eyebrow text-gold-soft">{banner.eyebrow}</p>}
            <Heading
              id={headingId}
              className={cn(
                'mt-4 max-w-3xl font-serif leading-[1.05] text-ivory',
                variant === 'hero' ? 'type-display' : 'type-page',
              )}
            >
              {banner.heading}
            </Heading>
            {banner.subheading && (
              <p className="mt-3 max-w-xl text-[0.875rem] leading-relaxed text-ivory/85 md:mt-5 md:text-[0.9375rem]">
                {banner.subheading}
              </p>
            )}
            {(banner.href || banner.secondaryHref) && (
              <div className="mt-5 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4 md:mt-8">
                {banner.href && (
                  <Button asChild variant="light" size="lg" className="w-full sm:w-auto">
                    <Link href={banner.href}>{banner.ctaLabel ?? 'Explore'}</Link>
                  </Button>
                )}
                {banner.secondaryHref && (
                  <Button asChild variant="outlineLight" size="lg" className="w-full sm:w-auto">
                    <Link href={banner.secondaryHref}>{banner.secondaryCtaLabel ?? 'Discover more'}</Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }

  const body = (
    <div className="band-feature relative w-full overflow-hidden bg-charcoal">
      {media}
      <div className="container-luxe relative flex h-full items-center">
        <div className="max-w-lg">
          {banner.eyebrow && <p className="eyebrow text-gold-soft">{banner.eyebrow}</p>}
          <Heading
            id={headingId}
            className="mt-5 font-serif type-display text-ivory"
          >
            {banner.heading}
          </Heading>
          {banner.subheading && (
            <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-ivory/80">{banner.subheading}</p>
          )}
          {banner.href && (
            <span className="mt-9 inline-flex items-center gap-3 border-b border-ivory/45 pb-2 text-[0.6875rem] uppercase tracking-[0.2em] text-ivory transition-colors duration-500 group-hover:border-ivory">
              {banner.ctaLabel ?? 'Discover the collection'}
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <section aria-labelledby={headingId} className="relative">
      {banner.href ? (
        <Link href={banner.href} className="group block">
          {body}
        </Link>
      ) : (
        body
      )}
    </section>
  )
}
