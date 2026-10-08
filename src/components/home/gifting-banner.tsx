import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Reveal } from '@/components/motion/reveal'

export function GiftingBanner() {
  return (
    <section className="container-luxe py-20 lg:py-28" aria-labelledby="art-of-gifting">
      <div className="grid items-center gap-0 overflow-hidden bg-charcoal lg:grid-cols-2">
        <Reveal y={0} className="relative">
          <div className="relative aspect-4/3 w-full lg:aspect-square">
            <Image
              src="/images/editorial/gifting-box.png"
              alt="A Pashmore lacquered presentation box, muslin sleeve and craft certificate arranged on linen"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </Reveal>

        <Reveal delay={0.1} className="px-6 py-12 sm:px-8 sm:py-14 md:px-14 lg:px-16 lg:py-20">
          <p className="eyebrow text-gold-soft">Gifting</p>
          <h2
            id="art-of-gifting"
            className="mt-5 font-serif text-[2.25rem] leading-[1.08] text-ivory md:text-[3rem]"
          >
            The Art of Gifting
          </h2>
          <p className="mt-6 max-w-md text-[0.9375rem] leading-relaxed text-ivory/75">
            Thoughtfully crafted pieces for moments worth remembering. Every gift is
            presented in a hand-bound box from a Srinagar bookbinder, with a muslin
            sleeve, a craft certificate and a hand-written card.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Button asChild variant="light" size="lg">
              <Link href="/collections/gifting">Shop Gifts</Link>
            </Button>
            <Button asChild variant="outlineLight" size="lg">
              <Link href="/corporate-gifts">Corporate Gifting</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
