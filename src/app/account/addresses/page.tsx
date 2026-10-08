import type { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { demoAddresses } from '@/data/account'

export const metadata: Metadata = { title: 'Addresses' }

export default function AddressesPage() {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl text-charcoal">Saved Addresses</h2>
        <Button variant="outline" size="sm">
          Add Address
        </Button>
      </div>

      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {demoAddresses.map((address) => (
          <li key={address.id} className="border border-line p-6">
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow text-taupe">{address.label}</p>
              {address.isDefault && (
                <span className="text-[0.625rem] uppercase tracking-[0.14em] text-gold">
                  Default
                </span>
              )}
            </div>

            <address className="mt-4 text-sm not-italic leading-relaxed text-mocha">
              <span className="text-charcoal">{address.fullName}</span>
              <br />
              {address.line1}
              <br />
              {address.line2 && (
                <>
                  {address.line2}
                  <br />
                </>
              )}
              {address.city}, {address.state} {address.postalCode}
              <br />
              {address.country}
              <br />
              {address.phone}
            </address>

            <div className="mt-5 flex gap-5">
              <button
                type="button"
                className="text-[0.6875rem] uppercase tracking-[0.14em] text-charcoal underline underline-offset-4 hover:text-gold"
              >
                Edit
              </button>
              <button
                type="button"
                className="text-[0.6875rem] uppercase tracking-[0.14em] text-taupe underline underline-offset-4 hover:text-burgundy"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-xs text-taupe">
        Demo mode — address management is presentational until an authentication and customer
        API are connected.
      </p>
    </div>
  )
}
