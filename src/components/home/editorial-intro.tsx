import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'
import { paragraphs, text } from '@/lib/home-copy'
import type { HomeSection } from '@/server/content'

/**
 * The section immediately under the hero. Image first on mobile, side by side
 * on desktop — the layout the brief calls for, expressed as one grid rather
 * than two conditional trees. Copy is edited in the admin (Website → Homepage).
 */
export function EditorialIntro({ section }: { section?: HomeSection }) {
  const body = paragraphs(section?.body, [
    'Every Pashmore piece begins on the Changthang plateau, where pashm is combed by hand from Changthangi goats each spring, and ends in a Srinagar workshop where a single shawl can occupy one loom for six weeks. Nothing in between is hurried.',
  ])

  return (
    <section
      className="container-luxe py-20 lg:py-32"
      aria-labelledby="art-of-indian-craft"
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-1 lg:order-2">
          <div className="relative mx-auto aspect-4/5 w-full max-w-md overflow-hidden bg-ivory-deep lg:mr-0">
            <Image
              src={section?.imageUrl ?? '/images/editorial/editorial-art-of-craft.png'}
              alt={text(
                section?.imageAlt,
                'Undyed Pashmina yarn resting on a hand-carved wooden charkha in a Srinagar workshop',
              )}
              fill
              sizes="(min-width: 480px) 448px, 92vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <Reveal className="order-2 lg:order-1" delay={0.1}>
          <p className="eyebrow text-gold">{text(section?.eyebrow, 'Our Craft')}</p>
          <h2
            id="art-of-indian-craft"
            className="mt-5 font-serif text-[2.25rem] leading-[1.08] text-charcoal md:text-[3.25rem]"
          >
            {text(section?.heading, 'The Art of Indian Craft')}
          </h2>
          <p className="mt-7 max-w-lg text-[1.0625rem] leading-relaxed text-mocha">
            {text(
              section?.subheading,
              'Discover timeless textiles shaped by generations of craftsmanship, refined for the modern wardrobe.',
            )}
          </p>
          {body.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="mt-5 max-w-lg text-[0.9375rem] leading-relaxed text-mocha">
              {paragraph}
            </p>
          ))}

          <Link
            href={section?.href ?? '/about'}
            className="group mt-10 inline-flex items-center gap-3 border-b border-charcoal/25 pb-2 text-[0.75rem] uppercase tracking-[0.2em] text-charcoal transition-colors duration-300 hover:border-gold hover:text-gold"
          >
            {text(section?.linkLabel, 'Discover Our Story')}
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-1"
              strokeWidth={1.25}
            />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
