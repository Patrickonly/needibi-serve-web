import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { cva } from 'class-variance-authority'
import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useTxNode } from '@/lib/phrases'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold tracking-[-0.005em] transition-[background,color,box-shadow,transform,border-color] duration-200 ease-out select-none disabled:cursor-not-allowed disabled:pointer-events-none aria-disabled:opacity-50 hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
  {
    variants: {
      variant: {
        // exactly one of these per card / section
        primary: 'border border-action-600 bg-action-600 text-white font-bold shadow-[0_8px_18px_rgb(42_77_161/0.24)] hover:bg-action-700 hover:shadow-[0_11px_22px_rgb(42_77_161/0.32)]',
        gold: 'bg-brand-yellow text-[#0b1f3a] font-extrabold shadow-[0_4px_10px_rgb(253_213_70/0.25)] hover:brightness-105 hover:shadow-[0_7px_16px_rgb(253_213_70/0.35)]',
        'gold-soft': 'border border-brand-yellow/70 bg-brand-yellow-soft text-brand-yellow-fg font-bold hover:bg-brand-yellow/50 hover:shadow-[0_5px_12px_rgb(253_213_70/0.22)]',
        navy: 'border border-action-600 bg-action-600 text-white shadow-[0_8px_18px_rgb(42_77_161/0.24)] hover:bg-action-700 hover:shadow-[0_11px_22px_rgb(42_77_161/0.32)]',
        outline: 'border border-action-600 bg-white text-action-fg font-bold shadow-[0_4px_12px_rgb(42_77_161/0.1)] hover:bg-action-soft hover:shadow-[0_8px_18px_rgb(42_77_161/0.18)]',
        'outline-white': 'border border-white/70 text-white hover:bg-white/10',
        ghost: 'border border-action-500/25 bg-action-soft text-action-fg hover:border-action-500/55 hover:bg-action-100 hover:shadow-[0_8px_18px_rgb(42_77_161/0.18)]',
        tertiary: 'border border-action-500/25 bg-action-soft px-3 text-action-fg hover:border-action-500/55 hover:bg-action-100 hover:shadow-[0_8px_18px_rgb(42_77_161/0.18)]',
        // Soft-filled companion to `outline`: same height and border weight, tinted
        // fill. Used for the secondary action on a card so the pair reads as a set.
        soft: 'border border-brand-yellow/70 bg-brand-yellow-soft text-brand-yellow-fg font-bold shadow-[0_6px_14px_rgb(253_213_70/0.2)] hover:bg-brand-yellow hover:border-brand-yellow hover:text-primary-900 hover:shadow-[0_9px_20px_rgb(253_213_70/0.3)]',
        surface: 'border border-border bg-white text-text shadow-[0_4px_12px_rgb(16_24_40/0.08)] hover:border-action-500/50 hover:bg-action-soft hover:text-action-fg hover:shadow-[0_8px_18px_rgb(42_79_181/0.18)]',
        'ghost-white': 'border border-white/25 bg-white/10 text-white/90 hover:bg-white/20 hover:text-white',
        link: 'border border-action-500/25 bg-action-soft px-3 h-9 text-action-fg underline-offset-4 hover:border-action-500/55 hover:bg-action-100 hover:shadow-[0_8px_18px_rgb(42_77_161/0.18)]',
        danger: 'bg-danger-600 text-white shadow-[0_4px_10px_rgb(22_59_114/0.2)] hover:bg-danger-700',
        'danger-outline': 'border border-danger-600/45 bg-surface text-danger-fg font-bold hover:border-danger-600 hover:bg-danger-100',
        trust: 'border border-action-600 bg-action-600 text-white shadow-[0_8px_18px_rgb(42_77_161/0.24)] hover:bg-action-700 hover:shadow-[0_11px_22px_rgb(42_77_161/0.32)]',
        subtle: 'border border-border bg-white text-text shadow-[0_4px_12px_rgb(16_24_40/0.06)] hover:border-action-500/45 hover:bg-action-soft',
      },
      size: {
        xs: 'h-8 px-2.5 text-xs',
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-7 text-base',
        icon: 'h-11 w-11 p-0',
        'icon-sm': 'h-9 w-9 p-0',
        card: 'min-h-12 px-3 py-2.5 text-sm',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'outline', size: 'md' },
  },
)

export const Button = forwardRef(function Button(
  { className, variant, size, block, loading, to, href, children, disabled, type = 'button', ...props },
  ref,
) {
  const txNode = useTxNode()
  const cls = cn(buttonVariants({ variant, size, block }), className)
  const content = (
    <>
      {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
      {txNode(children)}
    </>
  )
  if (to) {
    return (
      <Link ref={ref} to={to} className={cls} {...props}>
        {content}
      </Link>
    )
  }
  if (href) {
    return (
      <a ref={ref} href={href} className={cls} {...props}>
        {content}
      </a>
    )
  }
  return (
    <button ref={ref} type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  )
})

/** Icon-only button: always has an aria-label, optional count. */
export const IconButton = forwardRef(function IconButton({ label, count, active, className, size = 'icon-sm', variant = 'ghost', children, ...props }, ref) {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      aria-label={count != null ? `${label} (${count})` : label}
      aria-pressed={active ?? undefined}
      title={label}
      className={cn(count != null && 'w-auto gap-1 px-2', className)}
      {...props}
    >
      {children}
      {count != null && <span className="tabular text-xs font-medium text-muted">{count}</span>}
    </Button>
  )
})
