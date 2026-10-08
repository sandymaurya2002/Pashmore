import type { Metadata } from 'next'
import Link from 'next/link'
import { Lock } from 'lucide-react'

import { Logo } from '@/components/layout/logo'
import { CheckoutFlow } from '@/components/checkout/checkout-flow'
import { buildMetadata, pageTitle } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: pageTitle('Checkout'),
  description: 'Complete your Pashmore order.',
  path: '/checkout',
  noIndex: true,
})

export default function CheckoutPage() {
  return (
    <div className="min-h-dvh bg-ivory">
      <header className="border-b border-line">
        <div className="container-luxe flex items-center justify-between py-6">
          <Logo compact />
          <p className="flex items-center gap-2 text-[0.625rem] uppercase tracking-[0.16em] text-taupe">
            <Lock className="h-3 w-3" strokeWidth={1.5} aria-hidden />
            Secure checkout
          </p>
        </div>
      </header>

      <CheckoutFlow />

      <footer className="border-t border-line py-8">
        <div className="container-luxe flex flex-wrap items-center justify-between gap-4 text-xs text-taupe">
          <p>© {new Date().getFullYear()} Pashmore</p>
          <ul className="flex gap-6">
            <li>
              <Link href="/shipping" className="transition-colors hover:text-charcoal">
                Shipping
              </Link>
            </li>
            <li>
              <Link href="/returns" className="transition-colors hover:text-charcoal">
                Returns
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="transition-colors hover:text-charcoal">
                Privacy
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
