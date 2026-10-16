'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'

import { pageBannerFor } from '@/lib/page-banner'
import type { Banner } from '@/server/content'

const PageBannerContext = createContext<Banner[]>([])

/** Live page banners from the admin. Each page reads the one for its own path. */
export function PageBannerProvider({
  banners,
  children,
}: {
  banners: Banner[]
  children: ReactNode
}) {
  return <PageBannerContext.Provider value={banners}>{children}</PageBannerContext.Provider>
}

/** The admin page banner for the route being viewed, if one is published. */
export function usePageBanner(): Banner | undefined {
  const banners = useContext(PageBannerContext)
  const pathname = usePathname()
  return pageBannerFor(banners, pathname)
}
