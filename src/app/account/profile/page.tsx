import type { Metadata } from 'next'
import { ProfileForm } from '@/components/account/profile-form'
import { getCustomer } from '@/server/account'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
  const customer = await getCustomer('/account/profile')

  return (
    <div>
      <h2 className="font-serif text-2xl text-charcoal">Profile</h2>
      <p className="mt-3 max-w-lg text-sm leading-relaxed text-mocha">
        Your details are used for order confirmations, delivery and — if you opt in — the
        Pashmore journal.
      </p>

      <ProfileForm customer={customer} />
    </div>
  )
}
