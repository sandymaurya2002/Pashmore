import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

/** The Changthangi goat mark — trimmed, transparent, 221 × 256. */
const MARK = { src: '/images/brand/pashmore-mark.png', width: 221, height: 256 }

/**
 * The goat mark sits beside a set-type wordmark. The wordmark stays as text:
 * it is crisp at any size, costs no network request, and remains readable to
 * crawlers. The mark is decorative next to it (the link carries the name).
 */
export function Logo({
  className,
  compact = false,
  tone = 'dark',
  asLink = true,
  priority = false,
}: {
  className?: string
  compact?: boolean
  tone?: 'dark' | 'light'
  asLink?: boolean
  /** Set where the logo is above the fold on first paint (the header). */
  priority?: boolean
}) {
  const mark = (
    <span className={cn('flex items-center gap-2 sm:gap-3', className)}>
      <Image
        src={MARK.src}
        width={MARK.width}
        height={MARK.height}
        alt=""
        aria-hidden="true"
        priority={priority}
        sizes="64px"
        className={cn(
          'w-auto shrink-0 transition-all duration-500 ease-[var(--ease-luxe)]',
          // Small on phones: the header row is tight below ~360px and the cart
          // button must never be pushed off-screen.
          compact ? 'h-7 sm:h-9' : 'h-8 sm:h-12',
        )}
      />
      <span
        className={cn(
          'block font-serif font-semibold leading-none transition-all duration-500 ease-[var(--ease-luxe)]',
          tone === 'light' ? 'text-ivory' : 'text-charcoal',
          // The wordmark sits between the hamburger and the utility icons, so it
          // has to give way first on narrow phones — at full size it pushed the
          // cart button off-screen below ~360px.
          compact
            ? 'text-[1rem] tracking-[0.14em] xs:text-[1.125rem] sm:text-[1.625rem] sm:tracking-[0.3em]'
            : 'text-[1.0625rem] tracking-[0.16em] xs:text-[1.1875rem] sm:text-[2rem] sm:tracking-[0.34em]',
        )}
      >
        PASHMORE
      </span>
    </span>
  )

  if (!asLink) return mark

  return (
    <Link href="/" aria-label="Pashmore — home" className="inline-block">
      {mark}
    </Link>
  )
}
