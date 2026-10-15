import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/layout/site-header'
import { getHomeContent, getPageBanners, getSiteContent } from '@/server/content'
import { primaryNav } from '@/data/navigation'
import { withMenuFeatures } from '@/lib/home-copy'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteChrome } from '@/components/layout/site-chrome'
import { PageBanner } from '@/components/layout/page-banner'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { SearchOverlay } from '@/components/search/search-overlay'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { JsonLd } from '@/components/seo/json-ld'
import { graph, organisationSchema, websiteSchema } from '@/lib/jsonld'
import { site, siteUrl } from '@/lib/site'
import { siteKeywords } from '@/lib/keywords'

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
})

const sans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Pashmore | Luxury Pashmina, Shawls & Indian Craftsmanship',
    template: '%s | Pashmore',
  },
  description: site.description,
  keywords: siteKeywords,
  applicationName: site.name,
  authors: [{ name: site.name, url: siteUrl }],
  creator: site.name,
  publisher: site.legalName,
  category: 'shopping',
  alternates: { canonical: siteUrl },
  formatDetection: { telephone: false, address: false, email: false },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#faf7f2',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  // Never trap customers at 1× — the product gallery has its own zoom, but the
  // page itself must stay pinch-zoomable for accessibility.
  maximumScale: 5,
}

// Pages that render statically still pick up admin edits (announcements,
// policies, SEO) within five minutes, even if the CMS was unreachable at build.
export const revalidate = 300

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [{ announcement }, pageBanners, home] = await Promise.all([
    getSiteContent(),
    getPageBanners(),
    getHomeContent(),
  ])
  const nav = withMenuFeatures(
    primaryNav,
    home?.sections.find((section) => section.key === 'menu-features'),
  )

  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable}`}>
      <head>
        {/* Google's install snippet, once, in <head>. next/script would rewrite
            this and load it after hydration, so the raw async tag stays. */}
        {/* eslint-disable-next-line @next/next/next-script-for-ga */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-EQFP2ZRX7P" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-EQFP2ZRX7P');`,
          }}
        />
      </head>
      <body className="min-h-dvh bg-ivory antialiased">
        <JsonLd id="site-graph" data={graph([organisationSchema(), websiteSchema()])} />

        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-charcoal focus:px-5 focus:py-3 focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-ivory"
        >
          Skip to content
        </a>

        <Providers>
          <SiteChrome
            header={
              <SiteHeader
                announcements={announcement.enabled ? announcement.messages : []}
                primaryNav={nav}
              />
            }
            banner={pageBanners.length ? <PageBanner banners={pageBanners} /> : null}
            footer={<SiteFooter />}
            overlays={
              <>
                <CartDrawer />
                <SearchOverlay />
                <MobileBottomNav />
              </>
            }
          >
            {children}
          </SiteChrome>
        </Providers>
      </body>
    </html>
  )
}
