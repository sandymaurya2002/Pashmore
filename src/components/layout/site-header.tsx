'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { Heart, Menu, Search, ShoppingBag, User } from 'lucide-react'

import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { MegaMenuPanel } from '@/components/layout/mega-menu'
import { MobileMenu } from '@/components/layout/mobile-menu'
import { RegionSelect } from '@/components/layout/region-select'
import { Logo } from '@/components/layout/logo'
import { primaryNav } from '@/data/navigation'
import { useCart } from '@/context/cart-context'
import { useWishlist } from '@/context/wishlist-context'
import { useUI } from '@/context/ui-context'
import { useScrollState } from '@/hooks/use-scroll-direction'
import { cn } from '@/lib/utils'

export function SiteHeader({ announcements }: { announcements: string[] }) {
  const pathname = usePathname()
  const { scrolled } = useScrollState(80)
  const { totals, hydrated: cartHydrated, openCart } = useCart()
  const { slugs: wishlistSlugs, hydrated: wishlistHydrated } = useWishlist()
  const { openSearch, openMobileMenu } = useUI()

  const [activeMenu, setActiveMenu] = React.useState<string | null>(null)
  const closeTimer = React.useRef<number | null>(null)

  // Any navigation closes the mega menu, including browser back/forward.
  React.useEffect(() => {
    setActiveMenu(null)
  }, [pathname])

  const scheduleClose = React.useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    // A short grace period keeps the panel open while the pointer travels from
    // the trigger down into the panel itself.
    closeTimer.current = window.setTimeout(() => setActiveMenu(null), 120)
  }, [])

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
  }, [])

  React.useEffect(() => () => cancelClose(), [cancelClose])

  const activeItem = primaryNav.find((item) => item.label === activeMenu)
  const cartCount = cartHydrated ? totals.itemCount : 0
  const wishlistCount = wishlistHydrated ? wishlistSlugs.length : 0

  return (
    <>
      {/* The header condenses by ~60px on scroll. If it stayed in flow, that
          shift would trigger scroll anchoring, pull scrollY back under the
          threshold and re-expand it — an endless flicker near the top. A
          fixed header over a constant-height spacer keeps layout stable. */}
      <div aria-hidden className="h-[calc(2.25rem+5.5rem)]" />
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 w-full border-b bg-burgundy/95 backdrop-blur-md will-change-transform transition-[transform,border-color] duration-500 ease-[var(--ease-luxe)]',
          scrolled ? '-translate-y-9 border-ivory/10' : 'translate-y-0 border-transparent',
        )}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setActiveMenu(null)
        }}
      >
        <AnnouncementBar messages={announcements} condensed={scrolled} />

        <div
          className="container-luxe transition-[height] duration-500 ease-[var(--ease-luxe)]"
          onMouseLeave={scheduleClose}
        >
          <div
            className={cn(
              'grid grid-cols-[1fr_auto_1fr] items-center transition-[height] duration-500 ease-[var(--ease-luxe)]',
              scrolled ? 'h-16' : 'h-[5.5rem]',
            )}
          >
            {/* Left — desktop navigation, mobile hamburger */}
            <div className="flex items-center gap-8">
              <button
                type="button"
                onClick={openMobileMenu}
                className="-ml-2 flex h-10 w-10 items-center justify-center text-ivory lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" strokeWidth={1.25} />
              </button>

              <nav aria-label="Primary" className="hidden lg:block">
                <ul className="flex items-center gap-8">
                  {primaryNav.map((item) => (
                    <li
                      key={item.label}
                      onMouseEnter={() => {
                        cancelClose()
                        setActiveMenu(item.columns ? item.label : null)
                      }}
                    >
                      <Link
                        href={item.href}
                        onFocus={() => setActiveMenu(item.columns ? item.label : null)}
                        aria-expanded={item.columns ? activeMenu === item.label : undefined}
                        aria-haspopup={item.columns ? 'true' : undefined}
                        className={cn(
                          'relative py-2 text-[0.6875rem] uppercase tracking-[0.2em] text-ivory/85 transition-colors duration-300 hover:text-ivory',
                          activeMenu === item.label && 'text-ivory',
                        )}
                      >
                        {item.label}
                        <span
                          aria-hidden
                          className={cn(
                            'absolute -bottom-0.5 left-0 h-px bg-gold transition-all duration-500 ease-[var(--ease-luxe)]',
                            activeMenu === item.label ? 'w-full' : 'w-0',
                          )}
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Centre — wordmark */}
            <div
              className={cn(
                'flex justify-center transition-transform duration-500 ease-[var(--ease-luxe)]',
                scrolled ? 'scale-[0.8]' : 'scale-100',
              )}
            >
              <Logo priority tone="light" />
            </div>

            {/* Right — utilities */}
            <div className="flex items-center justify-end gap-1 sm:gap-2">
              <RegionSelect className="hidden md:flex" />

              <button
                type="button"
                onClick={openSearch}
                className="flex h-10 w-10 items-center justify-center text-ivory transition-colors duration-300 hover:text-gold"
                aria-label="Search (Ctrl+K)"
              >
                <Search className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
              </button>

              <Link
                href="/account"
                className="hidden h-10 w-10 items-center justify-center text-ivory transition-colors duration-300 hover:text-gold sm:flex"
                aria-label="Account"
              >
                <User className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
              </Link>

              <Link
                href="/wishlist"
                className="relative hidden h-10 w-10 items-center justify-center text-ivory transition-colors duration-300 hover:text-gold sm:flex"
                aria-label={
                  wishlistCount
                    ? `Wishlist, ${wishlistCount} saved`
                    : 'Wishlist'
                }
              >
                <Heart className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
                {wishlistCount > 0 && <CountDot value={wishlistCount} />}
              </Link>

              <button
                type="button"
                onClick={openCart}
                className="relative flex h-10 w-10 items-center justify-center text-ivory transition-colors duration-300 hover:text-gold"
                aria-label={cartCount ? `Shopping bag, ${cartCount} items` : 'Shopping bag'}
              >
                <ShoppingBag className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
                {cartCount > 0 && <CountDot value={cartCount} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {activeItem?.columns && (
            <div
              key={activeItem.label}
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
              <MegaMenuPanel item={activeItem} onNavigate={() => setActiveMenu(null)} />
            </div>
          )}
        </AnimatePresence>
      </header>

      <MobileMenu />
    </>
  )
}

function CountDot({ value }: { value: number }) {
  return (
    <span
      key={value}
      aria-hidden
      className="absolute right-1 top-1.5 flex h-4 min-w-4 animate-[pashmore-fade-up_320ms_var(--ease-luxe)] items-center justify-center rounded-full bg-gold px-1 text-[0.5625rem] font-medium leading-none text-ivory"
    >
      {value > 99 ? '99+' : value}
    </span>
  )
}
