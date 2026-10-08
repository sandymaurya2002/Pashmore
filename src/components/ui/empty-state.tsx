import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title: string
  description: string
  actionHref?: string
  actionLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
  className?: string
  icon?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel,
  className,
  icon,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center py-20 text-center', className)}>
      {icon && (
        <span
          aria-hidden
          className="mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-line text-taupe"
        >
          {icon}
        </span>
      )}
      <h2 className="font-serif text-[1.75rem] leading-tight text-charcoal md:text-[2.25rem]">
        {title}
      </h2>
      <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-mocha">
        {description}
      </p>

      {(actionHref || secondaryHref) && (
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          {actionHref && actionLabel && (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          )}
          {secondaryHref && secondaryLabel && (
            <Button asChild variant="outline">
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
