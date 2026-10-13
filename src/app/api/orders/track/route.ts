import { ApiError } from '@/lib/api/envelope'
import { normalizeOrderStatus } from '@/lib/normalize/commerce'
import { asArray, asIsoDate, asNumber, asOptionalString, asRecord, asString } from '@/lib/normalize/primitives'
import { clientContext, fail, ok, readJson } from '@/server/http'
import { workerFetch } from '@/server/worker'

const ORDER_NUMBER = /^PSH-\d{6}$/

/** Guest order lookup by order number plus the email it was placed with. */
export async function POST(request: Request) {
  try {
    const body = await readJson(request)
    const orderNumber = asString(body.orderNumber).toUpperCase()
    const email = asString(body.email)
    if (!ORDER_NUMBER.test(orderNumber) || !email) {
      throw new ApiError('Enter your order number (e.g. PSH-000123) and email.', 400, 'VALIDATION_ERROR', {
        ...(ORDER_NUMBER.test(orderNumber) ? {} : { orderNumber: 'Use the format PSH-000123.' }),
        ...(email ? {} : { email: 'Enter the email used for the order.' }),
      })
    }
    const { data } = await workerFetch<unknown>('/orders/track', {
      method: 'POST',
      body: { orderNumber, email },
      client: clientContext(request),
    })

    // The Worker returns a deliberately small summary — no address or payment details.
    const raw = asRecord(data)
    const number = asString(raw.orderNumber)
    if (!number) return ok({ order: null })
    return ok({
      order: {
        number,
        status: normalizeOrderStatus(raw.status),
        placedAt: asIsoDate(raw.placedAt) ?? '',
        itemCount: asArray(raw.items).reduce<number>(
          (sum, item) => sum + Math.max(0, asNumber(asRecord(item).quantity)),
          0,
        ),
        trackingNumber: asOptionalString(raw.trackingNumber),
        carrier: asOptionalString(raw.carrier),
        estimatedDelivery: asIsoDate(raw.estimatedDelivery),
      },
    })
  } catch (error) {
    return fail(error, 'api/orders/track')
  }
}
