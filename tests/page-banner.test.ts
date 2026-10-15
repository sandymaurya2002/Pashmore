import { describe, expect, it } from 'vitest'

import { pageBannerFor } from '@/lib/page-banner'
import type { Banner } from '@/server/content'

const banner = (id: string, pagePath: string): Banner => ({
  id,
  placement: 'PAGE_BANNER',
  heading: id,
  mediaType: 'IMAGE',
  imageUrl: '/images/hero.jpg',
  imageAlt: id,
  pagePath,
})

describe('page banners', () => {
  const banners = [
    banner('everywhere', '*'),
    banner('collections', '/collections/*'),
    banner('pashmina', '/collections/pure-pashmina'),
    banner('about', '/about'),
  ]

  it('prefers an exact page over a section over every page', () => {
    expect(pageBannerFor(banners, '/collections/pure-pashmina')?.id).toBe('pashmina')
    expect(pageBannerFor(banners, '/Collections/Pure-Pashmina/?sort=new')?.id).toBe('pashmina')
    expect(pageBannerFor(banners, '/collections/kani')?.id).toBe('collections')
    expect(pageBannerFor(banners, '/collections')?.id).toBe('collections')
    expect(pageBannerFor(banners, '/about')?.id).toBe('about')
    expect(pageBannerFor(banners, '/faqs')?.id).toBe('everywhere')
  })

  it('keeps every-page banners off the homepage, cart, checkout and account', () => {
    for (const path of ['/', '/cart', '/checkout', '/account/orders', '/login']) {
      expect(pageBannerFor(banners, path)).toBeUndefined()
    }
    expect(pageBannerFor([banner('cart', '/cart')], '/cart')?.id).toBe('cart')
  })

  it('uses the first banner in admin order when several target the same page', () => {
    expect(pageBannerFor([banner('first', '/about'), banner('second', '/about')], '/about')?.id).toBe('first')
  })
})
