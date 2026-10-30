import { Play, Mic } from 'lucide-react'
import { cn } from '@/lib/cn'
import { imageKeyFor, CATEGORY_IMAGE, imgSrc, imgSrcSet } from '@/lib/images'

export const CATEGORY_ICON = {
  agriculture: 'Sprout', automotive: 'Car', beauty: 'Sparkles', education: 'GraduationCap', electronics: 'Cpu',
  'food-catering': 'UtensilsCrossed', health: 'HeartPulse', 'home-furniture': 'Sofa', 'real-estate': 'Building',
  'professional-talent': 'Briefcase', services: 'Wrench', 'travel-tourism': 'Plane', 'custom-solutions': 'Lightbulb',
}

/** Lazy, responsive photo with a flat placeholder (no gradients). */
export function Photo({ k, alt = '', className, sizes = '(max-width: 640px) 100vw, 400px', eager }) {
  return (
    <img
      src={imgSrc(k, 400)}
      srcSet={imgSrcSet(k)}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('h-full w-full bg-surface-2 object-cover', className)}
    />
  )
}

/** Category photo (kept under the old name so every existing usage switches to photos). */
export function CategoryIllustration({ category, className, label }) {
  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-surface-2', className)}>
      <Photo k={CATEGORY_IMAGE[category] ?? 'cat-services'} alt={label ?? ''} />
    </div>
  )
}
export const CategoryImage = CategoryIllustration

/** Voice-note waveform — deterministic bars. */
export function Waveform({ bars = 36, seed = 3, className, progress = 0 }) {
  const heights = Array.from({ length: bars }, (_, i) => 20 + Math.abs(Math.sin((i + 1) * (seed + 1.7)) * 70) + ((i * 7) % 11))
  return (
    <div className={cn('flex h-12 items-center gap-[3px]', className)} aria-hidden="true">
      {heights.map((h, i) => (
        <span key={i} className={cn('w-[3px] rounded-full', i / bars < progress ? 'bg-action-300' : 'bg-current opacity-60')} style={{ height: `${Math.min(100, h)}%` }} />
      ))}
    </div>
  )
}

const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// Extra photos per category (keyed by the first word of the category slug) so a listing's gallery shows different pictures.
const PHOTO_POOL = {
  home: ['plumbing', 'plumbing-2', 'electrical', 'painting', 'carpentry', 'sofa', 'wardrobe', 'cleaning', 'roof', 'garden', 'pest', 'moving'],
  real: ['apartment', 'land', 'office-space', 'hotel', 'cat-realestate'],
  travel: ['safari', 'gorilla', 'kivu', 'airport', 'hotel', 'car-hire'],
  food: ['catering', 'chef', 'cake', 'brochette', 'lunch', 'groceries'],
  custom: ['wedding', 'party', 'photography', 'design', 'website'],
  automotive: ['car-repair', 'car-wash', 'car-hire', 'moto'],
  electronics: ['phone-repair', 'laptop', 'tv', 'solar'],
  agriculture: ['seeds', 'fertiliser', 'irrigation', 'harvest', 'cows'],
  education: ['tutoring', 'piano', 'coding', 'uniforms'],
  health: ['nurse', 'physio', 'lab', 'massage'],
  beauty: ['hair', 'barber', 'makeup', 'massage'],
  professional: ['accounting', 'legal', 'design', 'coding', 'office-setup'],
  services: ['laundry', 'security', 'delivery', 'cleaning', 'kiosk'],
}

function photoFor(item, m) {
  const base = imageKeyFor(item)
  const cat = String(item?.category ?? m.cat ?? '').split('-')[0]
  const pool = (PHOTO_POOL[cat] ?? PHOTO_POOL.services).filter((k) => k !== base)
  return pool[(m.seed - 1 + (item?.title?.length ?? 0)) % pool.length]
}

/**
 * Media slot for cards, tables and galleries: uploaded photo, otherwise a real photo matched to the item;
 * video gets a ▶ overlay, voice notes a waveform panel.
 */
export function MediaThumb({ item, media, className, children, mini, sizes }) {
  const first = media?.[0]
  const key = first?.kind === 'image' && first.seed ? photoFor(item, first) : imageKeyFor(item)
  if (first?.kind === 'audio') {
    return (
      <div className={cn('relative flex flex-col items-center justify-center gap-2 overflow-hidden bg-primary-900 px-4 text-white', className)}>
        {mini ? (
          <Mic size={16} aria-label="Voice note" />
        ) : (
          <>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-white/85">
              <Mic size={14} aria-hidden="true" /> Voice note · {fmt(first.durationSec ?? 30)}
            </span>
            <Waveform className="w-full text-white" seed={(item?.id?.length ?? 3) + 2} />
            <span className="sr-only">Voice note, transcript available on the detail page</span>
          </>
        )}
        {children}
      </div>
    )
  }
  return (
    <div className={cn('relative overflow-hidden bg-surface-2', className)}>
      {first?.url ? <img src={first.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <Photo k={key} sizes={sizes} />}
      {first?.kind === 'video' &&
        (mini ? (
          <span className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-900/80 text-white" title="Video">
            <Play size={9} fill="currentColor" aria-hidden="true" />
          </span>
        ) : (
          <>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-primary-900 shadow-hover">
                <Play size={20} className="ml-0.5" fill="currentColor" aria-hidden="true" />
              </span>
            </span>
            <span className="tabular absolute bottom-2 right-2 rounded bg-primary-900/80 px-1.5 py-0.5 text-[11px] font-semibold text-white">
              <span className="sr-only">Video, </span>
              {fmt(first.durationSec ?? 30)}
            </span>
          </>
        ))}
      {!mini && media?.length > 1 && first?.kind === 'image' && <span className="absolute bottom-2 right-2 rounded bg-primary-900/75 px-1.5 py-0.5 text-[11px] font-semibold text-white">1/{media.length}</span>}
      {children}
    </div>
  )
}
