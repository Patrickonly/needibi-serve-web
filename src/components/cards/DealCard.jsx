import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin, Clock, Timer, Pencil, Pause, CalendarDays, ChartBar, Check, X, Star, UserCog, Play, BadgeCheck, ShoppingBag, CalendarCheck, Send } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatMoney, countdown } from '@/lib/format'
import { useNow, useGatedAction } from '@/lib/hooks'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { useQueryClient } from '@tanstack/react-query'
import { MediaThumb, Badge, Rating, Button, StatusBadge, IconButton, Tooltip } from '@/design-system'
import { CardShell, CardTitleLink, QuickViewButton, CardToolbar, MediaChips, MetaRow, PILL, SOFT_PILL } from './CardParts'
import { useCardActions, detailPath } from './actionsStore'
import { FollowButton } from './PartnerCard'

const ACTION_LABEL = { book: 'actions.bookNow', get: 'actions.getDeal', request: 'actions.request' }
const ACTION_ICON = { book: CalendarCheck, get: ShoppingBag, request: Send }

// Deals can be single or bundled, and cover products, services, properties, professionals and custom solutions.
export const DEAL_TYPE_LABEL = {
  service: 'Service',
  product: 'Product',
  vehicle: 'Vehicle',
  property: 'Property',
  professional: 'Professional',
  custom: 'Custom solution',
  bundle: 'Bundle',
}

/** "-20% · 2d 04h left" — used on Deal detail. */
export function DealCountdownBadge({ deal, solid = true }) {
  const now = useNow(60_000)
  if (!deal.discountPct && !deal.endsAt) return null
  const parts = []
  if (deal.discountPct) parts.push(`-${deal.discountPct}%`)
  if (deal.endsAt) parts.push(countdown(deal.endsAt, now))
  return (
    <Badge tone="danger" solid={solid} icon={deal.endsAt ? <Timer size={12} aria-hidden="true" /> : undefined} size="xs">
      {parts.join(' · ')}
    </Badge>
  )
}

function MediaBadges({ deal }) {
  const now = useNow(60_000)
  return (
    <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
      {deal.discountPct ? <span className="rounded-md bg-danger-600 px-1.5 py-0.5 text-[11px] font-bold text-white">-{deal.discountPct}%</span> : <span />}
      {deal.endsAt && (
        <span className="tabular flex items-center gap-1 rounded-md bg-surface/95 px-1.5 py-0.5 text-[11px] font-semibold text-danger-fg shadow-card">
          <Timer size={11} aria-hidden="true" /> {countdown(deal.endsAt, now).replace(' left', '')}
        </span>
      )}
    </div>
  )
}

function PartnerDealActions({ deal }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const paused = deal.status === 'paused'
  return (
    <div className="relative z-[2] flex items-center gap-1">
      <Button size="sm" variant="primary" className="flex-1" onClick={() => navigate(`/app/partner/deals/${deal.slug}/edit`)}>
        <Pencil size={13} /> Edit
      </Button>
      <Tooltip content={paused ? 'Resume' : 'Pause'}>
        <IconButton
          label={paused ? 'Resume' : 'Pause'}
          variant="outline"
          onClick={async () => {
            await api.update('deals', deal.slug, { status: paused ? 'published' : 'paused' })
            qc.invalidateQueries({ queryKey: ['deals'] })
            toast(paused ? 'Deal resumed' : 'Deal paused')
          }}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
        </IconButton>
      </Tooltip>
      <Tooltip content="Bookings">
        <IconButton label="Bookings" variant="outline" onClick={() => navigate(`/app/partner/bookings?dealSlug=${deal.slug}`)}>
          <CalendarDays size={15} />
        </IconButton>
      </Tooltip>
      <Tooltip content="Stats">
        <IconButton label="Stats" variant="outline" onClick={() => navigate(`/app/partner/deals?stats=${deal.slug}`)}>
          <ChartBar size={15} />
        </IconButton>
      </Tooltip>
    </div>
  )
}

function AdminDealActions({ deal }) {
  const open = useCardActions((s) => s.open)
  const qc = useQueryClient()
  return (
    <div className="relative z-[2] flex items-center gap-1">
      <Button size="sm" variant="primary" className="flex-1" onClick={() => open('approve', deal)}>
        <Check size={13} /> Approve
      </Button>
      <Tooltip content={deal.featured ? 'Unfeature' : 'Feature on home'}>
        <IconButton
          label={deal.featured ? 'Unfeature' : 'Feature'}
          variant="outline"
          active={deal.featured}
          onClick={async () => {
            await api.update('deals', deal.slug, { featured: !deal.featured })
            qc.invalidateQueries({ queryKey: ['deals'] })
            toast(deal.featured ? 'Removed from featured' : 'Featured on the home page')
          }}
        >
          <Star size={15} className={deal.featured ? 'fill-current' : ''} />
        </IconButton>
      </Tooltip>
      <Tooltip content="Assign Partner">
        <IconButton label="Assign" variant="outline" onClick={() => open('assign', deal)}>
          <UserCog size={15} />
        </IconButton>
      </Tooltip>
      <Button size="sm" variant="danger-outline" onClick={() => open('reject', { item: deal, as: 'deal' })}>
        <X size={13} /> Reject
      </Button>
    </div>
  )
}

/**
 * Deal card. `compact` is the dense flash-deal tile used in carousels (Amazon/Jumia style);
 * the default card adds rating, partner trust line and the action row.
 */
export function DealCard({ deal, context = 'public', compact, className }) {
  const navigate = useNavigate()
  const gate = useGatedAction()
  const to = detailPath(deal)
  const primary = gate(() => navigate(`${to}?book=1`), { roles: ['needer', 'agent'], reason: `Sign in to ${deal.primaryAction === 'book' ? 'book' : deal.primaryAction === 'get' ? 'get' : 'request'} this Deal` })

  if (compact) {
    return (
      <CardShell item={deal} className={className}>
        <div className="relative">
          <MediaThumb item={deal} media={deal.media} className="aspect-[16/9] rounded-t-2xl" sizes="240px" />
          <MediaBadges deal={deal} />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-muted">{deal.categoryName}</p>
          <CardTitleLink item={deal} to={to} className="text-sm" />
          <p className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pt-1">
            <span className="tabular text-base font-bold text-text">{formatMoney(deal.price)}</span>
            {deal.oldPrice && <span className="tabular text-xs text-muted line-through">{formatMoney(deal.oldPrice)}</span>}
          </p>
          <p className="flex items-center gap-1 truncate text-xs text-muted">
            {deal.partner.verified && <BadgeCheck size={13} className="shrink-0 text-trust-fg" aria-label="Verified Partner" />}
            <span className="truncate">{deal.partner.name}</span>
          </p>
        </div>
        <div className="rounded-b-2xl border-t border-border bg-surface-2/60 p-2.5">
          <DealPublicActions deal={deal} onPrimary={primary} />
        </div>
      </CardShell>
    )
  }

  return (
    <CardShell item={deal} className={className}>
      <div className="relative">
        <MediaThumb item={deal} media={deal.media} className="h-32 rounded-t-2xl sm:h-36" />
        <MediaChips dot="bg-trust-600" label={`${DEAL_TYPE_LABEL[deal.type] ?? 'Deal'} · ${deal.categoryName}`} price={formatMoney(deal.price)} />
        {deal.discountPct > 0 && <span className="pointer-events-none absolute bottom-0 right-0 rounded-tl-xl bg-action-600 px-3 py-1.5 text-sm font-bold text-white">-{deal.discountPct}%</span>}
        <DealTimer deal={deal} />
        <QuickViewButton item={deal} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 py-3">
        <CardTitleLink item={deal} to={to} />
        <Link to={`/partners/${deal.partner.handle}`} className="relative z-[2] flex w-fit min-w-0 items-center gap-1 text-sm text-muted hover:text-text">
          <span className="truncate">{deal.partner.name}</span>
          {deal.partner.verified && <BadgeCheck size={15} className="shrink-0 text-action-fg" aria-label="Verified Partner" />}
        </Link>
        <MetaRow
          items={[
            [FilledStar, <span key="r" className="font-semibold text-text">{deal.rating.toFixed(1)}</span>],
            [MapPin, deal.coverage?.[0]],
            [Clock, deal.specs?.find(([k]) => k === 'Duration')?.[1]],
          ]}
        />
        {deal.oldPrice && <p className="tabular text-xs text-muted">Was <span className="line-through">{formatMoney(deal.oldPrice)}</span> · {deal.bookedThisWeek} booked this week</p>}
        {context !== 'public' && <StatusBadge status={deal.status} size="xs" />}
      </div>
      <div className="mt-auto border-t border-border bg-surface-2/50 px-3.5 pb-2 pt-3">
        {context === 'partner' ? (
          <div className="space-y-2">
            <PartnerDealActions deal={deal} />
            <CardToolbar item={deal} />
          </div>
        ) : context === 'admin' ? (
          <div className="space-y-2">
            <AdminDealActions deal={deal} />
            <CardToolbar item={deal} />
          </div>
        ) : (
          <DealPublicActions deal={deal} onPrimary={primary} />
        )}
      </div>
    </CardShell>
  )
}

/** Get (Book / Request / Get deal) · then Message · Love · Save · Share · Review · ⋯ */
const FilledStar = (props) => <Star {...props} className="shrink-0 fill-warn-500 text-warn-500" />

/** Small "ends in" timer on the photo, bottom-left. */
function DealTimer({ deal }) {
  const now = useNow(60_000)
  if (!deal.endsAt) return null
  return (
    <span className="tabular pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-semibold text-danger-fg shadow-card">
      <Timer size={11} aria-hidden="true" /> {countdown(deal.endsAt, now).replace(' left', '')}
    </span>
  )
}

/** Book / Request / Get · Follow pills, then ♡ 💬 🔖 ↗ · 👁 ⋯ (mobile-app layout). */
function DealPublicActions({ deal, onPrimary }) {
  const { t } = useTranslation()
  const PrimaryIcon = ACTION_ICON[deal.primaryAction] ?? ShoppingBag
  return (
    <div className="relative z-[2] space-y-2.5">
      <div className="flex items-center gap-2">
        <Button variant="primary" className={cn(PILL, 'min-w-0 flex-[1.15]')} onClick={onPrimary}>
          <PrimaryIcon size={16} /> {t(ACTION_LABEL[deal.primaryAction] ?? 'actions.getDeal')}
        </Button>
        <FollowButton partner={deal.partner} className={cn(SOFT_PILL, 'min-w-0 flex-1')} />
      </div>
      <CardToolbar item={deal} />
    </div>
  )
}

export function DealMiniCard({ deal, className }) {
  return (
    <Link to={detailPath(deal)} className={cn('group flex gap-3 rounded-xl border border-border bg-surface p-2.5 transition hover:border-border-strong hover:shadow-hover', className)}>
      <MediaThumb item={deal} media={deal.media} className="h-20 w-20 shrink-0 rounded-lg" mini />
      <div className="min-w-0">
        <p className="line-clamp-2 text-sm font-semibold text-text">{deal.title}</p>
        <p className="tabular mt-1 font-bold text-text">{formatMoney(deal.price)}</p>
        <Rating value={deal.rating} size={11} className="text-xs" />
      </div>
    </Link>
  )
}
