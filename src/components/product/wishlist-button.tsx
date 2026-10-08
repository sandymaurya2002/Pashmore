'use client'

import * as React from 'react'
import { Heart } from 'lucide-react'
import { useWishlist } from '@/context/wishlist-context'
import { useToast } from '@/context/toast-context'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  slug: string
  productName: string
  className?: string
  variant?: 'floating' | 'inline'
}

export function WishlistButton({
  slug,
  productName,
  className,
  variant = 'floating',
}: WishlistButtonProps) {
  const { has, toggle, hydrated } = useWishlist()
  const { toast } = useToast()
  const [pulse, setPulse] = React.useState(false)

  const saved = hydrated && has(slug)

  function onClick(event: React.MouseEvent) {
    // The button usually sits inside a card-wide link.
    event.preventDefault()
    event.stopPropagation()

    const added = toggle(slug)
    if (added) {
      setPulse(true)
      window.setTimeout(() => setPulse(false), 420)
    }
    toast({
      title: added ? 'Added to wishlist' : 'Removed from wishlist',
      description: productName,
      tone: added ? 'success' : 'info',
    })
  }

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          'inline-flex h-13 w-13 shrink-0 items-center justify-center border border-charcoal/25 text-charcoal transition-colors duration-300 hover:border-charcoal',
          className,
        )}
        aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
      >
        <Heart
          className={cn(
            'h-[1.15rem] w-[1.15rem] transition-all duration-300',
            saved && 'fill-burgundy text-burgundy',
            pulse && 'scale-125',
          )}
          strokeWidth={1.25}
        />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      className={cn(
        'flex h-9 w-9 items-center justify-center bg-ivory/85 text-charcoal opacity-0 backdrop-blur-[2px] transition-all duration-300 ease-[var(--ease-luxe)]',
        'hover:bg-ivory focus-visible:opacity-100 group-hover:opacity-100',
        // Always visible once saved, and always visible on touch devices where
        // there is no hover to reveal it.
        saved && 'opacity-100',
        '[@media(hover:none)]:opacity-100',
        className,
      )}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Add ${productName} to wishlist`}
    >
      <Heart
        className={cn(
          'h-4 w-4 transition-all duration-300',
          saved && 'fill-burgundy text-burgundy',
          pulse && 'scale-125',
        )}
        strokeWidth={1.25}
      />
    </button>
  )
}
