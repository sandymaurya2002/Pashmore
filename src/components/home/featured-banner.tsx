import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '@/components/motion/reveal'

export function FeaturedBanner() {
  return (
    <section aria-labelledby="crafted-for-generations" className="relative">
      <Reveal y={0}>
        <Link href="/collections/pure-pashmina" className="group block">
          <div className="relative h-[62dvh] min-h-[24rem] w-full overflow-hidden bg-charcoal lg:h-[70dvh]">
            <Image
              src="/images/editorial/featured-pure-pashmina.png"
              alt="A length of pure Pashmina cloth catching low light across its full drape"
              fill
              sizes="100vw"
              quality={82}
              className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-luxe)] group-hover:scale-[1.03]"
            />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-ink/70 via-ink/30 to-transparent"
            />

            <div className="container-luxe relative flex h-full items-center">
              <div className="max-w-lg">
                <p className="eyebrow text-gold-soft">Crafted for Generations</p>
                <h2
                  id="crafted-for-generations"
                  className="mt-5 font-serif text-[2.5rem] leading-[1.05] text-ivory md:text-[3.75rem]"
                >
                  Pure Pashmina
                </h2>
                <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-ivory/80">
                  Hand-combed at 4,500 metres, charkha-spun, and woven on a wooden
                  handloom by weavers whose names are recorded on every certificate.
                </p>
                <span className="mt-9 inline-flex items-center gap-3 border-b border-ivory/45 pb-2 text-[0.6875rem] uppercase tracking-[0.2em] text-ivory transition-colors duration-500 group-hover:border-ivory">
                  Discover the collection
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-1"
                    strokeWidth={1.25}
                  />
                </span>
              </div>
            </div>
          </div>
        </Link>
      </Reveal>
    </section>
  )
}
