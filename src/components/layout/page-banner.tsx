'use client'

import { usePathname } from 'next/navigation'

import { CmsBanner } from '@/components/home/cms-banner'
import { pageBannerFor } from '@/lib/page-banner'
import type { Banner } from '@/server/content'

/** The admin-managed banner (Banners → Page banner) for the page being viewed, if any. */
export function PageBanner({ banners }: { banners: Banner[] }) {
  const pathname = usePathname()
  const banner = pageBannerFor(banners, pathname)
  if (!banner) return null
  return <CmsBanner key={banner.id} banner={banner} variant="page" priority />
}
