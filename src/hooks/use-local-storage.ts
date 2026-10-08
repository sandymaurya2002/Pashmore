'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * localStorage-backed state that is safe to render on the server.
 *
 * The first client render deliberately uses `initialValue` so it matches the
 * HTML the server produced; the stored value is adopted in an effect straight
 * afterwards. `hydrated` lets callers hold back UI (cart counts, wishlist
 * hearts) until the real value is known, which avoids a visible flicker.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw !== null) setValue(JSON.parse(raw) as T)
    } catch {
      // Corrupt or unavailable storage (private mode, quota) — fall back to
      // the in-memory value rather than breaking the page.
    }
    setHydrated(true)
  }, [key])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore quota errors: the cart still works for this session.
    }
  }, [key, value, hydrated])

  // Keep multiple tabs consistent.
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== key || event.newValue === null) return
      try {
        setValue(JSON.parse(event.newValue) as T)
      } catch {
        /* ignore malformed payloads from other tabs */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  const reset = useCallback(() => setValue(initialValue), [initialValue])

  return { value, setValue, hydrated, reset } as const
}
