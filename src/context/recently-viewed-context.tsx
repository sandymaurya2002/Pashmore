'use client'

import * as React from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'

const STORAGE_KEY = 'pashmore.recently-viewed.v1'
const MAX_ENTRIES = 12

interface RecentlyViewedContextValue {
  slugs: string[]
  hydrated: boolean
  record: (slug: string) => void
  clear: () => void
}

const RecentlyViewedContext = React.createContext<RecentlyViewedContextValue | null>(null)

/** Product ids only, stored locally. No account required, no tracking cookie. */
export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const { value: slugs, setValue, hydrated } = useLocalStorage<string[]>(STORAGE_KEY, [])

  const record = React.useCallback(
    (slug: string) => {
      setValue((previous) =>
        [slug, ...previous.filter((entry) => entry !== slug)].slice(0, MAX_ENTRIES),
      )
    },
    [setValue],
  )

  const clear = React.useCallback(() => setValue([]), [setValue])

  const value = React.useMemo(
    () => ({ slugs, hydrated, record, clear }),
    [slugs, hydrated, record, clear],
  )

  return (
    <RecentlyViewedContext.Provider value={value}>
      {children}
    </RecentlyViewedContext.Provider>
  )
}

export function useRecentlyViewed(): RecentlyViewedContextValue {
  const context = React.useContext(RecentlyViewedContext)
  if (!context) {
    throw new Error('useRecentlyViewed must be used inside <RecentlyViewedProvider>')
  }
  return context
}
