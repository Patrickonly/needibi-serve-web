import { BadgeCheck, ShieldCheck, Repeat } from 'lucide-react'
import { cn } from '@/lib/cn'
import { statusMeta, URGENCY, PRIORITY } from '@/lib/status'
import { Icon } from './Icon'
import { useTx } from '@/lib/phrases'

export const TONES = {
  grey: 'bg-grey-100 text-grey-fg',
  info: 'bg-info-100 text-info-fg',
  warn: 'bg-warn-100 text-warn-fg',
  danger: 'bg-danger-100 text-danger-fg',
  trust: 'bg-trust-100 text-trust-fg',
  serve: 'bg-action-100 text-action-fg',
  navy: 'bg-primary-100 text-primary',
}
// Solid variants are used on top of media
const SOLID = {
  grey: 'bg-primary-900/80 text-white',
  info: 'bg-info-600 text-white',
  warn: 'bg-warn-700 text-white',
  danger: 'bg-danger-600 text-white',
  trust: 'bg-trust-600 text-white',
  serve: 'bg-action-500 text-white',
  navy: 'bg-primary-900 text-white',
}

export function Badge({ tone = 'grey', solid, icon, iconName, size = 'sm', className, children, ...props }) {
  const tx = useTx()
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full font-semibold leading-none whitespace-nowrap',
        size === 'xs' ? 'px-1.5 py-0.5 text-[11px]' : size === 'md' ? 'px-2.5 py-1.5 text-sm' : 'px-2 py-1 text-xs',
        solid ? SOLID[tone] : TONES[tone],
        className,
      )}
      {...props}
    >
      {icon}
      {iconName && <Icon name={iconName} size={size === 'md' ? 14 : 12} strokeWidth={2.25} />}
      <span className="truncate">{tx(children)}</span>
    </span>
  )
}

export function StatusBadge({ status, label, ...props }) {
  const m = statusMeta(status)
  const tx = useTx()
  return (
    <Badge tone={m.tone} iconName={m.icon} {...props}>
      {tx(label ?? m.label)}
    </Badge>
  )
}

export function UrgencyBadge({ urgency, solid, ...props }) {
  const m = URGENCY[urgency] ?? URGENCY.low
  return (
    <Badge tone={m.tone} iconName={m.icon} solid={solid} {...props}>
      {m.label}
    </Badge>
  )
}

export function PriorityBadge({ priority, ...props }) {
  const m = PRIORITY[priority] ?? PRIORITY.normal
  return (
    <Badge tone={m.tone} iconName={m.icon} {...props}>
      {m.label}
    </Badge>
  )
}

export function VerifiedBadge({ compact, className }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold text-trust-fg', className)} title="KYC-verified Partner">
      <BadgeCheck size={14} strokeWidth={2.25} aria-hidden="true" />
      {compact ? <span className="sr-only">Verified</span> : 'Verified'}
    </span>
  )
}

export function EscrowBadge({ className }) {
  return (
    <Badge tone="trust" icon={<ShieldCheck size={12} strokeWidth={2.25} aria-hidden="true" />} className={className}>
      Escrow protected
    </Badge>
  )
}

export function RecurringChip({ label = 'Recurring' }) {
  return (
    <Badge tone="navy" icon={<Repeat size={12} strokeWidth={2.25} aria-hidden="true" />}>
      {label}
    </Badge>
  )
}

/** NEED / BUNDLE / DEAL type labels — distinguishable at a glance in a mixed feed. */
export function KindLabel({ kind, count, className }) {
  const map = {
    need: { cls: 'bg-primary-900 text-white ring-1 ring-white/40', label: 'NEED' },
    bundle: { cls: 'bg-surface text-action-fg ring-2 ring-action-500', label: count ? `BUNDLE · ${count} items` : 'BUNDLE' },
    deal: { cls: 'bg-trust-600 text-white', label: 'DEAL' },
  }
  const m = map[kind] ?? map.need
  return <span className={cn('inline-flex items-center rounded-[4px] px-1.5 py-1 text-[10px] font-extrabold tracking-[0.08em] leading-none', m.cls, className)}>{m.label}</span>
}

export function LevelBadge({ level }) {
  const names = { 1: 'Level 1', 2: 'Level 2', 3: 'Top Partner' }
  return (
    <Badge tone={level === 3 ? 'serve' : 'navy'} iconName={level === 3 ? 'Sparkles' : 'BadgeCheck'} size="xs">
      {names[level] ?? `Level ${level}`}
    </Badge>
  )
}
