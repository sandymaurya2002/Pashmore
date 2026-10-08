'use client'

import { useEffect, useState } from 'react'

interface ScrollState {
  /** Page has scrolled past the threshold — used to condense the header. */
  scrolled: boolean
  /** Last movement direction, for hide-on-scroll behaviours. */
  direction: 'up' | 'down'
  y: number
}

/**
 * Scroll observation on a rAF tick. Reading `scrollY` inside the listener
 * would force layout on every event; batching into an animation frame keeps
 * the header transition off the critical path.
 */
export function useScrollState(threshold = 24): ScrollState {
  const [state, setState] = useState<ScrollState>({
    scrolled: false,
    direction: 'up',
    y: 0,
  })

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false

    function update() {
      const y = window.scrollY
      setState((previous) => {
        const direction = y > lastY + 2 ? 'down' : y < lastY - 2 ? 'up' : previous.direction
        lastY = y
        // Hysteresis: condense past the threshold, but only expand again once
        // well above it, so small scroll jitter near the boundary can't toggle
        // the header back and forth.
        const scrolled = previous.scrolled ? y > threshold / 2 : y > threshold
        if (
          previous.scrolled === scrolled &&
          previous.direction === direction &&
          Math.abs(previous.y - y) < 8
        ) {
          return previous
        }
        return { scrolled, direction, y }
      })
      ticking = false
    }

    function onScroll() {
      if (ticking) return
      ticking = true
      window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])

  return state
}
