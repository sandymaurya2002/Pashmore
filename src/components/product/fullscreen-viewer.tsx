'use client'

import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from 'lucide-react'

import { Dialog, DialogPortal, DialogTitle } from '@/components/ui/dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { clamp, cn } from '@/lib/utils'
import type { ProductImage } from '@/types'

const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_SCALE = 2.5
const SWIPE_THRESHOLD = 56

interface FullscreenViewerProps {
  images: ProductImage[]
  index: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onIndexChange: (index: number) => void
  productName: string
}

interface Transform {
  scale: number
  x: number
  y: number
}

const IDENTITY: Transform = { scale: 1, x: 0, y: 0 }

/**
 * Fullscreen image viewer.
 *
 * Built on pointer events so one code path serves mouse, touch and pen:
 *  - wheel / trackpad pinch  → zoom about the cursor
 *  - double click or tap     → toggle 1× ↔ 2.5× about the tap point
 *  - drag                    → pan while zoomed, swipe between images at 1×
 *  - two-finger pinch        → continuous zoom about the midpoint
 *  - ← → + − 0               → keyboard equivalents for everything above
 *
 * Radix supplies the focus trap, the `aria-modal` semantics, Escape-to-close
 * and the background scroll lock.
 */
export function FullscreenViewer({
  images,
  index,
  open,
  onOpenChange,
  onIndexChange,
  productName,
}: FullscreenViewerProps) {
  const [transform, setTransform] = React.useState<Transform>(IDENTITY)
  const [dragging, setDragging] = React.useState(false)

  const stageRef = React.useRef<HTMLDivElement>(null)
  const pointers = React.useRef(new Map<number, { x: number; y: number }>())
  const gesture = React.useRef({
    startDistance: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
    lastTap: 0,
  })

  const image = images[index]
  const reset = React.useCallback(() => setTransform(IDENTITY), [])

  React.useEffect(() => {
    reset()
  }, [index, open, reset])

  /** Keeps the image from being dragged entirely off the stage. */
  const clampTransform = React.useCallback((next: Transform): Transform => {
    const stage = stageRef.current
    if (!stage) return next
    const { width, height } = stage.getBoundingClientRect()
    const maxX = (Math.max(0, next.scale - 1) * width) / 2
    const maxY = (Math.max(0, next.scale - 1) * height) / 2
    return {
      scale: clamp(next.scale, MIN_SCALE, MAX_SCALE),
      x: clamp(next.x, -maxX, maxX),
      y: clamp(next.y, -maxY, maxY),
    }
  }, [])

  /** Zooms to `nextScale` while keeping the point under the cursor fixed. */
  const zoomAbout = React.useCallback(
    (nextScale: number, clientX: number, clientY: number) => {
      const stage = stageRef.current
      if (!stage) return
      const rect = stage.getBoundingClientRect()
      const pointX = clientX - rect.left - rect.width / 2
      const pointY = clientY - rect.top - rect.height / 2

      setTransform((current) => {
        const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE)
        if (scale === MIN_SCALE) return IDENTITY
        const ratio = scale / current.scale
        return clampTransform({
          scale,
          x: pointX - (pointX - current.x) * ratio,
          y: pointY - (pointY - current.y) * ratio,
        })
      })
    },
    [clampTransform],
  )

  const goTo = React.useCallback(
    (next: number) => {
      if (!images.length) return
      onIndexChange((next + images.length) % images.length)
    },
    [images.length, onIndexChange],
  )

  /* ---------------------------------------------------------------- *
   * Pointer gestures
   * ---------------------------------------------------------------- */

  function onPointerDown(event: React.PointerEvent) {
    ;(event.target as Element).setPointerCapture?.(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    gesture.current.moved = false

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      gesture.current.startDistance = Math.hypot(b.x - a.x, b.y - a.y)
      gesture.current.startScale = transform.scale
      gesture.current.originX = (a.x + b.x) / 2
      gesture.current.originY = (a.y + b.y) / 2
    } else {
      gesture.current.startX = event.clientX
      gesture.current.startY = event.clientY
      gesture.current.originX = transform.x
      gesture.current.originY = transform.y
      setDragging(true)
    }
  }

  function onPointerMove(event: React.PointerEvent) {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values())
      const distance = Math.hypot(b.x - a.x, b.y - a.y)
      if (!gesture.current.startDistance) return
      const nextScale = gesture.current.startScale * (distance / gesture.current.startDistance)
      zoomAbout(nextScale, gesture.current.originX, gesture.current.originY)
      gesture.current.moved = true
      return
    }

    const dx = event.clientX - gesture.current.startX
    const dy = event.clientY - gesture.current.startY
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) gesture.current.moved = true

    if (transform.scale > MIN_SCALE) {
      setTransform((current) =>
        clampTransform({
          ...current,
          x: gesture.current.originX + dx,
          y: gesture.current.originY + dy,
        }),
      )
    }
  }

  function onPointerUp(event: React.PointerEvent) {
    const start = { x: gesture.current.startX, y: gesture.current.startY }
    const wasSingle = pointers.current.size === 1
    pointers.current.delete(event.pointerId)
    setDragging(false)

    if (pointers.current.size === 0) gesture.current.startDistance = 0

    if (!wasSingle) return

    const dx = event.clientX - start.x
    const dy = event.clientY - start.y

    // At 1× a horizontal drag pages between images.
    if (
      transform.scale === MIN_SCALE &&
      Math.abs(dx) > SWIPE_THRESHOLD &&
      Math.abs(dx) > Math.abs(dy)
    ) {
      goTo(index + (dx < 0 ? 1 : -1))
      return
    }

    if (gesture.current.moved) return

    // Tap without movement: detect a double tap.
    const now = Date.now()
    if (now - gesture.current.lastTap < 320) {
      gesture.current.lastTap = 0
      zoomAbout(transform.scale > MIN_SCALE ? MIN_SCALE : DOUBLE_TAP_SCALE, event.clientX, event.clientY)
    } else {
      gesture.current.lastTap = now
    }
  }

  function onWheel(event: React.WheelEvent) {
    // preventDefault is not available on a passive React wheel handler in every
    // browser, so we only act when the gesture is clearly a zoom.
    const delta = -event.deltaY
    const factor = Math.exp(delta * 0.0016)
    zoomAbout(transform.scale * factor, event.clientX, event.clientY)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const stage = stageRef.current
    const rect = stage?.getBoundingClientRect()
    const cx = rect ? rect.left + rect.width / 2 : 0
    const cy = rect ? rect.top + rect.height / 2 : 0

    switch (event.key) {
      case 'ArrowRight':
        if (transform.scale > MIN_SCALE) {
          event.preventDefault()
          setTransform((c) => clampTransform({ ...c, x: c.x - 48 }))
        } else {
          event.preventDefault()
          goTo(index + 1)
        }
        break
      case 'ArrowLeft':
        if (transform.scale > MIN_SCALE) {
          event.preventDefault()
          setTransform((c) => clampTransform({ ...c, x: c.x + 48 }))
        } else {
          event.preventDefault()
          goTo(index - 1)
        }
        break
      case 'ArrowUp':
        if (transform.scale > MIN_SCALE) {
          event.preventDefault()
          setTransform((c) => clampTransform({ ...c, y: c.y + 48 }))
        }
        break
      case 'ArrowDown':
        if (transform.scale > MIN_SCALE) {
          event.preventDefault()
          setTransform((c) => clampTransform({ ...c, y: c.y - 48 }))
        }
        break
      case '+':
      case '=':
        event.preventDefault()
        zoomAbout(transform.scale + 0.5, cx, cy)
        break
      case '-':
      case '_':
        event.preventDefault()
        zoomAbout(transform.scale - 0.5, cx, cy)
        break
      case '0':
        event.preventDefault()
        reset()
        break
      default:
        break
    }
  }

  if (!image) return null

  const zoomed = transform.scale > MIN_SCALE

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/95 data-[state=open]:animate-[overlay-in_320ms_var(--ease-luxe)] data-[state=closed]:animate-[overlay-out_240ms_var(--ease-luxe)]" />
        <DialogPrimitive.Content
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col bg-ink focus:outline-none data-[state=open]:animate-[overlay-in_320ms_var(--ease-luxe)] data-[state=closed]:animate-[overlay-out_240ms_var(--ease-luxe)]"
        >
          <DialogTitle className="sr-only">
            {productName} — image {index + 1} of {images.length}
          </DialogTitle>

          <header className="flex items-center justify-between px-4 py-4 md:px-8">
            <p className="text-[0.6875rem] uppercase tracking-[0.2em] text-ivory/60">
              {index + 1} / {images.length}
            </p>

            <div className="flex items-center gap-1">
              <ViewerButton
                label="Zoom out"
                onClick={() => {
                  const rect = stageRef.current?.getBoundingClientRect()
                  zoomAbout(
                    transform.scale - 0.5,
                    rect ? rect.left + rect.width / 2 : 0,
                    rect ? rect.top + rect.height / 2 : 0,
                  )
                }}
                disabled={transform.scale <= MIN_SCALE}
              >
                <Minus className="h-4 w-4" strokeWidth={1.25} />
              </ViewerButton>
              <span className="w-14 text-center text-[0.6875rem] tabular-nums text-ivory/60">
                {Math.round(transform.scale * 100)}%
              </span>
              <ViewerButton
                label="Zoom in"
                onClick={() => {
                  const rect = stageRef.current?.getBoundingClientRect()
                  zoomAbout(
                    transform.scale + 0.5,
                    rect ? rect.left + rect.width / 2 : 0,
                    rect ? rect.top + rect.height / 2 : 0,
                  )
                }}
                disabled={transform.scale >= MAX_SCALE}
              >
                <Plus className="h-4 w-4" strokeWidth={1.25} />
              </ViewerButton>
              <ViewerButton label="Reset zoom" onClick={reset} disabled={!zoomed}>
                <RotateCcw className="h-4 w-4" strokeWidth={1.25} />
              </ViewerButton>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  aria-label="Close image viewer"
                  className="ml-2 flex h-10 w-10 items-center justify-center text-ivory/70 transition-colors hover:text-ivory"
                >
                  <X className="h-5 w-5" strokeWidth={1.25} />
                </button>
              </DialogPrimitive.Close>
            </div>
          </header>

          <div
            ref={stageRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            className={cn(
              'relative flex-1 touch-none select-none overflow-hidden',
              zoomed ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
            )}
          >
            <div
              className="absolute inset-0 will-change-transform"
              style={{
                transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                transition: dragging ? 'none' : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            >
              <Image
                key={image.url}
                src={image.url}
                alt={image.alt}
                fill
                sizes="100vw"
                priority
                draggable={false}
                className="object-contain"
              />
            </div>

            {images.length > 1 && (
              <>
                <ArrowButton side="left" onClick={() => goTo(index - 1)} />
                <ArrowButton side="right" onClick={() => goTo(index + 1)} />
              </>
            )}
          </div>

          {images.length > 1 && (
            <div className="border-t border-ivory/10 px-4 py-4 md:px-8">
              <ul className="scrollbar-none flex justify-center gap-3 overflow-x-auto">
                {images.map((entry, entryIndex) => (
                  <li key={entry.url}>
                    <button
                      type="button"
                      onClick={() => onIndexChange(entryIndex)}
                      aria-label={`View image ${entryIndex + 1}`}
                      aria-current={entryIndex === index}
                      className={cn(
                        'relative block h-16 w-13 overflow-hidden border transition-all duration-300 md:h-20 md:w-16',
                        entryIndex === index
                          ? 'border-ivory opacity-100'
                          : 'border-transparent opacity-45 hover:opacity-80',
                      )}
                    >
                      <Image
                        src={entry.url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-center text-[0.625rem] uppercase tracking-[0.16em] text-ivory/35">
                Scroll or pinch to zoom · Drag to pan · ← → to browse
              </p>
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  )
}

function ViewerButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center text-ivory/70 transition-colors hover:text-ivory disabled:opacity-25"
    >
      {children}
    </button>
  )
}

function ArrowButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous image' : 'Next image'}
      className={cn(
        'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center text-ivory/60 transition-colors hover:text-ivory',
        side === 'left' ? 'left-2 md:left-6' : 'right-2 md:right-6',
      )}
    >
      <Icon className="h-7 w-7" strokeWidth={1} />
    </button>
  )
}
