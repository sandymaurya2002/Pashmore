import { NextResponse } from 'next/server'
import { getProductsBySlugs } from '@/services/catalog'

/**
 * Resolves a list of product slugs.
 *
 * Used by client-side surfaces that only hold ids — recently viewed and the
 * guest wishlist — so neither has to ship the catalogue to the browser.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slugs = (searchParams.get('slugs') ?? '')
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)
    .slice(0, 24)

  if (!slugs.length) return NextResponse.json({ products: [] })

  const products = await getProductsBySlugs(slugs)

  // Preserve the order the caller asked for — "recently viewed" is ordered data.
  const bySlug = new Map(products.map((product) => [product.slug, product]))
  const ordered = slugs
    .map((slug) => bySlug.get(slug))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))

  return NextResponse.json(
    { products: ordered },
    { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=600' } },
  )
}
