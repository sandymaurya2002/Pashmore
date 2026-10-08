'use client'

import * as React from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { SlidersHorizontal } from 'lucide-react'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * Mobile filter drawer. The panel content is rendered on the server and passed
 * in as `children`, so this client component only owns open/closed state — the
 * filter markup itself stays out of the client bundle.
 */
export function FilterDrawer({
  children,
  activeCount,
  resultCount,
}: {
  children: React.ReactNode
  activeCount: number
  resultCount: number
}) {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Applying a filter navigates; close the drawer when the URL changes.
  const key = `${pathname}?${searchParams.toString()}`
  const previousKey = React.useRef(key)
  React.useEffect(() => {
    if (previousKey.current !== key) {
      previousKey.current = key
      setOpen(false)
    }
  }, [key])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2.5 border border-line-strong px-4 py-2.5 text-[0.6875rem] uppercase tracking-[0.14em] text-charcoal transition-colors hover:border-charcoal lg:hidden"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.25} />
        Filter
        {activeCount > 0 && <span className="text-gold">({activeCount})</span>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent side="left" className="max-w-[21rem]" closeLabel="Close filters">
          <div className="border-b border-line px-6 py-5">
            <DialogTitle className="font-serif text-xl text-charcoal">Filter</DialogTitle>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-2">
            {children}
          </div>

          <div className="border-t border-line px-6 py-4">
            <Button onClick={() => setOpen(false)} className="w-full">
              Show {resultCount} {resultCount === 1 ? 'piece' : 'pieces'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
