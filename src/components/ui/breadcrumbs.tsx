import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Breadcrumb } from '@/types'

/**
 * Visible breadcrumbs. The matching BreadcrumbList JSON-LD is emitted by the
 * page itself from the same array, so the markup and the structured data can
 * never disagree.
 */
export function Breadcrumbs({
  items,
  className,
  tone = 'dark',
}: {
  items: Breadcrumb[]
  className?: string
  tone?: 'dark' | 'light'
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[0.6875rem] uppercase tracking-[0.12em]">
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {last ? (
                <span
                  aria-current="page"
                  className={tone === 'light' ? 'text-ivory' : 'text-charcoal'}
                >
                  {item.name}
                </span>
              ) : (
                <>
                  <Link
                    href={item.href}
                    className={cn(
                      'inline-block py-1 transition-colors duration-300',
                      tone === 'light'
                        ? 'text-ivory/60 hover:text-ivory'
                        : 'text-taupe hover:text-charcoal',
                    )}
                  >
                    {item.name}
                  </Link>
                  <ChevronRight
                    aria-hidden
                    className={cn(
                      'h-3 w-3',
                      tone === 'light' ? 'text-ivory/40' : 'text-taupe/60',
                    )}
                    strokeWidth={1.25}
                  />
                </>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
