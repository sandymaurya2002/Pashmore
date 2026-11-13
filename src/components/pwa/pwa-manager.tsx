'use client'

import * as React from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import {
  countPageView,
  initPwa,
  openInstallDialog,
  promoSnoozed,
  promptInstall,
  snoozePromo,
  usePwa,
} from '@/lib/pwa'
import { cn } from '@/lib/utils'

// The dialog is only downloaded the first time a customer opens it.
const InstallDialog = dynamic(() => import('./install-dialog').then((mod) => mod.InstallDialog), {
  ssr: false,
})

/** Paths where nothing should distract from the task at hand. */
const QUIET_PATHS = /^\/(checkout|cart|admin|login|register|forgot-password|reset-password|account)(\/|$)/

/** Promo appears on the customer's second page view, after a short pause. */
const PROMO_MIN_VIEWS = 2
const PROMO_DELAY_MS = 3500

/**
 * Mounted once in the root layout. Registers the service worker after the page
 * has loaded (so it never competes with first paint), and shows a small,
 * dismissible install card to engaged visitors whose browser can install.
 */
export function PwaManager() {
  const pathname = usePathname()
  const { ready, installed, platform, dialogOpen } = usePwa()
  const [promoVisible, setPromoVisible] = React.useState(false)
  const [dialogLoaded, setDialogLoaded] = React.useState(false)
  const views = React.useRef(0)

  React.useEffect(() => {
    initPwa()
    registerServiceWorker()
  }, [])

  React.useEffect(() => {
    views.current = countPageView()
  }, [pathname])

  if (dialogOpen && !dialogLoaded) setDialogLoaded(true)

  const quiet = QUIET_PATHS.test(pathname)
  const installable = ready && !installed && platform !== 'unsupported' && platform !== 'mac-safari'

  React.useEffect(() => {
    if (!installable || quiet || promoVisible || promoSnoozed() || views.current < PROMO_MIN_VIEWS) return
    const timer = window.setTimeout(() => setPromoVisible(true), PROMO_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [installable, quiet, promoVisible, pathname])

  const showPromo = promoVisible && installable && !quiet && !dialogOpen

  const dismiss = () => {
    snoozePromo()
    setPromoVisible(false)
  }

  const install = async () => {
    setPromoVisible(false)
    if (platform === 'prompt') {
      const outcome = await promptInstall()
      if (outcome !== 'unavailable') return
    }
    snoozePromo()
    openInstallDialog('promo')
  }

  return (
    <>
      {showPromo && (
        <aside
          aria-label="Install the Pashmore app"
          className={cn(
            'fixed inset-x-3 z-40 animate-[slide-in-bottom_480ms_var(--ease-luxe)]',
            // Clears the mobile bottom navigation; floats bottom-right on larger screens.
            'bottom-[calc(4.75rem+env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-6 md:right-6 md:w-[24rem]',
          )}
        >
          <div className="relative flex items-center gap-4 border border-line bg-ivory/95 p-4 pr-10 shadow-[0_24px_60px_-24px_rgba(18,17,15,0.45)] backdrop-blur-md">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] border border-line bg-white shadow-sm">
              <Image src="/icon-192.png" alt="" width={44} height={44} sizes="44px" className="h-11 w-11" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg leading-tight text-charcoal">Pashmore, one tap away</p>
              <p className="mt-0.5 text-xs leading-snug text-mocha">
                Add our app to your home screen — no app store needed.
              </p>
              <button
                type="button"
                onClick={install}
                className="mt-2.5 bg-charcoal px-4 py-2 text-[0.6875rem] uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-ink"
              >
                Install App
              </button>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Not now"
              className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center text-charcoal/70 transition-colors hover:text-charcoal"
            >
              <X className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </div>
        </aside>
      )}

      {dialogLoaded && <InstallDialog />}
    </>
  )
}

function registerServiceWorker() {
  if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return
  const register = () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((error) => console.warn('[pwa] Service worker registration failed:', error))
  }
  if (document.readyState === 'complete') register()
  else window.addEventListener('load', register, { once: true })
}
