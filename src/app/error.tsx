'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    // Wire this to your error reporter (Sentry, Datadog…) when one is added.
    console.error(error)
  }, [error])

  return (
    <div className="container-luxe flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-gold">Something went wrong</p>
      <h1 className="mt-6 font-serif text-[2.5rem] leading-[1.05] text-charcoal md:text-[3.25rem]">
        A dropped stitch
      </h1>
      <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-mocha">
        We could not load this page. Nothing in your bag has been lost — please try again,
        or return home while we look into it.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button size="lg" onClick={reset}>
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">Return Home</Link>
        </Button>
      </div>

      {error.digest && (
        <p className="mt-10 text-xs text-taupe">
          Reference: <span className="tabular-nums">{error.digest}</span>
        </p>
      )}
    </div>
  )
}
