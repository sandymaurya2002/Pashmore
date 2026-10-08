'use client'

import * as React from 'react'

interface UIContextValue {
  searchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  mobileMenuOpen: boolean
  openMobileMenu: () => void
  closeMobileMenu: () => void
}

const UIContext = React.createContext<UIContextValue | null>(null)

/**
 * Overlay coordination lives outside the header so that any component — a
 * footer link, an empty state, the ⌘K shortcut — can open search without
 * prop-drilling through the layout.
 */
export function UIProvider({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const openSearch = React.useCallback(() => {
    setMobileMenuOpen(false)
    setSearchOpen(true)
  }, [])
  const closeSearch = React.useCallback(() => setSearchOpen(false), [])
  const openMobileMenu = React.useCallback(() => setMobileMenuOpen(true), [])
  const closeMobileMenu = React.useCallback(() => setMobileMenuOpen(false), [])

  // ⌘K / Ctrl+K opens search from anywhere. Ignored while typing in a field.
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return
      event.preventDefault()
      setSearchOpen((previous) => !previous)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const value = React.useMemo(
    () => ({
      searchOpen,
      openSearch,
      closeSearch,
      mobileMenuOpen,
      openMobileMenu,
      closeMobileMenu,
    }),
    [searchOpen, openSearch, closeSearch, mobileMenuOpen, openMobileMenu, closeMobileMenu],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI(): UIContextValue {
  const context = React.useContext(UIContext)
  if (!context) throw new Error('useUI must be used inside <UIProvider>')
  return context
}
