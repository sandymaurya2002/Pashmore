import type { Metadata } from 'next'
import { PolicyView, policyMetadata } from '@/components/content/policy-view'

export function generateMetadata(): Promise<Metadata> {
  return policyMetadata('returns')
}

export default function Page() {
  return <PolicyView slug="returns" />
}
