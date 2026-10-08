import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'

import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { SiteChrome } from '@/components/layout/site-chrome'
import { CartDrawer } from '@/components/cart/cart-drawer'
import { SearchOverlay } from '@/components/search/search-overlay'
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav'
import { JsonLd } from '@/components/seo/json-ld'
import { graph, organisationSchema, websiteSchema } from '@/lib/jsonld'
import { site, siteUrl } from '@/lib/site'
import { siteKeywords } from '@/lib/keywords'
import { getBestSellers } from '@/services/catalog'

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Resolved on the server so the cart drawer's recommendations cost the client
  // nothing until the drawer is actually opened.
  const cartRecommendations = await getBestSellers(4)

  return (
    <html lang="en-IN" className={`${serif.variable} ${sans.variable}`}>
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
            header={<SiteHeader />}
            footer={<SiteFooter />}
            overlays={
              <>
                <CartDrawer recommendations={cartRecommendations} />
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
