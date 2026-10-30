import { Link } from 'react-router-dom'
import { MapPin, Clock, UserPlus, Check } from 'lucide-react'
import { cn } from '@/lib/cn'

import { useEngagement, toast } from '@/lib/store'
import { useGatedAction } from '@/lib/hooks'
import { formatCompact } from '@/lib/format'
import { CATEGORIES } from '@/mocks/seed'
import { Avatar, VerifiedBadge, LevelBadge, Rating, Button, CategoryIllustration } from '@/design-system'

export function FollowButton({ partner, size = 'sm', className }) {
  const following = useEngagement((s) => !!s.following[partner.id])
  const toggle = useEngagement((s) => s.toggle)
  const gate = useGatedAction()
  return (
    <Button
      size={size}
      variant={following ? 'subtle' : 'soft'}
      aria-pressed={following}
      className={cn('relative z-[2]', className)}
      onClick={gate(() => {
        toggle('following', partner.id)
        toast(following ? `Unfollowed ${partner.name}` : `You're following ${partner.name}`, following ? undefined : { description: 'New Deals will show in Following.' })
      }, { reason: 'Sign in to follow Partners' })}
    >
      {following ? <Check size={15} /> : <UserPlus size={15} />}
      {following ? 'Following' : 'Follow'}
    </Button>
  )
}



const catName = (slug) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug

export function PartnerCard({ partner, className }) {
  return (
    <article className={cn('group relative flex h-full flex-col overflow-hidden rounded-2xl border shadow-none transition hover:-translate-y-0.5 hover:shadow-hover', 'border-border border-t-[3px] border-t-brand-yellow bg-surface hover:border-brand-yellow', className)}>
      <div className="h-20">
        <CategoryIllustration category={partner.categories[0]} seed={3} iconSize={24} />
      </div>
      <div className="-mt-8 flex flex-1 flex-col px-4 pb-4">
        <Avatar name={partner.name} hue={partner.avatarHue} size={60} ring className="relative z-[1] ring-4" />
        <h3 className="mt-2 flex items-center gap-1.5 font-bold text-text">
          <Link to={`/partners/${partner.handle}`} className="truncate after:absolute after:inset-0 after:z-[1] after:content-['']">
            {partner.name}
          </Link>
          {partner.verified && <VerifiedBadge compact />}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <LevelBadge level={partner.level} />
          <Rating value={partner.rating} count={partner.reviewCount} size={12} className="text-xs" />
        </div>
        <p className="mt-2 line-clamp-1 text-sm text-muted">{partner.categories.map(catName).join(' · ')}</p>
        <ul className="mt-2 space-y-1 text-xs text-muted">
          <li className="flex items-center gap-1.5">
            <MapPin size={13} aria-hidden="true" /> <span className="truncate">{partner.areas.join(', ')}</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Clock size={13} aria-hidden="true" /> Responds {partner.responseTime} · {formatCompact(partner.followers)} followers
          </li>
        </ul>
        <FollowButton partner={partner} className="mt-4 self-start" />
      </div>
    </article>
  )
}
