'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input, FieldError, FieldLabel } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/context/toast-context'
import { useSession } from '@/context/session-context'
import { ApiError } from '@/lib/api/envelope'
import { bff, errorMessage } from '@/lib/api/browser'

type Mode = 'login' | 'register' | 'forgot' | 'reset'

/** Mirrors the Worker's password rule so customers hear about it before submitting. */
const newPassword = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(128, 'That password is too long.')
  .refine((value) => /[a-zA-Z]/.test(value), 'Include at least one letter.')
  .refine((value) => /[0-9]/.test(value), 'Include at least one number.')

const email = z.string().trim().email('Please enter a valid email address.')

const schemas = {
  login: z.object({
    email,
    password: z.string().min(1, 'Please enter your password.'),
  }),
  register: z.object({
    firstName: z.string().trim().min(2, 'Please enter your first name.'),
    lastName: z.string().trim().min(1, 'Please enter your last name.'),
    email,
    password: newPassword,
  }),
  forgot: z.object({ email }),
  reset: z.object({ password: newPassword }),
}

/** Only same-site paths are honoured as post-login destinations. */
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/account'
}

export function AuthForm({ mode, token }: { mode: Mode; token?: string }) {
  const { toast } = useToast()
  const { signIn, register } = useSession()
  const router = useRouter()
  const [values, setValues] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [formError, setFormError] = React.useState<string | null>(null)
  const [remember, setRemember] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [sent, setSent] = React.useState(false)

  function set(field: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }))
  }

  async function submit() {
    switch (mode) {
      case 'login':
        await signIn(values.email.trim(), values.password, remember)
        router.replace(safeNext())
        router.refresh()
        return
      case 'register':
        await register({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          email: values.email.trim(),
          password: values.password,
        })
        toast({ title: 'Account created', description: 'Welcome to Pashmore.' })
        router.replace(safeNext())
        router.refresh()
        return
      case 'forgot': {
        const { data } = await bff<{ message: string }>('/api/auth/forgot-password', {
          method: 'POST',
          body: { email: values.email.trim() },
        })
        setSent(true)
        toast({ title: 'Check your inbox', description: data.message, tone: 'info' })
        return
      }
      case 'reset': {
        const { data } = await bff<{ message: string }>('/api/auth/reset-password', {
          method: 'POST',
          body: { token, password: values.password },
        })
        toast({ title: 'Password updated', description: data.message })
        router.replace('/login')
        return
      }
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const result = schemas[mode].safeParse(values)

    if (!result.success) {
      const next: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        if (!next[key]) next[key] = issue.message
      }
      setErrors(next)
      return
    }

    setErrors({})
    setFormError(null)
    setSubmitting(true)
    try {
      await submit()
    } catch (error) {
      if (error instanceof ApiError && error.details) setErrors(error.details)
      setFormError(
        errorMessage(
          error,
          mode === 'login' ? 'We could not sign you in. Please try again.' : 'Something went wrong. Please try again.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (mode === 'reset' && !token) {
    return (
      <p className="mt-10 text-sm leading-relaxed text-mocha">
        This reset link is incomplete. Please{' '}
        <Link href="/forgot-password" className="link-underline text-charcoal">
          request a new one
        </Link>
        .
      </p>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 flex flex-col gap-5">
      {mode === 'register' && (
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="firstName">First name</FieldLabel>
            <Input
              id="firstName"
              autoComplete="given-name"
              value={values.firstName}
              onChange={set('firstName')}
              aria-invalid={errors.firstName ? true : undefined}
            />
            <FieldError>{errors.firstName}</FieldError>
          </div>
          <div>
            <FieldLabel htmlFor="lastName">Last name</FieldLabel>
            <Input
              id="lastName"
              autoComplete="family-name"
              value={values.lastName}
              onChange={set('lastName')}
              aria-invalid={errors.lastName ? true : undefined}
            />
            <FieldError>{errors.lastName}</FieldError>
          </div>
        </div>
      )}

      {mode !== 'reset' && (
        <div>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={set('email')}
            aria-invalid={errors.email ? true : undefined}
          />
          <FieldError>{errors.email}</FieldError>
        </div>
      )}

      {mode !== 'forgot' && (
        <div>
          <FieldLabel htmlFor="password">{mode === 'reset' ? 'New password' : 'Password'}</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={values.password}
            onChange={set('password')}
            aria-invalid={errors.password ? true : undefined}
          />
          <FieldError>{errors.password}</FieldError>
        </div>
      )}

      {mode === 'login' && (
        <div className="flex items-center justify-between gap-4">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-mocha">
            <Checkbox
              checked={remember}
              onCheckedChange={(checked) => setRemember(checked === true)}
            />
            Keep me signed in
          </label>
          <Link
            href="/forgot-password"
            className="text-xs text-taupe underline underline-offset-4 transition-colors hover:text-charcoal"
          >
            Forgot password?
          </Link>
        </div>
      )}

      {formError && (
        <p role="alert" className="text-sm leading-relaxed text-burgundy">
          {formError}
        </p>
      )}

      {mode === 'forgot' && sent && (
        <p role="status" className="text-sm leading-relaxed text-mocha">
          If an account exists for that address, a reset link is on its way. The link
          expires after a short while, so use it soon.
        </p>
      )}

      <Button type="submit" size="lg" className="mt-3 h-13" disabled={submitting}>
        {submitting
          ? 'Please wait…'
          : mode === 'login'
            ? 'Sign In'
            : mode === 'register'
              ? 'Create Account'
              : mode === 'reset'
                ? 'Set New Password'
                : sent
                  ? 'Send Again'
                  : 'Send Reset Link'}
      </Button>

      <p className="mt-2 text-center text-sm text-mocha">
        {mode === 'login' ? (
          <>
            New to Pashmore?{' '}
            <Link href="/register" className="link-underline text-charcoal">
              Create an account
            </Link>
          </>
        ) : (
          <>
            {mode === 'register' ? 'Already have an account?' : 'Remembered it?'}{' '}
            <Link href="/login" className="link-underline text-charcoal">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
