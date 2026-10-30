import { useTranslation } from 'react-i18next'
import { Repeat, MapPin, Timer, Target, Layers, CalendarCheck, Clock, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatMoney, ago, countdown } from '@/lib/format'
import { statusMeta } from '@/lib/status'
import { MediaThumb, UrgencyBadge, Badge, SlotMeter, ProgressBar } from '@/design-system'
import { CardShell, CardTitleLink, QuickViewButton, MediaChips, MetaRow } from './CardParts'
import { NeedActions } from './NeedActions'
import { detailPath } from './actionsStore'

/** Name of the person who posted, with the blue verified tick and the live status pill (as in the mobile app). */
function PosterRow({ item }) {
  const { t } = useTranslation()
  const name = item.anonymous ? t('common.anonymous') : item.poster?.name
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="flex min-w-0 items-center gap-1 text-sm text-muted">
        <span className="truncate">{name}</span>
        {!item.anonymous && item.poster?.verified !== false && <BadgeCheck size={15} className="shrink-0 text-action-fg" aria-label="Verified" />}
      </p>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-action-soft px-2.5 py-0.5 text-xs font-semibold text-action-fg">
        <span className="h-1.5 w-1.5 rounded-full bg-action-600" aria-hidden="true" /> {statusMeta(item.status).label}
      </span>
    </div>
  )
}

/** Partner-dashboard extras: response countdown + fit score. */
function PartnerMeta({ item }) {
  const fit = 60 + ((item.code.charCodeAt(item.code.length - 1) * 7) % 39)
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone="warn" icon={<Timer size={12} />} size="xs">
        Reply in {countdown(new Date(new Date(item.createdAt).getTime() + 36 * 3600000).toISOString())}
      </Badge>
      <Badge tone="trust" icon={<Target size={12} />} size="xs">
        Fit {fit}%
      </Badge>
    </div>
  )
}

const FREQUENCY = {
  one_time: [CalendarCheck, 'Just once', 'bg-surface-2 text-text ring-1 ring-border'],
  recurring: [Repeat, 'Again and again', 'bg-primary-100 text-primary'],
  mixed: [Repeat, 'Both', 'bg-action-100 text-action-fg'],
}

/** One-time / Recurring / Mixed label for Bundles (and Needs on detail views). */
export function FrequencyTag({ value, className }) {
  const [FreqIcon, label, tone] = FREQUENCY[value] ?? FREQUENCY.one_time
  return (
    <span className={cn('inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', tone, className)}>
      <FreqIcon size={12} aria-hidden="true" /> {label}
    </span>
  )
}

export function NeedCard({ need: item, context = 'public', compact, owner, className }) {
  const to = detailPath(item, { owner })
  return (
    <CardShell item={item} className={className}>
      <div className="relative">
        <MediaThumb item={item} media={item.media} className={cn('rounded-t-2xl', 'h-32 sm:h-36')} />
        <MediaChips dot="bg-action-600" label={[item.categoryName, item.subtype].filter(Boolean).join(' · ')} price={formatMoney(item.budget)} />
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 flex gap-1.5">
          <UrgencyBadge urgency={item.urgency} solid size="xs" />
          {item.recurring && <span className="inline-flex items-center gap-1 rounded-full bg-surface/95 px-2 py-0.5 text-[11px] font-semibold text-primary shadow-card"><Repeat size={11} /> Recurring</span>}
        </div>
        <QuickViewButton item={item} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 py-3">
        <CardTitleLink item={item} to={to} />
        <PosterRow item={item} />
        <MetaRow
          items={[
            [MapPin, item.serviceArea?.sector ?? item.serviceArea?.district],
            [Clock, ago(item.createdAt)],
            [null, <SlotMeter key="slots" used={item.offerSlots.used} limit={item.offerSlots.limit} />],
          ]}
        />
        {context === 'partner' && <PartnerMeta item={item} />}
      </div>
      <div className="mt-auto border-t border-border bg-surface-2/50 px-3.5 pb-2 pt-3">
        <NeedActions item={item} context={context} />
      </div>
    </CardShell>
  )
}

export function BundleCard({ bundle: item, context = 'public', owner, className }) {
  const to = detailPath(item, { owner })
  return (
    <CardShell item={item} className={className}>
      <div className="relative">
        <MediaThumb item={item} media={item.media} className="h-32 rounded-t-2xl sm:h-36" />
        <MediaChips dot="bg-primary" label={`Bundle · ${item.itemCount} items`} price={formatMoney(item.totalBudget)} />
        <div className="pointer-events-none absolute bottom-2.5 left-2.5">
          <UrgencyBadge urgency={item.urgency} solid size="xs" />
        </div>
        <QuickViewButton item={item} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-4 py-3">
        <CardTitleLink item={item} to={to} />
        <PosterRow item={item} />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <FrequencyTag value={item.frequency ?? (item.mixedRecurring ? 'mixed' : 'one_time')} />
          <MetaRow items={[[MapPin, item.serviceArea?.sector], [Layers, `${item.items.length} jobs`]]} />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-medium text-text">
              {item.progress.served} of {item.progress.total} done
            </span>
          </div>
          <ProgressBar value={item.progress.served} max={item.progress.total} size="sm" label="Jobs done" />
        </div>
        {item.blockedItems > 0 && <Badge tone="danger" iconName="Ban" size="xs">{item.blockedItems} job on hold</Badge>}
        {context === 'partner' && <PartnerMeta item={item} />}
      </div>
      <div className="mt-auto border-t border-border bg-surface-2/50 px-3.5 pb-2 pt-3">
        <NeedActions item={item} context={context} />
      </div>
    </CardShell>
  )
}
