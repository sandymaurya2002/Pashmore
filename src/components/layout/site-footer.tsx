import Link from 'next/link'
import { Instagram, Facebook, Youtube } from 'lucide-react'
import { Logo } from '@/components/layout/logo'
import { NewsletterForm } from '@/components/marketing/newsletter-form'
import { footerColumns } from '@/data/navigation'
import { site } from '@/lib/site'

const PAYMENT_METHODS = ['Visa', 'Mastercard', 'RuPay', 'UPI', 'Net Banking', 'Razorpay']

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-line bg-cream/60 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
      <NewsletterForm />

      <div className="container-luxe grid grid-cols-2 gap-x-[clamp(1.5rem,2.5vw,3rem)] gap-y-12 border-t border-line py-[clamp(3rem,4vw,5rem)] md:grid-cols-4">
        {footerColumns.map((column) => (
          <nav key={column.title} aria-labelledby={`footer-${column.title}`}>
            <h2
              id={`footer-${column.title}`}
              className="eyebrow mb-6 font-sans text-taupe"
            >
              {column.title}
            </h2>
            <ul className="flex flex-col gap-1">
              {column.links.map((link) => (
                <li key={link.href}>
                  {/* inline-block + vertical padding keeps the tap target at
                      least 24px tall (WCAG 2.2 target size) without changing
                      the visual rhythm of the list. */}
                  <Link
                    href={link.href}
                    className="link-underline inline-block py-1.5 text-sm text-charcoal/85 transition-colors duration-300 hover:text-charcoal"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container-luxe border-t border-line py-12">
        <div className="flex flex-col items-center gap-8 text-center">
          <Logo />
          <p className="max-w-md text-sm leading-relaxed text-mocha">
            {site.tagline} Handcrafted in Srinagar, Kashmir, and shipped worldwide.
          </p>

          <a
            href={`tel:${site.phone.replace(/\s/g, '')}`}
            className="text-sm tracking-[0.06em] text-charcoal transition-colors duration-300 hover:text-gold"
          >
            {site.phone}
          </a>

          <ul className="flex items-center gap-6">
            <li>
              <a
                href={site.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pashmore on Instagram"
                className="text-charcoal/85 transition-colors duration-300 hover:text-gold"
              >
                <Instagram className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
              </a>
            </li>
            <li>
              <a
                href={site.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pashmore on Facebook"
                className="text-charcoal/85 transition-colors duration-300 hover:text-gold"
              >
                <Facebook className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
              </a>
            </li>
            <li>
              <a
                href={site.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Pashmore on YouTube"
                className="text-charcoal/85 transition-colors duration-300 hover:text-gold"
              >
                <Youtube className="h-[1.15rem] w-[1.15rem]" strokeWidth={1.25} />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="container-luxe flex flex-col items-center justify-between gap-6 border-t border-line py-8 md:flex-row">
        <p className="text-xs text-taupe">
          © {year} {site.name}. All Rights Reserved.
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-2">
          {PAYMENT_METHODS.map((method) => (
            <li
              key={method}
              className="border border-line-strong px-2.5 py-1 text-[0.625rem] uppercase tracking-[0.12em] text-taupe"
            >
              {method}
            </li>
          ))}
        </ul>

        <ul className="flex items-center gap-5 text-xs text-taupe">
          <li>
            <Link href="/privacy" className="transition-colors hover:text-charcoal">
              Privacy
            </Link>
          </li>
          <li>
            <Link href="/terms" className="transition-colors hover:text-charcoal">
              Terms
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}
