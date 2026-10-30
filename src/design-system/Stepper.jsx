import { Check, Star, Send, ShieldCheck, Shuffle, MessagesSquare, Wrench, Wallet, ScrollText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'

export const JOURNEY = [
  { key: 'submit', icon: Send, needer: 'Describe what you need — text, photo, video or voice.', partner: 'Needers post requests in your categories and areas.' },
  { key: 'validate', icon: ShieldCheck, needer: 'A quick policy check keeps the marketplace safe.', partner: 'Only approved, policy-checked requests reach you.' },
  { key: 'match', icon: Shuffle, needer: 'We find verified Partners near you.', partner: 'You get matched by fit, distance and reliability.' },
  { key: 'respond', icon: MessagesSquare, needer: 'Compare offers — accept or decline.', partner: 'Serve with a clear price, scope and timeline.' },
  { key: 'execute', icon: Wrench, needer: 'Track the work as it happens.', partner: 'Do the job and upload evidence.' },
  { key: 'pay', icon: Wallet, needer: 'Escrow is released only when you confirm.', partner: 'Get paid from escrow once the Needer confirms.' },
  { key: 'close', icon: ScrollText, needer: 'Review and keep a full audit trail.', partner: 'Build your reputation with verified reviews.' },
]

/** 7-step journey used on Home, How it works and every tracker. */
export function JourneyStepper({ current = -1, audience = 'needer', variant = 'full', className }) {
  const { t } = useTranslation()
  if (variant === 'compact') {
    return (
      <ol className={cn('flex items-center gap-1', className)} aria-label="Progress">
        {JOURNEY.map((s, i) => {
          const done = i < current
          const active = i === current
          return (
            <li key={s.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5" aria-current={active ? 'step' : undefined}>
              <span className={cn('h-1.5 w-full rounded-full', done ? 'bg-trust-600' : active ? 'bg-action-500' : 'bg-grey-100')} />
              <span className={cn('hidden truncate text-[11px] font-semibold sm:block', active ? 'text-text' : 'text-muted')}>{t(`journey.${s.key}`)}</span>
            </li>
          )
        })}
      </ol>
    )
  }
  if (variant === 'pastel') {
    const tones = ['pastel-blue', 'pastel-yellow', 'pastel-green', 'pastel-pink']
    return (
      <ol className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-4', className)}>
        {JOURNEY.map((s, i) => {
          const Icon = s.icon
          return (
            <li key={s.key} className={cn('pastel-card animate-fade-up flex h-full flex-col', tones[i % tones.length])} style={{ animationDelay: `${i * 55}ms` }}>
              <span className="pastel-icon"><Icon size={20} strokeWidth={2.2} /></span>
              <span className="mt-6 block text-xs font-semibold uppercase tracking-[0.16em] text-text/60">Step {String(i + 1).padStart(2, '0')}</span>
              <span className="mt-1 block text-lg font-semibold text-text">{t(`journey.${s.key}`)}</span>
              <span className="mt-2 block text-[15px] leading-7 text-text/80">{s[audience]}</span>
            </li>
          )
        })}
      </ol>
    )
  }
  return (
    <ol className={cn('grid gap-5 sm:grid-cols-2 lg:grid-cols-7 lg:gap-3', className)}>
      {JOURNEY.map((s, i) => {
        const Icon = s.icon
        const done = i < current
        const active = i === current
        return (
          <li key={s.key} className="animate-fade-up group relative flex gap-3 rounded-2xl border border-transparent p-2 transition duration-300 hover:border-border hover:bg-surface-2 lg:flex-col lg:items-center lg:text-center" style={{ animationDelay: `${i * 55}ms` }} aria-current={active ? 'step' : undefined}>
            {i < JOURNEY.length - 1 && <span className="absolute left-[60%] right-[-40%] top-7 hidden h-px bg-gradient-to-r from-border via-action-300 to-border lg:block" aria-hidden="true" />}
            <span
              className={cn(
                'relative z-[1] flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-card',
                done ? 'border-trust-600 bg-trust-600 text-white' : active ? 'border-action-500 bg-action-500 text-white' : 'border-border bg-surface text-primary',
              )}
            >
              {done ? <Check size={22} strokeWidth={2.5} /> : <Icon size={22} />}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-extrabold uppercase tracking-[0.16em] text-action-fg">Step {String(i + 1).padStart(2, '0')}</span>
              <span className="mt-0.5 block font-bold text-text">{t(`journey.${s.key}`)}</span>
              <span className="mt-1 block text-sm leading-5 text-muted">{s[audience]}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** Generic lifecycle stepper (need / booking / ticket). */
export function LifecycleStepper({ steps, current, className }) {
  return (
    <ol className={cn('flex items-start', className)} aria-label="Lifecycle">
      {steps.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <li key={label} className="flex min-w-0 flex-1 items-start" aria-current={active ? 'step' : undefined}>
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="flex w-full items-center">
                <span className={cn('h-0.5 flex-1', i === 0 ? 'bg-transparent' : done || active ? 'bg-trust-600' : 'bg-border')} />
                <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold', done ? 'bg-trust-600 text-white' : active ? 'bg-action-500 text-white ring-4 ring-action-500/20' : 'bg-grey-100 text-grey-fg')}>
                  {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn('h-0.5 flex-1', i === steps.length - 1 ? 'bg-transparent' : done ? 'bg-trust-600' : 'bg-border')} />
              </div>
              <span className={cn('mt-1.5 px-0.5 text-[11px] font-semibold leading-tight sm:text-xs', active ? 'text-text' : 'text-muted')}>{label}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

/** Offers ●●○ 2 of 3 */
export function SlotMeter({ used, limit, className, showLabel = true }) {
  const full = used >= limit
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', className)} aria-label={`Offers: ${used} of ${limit} slots used`}>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: limit }, (_, i) => (
          <span key={i} className={cn('h-2.5 w-2.5 rounded-full', i < used ? (full ? 'bg-danger-600' : 'bg-action-500') : 'border border-border-strong bg-surface')} />
        ))}
      </span>
      {showLabel && (
        <span className={cn('tabular font-semibold', full ? 'text-danger-fg' : 'text-muted')}>
          {full ? 'Offers full' : `${used} of ${limit}`}
        </span>
      )}
    </span>
  )
}

export function Rating({ value, count, size = 14, className, showValue = true }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm', className)} aria-label={`Rated ${value} out of 5${count != null ? ` from ${count} reviews` : ''}`}>
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} size={size} className={i < Math.round(value) ? 'text-warn-500' : 'text-border-strong'} fill="currentColor" strokeWidth={0} />
        ))}
      </span>
      {showValue && <span className="tabular font-semibold text-text">{value.toFixed(1)}</span>}
      {count != null && <span className="tabular text-muted">({count})</span>}
    </span>
  )
}

export function StarInput({ value, onChange, size = 32 }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => onChange(n)} className="rounded p-0.5">
          <Star size={size} className={n <= value ? 'text-warn-500' : 'text-border-strong'} fill="currentColor" strokeWidth={0} />
        </button>
      ))}
    </div>
  )
}

export function ProgressRing({ value, max, size = 64, stroke = 7, label }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = max ? value / max : 0
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={label ?? `${value} of ${max}`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--grey-100)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--trust-600)" strokeWidth={stroke} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="absolute text-sm font-extrabold text-text tabular">
        {value}/{max}
      </span>
    </span>
  )
}
