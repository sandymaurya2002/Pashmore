import { searchCatalog } from '@/services/catalog'
import { fail, ok } from '@/server/http'

/**
 * Instant-search endpoint for the header overlay.
 *
 * It exists so the client bundle never has to carry the catalogue. Excluded
 * from the sitemap and disallowed in robots.txt — this is machinery, not a page.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const term = (searchParams.get('q') ?? '').trim().slice(0, 80)

  if (term.length < 2) return ok({ products: [], collections: [], total: 0 })

  try {
    const result = await searchCatalog(term, 6)
    return ok(
      {
        total: result.total,
        products: result.products.map((product) => ({
          slug: product.slug,
          name: product.name,
          material: product.material,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          currency: product.currency,
          image: product.images[0],
        })),
        collections: result.collections,
      },
      // Private: prices depend on the shopper's region, so shared caches must not reuse them.
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=300' } },
    )
  } catch (error) {
    return fail(error, 'api/search')
  }
}
