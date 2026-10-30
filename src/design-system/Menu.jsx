import * as DM from '@radix-ui/react-dropdown-menu'
import * as P from '@radix-ui/react-popover'
import * as T from '@radix-ui/react-tooltip'
import * as RT from '@radix-ui/react-tabs'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTxNode } from '@/lib/phrases'

// ---------------------------------------------------------------- dropdown menu
export const Menu = DM.Root
export const MenuTrigger = DM.Trigger

export function MenuContent({ children, align = 'end', className, ...props }) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={6}
        className={cn('z-50 min-w-[210px] rounded-xl border border-border bg-surface p-1.5 text-sm shadow-modal animate-pop', className)}
        {...props}
      >
        {children}
      </DM.Content>
    </DM.Portal>
  )
}

export function MenuItem({ children, icon, tone, className, ...props }) {
  const txNode = useTxNode()
  return (
    <DM.Item
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 outline-none data-[highlighted]:bg-grey-100 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        tone === 'danger' ? 'text-danger-fg' : 'text-text',
        className,
      )}
      {...props}
    >
      {icon && <span className="flex w-4 justify-center text-muted [&>svg]:size-4">{icon}</span>}
      <span className="flex-1">{txNode(children)}</span>
    </DM.Item>
  )
}

export function MenuCheckItem({ checked, onCheckedChange, children }) {
  return (
    <DM.CheckboxItem
      checked={checked}
      onCheckedChange={onCheckedChange}
      onSelect={(e) => e.preventDefault()}
      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 outline-none data-[highlighted]:bg-surface-2"
    >
      <span className="flex h-4 w-4 items-center justify-center rounded border border-border-strong">
        <DM.ItemIndicator>
          <Check size={12} strokeWidth={3} />
        </DM.ItemIndicator>
      </span>
      {children}
    </DM.CheckboxItem>
  )
}

export function MenuLabel({ children }) {
  return <DM.Label className="px-2.5 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">{children}</DM.Label>
}

export function MenuSeparator() {
  return <DM.Separator className="my-1 h-px bg-border" />
}

// ---------------------------------------------------------------- popover
export const Popover = P.Root
export const PopoverTrigger = P.Trigger
export const PopoverAnchor = P.Anchor
export const PopoverClose = P.Close
export function PopoverContent({ children, className, align = 'start', ...props }) {
  return (
    <P.Portal>
      <P.Content align={align} sideOffset={8} className={cn('z-50 rounded-xl border border-border bg-surface shadow-modal animate-pop focus:outline-none', className)} {...props}>
        {children}
      </P.Content>
    </P.Portal>
  )
}

// ---------------------------------------------------------------- tooltip
export const TooltipProvider = T.Provider
export function Tooltip({ content, children, side = 'top' }) {
  if (!content) return children
  return (
    <T.Root delayDuration={250}>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content side={side} sideOffset={6} className="z-[60] max-w-xs rounded-lg bg-primary-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-hover animate-fade-in dark:bg-surface-2 dark:text-text">
          {content}
          <T.Arrow className="fill-primary-900 dark:fill-[var(--surface-2)]" />
        </T.Content>
      </T.Portal>
    </T.Root>
  )
}

/** Disabled-with-reason: keeps the disabled control focusable so the tooltip explains why. */
export function DisabledReason({ reason, children, className }) {
  return (
    <Tooltip content={reason}>
      <span tabIndex={0} className={cn('inline-flex', className)} aria-label={reason}>
        {children}
      </span>
    </Tooltip>
  )
}

// ---------------------------------------------------------------- tabs
export function Tabs({ value, onValueChange, defaultValue, children, className }) {
  return (
    <RT.Root value={value} onValueChange={onValueChange} defaultValue={defaultValue} className={className}>
      {children}
    </RT.Root>
  )
}
export function TabList({ children, className, label }) {
  return (
    <RT.List aria-label={label} className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-border', className)}>
      {children}
    </RT.List>
  )
}
export function Tab({ value, children, count, className }) {
  const txNode = useTxNode()
  return (
    <RT.Trigger
      value={value}
      className={cn(
        'relative inline-flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-semibold text-primary-900 transition-colors hover:bg-action-soft hover:text-action-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-500 focus-visible:ring-inset data-[state=active]:text-action-700',
        'after:absolute after:inset-x-2 after:bottom-[-1px] after:h-[2.5px] after:rounded-full after:bg-transparent after:transition-colors data-[state=active]:after:bg-brand-yellow',
        className,
      )}
    >
      {txNode(children)}
      {count != null && <span className="tabular rounded-full bg-grey-100 px-1.5 py-0.5 text-xs font-semibold text-grey-fg">{count}</span>}
    </RT.Trigger>
  )
}
export const TabPanel = ({ className, ...props }) => <RT.Content className={cn('focus:outline-none', className)} {...props} />
