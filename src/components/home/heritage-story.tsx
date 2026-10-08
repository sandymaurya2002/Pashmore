import Image from 'next/image'
import Link from 'next/link'
import { Reveal } from '@/components/motion/reveal'
import { cn } from '@/lib/utils'

interface Chapter {
  eyebrow: string
  heading: string
  body: string[]
  image: { url: string; alt: string }
  href?: string
  linkLabel?: string
}

const CHAPTERS: Chapter[] = [
  {
    eyebrow: 'The Fibre',
    heading: 'It begins at four thousand metres',
    body: [
      'Pashm is the winter underfleece of the Changthangi goat, which lives on the Changthang plateau in Ladakh where temperatures fall below −30°C. The goats are never shorn; the fibre is combed out by hand each spring as they moult.',
      'One animal yields around 150 grams a year. A single shawl needs the yield of three or four.',
    ],
    image: {
      url: '/images/editorial/editorial-kashmir.png',
      alt: 'The high Changthang plateau in early spring, where Pashmina fibre is hand-combed',
    },
  },
  {
    eyebrow: 'The Hand',
    heading: 'Spun on a charkha, because machines break it',
    body: [
      'At twelve to fifteen microns, pashm is roughly half the diameter of fine merino and too delicate for mill spinning. It is spun on a hand charkha, almost always by women, at a rate of a few grams an hour.',
      'The slight irregularity this leaves in the yarn is the reason handwoven Pashmina looks alive and machine-made imitation looks flat.',
    ],
    image: {
      url: '/images/editorial/editorial-loom.png',
      alt: 'A weaver’s hands passing weft through a wooden handloom in a Srinagar workshop',
    },
  },
  {
    eyebrow: 'The Workshop',
    heading: 'Every piece is signed by the person who made it',
    body: [
      'Our workshop sits on the Boulevard in Srinagar, where the same families have woven for us across four generations. Sozni embroiderers work by daylight only; kani weavers read from talim scripts that outdate the building.',
      'Each finished piece carries a certificate recording the fibre grade, the loom number and the name of the weaver. We think that is the least a textile of this kind owes its maker.',
    ],
    image: {
      url: '/images/editorial/editorial-artisan.png',
      alt: 'A Kashmiri artisan finishing sozni embroidery on a cream Pashmina shawl',
    },
    href: '/craftsmanship',
    linkLabel: 'Read about our craft',
  },
]

export function HeritageStory() {
  return (
    <section className="bg-cream/45 py-24 lg:py-36" aria-labelledby="soul-of-pashmore">
      <div className="container-luxe">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-gold">Heritage</p>
          <h2
            id="soul-of-pashmore"
            className="mt-5 font-serif text-[2.25rem] leading-[1.08] text-charcoal md:text-[3.25rem]"
          >
            The Soul of Pashmore
          </h2>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-mocha">
            Three hundred kilometres, four generations and about six weeks separate a
            Changthangi goat from a finished shawl. This is what happens in between.
          </p>
        </Reveal>

        <div className="mt-20 flex flex-col gap-20 lg:gap-32">
          {CHAPTERS.map((chapter, index) => {
            const imageFirst = index % 2 === 0
            return (
              <article
                key={chapter.heading}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20"
              >
                <Reveal
                  className={cn(
                    'order-1',
                    imageFirst ? 'lg:order-1' : 'lg:order-2',
                  )}
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-ivory-deep">
                    <Image
                      src={chapter.image.url}
                      alt={chapter.image.alt}
                      fill
                      sizes="(min-width: 1024px) 46vw, 92vw"
                      className="object-cover"
                    />
                  </div>
                </Reveal>

                <Reveal
                  delay={0.1}
                  className={cn('order-2', imageFirst ? 'lg:order-2' : 'lg:order-1')}
                >
                  <p className="eyebrow text-gold">{chapter.eyebrow}</p>
                  <h3 className="mt-4 font-serif text-[1.75rem] leading-[1.15] text-charcoal md:text-[2.25rem]">
                    {chapter.heading}
                  </h3>
                  {chapter.body.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 32)}
                      className="mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-mocha"
                    >
                      {paragraph}
                    </p>
                  ))}
                  {chapter.href && (
                    <Link
                      href={chapter.href}
                      className="mt-8 inline-block border-b border-charcoal/25 pb-1.5 text-[0.6875rem] uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:border-gold hover:text-gold"
                    >
                      {chapter.linkLabel}
                    </Link>
                  )}
                </Reveal>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
