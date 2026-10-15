import { cn } from '@/lib/utils'

/**
 * A plus that collapses into a minus.
 *
 * The two strokes share one centre, so the open and closed marks sit in the
 * same place. The vertical stroke scales away instead of rotating, which keeps
 * it on the pixel grid. It follows a parent `<details class="group">` or a
 * Radix trigger with `group` and `data-state`, and `open` covers plain React
 * state such as the mobile menu.
 */
export function DisclosureIcon({
  open,
  className,
}: {
  open?: boolean
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={cn('h-4 w-4 shrink-0 text-taupe', className)}
    >
      <path
        d="M3 8h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M8 3v10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
        className={cn(
          'origin-center [transform-box:fill-box] transition-transform duration-300 ease-[var(--ease-luxe)]',
          'group-open:scale-y-0 group-data-[state=open]:scale-y-0',
          open && 'scale-y-0',
        )}
      />
    </svg>
  )
}
