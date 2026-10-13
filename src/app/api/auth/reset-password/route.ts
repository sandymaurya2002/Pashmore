import { asRecord, asString } from '@/lib/normalize/primitives'
import { clientContext, fail, ok, readJson } from '@/server/http'
import { workerFetch } from '@/server/worker'

export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const { data } = await workerFetch<unknown>('/auth/reset-password', {
      method: 'POST',
      body: { token: asString(body.token), password: String(body.password ?? '') },
      client: clientContext(request),
    })
    return ok({
      message:
        asString(asRecord(data).message) || 'Your password has been reset. Please sign in.',
    })
  } catch (error) {
    return fail(error, 'api/auth/reset-password')
  }
}
