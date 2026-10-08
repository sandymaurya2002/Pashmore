import type { Metadata } from 'next'
import { PolicyView } from '@/components/content/policy-view'
import { policyBySlug } from '@/data/policies'
import { buildMetadata, metaDescription } from '@/lib/seo'

const policy = policyBySlug.get('returns')!

export const metadata: Metadata = buildMetadata({
  title: policy.metaTitle,
  description: metaDescription(policy.metaDescription),
  path: '/returns',
})

export default function Page() {
  return <PolicyView slug="returns" />
}
