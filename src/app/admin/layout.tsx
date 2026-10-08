import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const metadata: Metadata = {
  title: { absolute: 'Admin | Pashmore' },
  robots: { index: false, follow: false, nocache: true },
}

// Read the flag per request, not at build time.
export const dynamic = 'force-dynamic'

/**
 * There is no authentication yet, so admin tools are off in production unless
 * ENABLE_ADMIN=true is set explicitly. Put real auth (or at least basic auth
 * at the edge) in front of /admin before enabling it on a public deployment.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const enabled = process.env.NODE_ENV !== 'production' || process.env.ENABLE_ADMIN === 'true'
  if (!enabled) notFound()
  return <div className="min-h-dvh bg-ivory">{children}</div>
}
