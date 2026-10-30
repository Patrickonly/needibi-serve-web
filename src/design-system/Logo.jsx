import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

// Official Needibi Serve mark, redrawn as SVG from /public/brand/needibi-mark.png so it stays sharp at any size.
// Brand colours come from tokens (--brand-blue / --brand-yellow).
export function LogoMark({ size = 32, className }) {
  return (
    <svg width={size} height={Math.round(size * 0.62)} viewBox="20 31 102 63" className={cn('shrink-0', className)} aria-hidden="true">
      <path fill="var(--brand-blue)" d="M90 34 L118.8 34 L107.5 57 L100 55.6 L88 53.4 L78 51.4 L68.6 51 L61.5 59.5 L58 59.6 Q49 58.6 43 56.6 L46 51 L52.5 42.5 Q55.5 39 60 39 L80.5 41.6 L85.5 41.6 Z" />
      <path fill="var(--brand-yellow)" d="M35 65 L77 71.6 L80.4 66 Q82 62 85.5 62 L104.6 64.8 L94.5 81.5 Q91.5 86.6 86 86.6 L62 82.6 L59.4 82.4 L56.4 91.6 L22 91.6 Z" />
    </svg>
  )
}

/** Stacked italic wordmark — "Needibi" yellow, "Serve" blue — as in the official logo. */
export function Wordmark({ onDark, size = 'md', horizontal = false, className }) {
  const text = size === 'lg' ? 'text-[30px]' : size === 'sm' ? 'text-[13px]' : 'text-[17px]'
  return (
    <span className={cn(horizontal ? 'inline-flex items-center gap-1.5' : 'flex flex-col leading-[0.95]', 'font-display font-black italic tracking-tight', text, className)}>
      <span style={{ color: 'var(--brand-yellow-text)' }}>Needibi</span>
      <span style={{ color: onDark ? '#ffffff' : 'var(--wordmark-serve)' }}>Serve</span>
    </span>
  )
}

export function Logo({ onDark = false, compact = false, horizontal = false, to = '/', className, size = 'md' }) {
  const mark = size === 'lg' ? 72 : size === 'sm' ? 36 : 46
  return (
    <Link to={to} className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-md', className)} aria-label="Needibi Serve home">
      <LogoMark size={mark} />
      {!compact && <Wordmark onDark={onDark} horizontal={horizontal} size={size} />}
    </Link>
  )
}
