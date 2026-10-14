'use client'

import * as React from 'react'

import { useToast } from '@/context/toast-context'
import { bff, errorMessage } from '@/lib/api/browser'
import type { Region } from '@/lib/region'
import type { CommerceRules } from '@/server/content'

export interface RegionInfo extends Region {
  countryName: string
  /** Shipping rules in the region's currency. */
  commerce: CommerceRules
}

interface RegionContextValue {
  /** Null until the region has been read from the server. */
  region: RegionInfo | null
  changing: boolean
  /** Switches the shopping region; the page reloads so every price is re-read in the new currency. */
  setCountry: (country: string) => Promise<void>
}

const RegionContext = React.createContext<RegionContextValue | null>(null)

/**
 * The shopping region decides which price list (₹ or $) the server sends.
 * Prices themselves always carry their currency; this context only serves the
 * selector and copy that has no price data at hand, such as shipping thresholds.
 */
export function RegionProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast()
  const [region, setRegion] = React.useState<RegionInfo | null>(null)
  const [changing, setChanging] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    bff<RegionInfo>('/api/region')
      .then(({ data }) => {
        if (!cancelled) setRegion(data)
      })
      .catch(() => {
        /* The selector stays hidden; prices still come from the server. */
      })
    return () => {
      cancelled = true
    }
  }, [])

  const setCountry = React.useCallback(
    async (country: string) => {
      if (region?.country === country && region.source === 'choice') return
      setChanging(true)
      try {
        const { data } = await bff<RegionInfo>('/api/region', { method: 'POST', body: { country } })
        setRegion(data)
        window.location.reload()
      } catch (reason) {
        setChanging(false)
        toast({
          title: 'Could not change your region',
          description: errorMessage(reason, 'Please try again.'),
          tone: 'error',
        })
      }
    },
    [region, toast],
  )

  const value = React.useMemo(() => ({ region, changing, setCountry }), [region, changing, setCountry])
  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>
}

export function useRegion(): RegionContextValue {
  const context = React.useContext(RegionContext)
  if (!context) throw new Error('useRegion must be used inside <RegionProvider>')
  return context
}
