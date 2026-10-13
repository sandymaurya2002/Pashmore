'use client'

import * as React from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useSession, isSessionError } from '@/context/session-context'
import { useToast } from '@/context/toast-context'
import { bff, errorMessage } from '@/lib/api/browser'
import type { WishlistEntry } from '@/types'

const STORAGE_KEY = 'pashmore.wishlist.v1'
const NO_ENTRIES: WishlistEntry[] = []

interface WishlistContextValue {
  entries: WishlistEntry[]
  slugs: string[]
  hydrated: boolean
  /** True when the list is stored on the customer's account rather than this device. */
  synced: boolean
  has: (slug: string) => boolean
  toggle: (slug: string) => boolean
  remove: (slug: string) => void
  clear: () => void
}

const WishlistContext = React.createContext<WishlistContextValue | null>(null)

function toEntries(slugs: string[]): WishlistEntry[] {
  const now = new Date().toISOString()
  return slugs.map((productSlug) => ({ productSlug, addedAt: now }))
}

/**
 * Guests keep their wishlist in localStorage. Signed-in customers use the
 * account wishlist in the Worker; whatever a guest saved on this device is
 * merged into the account the first time they sign in.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { status, reload } = useSession()
  const { toast } = useToast()
  const local = useLocalStorage<WishlistEntry[]>(STORAGE_KEY, [])
  const [remote, setRemote] = React.useState<WishlistEntry[] | null>(null)
  const signedIn = status === 'authenticated'

  const localRef = React.useRef(local.value)
  const setLocal = local.setValue

  React.useEffect(() => {
    localRef.current = local.value
  }, [local.value])

  React.useEffect(() => {
    if (!signedIn) {
      setRemote(null)
      return
    }
    if (!local.hydrated) return

    let cancelled = false
    const guestSlugs = localRef.current.map((entry) => entry.productSlug)
    const request = guestSlugs.length
      ? bff<{ slugs: string[] }>('/api/wishlist/merge', { method: 'POST', body: { slugs: guestSlugs } })
      : bff<{ slugs: string[] }>('/api/wishlist')

    request
      .then(({ data }) => {
        if (cancelled) return
        if (guestSlugs.length) setLocal([])
        setRemote(toEntries(data.slugs))
      })
      .catch((error: unknown) => {
        if (cancelled) return
        if (isSessionError(error)) void reload()
        setRemote([])
      })

    return () => {
      cancelled = true
    }
  }, [signedIn, local.hydrated, setLocal, reload])

  const entries = signedIn ? (remote ?? NO_ENTRIES) : local.value
  const hydrated = signedIn ? remote !== null : status !== 'loading' && local.hydrated
  const slugs = React.useMemo(() => entries.map((entry) => entry.productSlug), [entries])

  const has = React.useCallback(
    (slug: string) => entries.some((entry) => entry.productSlug === slug),
    [entries],
  )

  const syncFailed = React.useCallback(
    (error: unknown, rollback: () => void) => {
      rollback()
      if (isSessionError(error)) void reload()
      toast({
        title: 'Wishlist not updated',
        description: errorMessage(error, 'Please try again.'),
        tone: 'error',
      })
    },
    [reload, toast],
  )

  const toggle = React.useCallback(
    (slug: string) => {
      const added = !entries.some((entry) => entry.productSlug === slug)

      if (!signedIn) {
        setLocal((previous) =>
          added
            ? [{ productSlug: slug, addedAt: new Date().toISOString() }, ...previous]
            : previous.filter((entry) => entry.productSlug !== slug),
        )
        return added
      }

      const before = remote ?? []
      setRemote(
        added
          ? [{ productSlug: slug, addedAt: new Date().toISOString() }, ...before]
          : before.filter((entry) => entry.productSlug !== slug),
      )
      bff<{ added: boolean }>('/api/wishlist/toggle', { method: 'POST', body: { slug } })
        .then(({ data }) => {
          // The server is the source of truth if another tab got there first.
          if (data.added !== added) {
            setRemote((current) =>
              data.added
                ? [{ productSlug: slug, addedAt: new Date().toISOString() }, ...(current ?? [])]
                : (current ?? []).filter((entry) => entry.productSlug !== slug),
            )
          }
        })
        .catch((error: unknown) => syncFailed(error, () => setRemote(before)))
      return added
    },
    [entries, signedIn, remote, setLocal, syncFailed],
  )

  const remove = React.useCallback(
    (slug: string) => {
      if (!signedIn) {
        setLocal((previous) => previous.filter((entry) => entry.productSlug !== slug))
        return
      }
      const before = remote ?? []
      setRemote(before.filter((entry) => entry.productSlug !== slug))
      bff(`/api/wishlist/${encodeURIComponent(slug)}`, { method: 'DELETE' }).catch(
        (error: unknown) => syncFailed(error, () => setRemote(before)),
      )
    },
    [signedIn, remote, setLocal, syncFailed],
  )

  const clear = React.useCallback(() => {
    if (!signedIn) {
      setLocal([])
      return
    }
    const before = remote ?? []
    setRemote([])
    bff('/api/wishlist', { method: 'DELETE' }).catch((error: unknown) =>
      syncFailed(error, () => setRemote(before)),
    )
  }, [signedIn, remote, setLocal, syncFailed])

  const value = React.useMemo<WishlistContextValue>(
    () => ({ entries, slugs, hydrated, synced: signedIn, has, toggle, remove, clear }),
    [entries, slugs, hydrated, signedIn, has, toggle, remove, clear],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist(): WishlistContextValue {
  const context = React.useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used inside <WishlistProvider>')
  return context
}
