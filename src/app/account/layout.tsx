import type { Metadata } from 'next'
import { AccountNav } from '@/components/account/account-nav'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: { default: 'My Account', template: `%s | Account | ${site.name}` },
  robots: { index: false, follow: false },
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-luxe pb-24 pt-12">
      <header className="max-w-2xl">
        <p className="eyebrow text-gold">Account</p>
        <h1 className="mt-5 font-serif text-[2.25rem] leading-[1.05] text-charcoal md:text-[3rem]">
          My Account
        </h1>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] lg:gap-16">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
