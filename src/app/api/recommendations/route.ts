import { getBestSellers } from '@/services/catalog'
import { fail, ok } from '@/server/http'

/** Best sellers for the cart drawer, fetched only when the drawer first opens. */
export async function GET() {
  try {
    const products = await getBestSellers(4)
    return ok(
      { products },
      { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' } },
    )
  } catch (error) {
    return fail(error, 'api/recommendations')
  }
}
