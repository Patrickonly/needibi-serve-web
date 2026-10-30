import { Link, useNavigate } from 'react-router-dom'
import { Heart, Bookmark, Share, Ellipsis, MessageSquare, Star, Info, Link as LinkIcon, Flag, EyeOff, ThumbsDown, Eye, UserPlus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useEngagement, toast } from '@/lib/store'
import { useGatedAction, useShare, useCopy } from '@/lib/hooks'
import { IconButton, Menu, MenuTrigger, MenuContent, MenuItem, MenuSeparator, Tooltip } from '@/design-system'
import { useCardActions, detailPath } from './actionsStore'

/** Card frame: whole card links to detail (buttons excluded). */
export function CardShell({ item, className, children }) {
  return (
    <article
      className={cn(
        'card-shell group relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-border border-t-[3px] border-t-brand-yellow bg-surface shadow-[0_1px_2px_rgb(15_23_42/0.04),0_6px_18px_-10px_rgb(15_23_42/0.18)]',
        className,
      )}
      aria-labelledby={`card-${item.id}`}
    >
      {children}
    </article>
  )
}

/** Small kind label above the title: NEED · BUNDLE · DEAL, plus category. */
export function Kicker({ kind, text }) {
  const tone = { need: 'text-primary', bundle: 'text-brand-yellow-fg', deal: 'text-brand-yellow-fg' }[kind]
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide">
      <span className={tone}>{kind}</span>
      {text && (
        <>
          <span className="text-border-strong" aria-hidden="true">•</span>
          <span className="truncate font-semibold text-muted">{text}</span>
        </>
      )}
    </p>
  )
}

/** Title with a stretched link covering the card. Interactive children use relative z-[2]. */
export function CardTitleLink({ item, to, className }) {
  return (
    <h3 id={`card-${item.id}`} className={cn('line-clamp-2 text-[17px] font-bold leading-snug tracking-[-0.01em] text-text', className)}>
      <Link
        to={to}
        className="after:absolute after:inset-0 after:z-[1] after:rounded-2xl after:content-[''] hover:text-action-fg focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-action-500"
      >
        {item.title}
      </Link>
    </h3>
  )
}

export function QuickViewButton({ item }) {
  const open = useCardActions((s) => s.open)
  return (
    <button
      type="button"
      onClick={() => open('quickView', item)}
      className="absolute bottom-2.5 right-2.5 z-[2] hidden items-center gap-1.5 rounded-md bg-surface/95 px-2.5 py-1.5 text-xs font-semibold text-text opacity-0 shadow-card transition-opacity group-hover:opacity-100 focus-visible:opacity-100 md:flex"
    >
      <Eye size={14} /> Quick view
    </button>
  )
}

export function useLoveSave(item) {
  const key = item.code ?? item.slug ?? item.id
  const loved = useEngagement((s) => !!s.loved[key])
  const saved = useEngagement((s) => !!s.saved[key])
  const toggle = useEngagement((s) => s.toggle)
  const gate = useGatedAction()
  return {
    loved,
    saved,
    love: gate(() => toggle('loved', key), { reason: 'Sign in to love this' }),
    save: gate(() => {
      toggle('saved', key)
      toast(saved ? 'Removed from Saved' : 'Saved', saved ? undefined : { description: 'Find it any time in Saved.' })
    }, { reason: 'Sign in to save items' }),
  }
}

// Stable pseudo-random number per item, for counts the mock data doesn't carry.
const seedOf = (item, salt) => [...String(item.code ?? item.slug ?? item.id)].reduce((h, c) => (h * 31 + c.charCodeAt(0) + salt) % 9973, 7)

/** Engagement numbers shown on every card toolbar. */
export function cardCounts(item) {
  if (item.kind === 'deal') {
    const views = item.views ?? 0
    return {
      messages: Math.round((item.reviewCount ?? 0) / 9),
      loves: Math.round(views / 40),
      saves: Math.round(views / 90),
      shares: Math.round(views / 200),
      reviews: item.reviewCount ?? 0,
      rating: item.rating,
    }
  }
  const c = item.counts ?? {}
  return {
    messages: c.messages ?? 0,
    loves: c.loves ?? 0,
    saves: c.saves ?? 0,
    shares: c.shares ?? 0,
    reviews: seedOf(item, 3) % 24,
    rating: 3.8 + (seedOf(item, 11) % 12) / 10,
  }
}

const compactNumber = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n))

/** Icon button used in card toolbars (always above the card's stretched link); shows a count when given. */
export function ToolButton({ label, tip, onClick, active, count, children }) {
  return (
    <Tooltip content={tip ?? label}>
      <IconButton
        label={label}
        active={active}
        variant="ghost"
        onClick={onClick}
        className={cn('card-toolbar-button rounded-lg relative z-[2] h-8', count != null ? 'w-auto gap-1.5 px-2' : 'w-8')}
      >
        {children}
        {count != null && <span className="tabular text-xs font-semibold">{compactNumber(count)}</span>}
      </IconButton>
    </Tooltip>
  )
}

export function MessageButton({ item, count }) {
  const open = useCardActions((s) => s.open)
  return (
    <ToolButton label="Comments" tip="Comments" count={count} onClick={() => open('comments', item)}>
      <MessageSquare size={16} />
    </ToolButton>
  )
}

export function ShareButton({ item, count }) {
  const share = useShare()
  return (
    <ToolButton label="Share" count={count} onClick={() => share({ title: item.title, path: detailPath(item) })}>
      <Share size={16} />
    </ToolButton>
  )
}

export function ReviewButton({ item, count, rating }) {
  const open = useCardActions((s) => s.open)
  const gate = useGatedAction()
  return (
    <ToolButton label="Review" tip={rating ? `Rated ${rating.toFixed(1)} · write a review` : 'Write a review'} count={count} onClick={gate(() => open('review', item), { reason: 'Sign in to leave a review' })}>
      <Star size={16} className="fill-warn-500 text-warn-500" />
    </ToolButton>
  )
}

/** Message · Love · Save · Share · Review · ⋯ — the engagement toolbar on every card. */
/** Mobile-app layout: ♡ 💬 🔖 ↗ on the left, 👁 ⋯ on the right. Review lives in ⋯. */
export function CardToolbar({ item, share = true, extra = [], hideView = false }) {
  const c = cardCounts(item)
  const navigate = useNavigate()
  const open = useCardActions((s) => s.open)
  const gate = useGatedAction()
  const { loved, saved, love, save } = useLoveSave(item)
  const review = { label: `Write a review${c.reviews ? ` · ★ ${c.rating?.toFixed(1)} (${c.reviews})` : ''}`, icon: <Star />, onSelect: gate(() => open('review', item), { reason: 'Sign in to leave a review' }) }
  return (
    <div className="relative z-[2] flex items-center justify-between">
      <div className="flex items-center gap-0.5">
        <ToolButton label="Love" tip={loved ? 'Loved' : 'Love'} active={loved} count={c.loves + (loved ? 1 : 0)} onClick={love}>
          <Heart size={17} className={loved ? 'animate-heart fill-danger-600 text-danger-600' : ''} />
        </ToolButton>
        <MessageButton item={item} count={c.messages} />
        <ToolButton label="Save" tip={saved ? 'Saved' : 'Save'} active={saved} onClick={save}>
          <Bookmark size={17} className={saved ? 'fill-action-600 text-action-600' : ''} />
        </ToolButton>
        {share && <ShareButton item={item} />}
      </div>
      <div className="flex items-center gap-0.5">
        {!hideView && (
          <ToolButton label="View details" onClick={() => navigate(detailPath(item))}>
            <Eye size={17} />
          </ToolButton>
        )}
        <CardMenu item={item} compact showMessage={false} showShare={false} extra={[review, ...extra]} />
      </div>
    </div>
  )
}

/** Image overlays shared by every card: category chip (left) and price pill (right). */
export function MediaChips({ dot = 'bg-action-600', label, price }) {
  return (
    <>
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/25" />
    <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
      {label ? (
        <span className="inline-flex min-w-0 max-w-[62%] items-center gap-1.5 rounded-full bg-surface/95 px-3 py-1 text-xs font-bold text-text shadow-card backdrop-blur">
          <span className={cn('h-2 w-2 shrink-0 rounded-full', dot)} aria-hidden="true" />
          <span className="truncate">{label}</span>
        </span>
      ) : <span />}
      {price && <span className="tabular shrink-0 rounded-full bg-white px-3.5 py-1 text-sm font-extrabold text-primary-700 shadow-card">{price}</span>}
    </div>
    </>
  )
}

/** Small icon + text facts in one line: ★ 4.6 · 📍 Kigali · ⏱ 1 day */
export function MetaRow({ items, className }) {
  return (
    <p className={cn('flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-muted', className)}>
      {items.filter(([, v]) => v).map(([ItemIcon, value], n) => (
        <span key={n} className="inline-flex min-w-0 items-center gap-1">
          {ItemIcon && <ItemIcon size={14} className="shrink-0" aria-hidden="true" />}
          <span className="truncate">{value}</span>
        </span>
      ))}
    </p>
  )
}

/** Pill buttons used on cards, matching the mobile app. */
export const PILL = 'h-10 rounded-xl px-3.5 text-[13px]'
export const SOFT_PILL = 'h-10 rounded-xl px-3.5 text-[13px] font-semibold shadow-none'


/** Love + Save icon buttons. `compact` matches the card toolbar size. */
export function LoveSave({ item, loves, saves, compact }) {
  const { loved, saved, love, save } = useLoveSave(item)
  if (compact) {
    return (
      <>
        <ToolButton label="Love" tip={loved ? 'Loved' : 'Love'} active={loved} count={loves != null ? loves + (loved ? 1 : 0) : undefined} onClick={love}>
          <Heart size={16} className={loved ? 'fill-danger-600 text-danger-600' : ''} />
        </ToolButton>
        <ToolButton label="Save" tip={saved ? 'Saved' : 'Save'} active={saved} count={saves != null ? saves + (saved ? 1 : 0) : undefined} onClick={save}>
          <Bookmark size={16} className={saved ? 'fill-action-600 text-action-600' : ''} />
        </ToolButton>
      </>
    )
  }
  return (
    <>
      <Tooltip content={loved ? 'Loved' : 'Love'}>
        <IconButton label="Love" count={loves != null ? loves + (loved ? 1 : 0) : undefined} active={loved} onClick={love} className="card-toolbar-button relative z-[2] h-9">
          <Heart size={16} className={loved ? 'fill-danger-600 text-danger-600' : ''} />
        </IconButton>
      </Tooltip>
      <Tooltip content={saved ? 'Saved' : 'Save'}>
        <IconButton label="Save" active={saved} onClick={save} className="card-toolbar-button relative z-[2]">
          <Bookmark size={16} className={saved ? 'fill-action-600 text-action-600' : ''} />
        </IconButton>
      </Tooltip>
    </>
  )
}

/** ⋯ menu: Message, Share, Card details, Copy link, Report, Hide, Not interested + role-specific extras. */
export function CardMenu({ item, extra = [], messages, compact, showMessage = true, showShare = true }) {
  const navigate = useNavigate()
  const copy = useCopy()
  const share = useShare()
  const toggle = useEngagement((s) => s.toggle)
  const open = useCardActions((s) => s.open)
  const gate = useGatedAction()
  const to = detailPath(item)
  const key = item.code ?? item.slug ?? item.id
  return (
    <Menu>
      <MenuTrigger asChild>
        <IconButton label="More actions" className={cn('card-toolbar-button relative z-[2]', compact && 'h-8 w-8')}>
          <Ellipsis size={18} />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        {extra.map((x) => (
          <MenuItem key={x.label} icon={x.icon} onSelect={x.onSelect} tone={x.tone}>
            {x.label}
          </MenuItem>
        ))}
        {showMessage && (
          <MenuItem icon={<MessageSquare />} onSelect={() => navigate(`${to}#messages`)}>
            Message{messages ? ` (${messages})` : ''}
          </MenuItem>
        )}
        {showShare && (
          <MenuItem icon={<Share />} onSelect={() => share({ title: item.title, path: to })}>
            Share
          </MenuItem>
        )}
        <MenuItem icon={<Info />} onSelect={() => navigate(to)}>
          Card details
        </MenuItem>
        <MenuItem icon={<LinkIcon />} onSelect={() => copy(new URL(to, location.origin).toString())}>
          Copy link
        </MenuItem>
        {item.kind === 'deal' && (
          <MenuItem icon={<UserPlus />} onSelect={gate(() => { toggle('following', item.partner.id); toast(`You're following ${item.partner.name}`) }, { reason: 'Sign in to follow Partners' })}>
            Follow {item.partner.name}
          </MenuItem>
        )}
        <MenuSeparator />
        <MenuItem icon={<EyeOff />} onSelect={() => { toggle('hidden', key); toast('Hidden from your feed', { action: { label: 'Undo', onClick: () => toggle('hidden', key) } }) }}>
          Hide
        </MenuItem>
        <MenuItem icon={<ThumbsDown />} onSelect={() => { toggle('hidden', key); toast("Got it — we'll show fewer like this") }}>
          Not interested
        </MenuItem>
        <MenuItem icon={<Flag />} tone="danger" onSelect={gate(() => open('report', item), { reason: 'Sign in to report content' })}>
          Report
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}

// Kept for pages that show the full engagement row (detail pages)
export function EngagementRow({ item, className }) {
  const counts = item.counts ?? { loves: 0, messages: 0 }
  return (
    <div className={cn('relative z-[2] flex items-center gap-0.5', className)}>
      <LoveSave item={item} loves={counts.loves} />
      <CardMenu item={item} messages={counts.messages} />
    </div>
  )
}
