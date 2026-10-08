import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'
import { AuthForm } from '@/components/account/auth-form'
import { buildMetadata, pageTitle } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: pageTitle('Create Account'),
  description: 'Create a Pashmore account.',
  path: '/register',
  noIndex: true,
})

export default function RegisterPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Create your account"
      description="Keep your orders, addresses and wishlist in one place — and hear about new pieces first."
    >
      <AuthForm mode="register" />
    </AuthShell>
  )
}
