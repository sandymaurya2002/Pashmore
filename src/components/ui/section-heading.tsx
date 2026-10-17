import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  eyebrow?: string
  title: string
  description?: string
  href?: string
  linkLabel?: string
  align?: 'left' | 'center'
  as?: 'h1' | 'h2'
  className?: string
  id?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = 'View all',
  align = 'left',
  as: Tag = 'h2',
  className,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end gap-6',
        align === 'center' ? 'flex-col items-center text-center' : 'justify-between',
        className,
      )}
    >
      <div className={align === 'center' ? 'max-w-2xl' : 'max-w-xl'}>
        {eyebrow && <p className="eyebrow mb-4 text-gold">{eyebrow}</p>}
        <Tag
          id={id}
          className="font-serif type-title text-charcoal"
        >
          {title}
        </Tag>
        {description && (
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-mocha">{description}</p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.18em] text-charcoal transition-colors duration-300 hover:text-gold"
        >
          {linkLabel}
          <ArrowRight
            className="h-3.5 w-3.5 transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-1"
            strokeWidth={1.25}
          />
        </Link>
      )}
    </div>
  )
}
