import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { setParamHref, type SearchParams } from '@/lib/query'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  pathname: string
  searchParams: SearchParams
  className?: string
}

export function Pagination({ page, totalPages, pathname, searchParams, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const href = (target: number) =>
    setParamHref(pathname, searchParams, 'page', target > 1 ? String(target) : undefined)

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex items-center justify-between gap-4 border-t border-line pt-8', className)}
    >
      {page > 1 ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page - 1)} rel="prev">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
            Previous
          </Link>
        </Button>
      ) : (
        <span />
      )}

      <p className="text-xs tabular-nums text-taupe">
        Page {page} of {totalPages}
      </p>

      {page < totalPages ? (
        <Button asChild variant="outline" size="sm">
          <Link href={href(page + 1)} rel="next">
            Next
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  )
}
