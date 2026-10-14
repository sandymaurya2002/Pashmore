'use client'

import { useRegion } from '@/context/region-context'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/site'
import { formatPrice } from '@/lib/utils'

/** "Free above ₹4,999" in India, "Free above $250" elsewhere, per the shopper's region. */
export function FreeShippingNote({ prefix = 'Free above ' }: { prefix?: string }) {
  const { region } = useRegion()
  const rules = region?.commerce
  return (
    <>
      {prefix}
      {formatPrice(rules?.freeShippingThreshold ?? FREE_SHIPPING_THRESHOLD, rules?.currency ?? 'INR')}
    </>
  )
}
