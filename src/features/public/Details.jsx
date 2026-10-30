import { useEffect, useRef, useState } from 'react'
import { imageKeyFor, imgSrc } from '@/lib/images'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Heart, MapPin, Clock, CalendarDays, Layers, ShieldCheck, Share, Bookmark, Lock, Minus, Plus, Languages, BadgeCheck, Timer, Star, Gauge, Zap, ArrowLeft, ArrowRight, ChevronRight, UserCheck, Truck, RotateCcw, CornerDownRight, Quote } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession, useGatedAction, useShare, useNow } from '@/lib/hooks'
import { useUI } from '@/lib/store'
import { countryName } from '@/lib/countries'
import { formatMoney, formatDate, ago, countdown, formatCompact, formatNumber } from '@/lib/format'
import { Reveal, Button, Badge, UrgencyBadge, StatusBadge, KindLabel, Avatar, VerifiedBadge, LevelBadge, Rating, SlotMeter, ProgressRing, MediaThumb, Card, DefinitionList, Tabs, TabList, Tab, TabPanel, Skeleton, EmptyState, RecurringChip, Input, Field, ProgressBar, CategoryIllustration } from '@/design-system'
import { PublicMessages } from '@/components/messages/PublicMessages'
import { MediaPlayer } from '@/components/media/MediaPlayer'
import { NeedActions } from '@/components/cards/NeedActions'
import { useCardActions } from '@/components/cards/actionsStore'
import { useLoveSave, CardMenu } from '@/components/cards/CardParts'
import { DealCard, DEAL_TYPE_LABEL } from '@/components/cards/DealCard'
import { FollowButton } from '@/components/cards/PartnerCard'
import { AnyCard, CARD_GRID } from '@/components/cards/AnyCard'
import { OfferCard } from '@/components/cards/OfferCard'
import { EscrowBanner } from '@/components/payments/Payments'
import { LocationPicker } from '@/components/layout/HeaderMenus'

function DetailSkeleton() {
  return (
    <div className="container-page grid gap-6 py-6 lg:grid-cols-[1fr_360px]" aria-busy="true">
      <div className="space-y-4">
        <Skeleton className="aspect-[16/9] rounded-card" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-32 rounded-card" />
      </div>
      <Skeleton className="h-80 rounded-card" />
    </div>
  )
}

function BackButton({ fallback, onDark }) {
  const navigate = useNavigate()
  // Open straight from a shared link there is no history to go back to, so fall back to the board.
  const back = () => (window.history.state?.idx > 0 ? navigate(-1) : navigate(fallback))
  return (
    <button type="button" onClick={back} className={`mb-3 inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-500 ${onDark ? 'border-white/30 text-white hover:bg-white/10' : 'border-border bg-surface text-text hover:bg-grey-100'}`}>
      <ArrowLeft size={16} aria-hidden="true" /> Back
    </button>
  )
}

function NotFoundItem({ kind }) {
  return <EmptyState title={`This ${kind} isn't available`} description="It may have been closed, archived or it hasn't passed review yet." action={<Button to={`/${kind.toLowerCase()}s`} variant="primary">Browse {kind}s</Button>} />
}

/** Big media with thumbnails; voice notes get a transcript toggle; videos mention captions. */
export function MediaGallery({ item, media = [] }) {
  const [i, setI] = useState(0)
  const [transcript, setTranscript] = useState(false)
  const current = media[i] ? [media[i]] : []
  const previous = () => setI((currentIndex) => (currentIndex - 1 + media.length) % media.length)
  const next = () => setI((currentIndex) => (currentIndex + 1) % media.length)
  return (
    <div>
      <div className="relative">
        {media[i]?.kind === 'video' || media[i]?.kind === 'audio' ? (
          <MediaPlayer media={media[i]} poster={imgSrc(imageKeyFor(item), 800)} title={media[i].kind === 'video' ? `${item?.title ?? 'Item'} — video` : `${item?.title ?? 'Item'} — voice note`} />
        ) : (
          <MediaThumb item={item} media={current} className="aspect-[16/10] rounded-card" iconSize={88} />
        )}
        {media.length > 1 && (
          <>
            <Button
              variant="outline"
              size="icon-sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 border-border/80 bg-surface/90 shadow-card backdrop-blur hover:bg-surface"
              aria-label="Show previous media"
              onClick={previous}
            >
              <ArrowLeft size={18} />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              className="absolute right-3 top-1/2 -translate-y-1/2 border-border/80 bg-surface/90 shadow-card backdrop-blur hover:bg-surface"
              aria-label="Show next media"
              onClick={next}
            >
              <ArrowRight size={18} />
            </Button>
          </>
        )}
      </div>
      {media[i]?.kind === 'audio' && (
        <div className="mt-2">
          <button type="button" className="text-sm font-semibold text-info-fg hover:underline" onClick={() => setTranscript((t) => !t)} aria-expanded={transcript}>
            {transcript ? 'Hide transcript' : 'Show transcript'}
          </button>
          {transcript && <p className="mt-1 rounded-lg bg-surface-2 p-3 text-sm text-text">“Muraho, I need a mason to fix the front wall of my house before the rains. It's about three metres long. Please come with materials.” (auto-transcribed)</p>}
        </div>
      )}
      {media[i]?.kind === 'video' && <p className="mt-2 text-xs text-muted">Captions available · EN, RW</p>}
      {media.length > 1 && (
        <ul className="mt-3 flex gap-2" aria-label="Media">
          {media.map((m, k) => (
            <li key={m.id}>
              <button type="button" onClick={() => setI(k)} aria-label={`Show media ${k + 1}`} aria-current={k === i} className={cn('block overflow-hidden rounded-lg border-2', k === i ? 'border-action-500' : 'border-transparent')}>
                <MediaThumb item={item} media={[m]} className="h-16 w-20" iconSize={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SaveShareRow({ item, path }) {
  const share = useShare()
  const { saved, save } = useLoveSave(item)
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" size="sm" onClick={save} aria-pressed={saved}>
        <Bookmark size={15} className={saved ? 'fill-current' : ''} /> {saved ? 'Saved' : 'Save'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => share({ title: item.title, path })}>
        <Share size={15} /> Share
      </Button>
    </div>
  )
}

/** Sticky bottom action bar on phone detail pages. */
function MobileActionBar({ children }) {
  return <div data-mobile-action-bar className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-surface/95 p-3 backdrop-blur md:hidden">{children}</div>
}

function DealSkeleton() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-6" aria-busy="true" aria-label="Loading Deal">
      <Skeleton className="h-4 w-56" />
      <Skeleton className="mt-6 h-9 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/3" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-16">
        <div className="space-y-5">
          <Skeleton className="aspect-[16/9] rounded-2xl" />
          <div className="flex items-center gap-3"><Skeleton className="h-12 w-12 rounded-full" /><Skeleton className="h-4 w-48" /></div>
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="hidden h-96 rounded-2xl lg:block" />
      </div>
    </div>
  )
}

/* ================================================================ Need detail (public) */
export function NeedDetail() {
  const { code } = useParams()
  const { user, role } = useSession()
  const open = useCardActions((s) => s.open)
  const gate = useGatedAction()
  const { data: need, isLoading, isError } = useQuery({ queryKey: ['needs', code], queryFn: () => api.one('needs', code), retry: false })
  const similar = useQuery({ queryKey: ['needs', 'similar', need?.category], queryFn: () => api.list('feed', { category: need.category, pageSize: 5 }), enabled: !!need })
  if (isLoading) return <DetailSkeleton />
  if (isError) return <NotFoundItem kind="Need" />
  const isOwner = user?.id === need.posterId
  const open_ = ['published', 'matching', 'offers_received'].includes(need.status)
  const full = open_ && need.offerSlots.used >= need.offerSlots.limit
  const serve = gate(() => (user?.verified === false ? open('verifyPartner', { item: need, mode: 'pending' }) : open('serve', need)), { roles: ['partner'], reason: 'Sign in as a verified Partner to serve this Need' })

  return (
    <div className="container-page py-6 pb-32 md:pb-6">
      <BackButton fallback="/needs" />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link to="/needs" className="hover:text-text">Needs</Link> › <Link to={`/categories/${need.category}`} className="hover:text-text">{need.categoryName}</Link> › <span className="text-text">{need.code}</span>
      </nav>
      {isOwner && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card bg-info-100 px-4 py-3 text-sm text-info-fg">
          You posted this Need. Manage offers, chat and payment from your dashboard.
          <Button size="sm" variant="navy" to={`/app/needer/needs/${need.code}`}>
            Manage my Need
          </Button>
        </div>
      )}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <MediaGallery item={need} media={need.media} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <KindLabel kind="need" />
              <UrgencyBadge urgency={need.urgency} />
              <StatusBadge status={need.status} />
              {need.recurring && <RecurringChip />}
              {need.negotiable && <Badge tone="serve">Negotiable</Badge>}
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold text-text sm:text-3xl">{need.title}</h1>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="flex items-center gap-1"><MapPin size={14} /> {need.serviceArea.sector}, {need.serviceArea.district}</span>
              <span className="flex items-center gap-1"><Clock size={14} /> Posted {ago(need.createdAt)}</span>
              <span className="tabular">{need.code}</span>
            </p>
          </div>
          <Card>
            <DefinitionList
              cols={3}
              items={[
                ['Budget', <span key="b" className="tabular text-lg font-extrabold">{formatMoney(need.budget)}</span>],
                ['Timeframe', need.timeframe],
                ['Category', `${need.categoryName} › ${need.subtype}`],
                ['Quantity', need.quantity],
                ['Recurrence', need.recurrence ? `${need.recurrence.frequency} · ${need.recurrence.days?.join(', ') ?? ''} ${need.recurrence.time ?? ''} · ${need.recurrence.cycles} cycles` : 'One-time'],
                ['Posted by', (
                  <span key="p" className="flex items-center gap-2">
                    <Avatar name={need.poster.name} hue={need.poster.avatarHue} size={22} anonymous={need.anonymous} /> {need.anonymous ? 'Anonymous' : need.poster.name}
                  </span>
                )],
              ]}
            />
            <div className="mt-5 border-t border-border pt-4">
              <h2 className="font-bold text-text">Description</h2>
              <p className="mt-1 text-[15px] text-text">{need.description}</p>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
              <Lock size={13} /> Exact address and contact details are never public. They're shared with the chosen Partner after agreement.
            </p>
          </Card>
          <PublicMessages target={need.code} kind="need" title={need.title} />
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-4">
            <Card>
              <p className="text-sm text-muted">Needer's budget</p>
              <p className="tabular text-3xl font-extrabold text-text">{formatMoney(need.budget)}</p>
              {need.negotiable && <p className="text-sm font-medium text-action-fg">Price negotiable</p>}
              <div className="mt-4 rounded-lg bg-surface-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text">Offer slots</span>
                  <SlotMeter used={need.offerSlots.used} limit={need.offerSlots.limit} />
                </div>
                <p className="mt-1 text-xs text-muted">{full ? 'Offers are full — tap Notify me to hear if a slot frees up.' : `${need.offerSlots.limit - need.offerSlots.used} slot${need.offerSlots.limit - need.offerSlots.used === 1 ? '' : 's'} left for verified Partners.`}</p>
              </div>
              {role === 'partner' || !user ? (
                <div className="mt-4 space-y-2">
                  <Button variant={full ? 'outline' : 'primary'} size="lg" block onClick={serve} disabled={full || !open_}>
                    {!open_ ? 'No longer taking offers' : full ? 'Offers are full' : 'Serve this Need'}
                  </Button>
                  <p className="text-center text-xs text-muted">You'll send price, inclusions and timeline. Chat unlocks after confirmation.</p>
                </div>
              ) : null}
              {!isOwner && (
                <div className="mt-3 rounded-lg border border-border p-3">
                  <Button variant="outline" size="sm" block onClick={() => document.getElementById('messages')?.scrollIntoView({ behavior: 'smooth' })}><MessageCircle size={15} /> Ask a question</Button>
                  <p className="mt-2 text-xs leading-5 text-muted">Questions are public and reviewed before they appear, so never share phone numbers. The Needer's answer shows under Messages and you get a notification.</p>
                </div>
              )}
              {role === 'partner' || !user ? null : (
                <div className="mt-4">
                  <NeedActions item={need} size="sm" onDetail />
                </div>
              )}
              <div className="mt-3">
                <SaveShareRow item={need} path={`/needs/${need.code}`} />
              </div>
            </Card>
            <EscrowBanner compact />
          </div>
        </aside>
      </div>

      <section className="mt-12">
        <h2 className="mb-4 font-display text-2xl font-extrabold text-primary">Similar Needs</h2>
        <div className={CARD_GRID}>{similar.data?.data.filter((x) => x.code !== need.code).slice(0, 4).map((n) => <AnyCard key={n.id} item={n} />)}</div>
      </section>

      <MobileActionBar>
        {role === 'partner' || !user ? (
          <div className="flex items-center gap-3">
            <SlotMeter used={need.offerSlots.used} limit={need.offerSlots.limit} />
            <Button variant="primary" block onClick={serve} disabled={full || !open_}>
              {!open_ ? 'Closed' : full ? 'Offers full' : 'Serve'}
            </Button>
          </div>
        ) : (
          <NeedActions item={need} size="sm" onDetail />
        )}
      </MobileActionBar>
    </div>
  )
}

/* ================================================================ Bundle detail */
export function BundleView({ bundle, owner }) {
  const open = useCardActions((s) => s.open)
  const gate = useGatedAction()
  const { user, role } = useSession()
  const offers = useQuery({ queryKey: ['offers', 'bundle', bundle.code], queryFn: () => api.list('offers', { needCode: bundle.code, pageSize: 50 }), enabled: owner || role === 'admin' })
  const recurring = bundle.items.filter((i) => i.recurring).length
  const serve = gate(() => (user?.verified === false ? open('verifyPartner', { item: bundle, mode: 'pending' }) : open('serve', bundle)), { roles: ['partner'], reason: 'Sign in as a verified Partner to serve this Bundle' })
  const [tab, setTab] = useState('items')
  const askQuestion = () => {
    setTab('messages')
    requestAnimationFrame(() => document.getElementById('bundle-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  const whole = offers.data?.data.filter((o) => o.scope.kind === 'bundle') ?? []
  const perItem = offers.data?.data.filter((o) => o.scope.kind === 'bundle_item') ?? []
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-modal border border-border bg-surface shadow-card">
        <div className="grid md:grid-cols-[320px_1fr]">
          <MediaThumb item={bundle} media={bundle.media} className="aspect-[4/3] md:aspect-auto md:h-full" />
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <KindLabel kind="bundle" count={bundle.itemCount} />
              <StatusBadge status={bundle.status} />
              {bundle.mixedRecurring && <RecurringChip label="Mixed recurring" />}
              {bundle.allowPartial && <Badge tone="grey">Partial serving allowed</Badge>}
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold text-text sm:text-3xl">{bundle.title}</h1>
            <p className="mt-1 text-muted">{bundle.goal}</p>
            <p className="mt-2 flex flex-wrap gap-x-3 text-sm text-muted">
              <span className="flex items-center gap-1"><MapPin size={14} /> {bundle.serviceArea.sector}, {bundle.serviceArea.district}</span>
              <span className="tabular">{bundle.code}</span>
              <span>Posted {ago(bundle.createdAt)} by {bundle.anonymous ? 'Anonymous' : bundle.poster.name}</span>
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-6">
              <ProgressRing value={bundle.progress.served} max={bundle.progress.total} size={76} label={`${bundle.progress.served} of ${bundle.progress.total} items served`} />
              <div>
                <p className="text-sm text-muted">Total budget</p>
                <p className="tabular text-2xl font-extrabold text-text">{formatMoney(bundle.totalBudget)}</p>
              </div>
              <div className="text-sm">
                <p><span className="font-bold text-text">{bundle.itemCount}</span> <span className="text-muted">items</span></p>
                <p><span className="font-bold text-text">{recurring}</span> <span className="text-muted">recurring · </span><span className="font-bold text-text">{bundle.itemCount - recurring}</span> <span className="text-muted">one-time</span></p>
              </div>
              {!owner && (role === 'partner' || role === 'visitor') && (
                <Button variant="primary" size="lg" onClick={serve} className="ml-auto">
                  Serve whole or selected items
                </Button>
              )}
              {!owner && (
                <Button variant="outline" size="lg" onClick={askQuestion} className={role === 'partner' || role === 'visitor' ? '' : 'ml-auto'}>
                  <MessageCircle size={17} /> Ask a question
                </Button>
              )}
            </div>
            {!owner && (
              <p className="mt-3 text-xs leading-5 text-muted">Ask a question to clear up details in public. Questions are reviewed before they appear, so never share phone numbers. To quote, use Serve; private chat opens once the Needer accepts your offer.</p>
            )}
          </div>
        </div>
      </div>

      <div id="bundle-tabs" className="scroll-mt-36">
      <Tabs value={tab} onValueChange={setTab}>
        <TabList label="Bundle sections">
          <Tab value="items" count={bundle.itemCount}>Items</Tab>
          <Tab value="offers" count={owner ? offers.data?.meta.total : undefined}>Offers</Tab>
          <Tab value="agreements">Agreements</Tab>
          <Tab value="payments">Payments</Tab>
          <Tab value="timeline">Timeline</Tab>
          <Tab value="messages">Messages</Tab>
        </TabList>
        <TabPanel value="items" className="pt-5">
          <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
            {bundle.items.map((it, k) => (
              <li key={it.id} className="flex flex-wrap items-center gap-4 p-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary">{k + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-text">
                    {it.title}
                    {it.quantity > 1 && <span className="text-muted"> ×{it.quantity}</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <UrgencyBadge urgency={it.urgency} size="xs" />
                    {it.recurring ? <RecurringChip /> : <Badge size="xs">One-time</Badge>}
                    <Badge tone="grey" size="xs">{it.offers} offers</Badge>
                  </div>
                </div>
                <span className="tabular font-bold text-text">{formatMoney(it.budget)}</span>
                <StatusBadge status={it.status} size="xs" />
              </li>
            ))}
          </ul>
        </TabPanel>
        <TabPanel value="offers" className="pt-5">
          {owner || role === 'admin' ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 font-bold text-text">Whole-Bundle offers ({whole.length}/3)</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{whole.map((o) => <OfferCard key={o.id} offer={o} decidable={owner} />)}</div>
                {!whole.length && <p className="text-sm text-muted">No whole-Bundle offers yet.</p>}
              </div>
              <div>
                <h3 className="mb-3 font-bold text-text">Per-item offers</h3>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{perItem.map((o) => <OfferCard key={o.id} offer={o} decidable={owner} />)}</div>
                {!perItem.length && <p className="text-sm text-muted">No per-item offers yet.</p>}
              </div>
            </div>
          ) : (
            <PrivateTab what="Offers" />
          )}
        </TabPanel>
        <TabPanel value="agreements" className="pt-5">
          {owner ? <Card><p className="text-sm text-muted">Agreements appear here once you accept an offer. Each is versioned and signed by typing your full name.</p><Button to="/app/needer/agreements" variant="outline" size="sm" className="mt-3">Open Agreements</Button></Card> : <PrivateTab what="Agreements" />}
        </TabPanel>
        <TabPanel value="payments" className="pt-5">
          {owner ? (
            <Card className="space-y-3">
              <EscrowBanner />
              <p className="text-sm text-muted">Large Bundles are billed in milestones; recurring items are billed per occurrence.</p>
              <ProgressBar value={bundle.progress.served} max={bundle.progress.total} label="Milestones paid" />
              <Button to={`/app/needer/checkout/${bundle.code}`} variant="primary" size="sm">Pay next milestone</Button>
            </Card>
          ) : (
            <PrivateTab what="Payments" />
          )}
        </TabPanel>
        <TabPanel value="timeline" className="pt-5">
          <Timeline item={bundle} />
        </TabPanel>
        <TabPanel value="messages" className="pt-5">
          <PublicMessages target={bundle.code} kind="bundle" title={bundle.title} />
        </TabPanel>
      </Tabs>
      </div>
    </div>
  )
}

function PrivateTab({ what }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-dashed border-border-strong bg-surface-2 p-5 text-sm text-muted">
      <Lock size={18} /> {what} are private to the Needer, the assigned Partners and Needibi staff.
    </div>
  )
}

export function Timeline({ item }) {
  const created = new Date(item.createdAt).getTime()
  const events = [
    ['Submitted', 'Posted by the Needer', 0],
    ['Validated', 'Passed the policy check', 0.4],
    ['Matching', 'Matched with verified Partners nearby', 1.2],
    ...(item.offerSlots?.used ? [['Offers received', `${item.offerSlots.used} offer(s) received`, 3]] : []),
    ...(['negotiating', 'agreement_signed', 'payment_verified', 'in_service', 'delivered', 'completed'].includes(item.status) ? [['Offer accepted', 'Chat unlocked with the chosen Partner', 6]] : []),
    ...(['payment_verified', 'in_service', 'delivered', 'completed'].includes(item.status) ? [['Paid into escrow', 'Payment verified and held', 9]] : []),
    ...(['delivered', 'completed'].includes(item.status) ? [['Delivered', 'Partner uploaded evidence', 30]] : []),
    ...(item.status === 'completed' ? [['Completed', 'Needer confirmed satisfaction · escrow released', 34]] : []),
  ]
  return (
    <ol className="relative space-y-5 border-l-2 border-border pl-6">
      {events.map(([t, d, h]) => (
        <li key={t} className="relative">
          <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-trust-600 ring-4 ring-bg" />
          <p className="font-semibold text-text">{t}</p>
          <p className="text-sm text-muted">
            {d} · {formatDate(new Date(created + h * 3600000).toISOString(), { hour: '2-digit', minute: '2-digit' })}
          </p>
        </li>
      ))}
    </ol>
  )
}

export function BundleDetail() {
  const { code } = useParams()
  const { user } = useSession()
  const { data, isLoading, isError } = useQuery({ queryKey: ['bundles', code], queryFn: () => api.one('bundles', code), retry: false })
  if (isLoading) return <DetailSkeleton />
  if (isError) return <NotFoundItem kind="Bundle" />
  return (
    <div className="container-page py-6">
      <BackButton fallback="/bundles" />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link to="/bundles" className="hover:text-text">Bundles</Link> › <span className="text-text">{data.code}</span>
      </nav>
      {user?.id === data.posterId && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card bg-info-100 px-4 py-3 text-sm text-info-fg">
          This is your Bundle.
          <Button size="sm" variant="navy" to={`/app/needer/bundles/${data.code}`}>Manage my Bundle</Button>
        </div>
      )}
      <BundleView bundle={data} />
    </div>
  )
}

/* ================================================================ Deal detail (PDP) */
function RatingBreakdown({ deal, filter, onFilter }) {
  const total = deal.ratingBreakdown.reduce((a, b) => a + b, 0)
  const [filled, setFilled] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return (
    <div>
      <div className="flex items-end gap-3">
        <p className="tabular font-display text-5xl font-extrabold leading-none tracking-tight text-text">{deal.rating.toFixed(1)}</p>
        <div className="pb-0.5">
          <Rating value={deal.rating} showValue={false} size={15} />
          <p className="mt-0.5 text-xs text-text/70">Based on <span className="tabular font-semibold text-text">{formatNumber(deal.reviewCount)}</span> reviews</p>
        </div>
      </div>
      <ul className="mt-5 space-y-1">
        {deal.ratingBreakdown.map((n, i) => {
          const stars = 5 - i
          const pct = Math.round((n / total) * 100)
          return (
            <li key={stars}>
              <button type="button" onClick={() => onFilter(filter === stars ? 0 : stars)} aria-pressed={filter === stars} className={cn('flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-sm transition hover:bg-surface', filter === stars && 'bg-surface shadow-card')}>
                <span className="flex w-8 items-center gap-0.5 font-semibold text-text">{stars}<Star size={12} className="fill-action text-action" /></span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/80 dark:bg-white/10" aria-hidden="true">
                  <span className="block h-full rounded-full bg-action transition-[width] duration-700 ease-out" style={{ width: filled ? `${pct}%` : 0, transitionDelay: `${i * 70}ms` }} />
                </span>
                <span className="tabular w-9 text-right text-xs font-medium text-text/70">{pct}%</span>
              </button>
            </li>
          )
        })}
      </ul>
      {filter > 0 && (
        <button type="button" onClick={() => onFilter(0)} className="mt-3 text-xs font-semibold text-action-fg hover:underline">Show all ratings</button>
      )}
    </div>
  )
}

function ReviewList({ partnerId, starFilter }) {
  const [all, setAll] = useState(false)
  const { data } = useQuery({ queryKey: ['reviews', partnerId, starFilter], queryFn: () => api.list('reviews', { partnerId, status: 'published', pageSize: 12, sort: '-createdAt', ...(starFilter ? { rating: starFilter } : {}) }) })
  const reviews = data?.data ?? []
  const shown = all ? reviews : reviews.slice(0, 4)
  return (
    <div className="min-w-0">
      <ul className="grid gap-4 md:grid-cols-2">
        {shown.map((r, n) => (
          <li key={r.id} className={cn('pastel-card animate-fade-up relative flex flex-col !p-5', ['pastel-blue', 'pastel-green', 'pastel-pink', 'pastel-blue'][n % 4])} style={{ animationDelay: `${(n % 4) * 60}ms` }}>
            <Quote size={28} className="absolute right-5 top-5 text-text/10" aria-hidden="true" />
            <div className="flex items-center gap-3">
              <Avatar name={r.authorName} hue={r.authorHue} size={44} ring className="ring-2 ring-white/80" />
              <div className="min-w-0">
                <p className="font-semibold text-text">{r.authorName}</p>
                <p className="text-xs text-text/70">{r.district} · {formatDate(r.createdAt)}</p>
              </div>
            </div>
            <Rating value={r.rating} showValue={false} size={12} className="mt-3" />
            <p className="mt-2 text-[15px] leading-6 text-text">“{r.comment}”</p>
            {r.reply && (
              <div className="mt-4 flex gap-2.5 rounded-2xl bg-white/75 p-3 text-sm shadow-sm dark:bg-white/5">
                <CornerDownRight size={16} className="mt-0.5 shrink-0 text-action" aria-hidden="true" />
                <div>
                <p className="font-semibold text-primary">Reply from {r.partnerName}</p>
                <p className="mt-0.5 leading-5 text-text/80">{r.reply}</p>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      {reviews.length === 0 && data && <EmptyState compact title="No reviews match" />}
      {!all && reviews.length > 4 && (
        <Button variant="outline" className="mt-8" onClick={() => setAll(true)}>Show all reviews</Button>
      )}
    </div>
  )
}

function OfferBox({ deal, boxRef, id }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const gate = useGatedAction()
  const { locationSet, country, countryName: detectedCountryName, district, sector, cell, village } = useUI()
  const now = useNow(60_000)
  const [qty, setQty] = useState(1)
  const [date, setDate] = useState(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10))
  const [locationOpen, setLocationOpen] = useState(false)
  const label = { book: t('actions.bookNow'), get: t('actions.getDeal'), request: t('actions.request') }[deal.primaryAction]
  const go = gate(() => navigate(`/app/needer/checkout/${deal.slug}?qty=${qty}&date=${date}&area=${encodeURIComponent(areaSel)}`), { roles: ['needer', 'agent'], reason: `Sign in to ${label.toLowerCase()}` })
  const hasDeliveryLocation = Boolean(locationSet && (sector || district))
  const locationLabel = sector || district || detectedCountryName || countryName(country || 'RW')
  const locationMeta = [cell, village, district, detectedCountryName || countryName(country || 'RW')].filter(Boolean).join(' · ')
  const ended = deal.endsAt && countdown(deal.endsAt, now) === 'Ended'
  const areaSel = deal.coverage.includes(district) ? district : deal.coverage[0]
  const startBooking = () => {
    if (ended) return
    if (!hasDeliveryLocation) {
      setLocationOpen(true)
      return
    }
    go()
  }
  return (
    <div ref={boxRef} id={id} className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p key={qty} className="tabular animate-fade-in font-display text-3xl font-extrabold tracking-tight text-text">{formatMoney(deal.price.amount * qty)}</p>
            {deal.oldPrice && (
              <p className="tabular mt-0.5 text-sm text-muted">
                <span className="line-through">{formatMoney(deal.oldPrice.amount * qty)}</span>
                <span className="ml-2 font-semibold text-danger-fg">Save {deal.discountPct}%</span>
              </p>
            )}
          </div>
        </div>
        {deal.endsAt && !ended && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-danger-fg">
            <Timer size={15} /> Offer ends in {countdown(deal.endsAt, now).replace(' left', '')}
          </p>
        )}
        {ended && <p className="mt-2 text-sm font-semibold text-danger-fg">This offer has ended</p>}
      </div>
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-action-100 text-action-fg"><MapPin size={15} /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Deliver to</p>
            <p className="truncate text-sm font-bold text-text">{hasDeliveryLocation ? locationLabel : 'Add your delivery location'}</p>
            {hasDeliveryLocation && locationMeta && <p className="truncate text-[11px] text-muted" title={locationMeta}>{locationMeta}</p>}
          </div>
        </div>
        <LocationPicker onDark={false} compact triggerLabel={hasDeliveryLocation ? 'Change' : 'Add'} open={locationOpen} onOpenChange={setLocationOpen} onSaved={() => { setLocationOpen(false); if (!ended) go() }} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">{(p) => <Input {...p} type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />}</Field>
        <div>
          <p className="mb-1.5 text-sm font-semibold text-text" id={`${id}-qty`}>Quantity</p>
          <div className="flex h-11 items-center rounded-[10px] border border-border-strong" role="group" aria-labelledby={`${id}-qty`}>
            <button type="button" aria-label="Decrease quantity" className="flex h-full w-10 items-center justify-center text-text disabled:opacity-40" disabled={qty <= 1} onClick={() => setQty((q) => q - 1)}><Minus size={16} /></button>
            <span className="tabular flex-1 text-center font-semibold" aria-live="polite">{qty}</span>
            <button type="button" aria-label="Increase quantity" className="flex h-full w-10 items-center justify-center text-text disabled:opacity-40" disabled={deal.orderLimit && qty >= deal.orderLimit} onClick={() => setQty((q) => q + 1)}><Plus size={16} /></button>
          </div>
        </div>
      </div>
      <Button variant="primary" size="lg" block disabled={ended} onClick={startBooking} className="transition-[transform,box-shadow,background] enabled:hover:-translate-y-0.5 enabled:hover:shadow-hover">
        {ended ? 'This offer has ended' : hasDeliveryLocation ? <>{label} <ArrowRight size={18} /></> : <><MapPin size={17} /> Add location to continue</>}
      </Button>
      {ended ? (
        <p className="text-sm text-muted">Browse <Link to="/deals" className="font-semibold text-action-fg underline">current Deals</Link> or post a Need and Partners will send you offers.</p>
      ) : (
        <p className="flex gap-2 rounded-lg bg-trust-100/60 px-3 py-2.5 text-xs leading-5 text-muted">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-trust-fg" />
          <span>You review a summary first. Your payment is held in escrow and released only when you confirm the job is done.</span>
        </p>
      )}
    </div>
  )
}

/** Deal photos, video and audio in the shared gallery, with the discount badge on top. */
function DealHeroMedia({ deal }) {
  return (
    <div className="relative">
      <MediaGallery item={deal} media={deal.media ?? []} />
      {deal.discountPct > 0 && <span className="pointer-events-none absolute left-4 top-4 rounded-lg bg-danger-600 px-2.5 py-1 text-sm font-bold text-white shadow-card">-{deal.discountPct}%</span>}
    </div>
  )
}

function DealHeaderActions({ deal }) {
  const share = useShare()
  const { loved, saved, love, save } = useLoveSave(deal)
  const btn = 'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-text underline-offset-2 transition hover:bg-surface-2 hover:underline'
  return (
    <div className="-ml-3 flex shrink-0 items-center sm:ml-0">
      <button type="button" className={btn} onClick={() => share({ title: deal.title, path: `/deals/${deal.slug}` })}><Share size={16} /> Share</button>
      <button type="button" className={btn} onClick={save} aria-pressed={saved}><Bookmark size={16} className={saved ? 'fill-action-600 text-action-600' : ''} /> {saved ? 'Saved' : 'Save'}</button>
      <button type="button" className={btn} onClick={love} aria-pressed={loved}><Heart size={16} className={loved ? 'animate-heart fill-danger-600 text-danger-600' : ''} /> {loved ? 'Loved' : 'Love'}</button>
      <CardMenu item={deal} compact showMessage={false} showShare={false} />
    </div>
  )
}

/** Public questions stay out of the way until someone wants to ask one. */
function DealQuestions({ deal }) {
  const [open, setOpen] = useState(() => window.location.hash === '#messages')
  return (
    <section id={open ? undefined : 'messages'} className="scroll-mt-32 border-t border-border py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-text">Messages</h2>
          <p className="mt-1 text-sm text-muted">Questions and honest comments about this deal, reviewed before they go public.</p>
        </div>
        {!open && <Button variant="outline" onClick={() => setOpen(true)}>Write a message</Button>}
      </div>
      {open && (
        <div className="mt-6 max-w-3xl">
          <PublicMessages target={deal.slug} kind="deal" title={deal.title} />
        </div>
      )}
    </section>
  )
}

/** Lean tile for "Similar" / "More from": just enough to decide whether to open the Deal. */
function RelatedDealTile({ deal }) {
  return (
    <Link to={`/deals/${deal.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition hover:-translate-y-0.5 hover:border-action-500/40 hover:shadow-hover">
      <div className="relative">
        <MediaThumb item={deal} media={deal.media} className="aspect-[16/10]" sizes="320px" />
        {deal.discountPct > 0 && <span className="absolute left-2.5 top-2.5 rounded-md bg-danger-600 px-1.5 py-0.5 text-[11px] font-bold text-white">-{deal.discountPct}%</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted">{DEAL_TYPE_LABEL[deal.type] ?? 'Deal'} · {deal.categoryName}</p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text group-hover:text-action-fg">{deal.title}</h3>
        <Rating value={deal.rating} count={deal.reviewCount} size={11} className="text-xs" />
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <p className="flex flex-wrap items-baseline gap-x-1.5">
            <span className="tabular font-bold text-text">{formatMoney(deal.price)}</span>
            {deal.oldPrice && <span className="tabular text-xs text-muted line-through">{formatMoney(deal.oldPrice)}</span>}
          </p>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-action-100 text-action-fg transition group-hover:bg-action-600 group-hover:text-white"><ArrowRight size={14} /></span>
        </div>
        <p className="flex items-center gap-1 truncate border-t border-border pt-2 text-xs text-muted">
          {deal.partner.verified && <BadgeCheck size={13} className="shrink-0 text-trust-fg" aria-label="Verified Partner" />}
          <span className="truncate">{deal.partner.name}</span>
        </p>
      </div>
    </Link>
  )
}

function RelatedDeals({ title, items, to, exclude }) {
  const seen = new Set([exclude])
  const unique = (items ?? []).filter((d) => !seen.has(d.title) && seen.add(d.title))
  if (!unique.length) return null
  return (
    <section className="mt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h2 className="flex items-center gap-3 font-display text-2xl font-extrabold tracking-tight text-text">
          <span className="h-1 w-7 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" /> {title}
        </h2>
        <Button variant="outline" size="sm" to={to} className="rounded-full">See all <ArrowRight size={15} /></Button>
      </div>
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {unique.slice(0, 4).map((d, n) => (
          <Reveal key={d.id} delay={n * 80} className="h-full">
            <RelatedDealTile deal={d} />
          </Reveal>
        ))}
      </div>
    </section>
  )
}

const HIGHLIGHT_ICONS = [UserCheck, Truck, RotateCcw, ShieldCheck]

export function DealDetail() {
  const { slug } = useParams()
  const [sp] = useSearchParams()
  const boxRef = useRef(null)
  const [starFilter, setStarFilter] = useState(0)
  const { country, countryName: detectedCountryName, enabledCountries } = useUI()
  const marketCountry = country || 'RW'
  const marketLabel = detectedCountryName || countryName(marketCountry)
  const canSeeDeals = enabledCountries.includes(marketCountry)
  const { data: deal, isLoading, isError } = useQuery({ queryKey: ['deals', slug], queryFn: () => api.one('deals', slug), retry: false })
  const similar = useQuery({ queryKey: ['deals', 'similar', deal?.category], queryFn: () => api.list('deals', { category: deal.category, status: 'published', pageSize: 8 }), enabled: !!deal })
  const more = useQuery({ queryKey: ['deals', 'partner', deal?.partnerId], queryFn: () => api.list('deals', { partnerId: deal.partnerId, status: 'published', pageSize: 8 }), enabled: !!deal })
  const offerId = () => (window.innerWidth >= 1024 ? 'offer-box' : 'offer-box-m')
  useEffect(() => {
    if (deal && sp.get('book')) document.getElementById(offerId())?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [deal, sp])
  if (isLoading) return <DealSkeleton />
  if (isError) return <NotFoundItem kind="Deal" />
  if (!canSeeDeals) return <EmptyState title={`This Deal is not available in ${marketLabel}`} description="Needibi is not serving Deals in this country yet." action={<Button to="/deals" variant="primary">Browse available Deals</Button>} />
  const primaryLabel = deal.primaryAction === 'book' ? 'Book now' : deal.primaryAction === 'get' ? 'Get deal' : 'Request'
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 pb-32 md:px-6 md:pb-12">
      <BackButton fallback="/deals" />
      <nav aria-label="Breadcrumb" className="mb-5 flex min-w-0 items-center gap-1.5 text-sm text-muted">
        <Link to="/deals" className="hover:text-text">Deals</Link>
        <ChevronRight size={14} className="shrink-0" />
        <Link to={`/categories/${deal.category}`} className="shrink-0 hover:text-text">{deal.categoryName}</Link>
        <ChevronRight size={14} className="shrink-0" />
        <span className="truncate text-text" aria-current="page">{deal.title}</span>
      </nav>

      <Reveal as="header" className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[28px] font-extrabold leading-tight tracking-tight text-text sm:text-4xl">{deal.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1 font-semibold text-text"><Star size={15} className="fill-warn-500 text-warn-500" /> {deal.rating.toFixed(1)}</span>
            <span aria-hidden="true">·</span>
            <a href="#reviews" className="font-medium text-text underline underline-offset-2 hover:text-action-fg">{formatNumber(deal.reviewCount)} reviews</a>
            <span aria-hidden="true">·</span>
            <span>{DEAL_TYPE_LABEL[deal.type] ?? 'Deal'}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1"><MapPin size={14} /> {deal.coverage.join(', ')}</span>
          </p>
        </div>
        <DealHeaderActions deal={deal} />
      </Reveal>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-16">
        <Reveal delay={80} className="min-w-0">
          <DealHeroMedia deal={deal} />

          <div className="flex items-center justify-between gap-4 border-b border-border py-6">
            <Link to={`/partners/${deal.partner.handle}`} className="flex min-w-0 items-center gap-3">
              <Avatar name={deal.partner.name} hue={deal.partner.avatarHue} size={48} />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-bold text-text hover:text-action-fg">
                  <span className="truncate">{deal.partner.name}</span> {deal.partner.verified && <BadgeCheck size={16} className="shrink-0 text-trust-fg" aria-label="Verified Partner" />}
                </span>
                <span className="block text-sm text-muted">{deal.partner.verified ? 'Verified Partner' : 'Partner'}{deal.partner.rating ? ` · ★ ${deal.partner.rating.toFixed(1)}` : ''}</span>
              </span>
            </Link>
            <FollowButton partner={deal.partner} size="sm" />
          </div>

          <div className="lg:hidden">
            <div className="h-6" />
            <OfferBox deal={deal} id="offer-box-m" />
          </div>

          <section className="border-b border-border py-8">
            <h2 className="mb-4 font-display text-xl font-bold tracking-tight text-text">What's included</h2>
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {deal.inclusions.map((inc, n) => {
                const HighlightIcon = HIGHLIGHT_ICONS[n % HIGHLIGHT_ICONS.length]
                return (
                  <li key={inc} className="flex items-center gap-3 text-[15px] text-text">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-text"><HighlightIcon size={19} strokeWidth={1.8} /></span> {inc}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="py-8">
            <h2 className="mb-3 font-display text-xl font-bold tracking-tight text-text">About this Deal</h2>
            <p className="max-w-2xl text-[15px] leading-7 text-text">{deal.description}</p>
            {deal.specs.some(([k]) => !['Category', 'Type'].includes(k)) && (
              <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                {deal.specs.filter(([k]) => !['Category', 'Type'].includes(k)).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="text-sm font-semibold text-text">{v}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </Reveal>

        <aside className="hidden lg:block">
          <div className="sticky top-32">
            <Reveal delay={160}>
              <OfferBox deal={deal} boxRef={boxRef} id="offer-box" />
            </Reveal>
          </div>
        </aside>
      </div>

      <Reveal as="section" id="reviews" aria-labelledby="reviews-h" className="scroll-mt-32 border-t border-border py-10">
        <h2 id="reviews-h" className="mb-6 flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-text">
          <Star size={22} className="fill-warn-500 text-warn-500" /> {deal.rating.toFixed(1)} · {formatNumber(deal.reviewCount)} reviews
        </h2>
        <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
          <RatingBreakdown deal={deal} filter={starFilter} onFilter={setStarFilter} />
          <ReviewList key={starFilter} partnerId={deal.partnerId} starFilter={starFilter} />
        </div>
      </Reveal>

      <DealQuestions deal={deal} />

      <RelatedDeals title="You may also like" to={`/deals?category=${deal.category}`} items={[...(similar.data?.data ?? []), ...(more.data?.data ?? [])]} exclude={deal.title} />

      <MobileActionBar>
        <div className="flex items-center gap-3">
          <span className="tabular text-lg font-extrabold text-text">{formatMoney(deal.price)}</span>
          <Button variant="primary" block onClick={() => document.getElementById(offerId())?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            {primaryLabel}
          </Button>
        </div>
      </MobileActionBar>
    </div>
  )
}

/* ================================================================ Partner profile (public) */
function PartnerStats({ p }) {
  const tiles = [
    [Star, 'Rating', p.rating.toFixed(1), `${formatNumber(p.reviewCount)} reviews`],
    [Zap, 'Completed jobs', formatNumber(p.completedJobs), 'on Needibi Serve'],
    [Timer, 'On-time delivery', `${p.onTime}%`, 'of agreed deadlines'],
    [Gauge, 'Response rate', `${p.responseRate}%`, `replies ${p.responseTime}`],
  ]
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {tiles.map(([TileIcon, label, value, hint], i) => (
        <div key={label} className={cn('pastel-card animate-fade-up !p-5', ['pastel-blue', 'pastel-green', 'pastel-blue', 'pastel-pink'][i])} style={{ animationDelay: `${i * 70}ms` }}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-primary dark:bg-white/10"><TileIcon size={18} strokeWidth={2.2} /></span>
          <p className="mt-4 text-sm font-medium text-text/80">{label}</p>
          <p className="tabular mt-1 font-display text-3xl font-extrabold tracking-tight text-text">{value}</p>
          <p className="text-xs text-text/70">{hint}</p>
        </div>
      ))}
    </div>
  )
}

export function PartnerProfile() {
  const { handle } = useParams()
  const gate = useGatedAction()
  const openAction = useCardActions((s) => s.open)
  const [starFilter, setStarFilter] = useState(0)
  const { data: p, isLoading, isError } = useQuery({ queryKey: ['partners', handle], queryFn: () => api.one('partners', handle), retry: false })
  const deals = useQuery({ queryKey: ['deals', 'partner', p?.id], queryFn: () => api.list('deals', { partnerId: p.id, status: 'published', pageSize: 12 }), enabled: !!p })
  if (isLoading) return <DetailSkeleton />
  if (isError) return <NotFoundItem kind="Partner" />
  return (
    <div>
      <section className="public-gradient-hero">
        <div className="container-page grid gap-8 py-9 sm:py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="animate-fade-in">
            <BackButton fallback="/partners" onDark />
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-white/70">
              <Link to="/partners" className="hover:text-white">Partners</Link>
              <ChevronRight size={12} aria-hidden="true" />
              <span className="text-white" aria-current="page">{p.name}</span>
            </nav>
            <div className="mt-5 flex items-center gap-4">
              <Avatar name={p.name} hue={p.avatarHue} size={80} ring className="shrink-0 ring-4 ring-white/20" />
              <div className="min-w-0">
                <p className="text-sm font-semibold capitalize text-white/85">{p.categories.map((c) => c.replace(/-/g, ' ')).join(' · ')}</p>
                <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
                  {p.name} {p.verified && <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-sm tracking-normal"><VerifiedBadge /></span>}
                </h1>
              </div>
            </div>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">{p.bio}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <LevelBadge level={p.level} />
              <span className="inline-flex items-center gap-1 font-semibold text-white"><Star size={15} className="text-white" fill="currentColor" /> {p.rating.toFixed(1)}</span>
              <span>{formatNumber(p.reviewCount)} reviews</span>
              <span aria-hidden="true">·</span>
              <span>{formatCompact(p.followers)} followers</span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="primary" size="lg" className="bg-white text-primary-900 hover:bg-action-100" onClick={() => document.getElementById('partner-deals')?.scrollIntoView({ behavior: 'smooth' })}>See their deals <ArrowRight size={17} /></Button>
              <FollowButton partner={p} size="lg" />
            </div>
          </div>
          <div className="animate-fade-up lg:pl-8" style={{ animationDelay: '120ms' }}>
            <div className="public-hero-card rounded-2xl p-6 sm:p-7">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white/85">Why customers pick {p.name}</span>
                <ShieldCheck size={18} className="text-white" />
              </div>
              <h2 className="mt-4 text-2xl font-extrabold text-white">Checked, reviewed and on time.</h2>
              <ul className="mt-5 space-y-2.5">
                {[
                  [UserCheck, p.verified ? 'Identity checked' : 'Check in progress', p.verified ? 'Needibi checked who they are before they could work here.' : 'Needibi is still checking this partner.'],
                  [MapPin, 'Works in', p.areas.join(', ')],
                  [Languages, 'Speaks', p.languages.join(', ')],
                ].map(([HeroIcon, label, text]) => (
                  <li key={label} className="flex gap-3 rounded-2xl border border-white/15 bg-white/10 p-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-primary-900"><HeroIcon size={18} /></span>
                    <span><strong className="block text-sm text-white">{label}</strong><span className="mt-0.5 block text-xs leading-5 text-white/65">{text}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <div className="container-page py-9 sm:py-12">
        <PartnerStats p={p} />
        <div className="mt-8 grid gap-8 lg:grid-cols-[320px_1fr]">
          <aside className="space-y-4">
            <div className="pastel-card pastel-blue">
              <h2 className="text-lg font-semibold text-text">About this partner</h2>
              <dl className="mt-4 space-y-3 text-sm">
                {[
                  [Layers, 'Categories', p.categories.map((c) => c.replace(/-/g, ' ')).join(', ')],
                  [MapPin, 'Areas served', p.areas.join(', ')],
                  [Languages, 'Languages', p.languages.join(', ')],
                  [CalendarDays, 'Member since', formatDate(p.memberSince, { day: undefined })],
                  [Timer, 'Response time', `${p.responseTime} · ${p.responseRate}% response rate`],
                  [Gauge, 'Reliability score', `${p.reliability} / 100`],
                  [Zap, 'Completed jobs', formatNumber(p.completedJobs)],
                ].map(([Icon, k, v]) => (
                  <div key={k} className="flex gap-3">
                    <Icon size={16} className="mt-0.5 shrink-0 text-text/70" aria-hidden="true" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-text/70">{k}</dt>
                      <dd className="capitalize text-text">{v}</dd>
                    </div>
                  </div>
                ))}
              </dl>
              <p className="mt-5 flex items-start gap-2 rounded-2xl bg-white/60 p-3 text-xs leading-5 text-text/80 dark:bg-white/5">
                <Lock size={13} /> Contacts, links and documents are never shown. Chat opens inside an agreed transaction.
              </p>
            </div>
            <div className="pastel-card pastel-green">
              <p className="text-sm font-semibold text-text">Reliability</p>
              <ProgressBar value={p.reliability} className="mt-2" label="Reliability" />
              <p className="mt-3 text-sm font-semibold text-text">On-time delivery</p>
              <ProgressBar value={p.onTime} className="mt-2" tone="info" label="On-time" />
            </div>
          </aside>
          <div className="min-w-0 space-y-10">
            <section>
              <h2 id="partner-deals" className="mb-4 scroll-mt-32 font-display text-3xl font-extrabold tracking-tight text-primary">Deals ({deals.data?.meta.total ?? '…'})</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{deals.data?.data.map((d) => <DealCard key={d.id} deal={d} />)}</div>
              {deals.data?.meta.total === 0 && <EmptyState compact title="No Deals yet" description="Follow to hear when this Partner publishes one." />}
            </section>
            <section id="reviews" className="scroll-mt-32">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-display text-3xl font-extrabold tracking-tight text-primary">
                  <Star className="text-action" fill="currentColor" /> {p.rating.toFixed(1)} · {formatNumber(p.reviewCount)} reviews
                </h2>
                <Button variant="outline" onClick={gate(() => openAction('review', { ...p, kind: 'partner', title: p.name }), { roles: ['needer', 'agent'], reason: 'Sign in to rate this Partner' })}>
                  <Star size={16} /> Rate this Partner
                </Button>
              </div>
              <div className="grid gap-8 xl:grid-cols-[260px_1fr]">
                <div className="pastel-card pastel-pink h-fit !p-5">
                  <RatingBreakdown deal={{ rating: p.rating, reviewCount: p.reviewCount, ratingBreakdown: p.ratingBreakdown ?? [70, 17, 7, 3, 3] }} filter={starFilter} onFilter={setStarFilter} />
                </div>
                <ReviewList key={starFilter} partnerId={p.id} starFilter={starFilter} />
              </div>
              <p className="mt-4 text-xs text-muted">Only Needers with a completed job can leave a review. Reviews are checked before they appear.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
