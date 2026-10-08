import Image from 'next/image'
import Link from 'next/link'
import { Reveal } from '@/components/motion/reveal'

interface CategoryCard {
  label: string
  heading: string
  href: string
  image: { url: string; alt: string }
}

const CARDS: CategoryCard[] = [
  {
    label: 'Men',
    heading: 'Cut to hang, not to wrap',
    href: '/collections/mens-shawls',
    image: {
      url: '/images/categories/category-men.png',
      alt: 'Pashmore men’s charcoal Pashmina shawl folded across a dark wooden bench',
    },
  },
  {
    label: 'Women',
    heading: 'Six weeks on a single loom',
    href: '/collections/womens-shawls',
    image: {
      url: '/images/categories/category-women.png',
      alt: 'Pashmore women’s ivory Pashmina shawl with hand-embroidered border, draped over a marble ledge',
    },
  },
  {
    label: 'Pashmina',
    heading: 'Nothing blended, nothing substituted',
    href: '/collections/pure-pashmina',
    image: {
      url: '/images/categories/category-pashmina.png',
      alt: 'Close detail of undyed pure Pashmina cloth showing the hand-spun weave',
    },
  },
  {
    label: 'Gifting',
    heading: 'Presented in hand-bound boxes',
    href: '/collections/gifting',
    image: {
      url: '/images/categories/category-gifting.png',
      alt: 'A Pashmore lacquered gift box in deep burgundy holding a folded Pashmina stole',
    },
  },
]

export function CategoryCards() {
  return (
    <section className="container-luxe py-8 lg:py-12" aria-labelledby="shop-by-category">
      <h2 id="shop-by-category" className="sr-only">
        Shop by category
      </h2>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {CARDS.map((card, index) => (
          <Reveal as="li" key={card.href} delay={index * 0.08}>
            <Link href={card.href} className="group block">
              <article className="relative aspect-4/5 overflow-hidden bg-ivory-deep">
                <Image
                  src={card.image.url}
                  alt={card.image.alt}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 92vw"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
                />
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-ink/72 via-ink/12 to-transparent transition-opacity duration-700 ease-[var(--ease-luxe)] group-hover:opacity-90"
                />

                <div className="absolute inset-x-0 bottom-0 p-6 transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:-translate-y-1.5">
                  <p className="eyebrow text-ivory/70">{card.label}</p>
                  <h3 className="mt-2.5 font-serif text-[1.375rem] leading-tight text-ivory">
                    {card.heading}
                  </h3>
                  <span className="mt-4 inline-block border-b border-ivory/45 pb-1 text-[0.625rem] uppercase tracking-[0.2em] text-ivory transition-colors duration-500 group-hover:border-ivory">
                    Explore
                  </span>
                </div>
              </article>
            </Link>
          </Reveal>
        ))}
      </ul>
    </section>
  )
}
