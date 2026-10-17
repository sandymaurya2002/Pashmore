import Image from 'next/image'
import { Reveal } from '@/components/motion/reveal'
import { text } from '@/lib/home-copy'
import type { HomeSection } from '@/server/content'

/** Copy is edited in the admin (Website → Homepage); an active "Home gift packaging" banner replaces it. */
export function GiftPackagingBanner({ section }: { section?: HomeSection }) {
  return (
    <section aria-labelledby="gift-box-packaging" className="bg-cream">
      <div className="container-luxe grid items-center gap-10 py-[clamp(3rem,5vw,5.5rem)] md:grid-cols-2 md:gap-[clamp(2rem,4vw,5rem)]">
        <Reveal className="order-2 text-center md:order-1">
          <p className="text-[0.6875rem] uppercase tracking-[0.35em] text-taupe">
            {text(section?.eyebrow, 'Complimentary')}
          </p>
          <h2
            id="gift-box-packaging"
            className="mt-3 font-serif text-[clamp(1.6rem,1.1rem+1.1vw,2.5rem)] uppercase leading-tight tracking-[0.12em] text-gold"
          >
            {text(section?.heading, 'Gift Box Packaging')}
          </h2>
          <p className="mt-4 text-[0.875rem] text-mocha">
            {text(section?.subheading, 'On All Prepaid Orders')}
          </p>
        </Reveal>

        <Reveal y={0} delay={0.1} className="order-1 md:order-2">
          <div className="relative mx-auto aspect-square w-full max-w-[clamp(16rem,38vw,34rem)] overflow-hidden rounded-t-full bg-sand">
            <Image
              src={section?.imageUrl ?? '/images/editorial/gifting-box.png'}
              alt={text(
                section?.imageAlt,
                'A Pashmore presentation gift box beside an embroidered Pashmina shawl',
              )}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
