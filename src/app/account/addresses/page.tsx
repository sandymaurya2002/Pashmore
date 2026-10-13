import type { Metadata } from 'next'
import { AddressBook } from '@/components/account/address-book'
import { getAddresses } from '@/server/account'

export const metadata: Metadata = { title: 'Addresses' }

export default async function AddressesPage() {
  const addresses = await getAddresses()
  return <AddressBook initialAddresses={addresses} />
}
