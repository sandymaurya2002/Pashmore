'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { NavItem } from '@/data/navigation'
import { usePrefersReducedMotion } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface MegaMenuProps {
  item: NavItem
  onNavigate: () => void
}

export function MegaMenuPanel({ item, onNavigate }: MegaMenuProps) {
  const reduceMotion = usePrefersReducedMotion()

  if (!item.columns) return null

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={{ duration: reduceMotion ? 0.001 : 0.34, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-x-0 top-full border-t border-line bg-ivory shadow-[0_28px_60px_-32px_rgba(18,17,15,0.3)]"
    >
      <div className="container-luxe grid grid-cols-12 gap-[clamp(1.5rem,2.2vw,2.75rem)] py-[clamp(2rem,3vw,3.25rem)]">
        {item.columns.map((column) => (
          <div key={column.title} className="col-span-3">
            <p className="eyebrow mb-6 text-taupe">{column.title}</p>
            <ul className="flex flex-col gap-3.5">
              {column.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className={cn(
                      'link-underline inline-flex items-center gap-2 text-[0.9375rem] text-charcoal/95 transition-colors duration-300 hover:text-charcoal',
                      link.highlight && 'text-gold hover:text-gold',
                    )}
                  >
                    {link.highlight && (
                      <span aria-hidden className="h-px w-4 bg-gold" />
                    )}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {item.feature && (
          <div className="col-span-6 col-start-7">
            <Link
              href={item.feature.href}
              onClick={onNavigate}
              className="group grid grid-cols-2 items-stretch gap-8"
            >
              <div className="relative aspect-4/5 overflow-hidden bg-ivory-deep">
                <Image
                  src={item.feature.image.url}
                  alt={item.feature.image.alt}
                  fill
                  sizes="(min-width: 1024px) 22vw, 0px"
                  className="object-cover transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:scale-[1.04]"
                />
              </div>
              <div className="flex flex-col justify-center">
                <p className="eyebrow text-gold">{item.feature.eyebrow}</p>
                <h3 className="mt-3 font-serif type-chapter text-charcoal">
                  {item.feature.heading}
                </h3>
                <span className="mt-5 inline-flex items-center gap-2 text-[0.75rem] uppercase tracking-[0.18em] text-charcoal">
                  {item.feature.ctaLabel}
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-1"
                    strokeWidth={1.25}
                  />
                </span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}
