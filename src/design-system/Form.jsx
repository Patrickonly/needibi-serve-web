import { forwardRef, useId } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTx, useTxNode } from '@/lib/phrases'

const fieldBase =
  'w-full rounded-[10px] border border-border-strong bg-surface text-text shadow-[0_1px_2px_rgb(16_24_40/0.04)] placeholder:text-muted/75 transition-[border-color,box-shadow] hover:border-text/25 focus-visible:outline-none focus-visible:border-action-500 focus-visible:ring-4 focus-visible:ring-action-500/15 disabled:bg-surface-2 disabled:text-muted aria-[invalid=true]:border-danger-600 aria-[invalid=true]:focus-visible:ring-danger-600/15'

export const Input = forwardRef(function Input({ className, size = 'md', leading, trailing, ...props }, ref) {
  const h = size === 'lg' ? 'h-12 text-base' : size === 'sm' ? 'h-9 text-sm' : 'h-11 text-[15px]'
  if (leading || trailing) {
    return (
      <div className={cn('relative flex items-center', className)}>
        {leading && <span className="pointer-events-none absolute left-3 flex text-muted">{leading}</span>}
        <input ref={ref} className={cn(fieldBase, h, 'px-3', leading && 'pl-10', trailing && 'pr-10')} {...props} />
        {trailing && <span className="absolute right-2 flex">{trailing}</span>}
      </div>
    )
  }
  return <input ref={ref} className={cn(fieldBase, h, 'px-3', className)} {...props} />
})

export const Textarea = forwardRef(function Textarea({ className, rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn(fieldBase, 'px-3 py-2.5 text-[15px] leading-relaxed', className)} {...props} />
})

export const Select = forwardRef(function Select({ className, size = 'md', children, ...props }, ref) {
  const h = size === 'sm' ? 'h-9 text-sm' : 'h-11 text-[15px]'
  return (
    <div className={cn('relative', className)}>
      <select ref={ref} className={cn(fieldBase, h, 'appearance-none pl-3 pr-9')} {...props}>
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
    </div>
  )
})

export function Label({ htmlFor, children, optional, className }) {
  return (
    <label htmlFor={htmlFor} className={cn('mb-1.5 block text-sm font-semibold text-text', className)}>
      {children}
      {optional && <span className="ml-1 font-normal text-muted">(optional)</span>}
    </label>
  )
}

/** Field wrapper: label + control + hint/error, wired up with ids for a11y. */
export function Field({ label: rawLabel, hint: rawHint, error, optional, children, className, id: idProp }) {
  const tx = useTx()
  const label = tx(rawLabel)
  const hint = tx(rawHint)
  const auto = useId()
  const id = idProp ?? auto
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined
  const control = typeof children === 'function' ? children({ id, 'aria-describedby': describedBy, 'aria-invalid': !!error || undefined }) : children
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} optional={optional}>
          {label}
        </Label>
      )}
      {control}
      {error ? (
        <p id={`${id}-err`} className="mt-1.5 text-sm font-medium text-danger-fg" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function Checkbox({ checked, onChange, label, description, className, indeterminate, ...props }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          className="peer h-5 w-5 cursor-pointer appearance-none rounded-[6px] border border-border-strong bg-surface transition-colors checked:border-action-600 checked:bg-action-600 dark:checked:border-action-500 dark:checked:bg-action-500"
          {...(checked === undefined && props.defaultChecked !== undefined ? {} : { checked: !!checked })}
          ref={(el) => el && (el.indeterminate = !!indeterminate)}
          onChange={(e) => onChange?.(e.target.checked, e)}
          {...props}
        />
        <Check size={14} strokeWidth={3} className="pointer-events-none absolute text-white opacity-0 peer-checked:opacity-100" aria-hidden="true" />
        {indeterminate && !checked && <span className="pointer-events-none absolute h-0.5 w-2.5 rounded bg-primary-900 dark:bg-primary" />}
      </span>
      {(label || description) && (
        <span className="text-sm">
          {label && <span className="font-medium text-text">{label}</span>}
          {description && <span className="block text-muted">{description}</span>}
        </span>
      )}
    </label>
  )
}

export function Switch({ checked, onChange, label, description, disabled, className, id: idProp }) {
  const auto = useId()
  const id = idProp ?? auto
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      {(label || description) && (
        <label htmlFor={id} className="min-w-0 cursor-pointer text-sm">
          <span className="font-semibold text-text">{label}</span>
          {description && <span className="block text-muted">{description}</span>}
        </label>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
          checked ? 'bg-trust-600' : 'bg-border-strong',
        )}
      >
        <span className={cn('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-6' : 'translate-x-1')} />
        <span className="sr-only">{label}</span>
      </button>
    </div>
  )
}

/** Large selectable cards (role choice, Single/Bundle, payment method…). */
export function RadioCards({ value, onChange, options, columns = 2, name, className }) {
  return (
    <div role="radiogroup" className={cn('grid gap-3', columns === 1 ? 'grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : columns === 4 ? 'grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2', className)}>
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            name={name}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex min-h-[88px] items-center gap-3 rounded-2xl border bg-surface p-4 text-left shadow-[0_1px_2px_rgb(16_24_40/0.04)] transition-all disabled:opacity-50',
              active ? 'border-action-500 ring-4 ring-action-500/15 bg-action-soft/60' : 'border-border hover:border-border-strong',
            )}
          >
            {o.icon && <span className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', active ? 'bg-action-500 text-white' : 'bg-primary-100 text-primary')}>{o.icon}</span>}
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-text">{o.label}</span>
              {o.description && <span className="mt-0.5 block text-sm text-muted">{o.description}</span>}
            </span>
            <span className={cn('mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-action-500 bg-action-500' : 'border-border-strong')}>
              {active && <span className="h-2 w-2 rounded-full bg-white" />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Segmented control (pill toggle). */
export function Segmented({ value, onChange, options, size = 'md', className, label }) {
  const tx = useTx()
  return (
    <div role="radiogroup" aria-label={label} className={cn('no-scrollbar inline-flex max-w-full overflow-x-auto rounded-full border border-border bg-surface-2 p-1 shadow-[inset_0_1px_2px_rgb(16_24_40/0.04)]', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors',
            size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
            value === o.value ? 'bg-surface text-text shadow-[0_1px_3px_rgb(16_24_40/0.12)] ring-1 ring-border' : 'text-muted hover:text-text',
          )}
        >
          {o.icon}
          {tx(o.label)}
        </button>
      ))}
    </div>
  )
}

/** Filter chip (toggle pill). */
export function Chip({ active, onClick, children, icon, className, ...props }) {
  const txNode = useTxNode()
  return (
    <button
      type="button"
      aria-pressed={!!active}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors',
        active ? 'border-action-600 bg-action-600 text-white shadow-[0_2px_8px_-2px_rgb(42_79_181/0.45)]' : 'border-border bg-surface text-text hover:border-border-strong hover:bg-surface-2',
        className,
      )}
      {...props}
    >
      {icon}
      {txNode(children)}
    </button>
  )
}
