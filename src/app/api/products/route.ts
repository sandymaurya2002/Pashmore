import { getProductsBySlugs } from '@/services/catalog'
import { fail, ok } from '@/server/http'

/**
 * Resolves a list of product slugs, in the order asked for.
 *
 * Used by client-side surfaces that only hold ids — recently viewed and the
 * wishlist — so neither has to ship the catalogue to the browser.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slugs = (searchParams.get('slugs') ?? '')
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => /^[a-z0-9-]{1,160}$/i.test(slug))
    .slice(0, 48)

  if (!slugs.length) return ok({ products: [] })

  try {
    const products = await getProductsBySlugs(slugs)
    return ok(
      { products },
      // Private: prices depend on the shopper's region.
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=300' } },
    )
  } catch (error) {
    return fail(error, 'api/products')
  }
}
