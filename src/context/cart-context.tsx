'use client'

import * as React from 'react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { FREE_SHIPPING_THRESHOLD, GST_RATE, STANDARD_SHIPPING_FEE } from '@/lib/site'
import { clamp } from '@/lib/utils'
import type { CartItem, CartTotals, Coupon } from '@/types'

const STORAGE_KEY = 'pashmore.cart.v1'

export const COUPONS: Coupon[] = [
  { code: 'HERITAGE10', label: '10% off your order', type: 'percent', value: 10 },
  {
    code: 'WELCOME500',
    label: '₹500 off orders above ₹5,000',
    type: 'fixed',
    value: 500,
    minimumSubtotal: 5000,
  },
]

interface CartState {
  items: CartItem[]
  coupon: Coupon | null
}

interface CartContextValue {
  items: CartItem[]
  totals: CartTotals
  coupon: Coupon | null
  hydrated: boolean
  isOpen: boolean
  /** Slug of the line added most recently — drives the confirmation toast. */
  lastAdded: string | null
  openCart: () => void
  closeCart: () => void
  addItem: (item: Omit<CartItem, 'key'> & { key?: string }) => void
  updateQuantity: (key: string, quantity: number) => void
  removeItem: (key: string) => void
  clear: () => void
  applyCoupon: (code: string) => { ok: boolean; message: string }
  removeCoupon: () => void
}

const CartContext = React.createContext<CartContextValue | null>(null)

export function cartItemKey(
  productSlug: string,
  colorSlug?: string,
  sizeSlug?: string,
): string {
  return [productSlug, colorSlug ?? '-', sizeSlug ?? '-'].join(':')
}

export function computeTotals(items: CartItem[], coupon: Coupon | null): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  let discount = 0
  if (coupon && (!coupon.minimumSubtotal || subtotal >= coupon.minimumSubtotal)) {
    discount =
      coupon.type === 'percent'
        ? Math.round((subtotal * coupon.value) / 100)
        : Math.min(coupon.value, subtotal)
  }

  const payable = Math.max(0, subtotal - discount)
  const shipping =
    payable === 0 || payable >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE

  // Indian retail convention: GST is included in the displayed price, so we
  // show the component rather than adding it on top.
  const tax = Math.round(payable - payable / (1 + GST_RATE))

  return {
    subtotal,
    discount,
    shipping,
    tax,
    total: payable + shipping,
    itemCount,
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { value: state, setValue: setState, hydrated } = useLocalStorage<CartState>(
    STORAGE_KEY,
    { items: [], coupon: null },
  )
  const [isOpen, setIsOpen] = React.useState(false)
  const [lastAdded, setLastAdded] = React.useState<string | null>(null)

  const openCart = React.useCallback(() => setIsOpen(true), [])
  const closeCart = React.useCallback(() => setIsOpen(false), [])

  const addItem = React.useCallback<CartContextValue['addItem']>(
    (incoming) => {
      const key =
        incoming.key ?? cartItemKey(incoming.productSlug, incoming.color, incoming.size)

      setState((previous) => {
        const existing = previous.items.find((item) => item.key === key)
        const items = existing
          ? previous.items.map((item) =>
              item.key === key
                ? {
                    ...item,
                    quantity: clamp(
                      item.quantity + incoming.quantity,
                      1,
                      incoming.maxQuantity,
                    ),
                  }
                : item,
            )
          : [...previous.items, { ...incoming, key }]
        return { ...previous, items }
      })

      setLastAdded(key)
      setIsOpen(true)
    },
    [setState],
  )

  const updateQuantity = React.useCallback(
    (key: string, quantity: number) => {
      setState((previous) => ({
        ...previous,
        items:
          quantity <= 0
            ? previous.items.filter((item) => item.key !== key)
            : previous.items.map((item) =>
                item.key === key
                  ? { ...item, quantity: clamp(quantity, 1, item.maxQuantity) }
                  : item,
              ),
      }))
    },
    [setState],
  )

  const removeItem = React.useCallback(
    (key: string) => {
      setState((previous) => ({
        ...previous,
        items: previous.items.filter((item) => item.key !== key),
      }))
    },
    [setState],
  )

  const clear = React.useCallback(() => {
    setState({ items: [], coupon: null })
  }, [setState])

  const totals = React.useMemo(
    () => computeTotals(state.items, state.coupon),
    [state.items, state.coupon],
  )

  const applyCoupon = React.useCallback<CartContextValue['applyCoupon']>(
    (code) => {
      const match = COUPONS.find(
        (entry) => entry.code.toLowerCase() === code.trim().toLowerCase(),
      )
      if (!match) return { ok: false, message: 'That code is not recognised.' }
      if (match.minimumSubtotal && totals.subtotal < match.minimumSubtotal) {
        return {
          ok: false,
          message: `This code applies to orders above ₹${match.minimumSubtotal.toLocaleString('en-IN')}.`,
        }
      }
      setState((previous) => ({ ...previous, coupon: match }))
      return { ok: true, message: match.label }
    },
    [setState, totals.subtotal],
  )

  const removeCoupon = React.useCallback(() => {
    setState((previous) => ({ ...previous, coupon: null }))
  }, [setState])

  const value = React.useMemo<CartContextValue>(
    () => ({
      items: state.items,
      coupon: state.coupon,
      totals,
      hydrated,
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
    }),
    [
      state.items,
      state.coupon,
      totals,
      hydrated,
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
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = React.useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside <CartProvider>')
  return context
}
