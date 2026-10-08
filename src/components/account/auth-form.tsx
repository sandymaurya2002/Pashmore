'use client'

import * as React from 'react'
import Link from 'next/link'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input, FieldError, FieldLabel } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/context/toast-context'

type Mode = 'login' | 'register' | 'forgot'

const schemas = {
  login: z.object({
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(8, 'Passwords are at least 8 characters.'),
  }),
  register: z.object({
    firstName: z.string().min(2, 'Please enter your first name.'),
    lastName: z.string().min(1, 'Please enter your last name.'),
    email: z.string().email('Please enter a valid email address.'),
    password: z.string().min(8, 'Choose a password of at least 8 characters.'),
  }),
  forgot: z.object({
    email: z.string().email('Please enter a valid email address.'),
  }),
}

/**
 * Presentational authentication forms with real client-side validation.
 *
 * There is no auth provider in the demo build; `onSubmit` is the single place
 * to call signIn / signUp once one is wired in.
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const { toast } = useToast()
  const [values, setValues] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [remember, setRemember] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)

  function set(field: keyof typeof values) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((current) => ({ ...current, [field]: event.target.value }))
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
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 600))
    setSubmitting(false)

    toast({
      title:
        mode === 'forgot'
          ? 'Reset link sent'
          : mode === 'register'
            ? 'Account created'
            : 'Signed in',
      description: 'Demo mode — connect an authentication provider to complete this flow.',
      tone: 'info',
    })
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

      {mode !== 'forgot' && (
        <div>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
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

      <Button type="submit" size="lg" className="mt-3 h-13" disabled={submitting}>
        {submitting
          ? 'Please wait…'
          : mode === 'login'
            ? 'Sign In'
            : mode === 'register'
              ? 'Create Account'
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
            Already have an account?{' '}
            <Link href="/login" className="link-underline text-charcoal">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  )
}
