import { asArray, asNumber, asRecord, asString } from '@/lib/normalize/primitives'
import { workerFetch } from '@/server/worker'

/**
 * Redirects managed in the admin dashboard (SEO & Redirects), applied by the
 * middleware. The list is held per server instance for a minute so page loads
 * never wait on the Worker; if it is unreachable, no redirects apply.
 */

export interface Redirect {
  toPath: string
  statusCode: 301 | 302 | 307 | 308
}

const TTL_MS = 60_000
const RETRY_AFTER_FAILURE_MS = 15_000
const STATUS_CODES = new Set([301, 302, 307, 308])

let table: { redirects: Map<string, Redirect>; expiresAt: number } | null = null
let loading: Promise<Map<string, Redirect>> | null = null

/** Same rule as the Worker: no query or hash, no trailing slash, lower case. */
export function normalizeRedirectPath(path: string): string {
  const clean = path.trim().split(/[?#]/)[0]!.replace(/\/+$/, '').toLowerCase()
  return clean.startsWith('/') ? clean || '/' : `/${clean}`
}

export function parseRedirects(data: unknown): Map<string, Redirect> {
  const redirects = new Map<string, Redirect>()
  for (const entry of asArray(data)) {
    const row = asRecord(entry)
    const fromPath = asString(row.fromPath)
    const toPath = asString(row.toPath).trim()
    const statusCode = asNumber(row.statusCode, 301)
    if (!fromPath.startsWith('/') || !STATUS_CODES.has(statusCode)) continue
    if (!toPath.startsWith('/') && !toPath.startsWith('https://')) continue
    if (toPath.startsWith('//')) continue
    redirects.set(normalizeRedirectPath(fromPath), {
      toPath,
      statusCode: statusCode as Redirect['statusCode'],
    })
  }
  return redirects
}

async function load(): Promise<Map<string, Redirect>> {
  try {
    const { data } = await workerFetch<unknown>('/content/redirects', {
      cache: 'no-store',
      timeoutMs: 3_000,
    })
    const redirects = parseRedirects(data)
    table = { redirects, expiresAt: Date.now() + TTL_MS }
    return redirects
  } catch (error) {
    console.error('[redirects] Could not load redirects:', (error as Error)?.message)
    const redirects = table?.redirects ?? new Map<string, Redirect>()
    table = { redirects, expiresAt: Date.now() + RETRY_AFTER_FAILURE_MS }
    return redirects
  }
}

export async function findRedirect(pathname: string): Promise<Redirect | null> {
  let redirects = table && table.expiresAt > Date.now() ? table.redirects : null
  if (!redirects) {
    loading ??= load().finally(() => {
      loading = null
    })
    redirects = await loading
  }
  const from = normalizeRedirectPath(pathname)
  const match = redirects.get(from)
  if (!match) return null
  if (match.toPath.startsWith('/') && normalizeRedirectPath(match.toPath) === from) return null
  return match
}
