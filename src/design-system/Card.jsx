import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTx } from '@/lib/phrases'

export function Card({ className, children, as: As = 'div', padded = true, ...props }) {
  return (
    <As className={cn('rounded-[20px] border border-border/90 border-t-[3px] border-t-brand-yellow bg-surface shadow-card', padded && 'p-5 sm:p-6', className)} {...props}>
      {children}
    </As>
  )
}

export function CardTitle({ children, action, className, sub }) {
  const tx = useTx()
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="font-display text-[17px] font-bold tracking-[-0.02em] text-text">{tx(children)}</h2>
        {sub && <p className="mt-0.5 text-sm text-muted">{tx(sub)}</p>}
      </div>
      {action}
    </div>
  )
}

/** Section header on public pages: title + optional "See all →" link. */
export function SectionHeader({ title, subtitle, to, linkLabel = 'See all', children, className, id }) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-text sm:text-[26px]">
          <span className="h-1 w-7 shrink-0 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" /> {title}
        </h2>
        {subtitle && <p className="mt-1 pl-10 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {children}
        {to && (
          <Link to={to} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-action-500/40 px-4 text-sm font-semibold text-action-fg transition hover:bg-action-soft">
            {linkLabel} <ArrowRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  )
}

const SPARK_COLOR = { navy: 'var(--action-600)', serve: 'var(--action-600)', trust: 'var(--trust-600)', info: 'var(--info-600)', warn: 'var(--warn-500)', danger: 'var(--danger-600)' }

/** Tiny decorative trend line, stable per label so it doesn't jump between renders. */
function Sparkline({ seed, color, className }) {
  const base = [...String(seed)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 7)
  const pts = Array.from({ length: 9 }, (_, i) => 26 - (i * 1.6 + (((base + 11) * (i + 3) * 17) % 997) % 10))
  const line = pts.map((y, i) => `${i * 10},${Math.max(3, y).toFixed(1)}`).join(' ')
  return (
    <svg width="84" height="32" viewBox="0 0 80 32" className={cn('shrink-0', className)} aria-hidden="true">
      <polygon points={`0,32 ${line} 80,32`} fill={color} opacity="0.1" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function KpiTile({ label: rawLabel, value, icon, delta, tone = 'navy', hint: rawHint, to, className }) {
  const tx = useTx()
  const label = tx(rawLabel)
  const hint = tx(rawHint)
  const tileTone = { navy: 'tile-navy', serve: 'tile-blue', trust: 'tile-green', info: 'tile-blue', warn: 'tile-amber', danger: 'tile-pink' }[tone] ?? 'tile-navy'
  const long = String(value ?? '').length > 11
  const body = (
    <>
      {icon && <span className="table-summary-card-icon [&>svg]:size-[19px]" aria-hidden="true">{icon}</span>}
      {to && <ArrowUpRight size={18} className="table-summary-card-arrow" aria-hidden="true" />}
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-muted" title={label}>{label}</p>
        <p className={cn('table-summary-card-value tabular mt-1 whitespace-nowrap font-bold leading-tight tracking-tight', long ? 'text-lg' : 'text-[24px]')}>{value}</p>
        {delta && (
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-trust-fg">
            <TrendingUp size={12} aria-hidden="true" /> {delta}
          </span>
        )}
        {hint && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
      </div>
    </>
  )
  const cls = cn('table-summary-card table-summary-card-stack', tileTone, className)
  return to ? (
    <Link to={to} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export function DefinitionList({ items, className, cols = 2 }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-3', cols === 2 ? 'sm:grid-cols-2' : cols === 3 ? 'sm:grid-cols-3' : '', className)}>
      {items.filter(Boolean).map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</dt>
          <dd className="mt-0.5 text-sm font-medium text-text">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
