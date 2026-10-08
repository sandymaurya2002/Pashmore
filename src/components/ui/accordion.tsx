'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Accordion = AccordionPrimitive.Root

export const AccordionItem = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(function AccordionItem({ className, ...props }, ref) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      className={cn('border-b border-line', className)}
      {...props}
    />
  )
})

export const AccordionTrigger = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(function AccordionTrigger({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          'group flex flex-1 items-center justify-between gap-4 py-5 text-left',
          'text-[0.8125rem] uppercase tracking-[0.16em] text-charcoal',
          'transition-colors duration-300 hover:text-gold',
          className,
        )}
        {...props}
      >
        {children}
        <span aria-hidden className="relative h-4 w-4 shrink-0 text-taupe transition-colors group-hover:text-gold">
          <Plus
            className="absolute inset-0 h-4 w-4 transition-all duration-300 ease-[var(--ease-luxe)] group-data-[state=open]:rotate-90 group-data-[state=open]:opacity-0"
            strokeWidth={1.25}
          />
          <Minus
            className="absolute inset-0 h-4 w-4 rotate-90 opacity-0 transition-all duration-300 ease-[var(--ease-luxe)] group-data-[state=open]:rotate-0 group-data-[state=open]:opacity-100"
            strokeWidth={1.25}
          />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
})

export const AccordionContent = React.forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(function AccordionContent({ className, children, ...props }, ref) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      // Radix measures the panel and publishes the height on a CSS variable, so
      // the open/close animation is pure CSS — no JS layout loop, no shift.
      className="overflow-hidden data-[state=closed]:animate-[accordion-up_320ms_var(--ease-luxe)] data-[state=open]:animate-[accordion-down_320ms_var(--ease-luxe)]"
      {...props}
    >
      <div className={cn('pb-6 text-sm leading-relaxed text-mocha', className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  )
})
