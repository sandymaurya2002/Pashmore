import type { MetadataRoute } from 'next'
import { site } from '@/lib/site'

/** Ivory ground from the design tokens (`--color-ivory`). */
const PWA_THEME_COLOR = '#faf7f2'

/**
 * Web App Manifest, served at /manifest.webmanifest and linked from every page
 * by Next.js. This is what makes Pashmore installable from the browser on
 * Android, iOS, Windows and macOS without an app store.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // A stable id keeps the installed app the same app even if start_url changes.
    id: '/',
    name: site.name,
    short_name: site.name,
    description: site.description,
    lang: site.language,
    dir: 'ltr',
    // The query flag lets analytics tell app launches from website visits; it
    // does not change what the page renders.
    start_url: '/?source=pwa',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: PWA_THEME_COLOR,
    theme_color: PWA_THEME_COLOR,
    categories: ['shopping', 'lifestyle', 'fashion'],
    prefer_related_applications: false,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    // Long-press shortcuts on the installed app icon (Android, Windows).
    shortcuts: [
      {
        name: 'Shop Collections',
        short_name: 'Shop',
        url: '/collections?source=pwa',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'My Wishlist',
        short_name: 'Wishlist',
        url: '/wishlist?source=pwa',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Track Order',
        short_name: 'Track',
        url: '/track-order?source=pwa',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  }
}
