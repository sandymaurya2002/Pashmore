'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, Search, ShoppingBag, LayoutGrid } from 'lucide-react'
import { useCart } from '@/context/cart-context'
import { useWishlist } from '@/context/wishlist-context'
import { useUI } from '@/context/ui-context'
import { cn } from '@/lib/utils'

/**
 * Mobile-only bottom navigation. Hidden on the checkout flow, where anything
 * that invites the customer away from the form costs conversions.
 */
export function MobileBottomNav() {
  const pathname = usePathname()
  const { totals, hydrated, openCart } = useCart()
  const { slugs, hydrated: wishlistHydrated } = useWishlist()
  const { openSearch } = useUI()

  if (pathname.startsWith('/checkout')) return null

  const count = hydrated ? totals.itemCount : 0
  const wishlistCount = wishlistHydrated ? slugs.length : 0

  return (
    <nav
      aria-label="Mobile shortcuts"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ivory/10 bg-burgundy/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        <BottomItem href="/" label="Home" active={pathname === '/'}>
          <Home className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
        </BottomItem>
        <BottomItem
          href="/collections"
          label="Shop"
          active={pathname.startsWith('/collections')}
        >
          <LayoutGrid className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
        </BottomItem>
        <li>
          <button
            type="button"
            onClick={openSearch}
            className="flex w-full flex-col items-center gap-1 py-2.5 text-ivory/85"
          >
            <Search className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
            <span className="text-[0.5625rem] uppercase tracking-[0.14em]">Search</span>
          </button>
        </li>
        <BottomItem
          href="/wishlist"
          label="Wishlist"
          active={pathname === '/wishlist'}
          badge={wishlistCount}
        >
          <Heart className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
        </BottomItem>
        <li>
          <button
            type="button"
            onClick={openCart}
            className="relative flex w-full flex-col items-center gap-1 py-2.5 text-ivory/85"
            aria-label={count ? `Shopping bag, ${count} items` : 'Shopping bag'}
          >
            <span className="relative">
              <ShoppingBag className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
              {count > 0 && <Dot value={count} />}
            </span>
            <span className="text-[0.5625rem] uppercase tracking-[0.14em]">Bag</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}

function BottomItem({
  href,
  label,
  active,
  badge,
  children,
}: {
  href: string
  label: string
  active: boolean
  badge?: number
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex flex-col items-center gap-1 py-2.5 transition-colors',
          active ? 'text-ivory [&_svg]:stroke-2' : 'text-ivory/75',
        )}
      >
        <span className="relative">
          {children}
          {badge ? <Dot value={badge} /> : null}
        </span>
        <span
          className={cn(
            'text-[0.5625rem] uppercase tracking-[0.14em]',
            active && 'font-semibold',
          )}
        >
          {label}
        </span>
      </Link>
    </li>
  )
}

function Dot({ value }: { value: number }) {
  return (
    <span
      aria-hidden
      className="absolute -right-2 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gold px-1 text-[0.5rem] leading-none text-ivory"
    >
      {value > 9 ? '9+' : value}
    </span>
  )
}
