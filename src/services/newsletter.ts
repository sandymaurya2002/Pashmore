import { bff, errorMessage } from '@/lib/api/browser'

/** Newsletter subscription, through the storefront's `/api/newsletter` route. */

export interface SubscribeResult {
  ok: boolean
  message: string
}

export async function subscribeToNewsletter(
  email: string,
  source = 'newsletter-section',
): Promise<SubscribeResult> {
  try {
    await bff('/api/newsletter', { method: 'POST', body: { email, source } })
    return { ok: true, message: 'Subscribed.' }
  } catch (error) {
    return {
      ok: false,
      message: errorMessage(error, 'We could not subscribe you just now. Please try again shortly.'),
    }
  }
}
