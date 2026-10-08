import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import type { ProductBadge } from '@/types'

const badgeVariants = cva(
  'inline-flex items-center px-2.5 py-1 text-[0.625rem] font-medium uppercase tracking-[0.16em]',
  {
    variants: {
      variant: {
        default: 'bg-charcoal text-ivory',
        gold: 'bg-gold text-ivory',
        outline: 'border border-charcoal/25 text-charcoal',
        light: 'bg-ivory/92 text-charcoal backdrop-blur-[2px]',
        sale: 'bg-burgundy text-ivory',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

const BADGE_LABELS: Record<ProductBadge, string> = {
  new: 'New',
  bestseller: 'Best Seller',
  limited: 'Limited',
  handcrafted: 'Handcrafted',
  exclusive: 'Exclusive',
}

const BADGE_VARIANTS: Record<ProductBadge, 'light' | 'gold' | 'default'> = {
  new: 'light',
  bestseller: 'light',
  limited: 'gold',
  handcrafted: 'light',
  exclusive: 'default',
}

export function ProductBadgeChip({ badge }: { badge: ProductBadge }) {
  return <Badge variant={BADGE_VARIANTS[badge]}>{BADGE_LABELS[badge]}</Badge>
}

export { badgeVariants, BADGE_LABELS }
