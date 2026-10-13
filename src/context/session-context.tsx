'use client'

import * as React from 'react'

import { ApiError } from '@/lib/api/envelope'
import { bff } from '@/lib/api/browser'
import type { Customer } from '@/types'

export type SessionStatus = 'loading' | 'authenticated' | 'guest'

export interface RegisterInput {
  firstName: string
  lastName: string
  email: string
  password: string
  acceptsMarketing?: boolean
}

interface SessionContextValue {
  status: SessionStatus
  customer: Customer | null
  signIn: (email: string, password: string, remember: boolean) => Promise<Customer | null>
  register: (input: RegisterInput) => Promise<Customer | null>
  signOut: () => Promise<void>
  /** Re-reads the session from the server (after profile edits, or a 401 elsewhere). */
  reload: () => Promise<void>
  setCustomer: (customer: Customer) => void
}

const SessionContext = React.createContext<SessionContextValue | null>(null)

/** True when an API call failed because the customer is no longer signed in. */
export function isSessionError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401
}

/**
 * The browser's view of the customer session. The tokens themselves live in
 * HttpOnly cookies managed by `/api/auth/*`; this context only knows who is
 * signed in, so the header, cart and wishlist can react.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<SessionStatus>('loading')
  const [customer, setCustomerState] = React.useState<Customer | null>(null)

  const apply = React.useCallback((next: Customer | null) => {
    setCustomerState(next)
    setStatus(next ? 'authenticated' : 'guest')
  }, [])

  const reload = React.useCallback(async () => {
    try {
      const { data } = await bff<{ customer: Customer | null }>('/api/auth/session')
      apply(data.customer)
    } catch {
      // The store is unreachable; treat the visitor as a guest for now rather
      // than blocking the page. Account pages still enforce auth server-side.
      apply(null)
    }
  }, [apply])

  React.useEffect(() => {
    void reload()
  }, [reload])

  const signIn = React.useCallback<SessionContextValue['signIn']>(
    async (email, password, remember) => {
      const { data } = await bff<{ customer: Customer | null }>('/api/auth/login', {
        method: 'POST',
        body: { email, password, remember },
      })
      apply(data.customer)
      return data.customer
    },
    [apply],
  )

  const register = React.useCallback<SessionContextValue['register']>(
    async (input) => {
      const { data } = await bff<{ customer: Customer | null }>('/api/auth/register', {
        method: 'POST',
        body: input,
      })
      apply(data.customer)
      return data.customer
    },
    [apply],
  )

  const signOut = React.useCallback(async () => {
    try {
      await bff('/api/auth/logout', { method: 'POST' })
    } finally {
      apply(null)
    }
  }, [apply])

  const setCustomer = React.useCallback((next: Customer) => apply(next), [apply])

  const value = React.useMemo<SessionContextValue>(
    () => ({ status, customer, signIn, register, signOut, reload, setCustomer }),
    [status, customer, signIn, register, signOut, reload, setCustomer],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionContextValue {
  const context = React.useContext(SessionContext)
  if (!context) throw new Error('useSession must be used inside <SessionProvider>')
  return context
}
