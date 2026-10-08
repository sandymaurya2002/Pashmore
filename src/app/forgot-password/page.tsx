import type { Metadata } from 'next'
import { AuthShell } from '@/components/account/auth-shell'
import { AuthForm } from '@/components/account/auth-form'
import { buildMetadata, pageTitle } from '@/lib/seo'

export const metadata: Metadata = buildMetadata({
  title: pageTitle('Reset Password'),
  description: 'Reset your Pashmore account password.',
  path: '/forgot-password',
  noIndex: true,
})

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="Reset your password"
      description="Enter the email address on your account and we will send you a link to set a new password."
    >
      <AuthForm mode="forgot" />
    </AuthShell>
  )
}
