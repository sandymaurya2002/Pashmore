'use client'

import * as React from 'react'

import { bff, errorMessage } from '@/lib/api/browser'
import type { Product } from '@/types'

/**
 * Resolves product records for a list of slugs held on the client (wishlist,
 * recently viewed). Keeps the catalogue on the server where it belongs.
 */
export function useProductsBySlugs(slugs: string[], enabled = true) {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const key = slugs.join(',')

  React.useEffect(() => {
    if (!enabled || !key) {
      setProducts([])
      setError(null)
      return
    }

    const controller = new AbortController()
    setLoading(true)
    setError(null)

    bff<{ products: Product[] }>(`/api/products?slugs=${encodeURIComponent(key)}`, {
      signal: controller.signal,
    })
      .then(({ data }) => setProducts(data.products))
      .catch((reason: unknown) => {
        if ((reason as Error)?.name === 'AbortError') return
        setError(errorMessage(reason, 'These pieces could not be loaded right now.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [key, enabled])

  return { products, loading, error }
}
