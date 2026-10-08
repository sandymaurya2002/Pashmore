import Image from 'next/image'
import { Instagram } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { site } from '@/lib/site'

/**
 * Eight optimised local images rather than an embedded Instagram widget: the
 * official embed pulls in several hundred kilobytes of third-party JavaScript
 * and blocks the main thread, which is not a trade worth making for a footer
 * gallery. Swap the array for a cached feed from the Instagram Basic Display
 * API when you want it live.
 */
const POSTS = [
  { image: 1, alt: 'An ivory Pashmina shawl styled over a linen shirt' },
  { image: 2, alt: 'A charcoal men’s shawl photographed on a dark wooden table' },
  { image: 3, alt: 'Hand-spun Pashmina yarn wound on a wooden charkha' },
  { image: 4, alt: 'A burgundy kani shawl detail showing the woven pallav' },
  { image: 5, alt: 'A cream Pashmina wrap folded beside a muslin sleeve' },
  { image: 6, alt: 'A mist grey stole draped over a chair in morning light' },
  { image: 7, alt: 'Antique gold jamawar weave photographed close up' },
  { image: 8, alt: 'A dusty rose cashmere wrap on a marble surface' },
]

export function SocialGrid() {
  return (
    <section className="py-20 lg:py-28" aria-labelledby="follow-pashmore">
      <div className="container-luxe">
        <Reveal className="text-center">
          <p className="eyebrow text-gold">@pashmore</p>
          <h2
            id="follow-pashmore"
            className="mt-5 font-serif text-[2rem] leading-[1.1] text-charcoal md:text-[2.75rem]"
          >
            Follow the World of Pashmore
          </h2>
        </Reveal>
      </div>

      <ul className="mt-12 grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-8">
        {POSTS.map((post) => (
          <li key={post.image}>
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden bg-ivory-deep"
            >
              <Image
                src={`/images/social/instagram-${post.image}.png`}
                alt={post.alt}
                fill
                sizes="(min-width: 1024px) 12.5vw, (min-width: 640px) 25vw, 50vw"
                className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-105"
              />
              <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              >
                <Instagram className="h-5 w-5 text-ivory" strokeWidth={1.25} />
              </span>
              <span className="sr-only">View on Instagram</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
