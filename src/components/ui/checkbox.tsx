'use client'

import * as React from 'react'
import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { cn } from '@/lib/utils'

export function CheckMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn('h-3 w-3', className)}>
      <path
        d="M3.25 8.25 6.4 11.15 12.75 4.75"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(function Checkbox({ className, ...props }, ref) {
  return (
    <CheckboxPrimitive.Root
      ref={ref}
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center border border-line-strong bg-transparent',
        'transition-colors duration-200 hover:border-taupe',
        'data-[state=checked]:border-charcoal data-[state=checked]:bg-charcoal data-[state=checked]:text-ivory',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <CheckMark />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
})
