'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Checkout is deliberately stripped of navigation: no mega menu, no footer
 * links, no search. Everything on the page should move the customer forward.
 *
 * The header and footer are passed in as rendered elements rather than
 * imported, so they remain Server Components — this wrapper only decides
 * whether to place them.
 */
export function SiteChrome({
  header,
  banner,
  footer,
  overlays,
  children,
}: {
  header: ReactNode
  /** Admin-managed page banner, shown above the page content. */
  banner?: ReactNode
  footer: ReactNode
  overlays: ReactNode
  children: ReactNode
}) {
  const pathname = usePathname()
  const minimal = pathname.startsWith('/checkout') || pathname.startsWith('/admin')

  return (
    <>
      {!minimal && header}
      <main id="main" className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {!minimal && banner}
        {children}
      </main>
      {!minimal && footer}
      {!minimal && overlays}
    </>
  )
}
