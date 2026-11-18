import type { RemotePattern } from 'next/dist/shared/lib/image-config'

/** Build-time values that can add image hosts on top of the production ones. */
export interface ImageHostEnv {
  CLOUDFLARE_R2_PUBLIC_URL?: string
  CLOUDFLARE_API_URL?: string
  IMAGE_REMOTE_HOSTS?: string
}

export function remoteImagePatterns(env?: ImageHostEnv): RemotePattern[]

declare const nextConfig: import('next').NextConfig
export default nextConfig
