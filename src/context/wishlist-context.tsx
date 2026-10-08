'use client'

import * as React from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import type { WishlistEntry } from '@/types'

const STORAGE_KEY = 'pashmore.wishlist.v1'

interface WishlistContextValue {
  entries: WishlistEntry[]
  slugs: string[]
  hydrated: boolean
  has: (slug: string) => boolean
  toggle: (slug: string) => boolean
  remove: (slug: string) => void
  clear: () => void
}

const WishlistContext = React.createContext<WishlistContextValue | null>(null)

/**
 * Guests keep their wishlist in localStorage. When authentication is wired up,
 * `syncWishlist` in `services/account` should merge this list into the
 * customer record on sign-in and this provider can read from the API instead —
 * no component changes required.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { value: entries, setValue, hydrated } = useLocalStorage<WishlistEntry[]>(
    STORAGE_KEY,
    [],
  )

  const slugs = React.useMemo(() => entries.map((entry) => entry.productSlug), [entries])

  const has = React.useCallback(
    (slug: string) => entries.some((entry) => entry.productSlug === slug),
    [entries],
  )

  const toggle = React.useCallback(
    (slug: string) => {
      let added = false
      setValue((previous) => {
        const exists = previous.some((entry) => entry.productSlug === slug)
        added = !exists
        return exists
          ? previous.filter((entry) => entry.productSlug !== slug)
          : [{ productSlug: slug, addedAt: new Date().toISOString() }, ...previous]
      })
      return added
    },
    [setValue],
  )

  const remove = React.useCallback(
    (slug: string) => {
      setValue((previous) => previous.filter((entry) => entry.productSlug !== slug))
    },
    [setValue],
  )

  const clear = React.useCallback(() => setValue([]), [setValue])

  const value = React.useMemo<WishlistContextValue>(
    () => ({ entries, slugs, hydrated, has, toggle, remove, clear }),
    [entries, slugs, hydrated, has, toggle, remove, clear],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const context = React.useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return context
}
