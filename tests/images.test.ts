import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hasRemoteMatch } from 'next/dist/shared/lib/match-remote-pattern.js'

import { allowedImageHosts, resolveMediaUrl } from '@/lib/media'
import { remoteImagePatterns } from '../next.config.mjs'

const PRODUCTION_PATTERNS = [
  { protocol: 'https', hostname: 'media.pashmore.com', pathname: '/**' },
  { protocol: 'https', hostname: 'api.pashmore.com', pathname: '/**' },
]

beforeEach(() => {
  vi.stubEnv('CLOUDFLARE_API_URL', '')
  vi.stubEnv('CLOUDFLARE_R2_PUBLIC_URL', '')
  vi.stubEnv('IMAGE_REMOTE_HOSTS', '')
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('remote image configuration', () => {
  it('permits the production media and API hosts when build env is empty', () => {
    expect(remoteImagePatterns()).toEqual(PRODUCTION_PATTERNS)
    expect(allowedImageHosts()).toEqual(['media.pashmore.com', 'api.pashmore.com'])
  })

  it('adds build-time hosts without duplicating the production ones or using a wildcard', () => {
    const patterns = remoteImagePatterns({
      CLOUDFLARE_R2_PUBLIC_URL: 'https://media.pashmore.com',
      CLOUDFLARE_API_URL: 'http://127.0.0.1:8787',
      IMAGE_REMOTE_HOSTS: 'cdn.example.com, media.pashmore.com',
    })

    expect(patterns).toEqual([
      ...PRODUCTION_PATTERNS,
      { protocol: 'http', hostname: '127.0.0.1', port: '8787', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.example.com', pathname: '/**' },
    ])
    expect(patterns.some((pattern) => pattern.hostname.includes('*'))).toBe(false)
  })

  it('rejects an invalid configured image origin', () => {
    expect(() => remoteImagePatterns({ CLOUDFLARE_API_URL: 'not a url' })).toThrow(/Invalid URL/)
  })

  it('allows optimizer URLs for trusted hosts and rejects other domains', () => {
    const patterns = remoteImagePatterns()
    const allowed = [
      'https://media.pashmore.com/products/example.webp',
      'https://api.pashmore.com/media/products/example.webp',
      'https://api.pashmore.com/media/banners/example.webp',
    ]

    for (const src of allowed) {
      expect(hasRemoteMatch([], patterns, new URL(src))).toBe(true)
      const optimized = new URL('https://pashmore.com/_next/image')
      optimized.searchParams.set('url', src)
      optimized.searchParams.set('w', '640')
      optimized.searchParams.set('q', '75')
      expect(optimized.pathname).toBe('/_next/image')
      expect(new URL(optimized.searchParams.get('url')!).hostname).not.toBe('evil.example')
    }

    expect(hasRemoteMatch([], patterns, new URL('https://evil.example/a.jpg'))).toBe(false)
  })
})

describe('resolveMediaUrl production sources', () => {
  beforeEach(() => {
    vi.stubEnv('CLOUDFLARE_API_URL', 'https://api.pashmore.com')
    vi.stubEnv('CLOUDFLARE_R2_PUBLIC_URL', 'https://media.pashmore.com')
  })

  it('keeps absolute R2 URLs on the media host', () => {
    expect(resolveMediaUrl('https://media.pashmore.com/products/example.webp')).toBe(
      'https://media.pashmore.com/products/example.webp',
    )
  })

  it('joins product and banner paths onto the API origin', () => {
    expect(resolveMediaUrl('/media/products/example.webp')).toBe(
      'https://api.pashmore.com/media/products/example.webp',
    )
    expect(resolveMediaUrl('/media/banners/example.webp')).toBe(
      'https://api.pashmore.com/media/banners/example.webp',
    )
  })

  it('leaves bundled storefront assets local', () => {
    expect(resolveMediaUrl('/images/editorial/example.png')).toBe('/images/editorial/example.png')
  })

  it('rejects an untrusted external host', () => {
    expect(resolveMediaUrl('https://evil.example/products/example.webp')).toBeNull()
  })

  it('still accepts a production R2 URL when the runtime env points elsewhere', () => {
    vi.stubEnv('CLOUDFLARE_R2_PUBLIC_URL', 'https://media.preview.example')
    vi.stubEnv('CLOUDFLARE_API_URL', 'https://api.preview.example')
    expect(resolveMediaUrl('https://media.pashmore.com/products/example.webp')).toBe(
      'https://media.pashmore.com/products/example.webp',
    )
    expect(resolveMediaUrl('https://evil.example/x.webp')).toBeNull()
  })
})
