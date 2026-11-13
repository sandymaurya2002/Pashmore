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
    // Prices are already in the server HTML. This request only fills the
    // region selector, so it waits until the browser is idle and does not
    // compete with the hero image on a phone.
    const load = () => {
      if (cancelled) return
      bff<RegionInfo>('/api/region')
        .then(({ data }) => {
          if (!cancelled) setRegion(data)
        })
        .catch(() => {
          /* The selector stays hidden; prices still come from the server. */
        })
    }
    const idleId =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(load, { timeout: 2000 })
        : null
    const timer = idleId == null ? window.setTimeout(load, 1200) : null
    return () => {
      cancelled = true
      if (idleId != null) window.cancelIdleCallback(idleId)
      if (timer != null) window.clearTimeout(timer)
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
