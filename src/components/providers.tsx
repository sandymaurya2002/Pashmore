'use client'

import type { ReactNode } from 'react'
import { CartProvider } from '@/context/cart-context'
import { SessionProvider } from '@/context/session-context'
import { WishlistProvider } from '@/context/wishlist-context'
import { RecentlyViewedProvider } from '@/context/recently-viewed-context'
import { ToastProvider } from '@/context/toast-context'
import { UIProvider } from '@/context/ui-context'

/**
 * The single client boundary in the layout. Everything above it — the page
 * shell, all page content — stays a Server Component.
 *
 * The session sits above the wishlist and cart: both wait for it to resolve
 * so a token refresh never races their first request.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <SessionProvider>
        <UIProvider>
          <WishlistProvider>
            <RecentlyViewedProvider>
              <CartProvider>{children}</CartProvider>
            </RecentlyViewedProvider>
          </WishlistProvider>
        </UIProvider>
      </SessionProvider>
    </ToastProvider>
  )
}
