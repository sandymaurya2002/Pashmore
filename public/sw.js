/**
 * Pashmore service worker.
 *
 * Deliberately conservative — this is a store with live prices, stock, carts,
 * accounts and payments, so freshness and privacy win over offline reach:
 *
 *   Pages (navigations)   network only, with navigation preload; the offline
 *                         page is shown only when the network is unreachable.
 *                         HTML is never cached, so product listings, prices and
 *                         personalised pages (account, cart, checkout) are always
 *                         fresh and no customer's page is stored on the device.
 *   /api/*, RSC payloads  not intercepted at all — the browser handles them
 *                         exactly as before (auth, cart, checkout, Razorpay).
 *   Cross-origin          not intercepted (Razorpay, Google Analytics, CDNs).
 *   /_next/static/*       cache first — content-hashed, immutable build assets
 *                         (JS, CSS, fonts).
 *   /images/*, icons      cache first — bundled, immutable brand imagery.
 *   /_next/image          stale-while-revalidate — optimised product images.
 *
 * Responses marked `private` or `no-store`, non-200 and opaque responses are
 * never cached. Bump VERSION to drop every cache on the next deploy.
 */

const VERSION = 'v1'
const STATIC_CACHE = `pashmore-static-${VERSION}`
const IMAGE_CACHE = `pashmore-images-${VERSION}`
const OFFLINE_URL = '/offline.html'

const PRECACHE = [
  OFFLINE_URL,
  '/images/brand/pashmore-mark.png',
  '/icon-192.png',
  '/icon-512.png',
]

const LIMITS = { [STATIC_CACHE]: 200, [IMAGE_CACHE]: 80 }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([STATIC_CACHE, IMAGE_CACHE])
      const names = await caches.keys()
      await Promise.all(
        names.filter((name) => name.startsWith('pashmore-') && !keep.has(name)).map((name) => caches.delete(name)),
      )
      // Lets page requests start in parallel with the worker booting, so the
      // worker never adds latency to a page load.
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable()
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(navigate(event))
    return
  }

  // React Server Component payloads and data requests carry live, possibly
  // personalised content: leave them entirely to the network.
  if (url.pathname.startsWith('/api/') || url.searchParams.has('_rsc') || request.headers.get('RSC')) return

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE))
    return
  }
  if (url.pathname.startsWith('/images/') || /^\/(icon|apple-touch-icon|favicon)[\w-]*\.png$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }
  if (url.pathname === '/_next/image') {
    event.respondWith(staleWhileRevalidate(event, IMAGE_CACHE))
  }
})

async function navigate(event) {
  try {
    const preloaded = await event.preloadResponse
    const response = preloaded || (await fetch(event.request))
    // The browser may evict caches under storage pressure: while online,
    // quietly put the offline page back if it has gone missing.
    event.waitUntil(ensureOfflinePage())
    return response
  } catch {
    const offline = await caches.match(OFFLINE_URL)
    return offline || new Response(FALLBACK_HTML, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }
}

async function ensureOfflinePage() {
  try {
    if (await caches.match(OFFLINE_URL)) return
    const cache = await caches.open(STATIC_CACHE)
    await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }))
  } catch {
    // Still offline-capable via FALLBACK_HTML.
  }
}

/** Last resort if the offline page itself is not in the cache. */
const FALLBACK_HTML = `<!doctype html><html lang="en-IN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>You're offline | Pashmore</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#faf7f2;color:#1f1d1a;font-family:Georgia,serif;text-align:center;padding:24px"><main><p style="letter-spacing:.34em;font-weight:600">PASHMORE</p><h1 style="font-weight:400">You're offline</h1><p style="font-family:system-ui,sans-serif;color:#665642">Please check your connection and try again.</p><button onclick="location.reload()" style="height:48px;padding:0 32px;border:0;background:#1f1d1a;color:#faf7f2;letter-spacing:.18em;text-transform:uppercase;font-size:12px">Try again</button></main><script>addEventListener('online',function(){location.reload()})</script></body></html>`

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  store(cacheName, request, response.clone())
  return response
}

async function staleWhileRevalidate(event, cacheName) {
  const { request } = event
  const cached = await caches.match(request)
  const network = fetch(request).then((response) => {
    store(cacheName, request, response.clone())
    return response
  })
  if (cached) {
    event.waitUntil(network.catch(() => undefined))
    return cached
  }
  return network
}

function cacheable(response) {
  if (!response || response.status !== 200 || response.type !== 'basic') return false
  const control = response.headers.get('Cache-Control') || ''
  return !/no-store|private/i.test(control)
}

async function store(cacheName, request, response) {
  if (!cacheable(response)) return
  try {
    const cache = await caches.open(cacheName)
    await cache.put(request, response)
    await trim(cache, LIMITS[cacheName])
  } catch {
    // Storage full or unavailable: caching is an optimisation, never required.
  }
}

async function trim(cache, max) {
  if (!max) return
  const keys = await cache.keys()
  // Oldest entries first (insertion order).
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}
