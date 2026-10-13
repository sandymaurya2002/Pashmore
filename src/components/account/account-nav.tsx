'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useSession } from '@/context/session-context'
import { useToast } from '@/context/toast-context'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/account', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/profile', label: 'Profile' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/wishlist', label: 'Wishlist' },
]

export function AccountNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useSession()
  const { toast } = useToast()
  const [signingOut, setSigningOut] = React.useState(false)

  async function onSignOut() {
    setSigningOut(true)
    try {
      await signOut()
      toast({ title: 'Signed out', tone: 'info' })
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }

  return (
    <nav aria-label="Account" className="lg:sticky lg:top-28 lg:self-start">
      <ul className="flex gap-x-6 gap-y-2 overflow-x-auto border-b border-line pb-4 lg:flex-col lg:border-b-0 lg:pb-0">
        {LINKS.map((link) => {
          const active =
            link.href === '/account'
              ? pathname === '/account'
              : pathname.startsWith(link.href)

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'block whitespace-nowrap py-1.5 text-[0.75rem] uppercase tracking-[0.14em] transition-colors duration-300',
                  active ? 'text-charcoal' : 'text-taupe hover:text-charcoal',
                )}
              >
                {link.label}
              </Link>
            </li>
          )
        })}
        <li className="lg:mt-6 lg:border-t lg:border-line lg:pt-6">
          <button
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 whitespace-nowrap py-1.5 text-[0.75rem] uppercase tracking-[0.14em] text-taupe transition-colors hover:text-charcoal disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.25} aria-hidden />
            {signingOut ? 'Signing out…' : 'Logout'}
          </button>
        </li>
      </ul>
    </nav>
  )
}
