'use client'

import type { ReactNode } from 'react'
import { CartProvider } from '@/context/cart-context'
import { WishlistProvider } from '@/context/wishlist-context'
import { RecentlyViewedProvider } from '@/context/recently-viewed-context'
import { ToastProvider } from '@/context/toast-context'
import { UIProvider } from '@/context/ui-context'

/**
 * The single client boundary in the layout. Everything above it — the page
 * shell, all page content — stays a Server Component.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <UIProvider>
        <WishlistProvider>
          <RecentlyViewedProvider>
            <CartProvider>{children}</CartProvider>
          </RecentlyViewedProvider>
        </WishlistProvider>
      </UIProvider>
    </ToastProvider>
  )
}
