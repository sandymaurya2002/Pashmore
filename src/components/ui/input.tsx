import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, type = 'text', ...props }, ref) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-11 w-full border border-line-strong bg-transparent px-4 text-sm text-charcoal',
        'placeholder:text-taupe transition-colors duration-200',
        'hover:border-taupe focus:border-charcoal focus:outline-none focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-[invalid=true]:border-burgundy',
        className,
      )}
      {...props}
    />
  )
})

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full border border-line-strong bg-transparent px-4 py-3 text-sm text-charcoal',
        'placeholder:text-taupe transition-colors duration-200',
        'hover:border-taupe focus:border-charcoal focus:outline-none focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2',
        className,
      )}
      {...props}
    />
  )
})

export function FieldLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'eyebrow mb-2 block text-taupe',
        className,
      )}
      {...props}
    />
  )
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="mt-1.5 text-xs text-burgundy">
      {children}
    </p>
  )
}
