import { useEffect, useState } from 'react'
import { CircleCheck, CircleAlert, Info, X, WifiOff, RefreshCw, SearchX, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTx } from '@/lib/phrases'
import { useToasts } from '@/lib/store'
import { Button } from './Button'

export function Skeleton({ className, ...props }) {
  return (
    <div className={cn('skeleton rounded-md bg-grey-100', className)} aria-hidden="true" {...props} />
  )
}

export function CardSkeleton({ className }) {
  return (
    <div className={cn('overflow-hidden rounded-card border border-border bg-surface', className)} aria-hidden="true">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    </div>
  )
}

/** Friendly brand illustration for empty states (no external assets). */
function EmptyArt({ kind = 'box' }) {
  return (
    <svg width="132" height="104" viewBox="0 0 132 104" aria-hidden="true" className="mx-auto">
      <circle cx="66" cy="54" r="46" fill="var(--primary-100)" />
      <circle cx="104" cy="22" r="9" fill="none" stroke="var(--action-500)" strokeWidth="3" />
      <circle cx="22" cy="84" r="5" fill="var(--action-500)" opacity=".5" />
      {kind === 'search' ? (
        <>
          <circle cx="60" cy="50" r="20" fill="var(--surface)" stroke="var(--primary-500)" strokeWidth="4" />
          <path d="M75 65l14 14" stroke="var(--primary-500)" strokeWidth="6" strokeLinecap="round" />
          <path d="M52 50h16" stroke="var(--action-500)" strokeWidth="4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M36 44l30-14 30 14v30L66 88 36 74z" fill="var(--surface)" stroke="var(--primary-500)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M36 44l30 14 30-14M66 58v30" fill="none" stroke="var(--primary-500)" strokeWidth="3" strokeLinejoin="round" />
          <path d="M51 37l30 14" stroke="var(--action-500)" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

export function EmptyState({ title, description, action, secondary, art = 'box', className, compact }) {
  const tx = useTx()
  return (
    <div className={cn('flex flex-col items-center px-6 text-center', compact ? 'py-8' : 'py-14', className)}>
      {!compact && <EmptyArt kind={art} />}
      <h3 className="mt-4 text-lg font-semibold text-text">{tx(title)}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{tx(description)}</p>}
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  )
}

export function NoResults({ onClear, label = 'No results match these filters' }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <SearchX size={36} className="text-muted" aria-hidden="true" />
      <p className="mt-3 font-semibold text-text">{label}</p>
      {onClear && (
        <Button variant="link" className="mt-1" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', error, onRetry, className }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-100 text-danger-fg">
        <TriangleAlert size={22} aria-hidden="true" />
      </span>
      <p className="mt-3 font-semibold text-text">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted">{error?.message ?? 'Please check your connection and try again.'}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw size={14} aria-hidden="true" /> Retry
        </Button>
      )}
    </div>
  )
}

export function ProgressBar({ value, max = 100, tone = 'trust', className, label, size = 'md' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const bar = { trust: 'bg-trust-600', serve: 'bg-action-500', info: 'bg-info-600', navy: 'bg-primary-900 dark:bg-primary', danger: 'bg-danger-600' }[tone]
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-grey-100', size === 'sm' ? 'h-1.5' : 'h-2', className)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <div className={cn('h-full rounded-full transition-[width] duration-500 ease-out', bar)} style={{ width: `${pct}%` }} />
    </div>
  )
}

/** Thin indeterminate bar shown while the next page loads. */
export function TopProgress({ active }) {
  if (!active) return null
  return (
    <div className="absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-action-100" role="progressbar" aria-label="Loading">
      <div className="h-full w-2/5 animate-progress bg-action-500" />
    </div>
  )
}

export function Alert({ tone = 'info', title: rawTitle, children, action, icon, className }) {
  const tx = useTx()
  const title = tx(rawTitle)
  const Icon = icon ?? (tone === 'trust' ? CircleCheck : tone === 'danger' || tone === 'warn' ? CircleAlert : Info)
  const cls = { info: 'bg-info-100 text-info-fg', trust: 'bg-trust-100 text-trust-fg', warn: 'bg-warn-100 text-warn-fg', danger: 'bg-danger-100 text-danger-fg', serve: 'bg-action-100 text-action-fg', navy: 'bg-primary-100 text-primary' }[tone]
  return (
    <div className={cn('flex flex-wrap items-start gap-x-3 gap-y-2.5 rounded-card px-4 py-3 sm:flex-nowrap', cls, className)} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'text-text/85')}>{children}</div>}
      </div>
      {action && <div className="basis-full pl-[30px] sm:basis-auto sm:shrink-0 sm:pl-0">{action}</div>}
    </div>
  )
}

export function OfflineBanner() {
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)
  useEffect(() => {
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  if (!offline) return null
  return (
    <div className="sticky top-0 z-[70] flex items-center justify-center gap-2 bg-warn-700 px-4 py-2 text-sm font-semibold text-white" role="status">
      <WifiOff size={16} aria-hidden="true" /> You're offline. We'll sync when you're back.
    </div>
  )
}

export function Toaster() {
  const { toasts, dismiss } = useToasts()
  return (
    <div aria-live="polite" aria-atomic="false" className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-4 md:bottom-6 md:items-end md:pr-6">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card bg-primary-900 px-4 py-3 text-white shadow-modal animate-pop dark:bg-surface-2 dark:text-text">
          {t.tone === 'danger' ? <CircleAlert size={18} className="mt-0.5 shrink-0 text-danger-fg" /> : t.tone === 'info' ? <Info size={18} className="mt-0.5 shrink-0 text-info-fg" /> : <CircleCheck size={18} className="mt-0.5 shrink-0 text-trust-fg" />}
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold">{t.message}</p>
            {t.description && <p className="mt-0.5 text-white/75 dark:text-muted">{t.description}</p>}
          </div>
          {t.action && (
            <button
              type="button"
              className="shrink-0 text-sm font-bold text-action-300 hover:underline"
              onClick={() => {
                t.action.onClick()
                dismiss(t.id)
              }}
            >
              {t.action.label}
            </button>
          )}
          <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="shrink-0 rounded p-0.5 text-white/70 hover:text-white dark:text-muted">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
