/**
 * Remote image hosts allowed for next/image. Mirrors `allowedImageHosts()` in
 * src/lib/media.ts: the R2 public bucket domain, the Worker origin (which
 * serves `/media/*`) and any extra hosts listed in IMAGE_REMOTE_HOSTS.
 */
function remoteImagePatterns() {
  const patterns = []
  for (const value of [process.env.CLOUDFLARE_R2_PUBLIC_URL, process.env.CLOUDFLARE_API_URL]) {
    if (!value) continue
    let url
    try {
      url = new URL(value)
    } catch {
      throw new Error(`Invalid URL in environment: ${value}`)
    }
    patterns.push({
      protocol: url.protocol.replace(':', ''),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
      pathname: '/**',
    })
  }
  for (const host of (process.env.IMAGE_REMOTE_HOSTS ?? '').split(',')) {
    if (host.trim()) patterns.push({ protocol: 'https', hostname: host.trim(), pathname: '/**' })
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
