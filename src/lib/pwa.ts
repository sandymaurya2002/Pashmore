/**
 * Install ("Add to Home Screen") state for the Pashmore PWA.
 *
 * A tiny external store shared by the install button, the promo card and the
 * install dialog, read with `useSyncExternalStore`. Nothing here runs on the
 * server or before hydration: the server snapshot reports "not ready", so no
 * install UI is rendered until the browser has been inspected.
 *
 * Chrome can fire `beforeinstallprompt` before React hydrates, so the event is
 * captured by an inline script in <head> (PWA_BOOTSTRAP_SCRIPT) and parked on
 * `window.__pashmorePwaPrompt`; this module picks it up from there.
 */

import { useSyncExternalStore } from 'react'
import { PWA_PROMPT_EVENT } from '@/lib/pwa-bootstrap'

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

declare global {
  interface Window {
    __pashmorePwaPrompt?: BeforeInstallPromptEvent | null
    gtag?: (...args: unknown[]) => void
  }
  interface Navigator {
    /** iOS Safari: true when launched from the home screen. */
    standalone?: boolean
  }
}

/**
 * How Pashmore can be installed in this browser:
 * - `prompt`            Chromium (Android, Windows, macOS, ChromeOS): native dialog.
 * - `ios`               iPhone / iPad Safari: Share → Add to Home Screen.
 * - `ios-other-browser` Chrome, Firefox or an in-app browser on iOS: open in Safari first.
 * - `mac-safari`        Safari 17+ on macOS: File → Add to Dock.
 * - `unsupported`       No install path (or Chrome has not offered one yet).
 */
export type InstallPlatform = 'prompt' | 'ios' | 'ios-other-browser' | 'mac-safari' | 'unsupported'

export interface PwaState {
  /** False on the server and until the browser has been inspected. */
  ready: boolean
  /** Running as the installed app, or installed during this visit. */
  installed: boolean
  platform: InstallPlatform
  dialogOpen: boolean
}

const PROMO_KEY = 'pashmore:pwa-promo-dismissed'
const VIEWS_KEY = 'pashmore:pwa-views'
/** A dismissed promo stays hidden for this long. */
const PROMO_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000

const SERVER_STATE: PwaState = { ready: false, installed: false, platform: 'unsupported', dialogOpen: false }

let state: PwaState = SERVER_STATE
const listeners = new Set<() => void>()
let initialised = false

function setState(patch: Partial<PwaState>) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePwa(): PwaState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE)
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.navigator.standalone === true
  )
}

export function detectPlatform(): InstallPlatform {
  if (window.__pashmorePwaPrompt) return 'prompt'

  const ua = navigator.userAgent
  // iPadOS 13+ reports itself as a Mac; touch support gives it away.
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  if (iOS) {
    const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|GSA\/|FBAN|FBAV|Instagram|Line\/|Snapchat|Twitter/.test(ua)
    return otherBrowser ? 'ios-other-browser' : 'ios'
  }

  if (/Macintosh/.test(ua) && /Safari\//.test(ua) && !/Chrome|Chromium|Edg\/|OPR\/|Firefox/.test(ua)) {
    const version = Number(/Version\/(\d+)/.exec(ua)?.[1] ?? 0)
    if (version >= 17) return 'mac-safari'
  }
  return 'unsupported'
}

/** Wires up browser listeners once. Safe to call repeatedly. */
export function initPwa() {
  if (initialised || typeof window === 'undefined') return
  initialised = true

  const refresh = () => setState({ ready: true, installed: state.installed || isStandalone(), platform: detectPlatform() })
  refresh()

  window.addEventListener(PWA_PROMPT_EVENT, refresh)
  window.addEventListener('appinstalled', () => {
    window.__pashmorePwaPrompt = null
    setState({ installed: true, platform: detectPlatform() })
    track('pwa_installed')
  })
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', refresh)
}

export function openInstallDialog(source: string) {
  setState({ dialogOpen: true })
  track('pwa_install_open', { source })
}

export function closeInstallDialog() {
  setState({ dialogOpen: false })
}

/** Shows Chrome's native install dialog. The event can only be used once. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = window.__pashmorePwaPrompt
  if (!event) return 'unavailable'
  window.__pashmorePwaPrompt = null
  await event.prompt()
  const { outcome } = await event.userChoice
  track('pwa_install_prompt', { outcome })
  if (outcome === 'accepted') setState({ installed: true, dialogOpen: false, platform: detectPlatform() })
  else {
    snoozePromo()
    setState({ platform: detectPlatform() })
  }
  return outcome
}

/* ---------------------------------------------------------------- *
 * Promo card frequency
 * ---------------------------------------------------------------- */

export function promoSnoozed(): boolean {
  try {
    const at = Number(window.localStorage.getItem(PROMO_KEY) ?? 0)
    return Date.now() - at < PROMO_SNOOZE_MS
  } catch {
    // Storage blocked (private mode): never nag.
    return true
  }
}

export function snoozePromo() {
  try {
    window.localStorage.setItem(PROMO_KEY, String(Date.now()))
  } catch {
    // Ignore — the promo simply may show again on a later visit.
  }
}

/** Counts page views in this browser tab session; returns the new total. */
export function countPageView(): number {
  try {
    const views = Number(window.sessionStorage.getItem(VIEWS_KEY) ?? 0) + 1
    window.sessionStorage.setItem(VIEWS_KEY, String(views))
    return views
  } catch {
    return 0
  }
}

function track(event: string, params: Record<string, string> = {}) {
  try {
    window.gtag?.('event', event, params)
  } catch {
    // Analytics must never break the install flow.
  }
}
