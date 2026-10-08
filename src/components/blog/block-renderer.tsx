import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { BlogBlock } from '@/types'

/**
 * Renders the structured article body.
 *
 * Content is stored as typed blocks rather than raw HTML, which keeps the
 * markup semantic, keeps a heading hierarchy that never skips a level, and
 * means swapping the local data for a CMS is a mapping exercise rather than a
 * sanitisation problem.
 */
export function BlockRenderer({ blocks }: { blocks: BlogBlock[] }) {
  return (
    <div className="flex flex-col">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`

        switch (block.type) {
          case 'heading':
            return (
              <h2
                key={key}
                className="mt-14 font-serif text-[1.625rem] leading-tight text-charcoal md:text-[2rem]"
              >
                {block.text}
              </h2>
            )

          case 'subheading':
            return (
              <h3
                key={key}
                className="mt-10 font-serif text-[1.25rem] leading-snug text-charcoal"
              >
                {block.text}
              </h3>
            )

          case 'paragraph':
            return (
              <p key={key} className="mt-5 text-[1.0625rem] leading-[1.75] text-mocha">
                {block.text}
              </p>
            )

          case 'list':
            return (
              <ul key={key} className="mt-6 flex flex-col gap-3">
                {block.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-[1.0625rem] leading-[1.7] text-mocha"
                  >
                    <span aria-hidden className="mt-3.5 h-px w-3.5 shrink-0 bg-gold" />
                    {item}
                  </li>
                ))}
              </ul>
            )

          case 'quote':
            return (
              <figure key={key} className="my-12 border-l border-gold pl-6">
                <blockquote className="font-serif text-[1.375rem] leading-snug text-charcoal md:text-[1.75rem]">
                  “{block.text}”
                </blockquote>
                {block.attribution && (
                  <figcaption className="mt-4 text-[0.6875rem] uppercase tracking-[0.16em] text-taupe">
                    {block.attribution}
                  </figcaption>
                )}
              </figure>
            )

          case 'productLink':
            return (
              <InlineLink
                key={key}
                href={`/products/${block.slug}`}
                label={block.label}
                eyebrow="Shop the piece"
              />
            )

          case 'collectionLink':
            return (
              <InlineLink
                key={key}
                href={`/collections/${block.slug}`}
                label={block.label}
                eyebrow="Explore"
              />
            )

          default:
            return null
        }
      })}
    </div>
  )
}

function InlineLink({
  href,
  label,
  eyebrow,
}: {
  href: string
  label: string
  eyebrow: string
}) {
  return (
    <Link
      href={href}
      className="group my-10 flex items-center justify-between gap-6 border border-line bg-cream/40 px-6 py-5 transition-colors duration-300 hover:border-gold/50"
    >
      <span>
        <span className="eyebrow block text-gold">{eyebrow}</span>
        <span className="mt-1.5 block font-serif text-lg text-charcoal">{label}</span>
      </span>
      <ArrowRight
        aria-hidden
        className="h-4 w-4 shrink-0 text-charcoal transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-1"
        strokeWidth={1.25}
      />
    </Link>
  )
}
