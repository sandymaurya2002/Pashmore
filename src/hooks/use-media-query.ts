'use client'

import { useEffect, useState } from 'react'

/** SSR-safe media query. Returns `false` until the client has measured. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const list = window.matchMedia(query)
    setMatches(list.matches)
    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** Matches the tablet breakpoint from the design system. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)')
}

/**
 * Honours the OS "reduce motion" setting. Parallax, hover zoom follow and
 * reveal animations all consult this before doing anything expensive.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

/** True on devices whose primary pointer can hover (i.e. a real mouse). */
export function useHasHover(): boolean {
  return useMediaQuery('(hover: hover) and (pointer: fine)')
}
