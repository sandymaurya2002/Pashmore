import { ApiError } from '@/lib/api/envelope'
import { fail } from '@/server/http'

/**
 * The Worker has no enquiry endpoint yet. Answer honestly rather than
 * pretending the message was delivered.
 */
export function POST() {
  return fail(
    new ApiError(
      'Online enquiries are not available yet. Please email care@pashmore.com and our team will reply within one working day.',
      501,
      'NOT_IMPLEMENTED',
    ),
  )
}
