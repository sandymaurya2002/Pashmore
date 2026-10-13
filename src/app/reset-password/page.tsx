import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'
import { AuthForm } from '@/components/account/auth-form'
import { buildMetadata, pageTitle } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: pageTitle('Set a New Password'),
  description: 'Choose a new password for your Pashmore account.',
  path: '/reset-password',
  noIndex: true,
})

interface PageProps {
  searchParams: Promise<{ token?: string | string[] }>
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token } = await searchParams
  return (
    <AuthShell
      eyebrow="Account"
      title="Set a new password"
      description="Choose a password of at least eight characters, with at least one letter and one number."
    >
      <AuthForm mode="reset" token={typeof token === 'string' ? token : undefined} />
    </AuthShell>
  )
}
