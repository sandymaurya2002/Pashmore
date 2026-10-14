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
 * and carries the page's h1; `feature` is the full-bleed editorial band.
 */
export function CmsBanner({ banner, variant, priority = false }: { banner: Banner; variant: 'hero' | 'feature'; priority?: boolean }) {
  const headingId = `banner-${banner.id}`
  const Heading = variant === 'hero' ? 'h1' : 'h2'

  const media = (
    <>
      {banner.mediaType === 'VIDEO' && banner.videoUrl ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
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
      ) : null}
      <span
        aria-hidden
        className={cn(
          'absolute inset-0',
          variant === 'hero'
            ? 'bg-gradient-to-t from-ink/70 via-ink/20 to-transparent'
            : 'bg-gradient-to-r from-ink/70 via-ink/30 to-transparent',
        )}
      />
    </>
  )

  if (variant === 'hero') {
    return (
      <section className="relative w-full bg-charcoal" aria-labelledby={headingId}>
        <div className="relative h-[78dvh] min-h-[28rem] w-full overflow-hidden md:h-auto md:aspect-video">
          {media}
          <div className="container-luxe absolute inset-x-0 bottom-0 flex flex-col items-center pb-10 text-center md:pb-14">
            {banner.eyebrow && <p className="eyebrow text-gold-soft">{banner.eyebrow}</p>}
            <Heading
              id={headingId}
              className="mt-4 max-w-3xl font-serif text-[2.25rem] leading-[1.05] text-ivory md:text-[3.5rem]"
            >
              {banner.heading}
            </Heading>
            {banner.subheading && (
              <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-ivory/85">{banner.subheading}</p>
            )}
            {(banner.href || banner.secondaryHref) && (
              <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
                {banner.href && (
                  <Button asChild variant="light" size="lg">
                    <Link href={banner.href}>{banner.ctaLabel ?? 'Explore'}</Link>
                  </Button>
                )}
                {banner.secondaryHref && (
                  <Button asChild variant="outlineLight" size="lg">
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
    <div className="relative h-[62dvh] min-h-[24rem] w-full overflow-hidden bg-charcoal lg:h-[70dvh]">
      {media}
      <div className="container-luxe relative flex h-full items-center">
        <div className="max-w-lg">
          {banner.eyebrow && <p className="eyebrow text-gold-soft">{banner.eyebrow}</p>}
          <Heading
            id={headingId}
            className="mt-5 font-serif text-[2.5rem] leading-[1.05] text-ivory md:text-[3.75rem]"
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
