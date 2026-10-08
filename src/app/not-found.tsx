import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[70dvh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-gold">404</p>
      <h1 className="mt-6 font-serif text-[2.5rem] leading-[1.05] text-charcoal md:text-[3.5rem]">
        Lost among the threads?
      </h1>
      <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-mocha">
        Let’s find your way back to Pashmore.
      </p>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
        <Button asChild size="lg">
          <Link href="/">Return Home</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/collections">Browse Collections</Link>
        </Button>
      </div>

      <nav aria-label="Popular destinations" className="mt-16">
        <p className="eyebrow mb-5 text-taupe">Popular destinations</p>
        <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          {[
            ['Pure Pashmina', '/collections/pure-pashmina'],
            ['Women’s Shawls', '/collections/womens-shawls'],
            ['Men’s Shawls', '/collections/mens-shawls'],
            ['Gifting', '/collections/gifting'],
            ['Journal', '/blog'],
          ].map(([label, href]) => (
            <li key={href}>
              <Link
                href={href}
                className="link-underline text-sm text-charcoal/85 hover:text-charcoal"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
