import Image from 'next/image'
import { Instagram } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { listItems, text } from '@/lib/home-copy'
import { site } from '@/lib/site'
import type { HomeSection } from '@/server/content'

interface Post {
  url: string
  alt: string
}

/**
 * Eight optimised local images rather than an embedded Instagram widget: the
 * official embed pulls in several hundred kilobytes of third-party JavaScript
 * and blocks the main thread, which is not a trade worth making for a footer
 * gallery. The tiles are edited in the admin (Website → Homepage).
 */
const POSTS: Post[] = [
  { url: '/images/social/instagram-1.png', alt: 'An ivory Pashmina shawl styled over a linen shirt' },
  { url: '/images/social/instagram-2.png', alt: 'A charcoal men’s shawl photographed on a dark wooden table' },
  { url: '/images/social/instagram-3.png', alt: 'Hand-spun Pashmina yarn wound on a wooden charkha' },
  { url: '/images/social/instagram-4.png', alt: 'A burgundy kani shawl detail showing the woven pallav' },
  { url: '/images/social/instagram-5.png', alt: 'A cream Pashmina wrap folded beside a muslin sleeve' },
  { url: '/images/social/instagram-6.png', alt: 'A mist grey stole draped over a chair in morning light' },
  { url: '/images/social/instagram-7.png', alt: 'Antique gold jamawar weave photographed close up' },
  { url: '/images/social/instagram-8.png', alt: 'A dusty rose cashmere wrap on a marble surface' },
]

export function SocialGrid({ section }: { section?: HomeSection }) {
  const posts = listItems<Post>(section, POSTS, (item, fallback) => {
    const url = item.imageUrl ?? fallback?.url
    if (!url) return null
    return { url, alt: text(item.imageAlt, fallback?.alt ?? 'Pashmore on Instagram') }
  })
  const profileUrl = section?.href ?? site.social.instagram

  return (
    <section className="py-20 lg:py-28" aria-labelledby="follow-pashmore">
      <div className="container-luxe">
        <Reveal className="text-center">
          <p className="eyebrow text-gold">{text(section?.eyebrow, '@pashmore')}</p>
          <h2
            id="follow-pashmore"
            className="mt-5 font-serif text-[2rem] leading-[1.1] text-charcoal md:text-[2.75rem]"
          >
            {text(section?.heading, 'Follow the World of Pashmore')}
          </h2>
        </Reveal>
      </div>

      <ul className="mt-12 grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-8">
        {posts.map((post, index) => (
          <li key={`${index}-${post.url}`}>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden bg-ivory-deep"
            >
              <Image
                src={post.url}
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
