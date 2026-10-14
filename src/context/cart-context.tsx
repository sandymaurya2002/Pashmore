'use client'

import * as React from 'react'

import { useSession } from '@/context/session-context'
import { useToast } from '@/context/toast-context'
import { bff, errorMessage } from '@/lib/api/browser'
import { FREE_SHIPPING_THRESHOLD } from '@/lib/site'
import type { Cart, CartItem, CartTotals, Coupon, Currency } from '@/types'

/** Pre-migration carts lived here; they hold no variant ids and cannot be restored. */
const LEGACY_STORAGE_KEY = 'pashmore.cart.v1'

const EMPTY_CART: Cart = {
  currency: 'INR',
  items: [],
  totals: { subtotal: 0, discount: 0, shipping: 0, tax: 0, total: 0, itemCount: 0 },
  coupon: null,
  freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
  remainingForFreeShipping: FREE_SHIPPING_THRESHOLD,
}

interface CartContextValue {
  /** Every amount in the bag is in this currency (the shopper's region). */
  currency: Currency
  items: CartItem[]
  totals: CartTotals
  coupon: Coupon | null
  freeShippingThreshold: number
  remainingForFreeShipping: number
  /** The cart has been read from the server at least once. */
  hydrated: boolean
  /** Set when the cart could not be loaded at all. */
  error: string | null
  /** Key of the line (or `'cart'`) with a request in flight. */
  pendingKey: string | null
  isOpen: boolean
  /** Line added most recently. */
  lastAdded: string | null
  openCart: () => void
  closeCart: () => void
  addItem: (input: { variantId: string; productSlug: string; quantity: number }) => Promise<boolean>
  updateQuantity: (key: string, quantity: number) => Promise<void>
  removeItem: (key: string) => Promise<void>
  clear: () => Promise<void>
  applyCoupon: (code: string) => Promise<{ ok: boolean; message: string }>
  removeCoupon: () => Promise<void>
  reload: () => Promise<void>
}

const CartContext = React.createContext<CartContextValue | null>(null)

type CartResponse = { cart: Cart; message?: string }

/**
 * The bag lives in the Worker (D1), keyed to the customer when signed in and
 * to an HttpOnly guest cookie otherwise. Prices, stock limits, discounts and
 * totals all come from the server — nothing is computed or trusted here.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const { toast } = useToast()
  const [cart, setCart] = React.useState<Cart>(EMPTY_CART)
  const [hydrated, setHydrated] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pendingKey, setPendingKey] = React.useState<string | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [lastAdded, setLastAdded] = React.useState<string | null>(null)

  const openCart = React.useCallback(() => setIsOpen(true), [])
  const closeCart = React.useCallback(() => setIsOpen(false), [])

  const reload = React.useCallback(async () => {
    try {
      const { data } = await bff<CartResponse>('/api/cart')
      setCart(data.cart)
      setError(null)
    } catch (reason) {
      setError(errorMessage(reason, 'Your bag could not be loaded.'))
    } finally {
      setHydrated(true)
    }
  }, [])

  // Wait for the session so a refresh never races the cart request, and
  // reload on sign-in/out — sign-in merges the guest bag into the account.
  React.useEffect(() => {
    if (status === 'loading') return
    void reload()
  }, [status, reload])

  React.useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch {
      /* storage unavailable */
    }
  }, [])

  const mutate = React.useCallback(
    async (
      key: string,
      path: string,
      init: { method: string; body?: unknown },
      failureTitle: string,
    ): Promise<CartResponse | null> => {
      setPendingKey(key)
      try {
        const { data } = await bff<CartResponse>(path, init)
        setCart(data.cart)
        setError(null)
        return data
      } catch (reason) {
        toast({
          title: failureTitle,
          description: errorMessage(reason, 'Please try again.'),
          tone: 'error',
        })
        // Stock or prices may have moved underneath us; show the truth.
        void reload()
        return null
      } finally {
        setPendingKey(null)
      }
    },
    [reload, toast],
  )

  const addItem = React.useCallback<CartContextValue['addItem']>(
    async ({ variantId, productSlug, quantity }) => {
      const result = await mutate(
        'cart',
        '/api/cart/items',
        { method: 'POST', body: { variantId, productSlug, quantity } },
        'Could not add to your bag',
      )
      if (!result) return false
      const line = result.cart.items.find((item) => item.variantId === variantId)
      setLastAdded(line?.key ?? null)
      setIsOpen(true)
      return true
    },
    [mutate],
  )

  const updateQuantity = React.useCallback(
    async (key: string, quantity: number) => {
      await mutate(
        key,
        `/api/cart/items/${encodeURIComponent(key)}`,
        quantity <= 0 ? { method: 'DELETE' } : { method: 'PATCH', body: { quantity } },
        'Could not update your bag',
      )
    },
    [mutate],
  )

  const removeItem = React.useCallback(
    async (key: string) => {
      await mutate(
        key,
        `/api/cart/items/${encodeURIComponent(key)}`,
        { method: 'DELETE' },
        'Could not remove that item',
      )
    },
    [mutate],
  )

  const clear = React.useCallback(async () => {
    await mutate('cart', '/api/cart', { method: 'DELETE' }, 'Could not empty your bag')
  }, [mutate])

  const applyCoupon = React.useCallback<CartContextValue['applyCoupon']>(async (code) => {
    setPendingKey('coupon')
    try {
      const { data } = await bff<CartResponse>('/api/cart/coupon', {
        method: 'POST',
        body: { code: code.trim() },
      })
      setCart(data.cart)
      return { ok: true, message: data.message || data.cart.coupon?.label || 'Discount applied.' }
    } catch (reason) {
      return { ok: false, message: errorMessage(reason, 'That code could not be applied.') }
    } finally {
      setPendingKey(null)
    }
  }, [])

  const removeCoupon = React.useCallback(async () => {
    await mutate('coupon', '/api/cart/coupon', { method: 'DELETE' }, 'Could not remove the code')
  }, [mutate])

  const value = React.useMemo<CartContextValue>(
    () => ({
      currency: cart.currency,
      items: cart.items,
      totals: cart.totals,
      coupon: cart.coupon,
      freeShippingThreshold: cart.freeShippingThreshold,
      remainingForFreeShipping: cart.remainingForFreeShipping,
      hydrated,
      error,
      pendingKey,
      isOpen,
      lastAdded,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      applyCoupon,
      removeCoupon,
      reload,
    }),
    [
      cart,
      hydrated,
      error,
      pendingKey,
      isOpen,
      lastAdded,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      applyCoupon,
      removeCoupon,
      reload,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = React.useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}
