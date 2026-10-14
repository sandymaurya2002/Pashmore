import type { Metadata } from 'next'
import { PolicyView, policyMetadata } from '@/components/content/policy-view'

export function generateMetadata(): Promise<Metadata> {
  return policyMetadata('shipping')
}

export default function Page() {
  return <PolicyView slug="shipping" />
}
