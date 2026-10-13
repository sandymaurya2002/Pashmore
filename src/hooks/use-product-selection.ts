'use client'

import * as React from 'react'
import { useCart } from '@/context/cart-context'
import { useToast } from '@/context/toast-context'
import { clamp } from '@/lib/utils'
import type { Product, ProductVariant } from '@/types'

/**
 * Shared purchase state for the product page, the quick view and the bottom
 * sticky bar. Keeping it in one hook means all three always agree about which
 * variant is selected and whether it can actually be bought.
 */
export function useProductSelection(product: Product) {
  const { addItem } = useCart()
  const { toast } = useToast()

  const [colorSlug, setColorSlug] = React.useState(() => product.colors[0]?.slug)
  const [sizeSlug, setSizeSlug] = React.useState(() => product.sizes[0]?.slug)
  const [quantity, setQuantity] = React.useState(1)
  const [adding, setAdding] = React.useState(false)

  // A different product means a fresh selection.
  React.useEffect(() => {
    setColorSlug(product.colors[0]?.slug)
    setSizeSlug(product.sizes[0]?.slug)
    setQuantity(1)
  }, [product.slug, product.colors, product.sizes])

  const variant: ProductVariant | undefined = React.useMemo(() => {
    // A product sold without variants is bought by its product id, as in the Worker.
    if (!product.variants.length) {
      return {
        id: product.id,
        sku: '',
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        inventory: product.inventory,
      }
    }
    return product.variants.find(
      (entry) => entry.colorSlug === colorSlug && entry.sizeSlug === sizeSlug,
    )
  }, [product, colorSlug, sizeSlug])

  const available = (variant?.inventory ?? 0) > 0
  const maxQuantity = Math.max(1, Math.min(variant?.inventory ?? 1, 10))

  React.useEffect(() => {
    setQuantity((current) => clamp(current, 1, maxQuantity))
  }, [maxQuantity])

  /** Inventory for a colour across every size — used to grey out swatches. */
  const colorAvailability = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of product.variants) {
      if (!entry.colorSlug) continue
      map.set(entry.colorSlug, (map.get(entry.colorSlug) ?? 0) + entry.inventory)
    }
    return map
  }, [product.variants])

  const sizeAvailability = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of product.variants) {
      if (!entry.sizeSlug) continue
      if (colorSlug && entry.colorSlug !== colorSlug) continue
      map.set(entry.sizeSlug, (map.get(entry.sizeSlug) ?? 0) + entry.inventory)
    }
    return map
  }, [product.variants, colorSlug])

  const colorName = product.colors.find((c) => c.slug === colorSlug)?.name
  const sizeName = product.sizes.find((s) => s.slug === sizeSlug)?.name

  const addToCart = React.useCallback(async () => {
    if (!variant || !available) {
      toast({
        title: 'Currently unavailable',
        description: 'This combination is out of stock. Try another colour or size.',
        tone: 'error',
      })
      return false
    }
    if (adding) return false

    // The Worker checks stock and price again; failures surface as a toast.
    setAdding(true)
    try {
      const added = await addItem({ variantId: variant.id, productSlug: product.slug, quantity })
      if (added) {
        toast({
          title: 'Added to your bag',
          description: `${product.name}${colorName ? ` — ${colorName}` : ''}`,
        })
      }
      return added
    } finally {
      setAdding(false)
    }
  }, [adding, addItem, available, colorName, product.name, product.slug, quantity, toast, variant])

  return {
    colorSlug,
    setColorSlug,
    sizeSlug,
    setSizeSlug,
    quantity,
    setQuantity,
    variant,
    available,
    maxQuantity,
    colorAvailability,
    sizeAvailability,
    colorName,
    sizeName,
    addToCart,
    adding,
  }
}
