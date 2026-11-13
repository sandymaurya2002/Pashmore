'use client'

import { Download } from 'lucide-react'
import { openInstallDialog, usePwa } from '@/lib/pwa'
import { cn } from '@/lib/utils'

/**
 * "Install Pashmore App". Renders nothing until the browser is known to support
 * installing, and nothing once Pashmore is installed or running as the app.
 */
export function InstallAppButton({
  variant = 'footer',
  className,
  onOpen,
}: {
  variant?: 'footer' | 'menu'
  className?: string
  /** Called before the dialog opens, e.g. to close the mobile menu. */
  onOpen?: () => void
}) {
  const { ready, installed, platform } = usePwa()
  if (!ready || installed || platform === 'unsupported') return null

  const open = () => {
    onOpen?.()
    openInstallDialog(variant)
  }

  if (variant === 'menu') {
    return (
      <button
        type="button"
        onClick={open}
        className={cn(
          'flex w-full items-center gap-3 border border-gold/50 bg-gold-pale/25 px-4 py-3 text-left text-sm text-charcoal transition-colors hover:border-gold',
          className,
        )}
      >
        <Download className="h-4 w-4 text-gold" strokeWidth={1.5} />
        Install Pashmore App
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        'inline-flex h-11 items-center gap-2.5 border border-charcoal/25 px-6 text-[0.6875rem] uppercase tracking-[0.18em] text-charcoal transition-all duration-300 ease-[var(--ease-luxe)] hover:border-charcoal hover:bg-charcoal hover:text-ivory',
        className,
      )}
    >
      <Download className="h-4 w-4" strokeWidth={1.5} />
      Install Pashmore App
    </button>
  )
}
