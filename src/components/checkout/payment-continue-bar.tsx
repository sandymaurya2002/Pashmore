'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getContinuePrompt, subscribeContinuePrompt } from '@/lib/razorpay'

/**
 * Continue button shown under Razorpay's desktop window while it is open.
 * Razorpay appends its overlay to <body> at the highest z-index, so this bar
 * is appended after it, at the same z-index, to sit on top.
 */
export function PaymentContinueBar() {
  const prompt = React.useSyncExternalStore(subscribeContinuePrompt, getContinuePrompt, () => null)
  const [host, setHost] = React.useState<HTMLElement | null>(null)
  const open = prompt !== null

  React.useEffect(() => {
    if (!open) return
    const element = document.createElement('div')
    document.body.appendChild(element)
    setHost(element)
    return () => {
      element.remove()
      setHost(null)
    }
  }, [open])

  if (!prompt || !host) return null

  return createPortal(
    <div
      style={{ zIndex: 2147483647 }}
      className="fixed inset-x-0 bottom-6 hidden justify-center px-6 md:flex [@media(max-height:620px)]:hidden"
    >
      <div className="flex max-w-xl items-center gap-5 bg-ivory px-5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
        <p className="text-[0.8125rem] leading-snug text-mocha" aria-live="polite">
          {prompt.notice ?? 'Paid by scanning the QR code on your phone?'}
        </p>
        <Button size="sm" className="shrink-0" onClick={prompt.confirm} disabled={prompt.checking}>
          {prompt.checking ? 'Checking…' : 'Continue'}
          {!prompt.checking && <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />}
        </Button>
      </div>
    </div>,
    host,
  )
}
