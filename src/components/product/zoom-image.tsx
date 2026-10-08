'use client'

import * as React from 'react'
import Image from 'next/image'
import { Expand } from 'lucide-react'
import { clamp, cn } from '@/lib/utils'
import { useHasHover, usePrefersReducedMotion } from '@/hooks/use-media-query'
import type { ProductImage } from '@/types'

const ZOOM_SCALE = 2.2

interface ZoomImageProps {
  image: ProductImage
  onOpenFullscreen: () => void
  priority?: boolean
  sizes?: string
  className?: string
}

/**
 * Hover magnification for the main product image.
 *
 * The magnified layer is the same next/image element scaled about the cursor
 * via `transform-origin`, so there is no second network request and no second
 * decode. `transform-origin` is updated without a transition so the zoom tracks
 * the pointer exactly, while `transform` itself is transitioned so entering and
 * leaving the image feels like a lens settling rather than a jump.
 */
export function ZoomImage({
  image,
  onOpenFullscreen,
  priority = false,
  sizes = '(min-width: 1024px) 46vw, 100vw',
  className,
}: ZoomImageProps) {
  const hasHover = useHasHover()
  const reduceMotion = usePrefersReducedMotion()
  const [zooming, setZooming] = React.useState(false)
  const [origin, setOrigin] = React.useState({ x: 50, y: 50 })
  const frame = React.useRef<number | null>(null)

  React.useEffect(() => {
    setZooming(false)
    setOrigin({ x: 50, y: 50 })
  }, [image.url])

  React.useEffect(() => {
    const pending = frame
    return () => {
      if (pending.current) cancelAnimationFrame(pending.current)
    }
  }, [])

  function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    if (!hasHover) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    // Coalesce into one frame: mousemove can fire far faster than the compositor.
    if (frame.current) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() =>
      setOrigin({ x: clamp(x, 0, 100), y: clamp(y, 0, 100) }),
    )
  }

  function onKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault()
        onOpenFullscreen()
        break
      case '+':
      case '=':
        event.preventDefault()
        setZooming(true)
        break
      case '-':
      case '_':
      case 'Escape':
        event.preventDefault()
        setZooming(false)
        break
      case 'ArrowLeft':
        if (!zooming) break
        event.preventDefault()
        setOrigin((o) => ({ ...o, x: clamp(o.x - 8, 0, 100) }))
        break
      case 'ArrowRight':
        if (!zooming) break
        event.preventDefault()
        setOrigin((o) => ({ ...o, x: clamp(o.x + 8, 0, 100) }))
        break
      case 'ArrowUp':
        if (!zooming) break
        event.preventDefault()
        setOrigin((o) => ({ ...o, y: clamp(o.y - 8, 0, 100) }))
        break
      case 'ArrowDown':
        if (!zooming) break
        event.preventDefault()
        setOrigin((o) => ({ ...o, y: clamp(o.y + 8, 0, 100) }))
        break
      default:
        break
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${image.alt}. Press Enter to open the fullscreen viewer, plus and minus to zoom.`}
      onMouseEnter={() => hasHover && setZooming(true)}
      onMouseLeave={() => setZooming(false)}
      onMouseMove={onMouseMove}
      onClick={onOpenFullscreen}
      onKeyDown={onKeyDown}
      className={cn(
        'group relative aspect-4/5 w-full overflow-hidden bg-ivory-deep',
        hasHover ? 'cursor-zoom-in' : 'cursor-pointer',
        className,
      )}
    >
      <Image
        src={image.url}
        alt={image.alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={90}
        draggable={false}
        className="object-cover"
        style={{
          transform: `scale(${zooming ? ZOOM_SCALE : 1})`,
          transformOrigin: `${origin.x}% ${origin.y}%`,
          transition: reduceMotion
            ? 'none'
            : 'transform 420ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center bg-ivory/85 text-charcoal backdrop-blur-[2px] transition-opacity duration-300',
          zooming ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100',
        )}
      >
        <Expand className="h-4 w-4" strokeWidth={1.25} />
      </span>
    </div>
  )
}
