'use client'

import * as React from 'react'
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { DisclosureIcon } from '@/components/ui/disclosure-icon'
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
        <DisclosureIcon className="transition-colors group-hover:text-gold" />
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
