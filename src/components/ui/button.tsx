import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans transition-all duration-300 ease-[var(--ease-luxe)] disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-charcoal text-ivory hover:bg-ink active:translate-y-px',
        outline:
          'border border-charcoal/25 text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory',
        gold: 'bg-gold text-ivory hover:bg-[#9c7c44]',
        ghost: 'text-charcoal hover:bg-charcoal/5',
        light:
          'bg-ivory text-charcoal hover:bg-white border border-transparent',
        outlineLight:
          'border border-ivory/50 text-ivory hover:bg-ivory hover:text-charcoal',
        link: 'text-charcoal underline-offset-4 hover:text-gold',
      },
      size: {
        // Uppercase labels with wide tracking have a large min-content width.
        // Padding and tracking ease off on small phones so long labels such as
        // "Corporate Gifting" cannot force horizontal overflow.
        sm: 'h-9 px-4 text-[0.6875rem] tracking-[0.16em] uppercase',
        md: 'h-11 px-5 text-[0.75rem] tracking-[0.14em] uppercase sm:px-7 sm:tracking-[0.18em]',
        lg: 'h-13 px-6 text-[0.75rem] tracking-[0.16em] uppercase sm:px-9 sm:text-[0.8125rem] sm:tracking-[0.2em]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant, size, asChild = false, ...props }, ref) {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    )
  },
)

export { buttonVariants }
