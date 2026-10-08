'use client'

import * as React from 'react'
import type { Product } from '@/types'

/**
 * Resolves product records for a list of slugs held on the client (wishlist,
 * recently viewed). Keeps the catalogue on the server where it belongs.
 */
export function useProductsBySlugs(slugs: string[], enabled = true) {
  const [products, setProducts] = React.useState<Product[]>([])
  const [loading, setLoading] = React.useState(false)
  const key = slugs.join(',')

  React.useEffect(() => {
    if (!enabled || !key) {
      setProducts([])
      return
    }

    const controller = new AbortController()
    setLoading(true)

    fetch(`/api/products?slugs=${encodeURIComponent(key)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data: { products: Product[] }) => setProducts(data.products))
      .catch(() => {
        /* aborted or offline */
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [key, enabled])

  return { products, loading }
}
