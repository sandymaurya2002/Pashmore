'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronDown, Search } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Logo } from '@/components/layout/logo'
import { primaryNav, footerColumns } from '@/data/navigation'
import { useUI } from '@/context/ui-context'
import { cn } from '@/lib/utils'

/**
 * Full-height drawer built on the shared Dialog primitive, so focus trapping,
 * scroll locking and Escape handling match every other overlay in the store.
 */
export function MobileMenu() {
  const { mobileMenuOpen, closeMobileMenu, openSearch } = useUI()
  const [expanded, setExpanded] = React.useState<string | null>(null)

  return (
    <Dialog open={mobileMenuOpen} onOpenChange={(open) => !open && closeMobileMenu()}>
      <DialogContent
        side="left"
        className="max-w-[22rem]"
        closeLabel="Close navigation menu"
      >
        <DialogTitle className="sr-only">Navigation menu</DialogTitle>

        <div className="border-b border-line px-6 py-6">
          <Logo compact />
        </div>

        <div className="border-b border-line px-6 py-4">
          <button
            type="button"
            onClick={() => {
              closeMobileMenu()
              openSearch()
            }}
            className="flex w-full items-center gap-3 border border-line-strong px-4 py-3 text-left text-sm text-taupe transition-colors hover:border-taupe"
          >
            <Search className="h-4 w-4" strokeWidth={1.25} />
            What are you looking for?
          </button>
        </div>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain">
          <ul className="px-6 py-2">
            {primaryNav.map((item) => {
              const isOpen = expanded === item.label
              return (
                <li key={item.label} className="border-b border-line/70 last:border-0">
                  {item.columns ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : item.label)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between py-4 text-left font-serif text-xl text-charcoal"
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 text-taupe transition-transform duration-300 ease-[var(--ease-luxe)]',
                            isOpen && 'rotate-180',
                          )}
                          strokeWidth={1.25}
                        />
                      </button>
                      <div
                        className="grid transition-[grid-template-rows] duration-400 ease-[var(--ease-luxe)]"
                        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                      >
                        <div className="overflow-hidden">
                          <ul className="flex flex-col gap-3 pb-5 pl-1">
                            {item.columns.flatMap((column) => column.links).map((link) => (
                              <li key={`${item.label}-${link.href}-${link.label}`}>
                                <Link
                                  href={link.href}
                                  onClick={closeMobileMenu}
                                  className={cn(
                                    'text-[0.9375rem] text-charcoal/85 transition-colors hover:text-charcoal',
                                    link.highlight && 'text-gold',
                                  )}
                                >
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="block py-4 font-serif text-xl text-charcoal"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="mt-4 border-t border-line px-6 py-6">
            <p className="eyebrow mb-4 text-taupe">Account</p>
            <ul className="flex flex-col gap-3">
              {footerColumns[3].links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMobileMenu}
                    className="text-sm text-charcoal/85 transition-colors hover:text-charcoal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/contact"
                  onClick={closeMobileMenu}
                  className="text-sm text-charcoal/85 transition-colors hover:text-charcoal"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </DialogContent>
    </Dialog>
  )
}
