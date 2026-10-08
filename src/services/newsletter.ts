/**
 * Newsletter subscription.
 *
 * The demo build resolves locally. Point NEXT_PUBLIC_API_BASE_URL at a backend
 * and this becomes a POST to `/newsletter/subscribe` with no caller changes.
 */

import { apiConfigured, apiFetch } from '@/services/api'

export interface SubscribeResult {
  ok: boolean
  message: string
}

export async function subscribeToNewsletter(email: string): Promise<SubscribeResult> {
  if (apiConfigured()) {
    try {
      await apiFetch('/newsletter/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      return { ok: true, message: 'Subscribed.' }
    } catch {
      return {
        ok: false,
        message: 'We could not subscribe you just now. Please try again shortly.',
      }
    }
  }

  // Demo mode — simulate the round trip so the UI states are exercised.
  await new Promise((resolve) => setTimeout(resolve, 450))
  return { ok: true, message: 'Subscribed.' }
}
