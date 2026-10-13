import { ApiError } from '@/lib/api/envelope'
import { fail } from '@/server/http'

/** The Worker has no newsletter list yet, so nothing is stored and no success is reported. */
export function POST() {
  return fail(
    new ApiError(
      'Newsletter sign-up is not open yet. Please check back soon.',
      501,
      'NOT_IMPLEMENTED',
    ),
  )
}
