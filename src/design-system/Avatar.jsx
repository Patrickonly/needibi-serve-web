import { cn } from '@/lib/cn'
import { initials } from '@/lib/format'

// Token-based avatar tones (no hard-coded colours); hue picks one deterministically.
const TONES = [
  'bg-primary-100 text-primary',
  'bg-action-100 text-action-fg',
  'bg-trust-100 text-trust-fg',
  'bg-info-100 text-info-fg',
  'bg-warn-100 text-warn-fg',
  'bg-primary-700 text-white',
]

export function Avatar({ name = '', hue = 0, size = 36, src, className, ring, anonymous }) {
  const tone = TONES[Math.abs(Math.round(hue / 60)) % TONES.length]
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.38) }
  if (src) return <img src={src} alt="" style={style} className={cn('shrink-0 rounded-full object-cover', ring && 'ring-2 ring-surface', className)} />
  return (
    <span
      style={style}
      aria-hidden="true"
      className={cn('inline-flex shrink-0 select-none items-center justify-center rounded-full font-bold', anonymous ? 'bg-grey-100 text-grey-fg' : tone, ring && 'ring-2 ring-surface', className)}
    >
      {anonymous ? '?' : initials(name)}
    </span>
  )
}

export function AvatarStack({ people, max = 3, size = 28 }) {
  return (
    <span className="flex -space-x-2">
      {people.slice(0, max).map((p) => (
        <Avatar key={p.id ?? p.name} name={p.name} hue={p.avatarHue} size={size} ring />
      ))}
      {people.length > max && (
        <span style={{ width: size, height: size }} className="flex items-center justify-center rounded-full bg-grey-100 text-[11px] font-bold text-grey-fg ring-2 ring-surface">
          +{people.length - max}
        </span>
      )}
    </span>
  )
}
