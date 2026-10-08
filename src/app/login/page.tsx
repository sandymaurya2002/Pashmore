import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'
import { AuthForm } from '@/components/account/auth-form'
import { buildMetadata, pageTitle } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: pageTitle('Sign In'),
  description: 'Sign in to your Pashmore account.',
  path: '/login',
  noIndex: true,
})

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Welcome back"
      description="Sign in to track orders, save addresses and keep your wishlist across devices."
    >
      <AuthForm mode="login" />
    </AuthShell>
  )
}
