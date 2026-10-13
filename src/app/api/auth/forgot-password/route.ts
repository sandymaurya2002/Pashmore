import { asRecord, asString } from '@/lib/normalize/primitives'
import { clientContext, fail, ok, readJson } from '@/server/http'
import { workerFetch } from '@/server/worker'

export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const { data } = await workerFetch<unknown>('/auth/forgot-password', {
      method: 'POST',
      body: { email: asString(body.email) },
      client: clientContext(request),
    })
    return ok({
      message:
        asString(asRecord(data).message) ||
        'If an account exists for that address, a reset link is on its way.',
    })
  } catch (error) {
    return fail(error, 'api/auth/forgot-password')
  }
}
