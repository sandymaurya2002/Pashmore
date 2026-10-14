import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WORKER_ORIGIN, failure, mockWorker, success } from './helpers'

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv('CLOUDFLARE_API_URL', WORKER_ORIGIN)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

// The redirect table is cached per module instance, so each test loads a fresh copy.
const load = () => import('@/server/redirects')

describe('admin-managed redirects', () => {
  it('matches paths the way the Worker stores them and caches the table', async () => {
    const { calls } = mockWorker({
      'GET /content/redirects': success([
        { fromPath: '/old-shawls', toPath: '/collections/shawls', statusCode: 301 },
        { fromPath: '/journal', toPath: 'https://blog.example.com', statusCode: 302 },
      ]),
    })
    const { findRedirect } = await load()

    expect(await findRedirect('/Old-Shawls/')).toEqual({ toPath: '/collections/shawls', statusCode: 301 })
    expect(await findRedirect('/journal')).toEqual({ toPath: 'https://blog.example.com', statusCode: 302 })
    expect(await findRedirect('/about')).toBeNull()
    expect(calls).toHaveLength(1)
  })

  it('ignores unsafe or malformed entries', async () => {
    const { parseRedirects } = await load()
    const table = parseRedirects([
      { fromPath: '/a', toPath: '//evil.example.com', statusCode: 301 },
      { fromPath: '/b', toPath: 'http://insecure.example.com', statusCode: 301 },
      { fromPath: '/c', toPath: 'javascript:alert(1)', statusCode: 301 },
      { fromPath: '/d', toPath: '/fine', statusCode: 200 },
      { fromPath: 'no-slash', toPath: '/fine', statusCode: 301 },
      { fromPath: '/e', toPath: '/fine', statusCode: 308 },
    ])
    expect([...table.keys()]).toEqual(['/e'])
  })

  it('never redirects a page to itself', async () => {
    mockWorker({
      'GET /content/redirects': success([{ fromPath: '/loop', toPath: '/Loop/', statusCode: 301 }]),
    })
    const { findRedirect } = await load()
    expect(await findRedirect('/loop')).toBeNull()
  })

  it('serves pages normally when the Worker is unavailable', async () => {
    mockWorker({ 'GET /content/redirects': failure(503, 'UNAVAILABLE') })
    const { findRedirect } = await load()
    expect(await findRedirect('/old-shawls')).toBeNull()
  })
})
