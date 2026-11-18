/**
 * Hosts that must be present in every build. Cloudflare injects
 * CLOUDFLARE_R2_PUBLIC_URL and CLOUDFLARE_API_URL as Worker runtime bindings,
 * which are not available while next.config.mjs is evaluated, so reading them
 * alone serializes `"remotePatterns": []`.
 *
 * Keep these hostnames in step with `BUILTIN_IMAGE_HOSTS` in src/lib/media.ts.
 */
const BUILTIN_REMOTE_PATTERNS = [
  { protocol: 'https', hostname: 'media.pashmore.com', pathname: '/**' },
  { protocol: 'https', hostname: 'api.pashmore.com', pathname: '/**' },
]

function patternKey(pattern) {
  return `${pattern.protocol}|${pattern.hostname}|${pattern.port ?? ''}|${pattern.pathname}`
}

/**
 * Remote image hosts allowed for next/image. Always includes the production
 * R2 and Worker origins, then any build-time hosts from
 * CLOUDFLARE_R2_PUBLIC_URL, CLOUDFLARE_API_URL (local or preview) and
 * IMAGE_REMOTE_HOSTS. Mirrors `allowedImageHosts()` in src/lib/media.ts.
 */
export function remoteImagePatterns(env = process.env) {
  const patterns = BUILTIN_REMOTE_PATTERNS.map((pattern) => ({ ...pattern }))
  const seen = new Set(patterns.map(patternKey))

  const add = (pattern) => {
    const key = patternKey(pattern)
    if (seen.has(key)) return
    seen.add(key)
    patterns.push(pattern)
  }

  for (const value of [env.CLOUDFLARE_R2_PUBLIC_URL, env.CLOUDFLARE_API_URL]) {
    if (!value) continue
    let url
    try {
      url = new URL(value)
    } catch {
      throw new Error(`Invalid URL in environment: ${value}`)
    }
    add({
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: '/**',
    })
  }

  for (const host of (env.IMAGE_REMOTE_HOSTS ?? '').split(',')) {
    const hostname = host.trim()
    if (hostname) add({ protocol: 'https', hostname, pathname: '/**' })
  }

  return patterns
}

// A production deploy without the Worker would render an empty storefront.
// Fail the build instead of shipping one.
if (process.env.VERCEL_ENV === 'production' && !process.env.CLOUDFLARE_API_URL) {
  throw new Error('CLOUDFLARE_API_URL must be set for production deployments.')
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  images: {
    // Modern formats first — Next negotiates by Accept header.
    formats: ['image/avif', 'image/webp'],
    // Breakpoints tuned to the design system in section 49 of the brief.
    deviceSizes: [320, 390, 640, 768, 1024, 1200, 1440, 1920, 2560],
    imageSizes: [64, 96, 128, 192, 256, 384, 512],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [75, 80, 82, 88, 90],
    remotePatterns: remoteImagePatterns(),
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
        ],
      },
      {
        // The service worker must always be re-checked, or a deploy could leave
        // customers on an old worker for up to a day.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Shown by the service worker when there is no connection; never indexed.
        source: '/offline.html',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        // Bundled imagery is addressed by name and never mutates.
        source: '/images/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
