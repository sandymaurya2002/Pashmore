'use client'

import * as React from 'react'
import Image from 'next/image'
import { Expand } from 'lucide-react'

import { ZoomImage } from '@/components/product/zoom-image'
import { FullscreenViewer } from '@/components/product/fullscreen-viewer'
import { cn } from '@/lib/utils'
import type { ProductImage } from '@/types'

interface ProductGalleryProps {
  images: ProductImage[]
  productName: string
}

/**
 * Desktop: vertical thumbnail rail plus a magnifying main image.
 * Mobile: a scroll-snap swipe gallery with a position indicator.
 * Both open the same fullscreen viewer, which owns pinch, wheel and pan.
 */
export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [index, setIndex] = React.useState(0)
  const [viewerOpen, setViewerOpen] = React.useState(false)
  const trackRef = React.useRef<HTMLUListElement>(null)

  const active = images[index] ?? images[0]

  // Keep the mobile counter in step with the swipe position.
  const onScroll = React.useCallback(() => {
    const node = trackRef.current
    if (!node) return
    const next = Math.round(node.scrollLeft / node.clientWidth)
    setIndex((current) => (current === next ? current : next))
  }, [])

  if (!images.length) return null

  return (
    <>
      {/* ---------------- Desktop ---------------- */}
      <div className="hidden gap-5 lg:flex">
        <ul className="flex w-20 shrink-0 flex-col gap-3" aria-label="Product images">
          {images.map((image, imageIndex) => (
            <li key={image.url}>
              <button
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-label={`Show image ${imageIndex + 1} of ${images.length}`}
                aria-current={imageIndex === index}
                className={cn(
                  'relative block aspect-4/5 w-full overflow-hidden border transition-all duration-300 ease-[var(--ease-luxe)]',
                  imageIndex === index
                    ? 'border-charcoal'
                    : 'border-transparent opacity-60 hover:opacity-100',
                )}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="min-w-0 flex-1">
          <ZoomImage
            image={active}
            priority
            onOpenFullscreen={() => setViewerOpen(true)}
            sizes="(min-width: 1280px) 42vw, (min-width: 1024px) 48vw, 100vw"
          />
          <p className="mt-3 text-center text-[0.625rem] uppercase tracking-[0.16em] text-taupe">
            Hover to magnify · Click to view fullscreen
          </p>
        </div>
      </div>

      {/* ---------------- Mobile ---------------- */}
      <div className="relative lg:hidden">
        <ul
          ref={trackRef}
          onScroll={onScroll}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
          aria-label={`${productName} images`}
        >
          {images.map((image, imageIndex) => (
            <li key={image.url} className="w-full shrink-0 snap-center">
              <button
                type="button"
                onClick={() => {
                  setIndex(imageIndex)
                  setViewerOpen(true)
                }}
                className="relative block aspect-4/5 w-full bg-ivory-deep"
                aria-label={`${image.alt}. Tap to open fullscreen viewer.`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="100vw"
                  priority={imageIndex === 0}
                  quality={88}
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>

        <div className="pointer-events-none absolute bottom-4 left-4 bg-ivory/85 px-3 py-1.5 text-[0.6875rem] tabular-nums tracking-[0.1em] text-charcoal backdrop-blur-[2px]">
          {index + 1} / {images.length}
        </div>

        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          className="absolute bottom-4 right-4 flex h-9 w-9 items-center justify-center bg-ivory/85 text-charcoal backdrop-blur-[2px]"
          aria-label="Open fullscreen image viewer"
        >
          <Expand className="h-4 w-4" strokeWidth={1.25} />
        </button>

        <ul className="mt-4 flex justify-center gap-1.5" aria-hidden>
          {images.map((image, imageIndex) => (
            <li
              key={image.url}
              className={cn(
                'h-0.5 w-6 transition-colors duration-300',
                imageIndex === index ? 'bg-charcoal' : 'bg-line-strong',
              )}
            />
          ))}
        </ul>
      </div>

      <FullscreenViewer
        images={images}
        index={index}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        onIndexChange={setIndex}
        productName={productName}
      />
    </>
  )
}
