'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogPortal = DialogPrimitive.Portal
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px]',
        'data-[state=open]:animate-[overlay-in_320ms_var(--ease-luxe)]',
        'data-[state=closed]:animate-[overlay-out_240ms_var(--ease-luxe)]',
        className,
      )}
      {...props}
    />
  )
})

/**
 * One primitive covers every overlay in the store: centred modals (quick view),
 * edge drawers (cart, filters, mobile navigation) and full-bleed surfaces
 * (search, the fullscreen image viewer). Radix handles focus trapping, scroll
 * locking, `aria-modal` and Escape for all of them.
 */
const contentVariants = cva(
  'fixed z-50 flex flex-col bg-ivory shadow-[0_24px_80px_-24px_rgba(18,17,15,0.35)] focus:outline-none',
  {
    variants: {
      side: {
        right:
          'inset-y-0 right-0 h-full w-full max-w-[27rem] data-[state=open]:animate-[slide-in-right_420ms_var(--ease-luxe)] data-[state=closed]:animate-[slide-out-right_320ms_var(--ease-luxe)]',
        left:
          'inset-y-0 left-0 h-full w-full max-w-[24rem] data-[state=open]:animate-[slide-in-left_420ms_var(--ease-luxe)] data-[state=closed]:animate-[slide-out-left_320ms_var(--ease-luxe)]',
        bottom:
          'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[4px] data-[state=open]:animate-[slide-in-bottom_400ms_var(--ease-luxe)] data-[state=closed]:animate-[slide-out-bottom_300ms_var(--ease-luxe)]',
        top: 'inset-x-0 top-0 data-[state=open]:animate-[slide-in-top_380ms_var(--ease-luxe)] data-[state=closed]:animate-[slide-out-top_260ms_var(--ease-luxe)]',
        center:
          'left-1/2 top-1/2 w-[calc(100%-2rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 max-h-[90dvh] data-[state=open]:animate-[modal-in_420ms_var(--ease-luxe)] data-[state=closed]:animate-[modal-out_260ms_var(--ease-luxe)]',
        full: 'inset-0 bg-ink data-[state=open]:animate-[overlay-in_320ms_var(--ease-luxe)] data-[state=closed]:animate-[overlay-out_240ms_var(--ease-luxe)]',
      },
    },
    defaultVariants: { side: 'right' },
  },
)

export interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof contentVariants> {
  /** Renders the default close affordance in the corner. */
  showClose?: boolean
  closeLabel?: string
  overlayClassName?: string
}

export const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  { className, children, side, showClose = true, closeLabel = 'Close', overlayClassName, ...props },
  ref,
) {
  return (
    <DialogPortal>
      <DialogOverlay className={overlayClassName} />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(contentVariants({ side }), className)}
        {...props}
      >
        {children}
        {showClose && (
          <DialogPrimitive.Close
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center text-charcoal/85 transition-colors duration-200 hover:text-charcoal"
            aria-label={closeLabel}
          >
            <X className="h-4.5 w-4.5" strokeWidth={1.25} />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})

export function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between border-b border-line px-6 py-5',
        className,
      )}
      {...props}
    />
  )
}

export function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-t border-line px-6 py-5', className)}
      {...props}
    />
  )
}
