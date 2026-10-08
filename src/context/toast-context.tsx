'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X, Info } from 'lucide-react'
import { createId } from '@/lib/utils'
import { usePrefersReducedMotion } from '@/hooks/use-media-query'

type ToastTone = 'success' | 'info' | 'error'

interface Toast {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; tone?: ToastTone }) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

const TONE_ICON: Record<ToastTone, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  success: Check,
  info: Info,
  error: X,
}

const DURATION = 4200

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const reduceMotion = usePrefersReducedMotion()
  const timers = React.useRef(new Map<string, number>())

  const dismiss = React.useCallback((id: string) => {
    setToasts((previous) => previous.filter((entry) => entry.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = React.useCallback<ToastContextValue['toast']>(
    ({ title, description, tone = 'success' }) => {
      const id = createId('toast')
      setToasts((previous) => [...previous.slice(-2), { id, title, description, tone }])
      const timer = window.setTimeout(() => dismiss(id), DURATION)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  React.useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach((timer) => window.clearTimeout(timer))
      pending.clear()
    }
  }, [])

  const value = React.useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        // Announced politely so add-to-cart confirmations reach screen readers
        // without interrupting whatever the customer is doing.
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-4 z-[70] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 md:bottom-8 md:right-8"
      >
        <AnimatePresence initial={false}>
          {toasts.map((entry) => {
            const Icon = TONE_ICON[entry.tone]
            return (
              <motion.div
                key={entry.id}
                layout
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: reduceMotion ? 0.001 : 0.36, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto flex items-start gap-3 border border-line bg-ivory px-4 py-3.5 shadow-[0_16px_48px_-20px_rgba(18,17,15,0.45)]"
              >
                <span
                  aria-hidden
                  className={
                    entry.tone === 'error'
                      ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-burgundy text-ivory'
                      : 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-charcoal text-ivory'
                  }
                >
                  <Icon className="h-3 w-3" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.8125rem] font-medium text-charcoal">{entry.title}</p>
                  {entry.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-mocha">
                      {entry.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(entry.id)}
                  className="-mr-1 -mt-1 p-1 text-taupe transition-colors hover:text-charcoal"
                  aria-label={`Dismiss: ${entry.title}`}
                >
                  <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
