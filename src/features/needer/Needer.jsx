import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ClipboardList, Activity, CircleCheck, Wallet, Eye, Pencil, Repeat, FilePen, Archive, Download, Receipt as ReceiptIcon, Undo, TriangleAlert, ShoppingBag, Layers, Star, UserPlus, Camera, Heart, RotateCcw, Timer, ArrowUpRight, MapPin, BriefcaseBusiness, CalendarDays, Building2, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession } from '@/lib/hooks'
import { useAuth, useEngagement, toast } from '@/lib/store'
import { formatMoney, formatDate, ago } from '@/lib/format'
import { NEED_STATUS_TABS, PAYMENT_METHODS } from '@/lib/status'
import { CATEGORIES, DISTRICTS } from '@/mocks/seed'
import { Button, IconButton, KpiTile, Card, CardTitle, EmptyState, StatusBadge, Badge, Dialog, Tabs, TabList, Tab, TabPanel, ProgressBar, StarInput, Textarea, Field, Avatar, VerifiedBadge, Input, Select, Skeleton, RecurringChip, Chip } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'
import { ActionNeededBanner } from '@/components/layout/Banners'
import { DataTable, RowMenu } from '@/components/tables/DataTable'
import { col } from '@/components/tables/columns'
import { NeedCard, BundleCard } from '@/components/cards/NeedCard'
import { DealCard } from '@/components/cards/DealCard'
import { PartnerCard } from '@/components/cards/PartnerCard'
import { APP_CARD_GRID } from '@/components/cards/AnyCard'
import { useCardActions } from '@/components/cards/actionsStore'
import { Receipt } from '@/components/payments/Payments'
import { FileUploader } from '@/components/forms/inputs'

const CAT_OPTIONS = CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))
const URGENCY_OPTIONS = ['urgent', 'high', 'medium', 'low'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))
const DATE_FILTER = { id: 'since', label: 'Date', options: [{ value: '7d', label: 'Last 7 days' }, { value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }, { value: '365d', label: 'Last year' }] }
const hideClosed = { id: 'showClosed', label: 'Show closed', paramOff: { status_nin: 'closed,archived' } }

/* ================================================================ Dashboard */
export function NeederDashboard() {
  const assisted = useAuth((s) => !!s.assistedBy)
  const { user } = useSession()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['dashboard', 'needer', user.id], queryFn: () => api.get('/api/dashboard/needer', { userId: user.id }) })
  const recent = useQuery({ queryKey: ['needs', 'mine-recent', user.id], queryFn: () => api.list('needs', { posterId: user.id, pageSize: 4, sort: '-createdAt', status_nin: 'closed,archived' }) })
  const offers = useQuery({ queryKey: ['offers', 'awaiting', user.id], queryFn: () => api.list('offers', { neederId: user.id, status: 'submitted,revised', pageSize: 5, sort: '-createdAt' }) })
  const k = data?.kpis
  const needs = recent.data?.data ?? []
  return (
    <div className="reference-dashboard">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-action-fg">Customer workspace</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-[-0.04em] text-text sm:text-[30px]">Current requests</h1>
        </div>
        <Button variant="primary" onClick={() => navigate('/app/needer/post')}><Plus size={17} /> Request a service</Button>
      </div>
      <ActionNeededBanner actions={data?.actions} needer={assisted ? user : undefined} className="mb-5" />
      {recent.data?.meta.total === 0 && <GetStarted firstName={user.firstName ?? user.name?.split(' ')[0]} />}
      <div className="reference-kpis grid grid-cols-2 gap-4 xl:grid-cols-4">
        <ReferenceStat label="Open requests" value={isLoading ? '…' : k?.active} tone="blue" icon={<ClipboardList />} to="/app/needer/needs?tab=matching" />
        <ReferenceStat label="Being served" value={isLoading ? '…' : k?.inProgress} tone="navy" icon={<Activity />} to="/app/needer/needs?tab=in_progress" />
        <ReferenceStat label="Finished requests" value={isLoading ? '…' : k?.completed} tone="green" icon={<CircleCheck />} to="/app/needer/needs?tab=done" />
        <ReferenceStat label="Request a service" value="Create new" tone="create" icon={<Plus />} to="/app/needer/post" />
      </div>
      <Card className="reference-openings mt-5" padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-display text-base font-bold tracking-[-0.02em] text-text">Current requests & service activity</h2>
            <p className="mt-0.5 text-xs text-muted">Track your latest requests and review incoming offers.</p>
          </div>
          <Button variant="subtle" size="sm" to="/app/needer/needs"><SlidersHorizontal size={14} /> Filter</Button>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5">
          {needs.map((n, index) => <ReferenceNeedCard key={n.id} need={n} index={index} />)}
          {needs.length === 0 && <EmptyState compact title="No requests yet" description="Ask for your first service — it is free." action={<Button to="/app/needer/post" variant="primary" size="sm">Request a service</Button>} />}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-2/60 px-5 py-3 text-xs text-muted sm:px-6">
          <span>Showing {needs.length} of {recent.data?.meta.total ?? 0} requests</span>
          <Button variant="link" size="xs" to="/app/needer/needs">View all requests <ArrowUpRight size={13} /></Button>
        </div>
      </Card>
      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card className="min-w-0">
          <CardTitle action={<Button variant="link" size="xs" to="/app/needer/offers">See all offers <ArrowUpRight size={13} /></Button>}>Offers to review</CardTitle>
          <ul className="space-y-3">
            {offers.data?.data.map((o) => (
              <li key={o.id} className="flex min-w-0 items-center gap-3 rounded-xl bg-surface/70 p-2.5">
                <Avatar name={o.partner.name} hue={o.partner.avatarHue} size={34} />
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text">{o.partner.name}</span><span className="block truncate text-xs text-muted">{o.needTitle}</span></span>
                <span className="tabular text-sm font-bold text-action-fg">{formatMoney(o.price)}</span>
                <Button size="xs" variant="outline" to={`/app/needer/needs/${o.needCode}`}>Review</Button>
              </li>
            ))}
          </ul>
          {offers.data && offers.data.data.length === 0 && <p className="rounded-xl bg-surface/70 px-4 py-3 text-sm text-muted">No offers waiting. New quotes from partners show up here as they arrive.</p>}
        </Card>
        <Card>
          <CardTitle>Payment overview</CardTitle>
          <p className="font-display text-3xl font-bold tracking-[-0.04em] text-text">{isLoading ? '…' : formatMoney(k?.totalSpent ?? 0)}</p>
          <p className="mt-1 text-sm text-muted">Protected payments across completed services.</p>
          <Button className="mt-4" size="sm" variant="outline" to="/app/needer/payments"><Wallet size={15} /> Open payments</Button>
        </Card>
      </div>
    </div>
  )
}

const GET_STARTED = [
  { icon: Plus, title: 'Post your first Need', text: 'Say what you need, where and when. It is free, and verified Partners send you offers.', to: '/app/needer/post', cta: 'Request a service' },
  { icon: ShoppingBag, title: 'Or book a ready Deal', text: 'Fixed-price services you can book straight away, with your money held safely until you confirm.', to: '/deals', cta: 'Browse Deals' },
  { icon: UserPlus, title: 'Complete your profile', text: 'Add your sector and a photo so Partners can find and serve you faster.', to: '/app/needer/profile', cta: 'Open profile' },
]

function GetStarted({ firstName }) {
  return (
    <Card className="mb-5">
      <CardTitle sub="Three quick ways to get your first service. You can come back to this any time.">{firstName ? `Welcome, ${firstName}. Here is how to start` : 'Here is how to start'}</CardTitle>
      <ol className="grid gap-3 sm:grid-cols-3">
        {GET_STARTED.map((s, i) => (
          <li key={s.to} className="flex flex-col rounded-xl border border-border bg-surface-2/50 p-4">
            <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted"><span className="grid size-7 place-items-center rounded-full bg-action-100 text-action-fg"><s.icon size={15} /></span>Step {i + 1}</span>
            <strong className="mt-3 text-sm font-bold text-text">{s.title}</strong>
            <p className="mt-1 flex-1 text-xs leading-5 text-muted">{s.text}</p>
            <Button className="mt-3 self-start" size="sm" variant={i === 0 ? 'primary' : 'outline'} to={s.to}>{s.cta}</Button>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function ReferenceStat({ label, value, icon, tone, to }) {
  return <Link to={to} className={cn('reference-stat group', `reference-stat-${tone}`)}><span className="reference-stat-icon">{icon}</span><span className="min-w-0 flex-1"><span className="block text-xs font-medium opacity-90">{label}</span><strong className="mt-1 block truncate text-xl font-bold tracking-[-0.03em]">{value}</strong></span><ArrowUpRight size={21} className="shrink-0 opacity-90 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>
}

function ReferenceNeedCard({ need, index }) {
  return (
    <Link to={`/app/needer/needs/${need.code}`} className="reference-need-card animate-fade-up" style={{ animationDelay: `${index * 70}ms` }}>
      <div className="flex items-start gap-3">
        <span className="reference-need-mark"><BriefcaseBusiness size={18} /></span>
        <span className="min-w-0 flex-1"><strong className="line-clamp-2 text-sm font-bold leading-5 text-text">{need.title}</strong><span className="mt-0.5 block truncate text-xs font-semibold text-muted">{need.code}</span></span>
        <StatusBadge status={need.status} size="xs" />
      </div>
      <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted">{need.nextStep || 'Your request is moving through the Needibi matching flow.'}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted">
        <span><MapPin size={13} className="mr-1 inline" />{need.district || 'Rwanda'}</span>
        <span><CalendarDays size={13} className="mr-1 inline" />{ago(need.createdAt)}</span>
        <span className="font-semibold text-action-fg"><Building2 size={13} className="mr-1 inline" />{need.categoryName || 'Service request'}</span>
      </div>
    </Link>
  )
}

/* ================================================================ My Needs */
function NeedRowMenu({ need }) {
  const navigate = useNavigate()
  const open = useCardActions((s) => s.open)
  const qc = useQueryClient()
  return (
    <RowMenu
      items={[
        { label: 'View details', icon: <Eye />, onSelect: () => navigate(`/app/needer/needs/${need.code}`) },
        ['submitted', 'under_review', 'changes_requested', 'published', 'matching'].includes(need.status) && { label: need.status === 'changes_requested' ? 'Edit & submit revision' : 'Edit', icon: <Pencil />, onSelect: () => navigate(`/app/needer/post?edit=${need.code}`) },
        { label: 'Repost', icon: <Repeat />, onSelect: () => open('reneed', need) },
        { label: 'Re-request', icon: <FilePen />, onSelect: () => navigate(`/app/needer/post?from=${need.code}`) },
        '-',
        {
          label: 'Archive',
          icon: <Archive />,
          onSelect: async () => {
            const prev = need.status
            await api.update('needs', need.code, { status: 'archived' })
            qc.invalidateQueries({ queryKey: ['needs'] })
            toast('Need archived', { action: { label: 'Undo', onClick: async () => { await api.update('needs', need.code, { status: prev }); qc.invalidateQueries({ queryKey: ['needs'] }) } } })
          },
        },
      ]}
    />
  )
}

export const needColumns = (owner = true) => [
  col.item({ header: 'Need', href: (r) => (owner ? `/app/needer/needs/${r.code}` : `/needs/${r.code}`) }),
  col.status(),
  col.money('budget', 'Budget'),
  { ...col.text('categoryName', 'Category'), meta: { sortable: true, sortKey: 'category', className: 'whitespace-nowrap' } },
  col.slots(),
  { ...col.text('nextStep', 'Next step'), cell: ({ row }) => <span className={cn('text-sm', row.original.statusGroup === 'action_needed' ? 'font-semibold text-action-fg' : 'text-muted')}>{row.original.nextStep}</span> },
  col.date('createdAt', 'Posted', { relative: true }),
]

export function MyNeeds() {
  const { user } = useSession()
  const navigate = useNavigate()
  const qc = useQueryClient()
  return (
    <>
      <PageHeader
        title="My Needs"
        subtitle="Everything you've posted, grouped by what happens next."
        actions={
          <>
            <Button variant="primary" onClick={() => navigate('/app/needer/post')}><Plus size={18} /> Request a service</Button>
          </>
        }
      />
      <DataTable
        id="needer-needs"
        caption="My Needs"
        queryKey={['needs', 'mine']}
        fetcher={(p) => api.list('needs', p)}
        baseParams={{ posterId: user.id }}
        columns={needColumns()}
        statusTabs={{ field: 'statusGroup', tabs: NEED_STATUS_TABS }}
        filters={[{ id: 'category', label: 'Category', options: CAT_OPTIONS }, { id: 'urgency', label: 'Urgency', options: URGENCY_OPTIONS }, DATE_FILTER]}
        toggles={[hideClosed]}
        searchPlaceholder="Search needs…"
        bulkActions={[
          { label: 'Archive', icon: <Archive size={15} />, onRun: async (rows, { allMatching, total }) => { await Promise.all(rows.map((r) => api.update('needs', r.code, { status: 'archived' }))); toast(`${allMatching ? total : rows.length} Needs archived`) } },
          { label: 'Export', icon: <Download size={15} />, onRun: (rows) => toast(`Exported ${rows.length} rows`) },
        ]}
        rowActions={(row) => <NeedRowMenu need={row} />}
        viewToggle={{ card: (row) => <NeedCard need={row} owner compact /> }}
        emptyState={<EmptyState title="No Needs yet" description="Describe what you need — verified Partners will send offers." action={<Button variant="primary" to="/app/needer/post">Post your first Need</Button>} />}
        onRowClick={(row) => navigate(`/app/needer/needs/${row.code}`)}
      />
    </>
  )
}

/* ================================================================ Bundles */
export function MyBundles() {
  const { user } = useSession()
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title="My Bundles" subtitle="Several Needs, one goal. Track each item's budget and status." actions={<Button variant="primary" to="/app/needer/bundles/new"><Plus size={18} /> Build a Bundle</Button>} />
      <DataTable
        id="needer-bundles"
        caption="My Bundles"
        queryKey={['bundles', 'mine']}
        fetcher={(p) => api.list('bundles', p)}
        baseParams={{ posterId: user.id }}
        columns={[
          col.item({ header: 'Bundle', sub: (r) => `${r.code} · ${r.itemCount} items`, href: (r) => `/app/needer/bundles/${r.code}` }),
          col.custom('progress', 'Progress', (r) => (
            <div className="w-36">
              <p className="mb-1 text-xs text-muted">{r.progress.served} of {r.progress.total} served</p>
              <ProgressBar value={r.progress.served} max={r.progress.total} size="sm" label="Bundle progress" />
            </div>
          ), { value: (r) => r.progress.served }),
          col.money('totalBudget', 'Total budget'),
          col.custom('flags', 'Flags', (r) => (
            <div className="flex flex-wrap gap-1">
              {r.mixedRecurring && <RecurringChip label="Mixed" />}
              {r.blockedItems > 0 && <Badge tone="danger" iconName="Ban" size="xs">{r.blockedItems} blocked</Badge>}
              {!r.mixedRecurring && !r.blockedItems && <span className="text-muted">—</span>}
            </div>
          ), { csv: false }),
          col.status(),
          col.date('createdAt', 'Created'),
        ]}
        statusTabs={{ field: 'statusGroup', tabs: NEED_STATUS_TABS }}
        filters={[{ id: 'category', label: 'Category', options: CAT_OPTIONS }, DATE_FILTER]}
        searchPlaceholder="Search bundles…"
        viewToggle={{ card: (r) => <BundleCard bundle={r} owner /> }}
        onRowClick={(r) => navigate(`/app/needer/bundles/${r.code}`)}
        rowActions={(r) => <RowMenu items={[{ label: 'Open', icon: <Eye />, onSelect: () => navigate(`/app/needer/bundles/${r.code}`) }, { label: 'Re-create Bundle', icon: <FilePen />, onSelect: () => navigate(`/app/needer/bundles/new?from=${r.code}`) }]} />}
        emptyState={<EmptyState title="No Bundles yet" description="Furnishing a home or planning an event? Group the Needs in one Bundle." action={<Button to="/app/needer/bundles/new" variant="primary">Build a Bundle</Button>} />}
      />
    </>
  )
}

/* ================================================================ Tracking */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export function Tracking() {
  const { user } = useSession()
  const active = useQuery({ queryKey: ['needs', 'tracking', user.id], queryFn: () => api.list('needs', { posterId: user.id, statusGroup: 'in_progress,action_needed,matching', pageSize: 50, sort: 'deadline' }) })
  const bundles = useQuery({ queryKey: ['bundles', 'tracking', user.id], queryFn: () => api.list('bundles', { posterId: user.id, statusGroup: 'in_progress,action_needed,matching', pageSize: 20 }) })
  const items = [...(active.data?.data ?? []), ...(bundles.data?.data ?? [])]
  const now = Date.now()
  const overdue = items.filter((i) => i.deadline && new Date(i.deadline).getTime() < now + 2 * 86400000)
  const stepIndex = { published: 2, matching: 2, offers_received: 3, negotiating: 3, agreement_signed: 4, awaiting_payment: 5, payment_verified: 4, in_service: 4, delivered: 5 }
  const recurring = items.filter((i) => i.recurring || i.mixedRecurring)
  return (
    <>
      <PageHeader title="Tracking" subtitle="Progress, deadlines and recurring occurrences across all your Needs and Bundles." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Being tracked" value={items.length} icon={<Activity />} tone="info" />
        <KpiTile label="In service" value={items.filter((i) => i.status === 'in_service').length} icon={<Timer />} tone="navy" />
        <KpiTile label="Due within 48 h" value={overdue.length} icon={<TriangleAlert />} tone="warn" />
        <KpiTile label="Recurring" value={recurring.length} icon={<Repeat />} tone="trust" />
      </div>
      <Card className="mt-6">
        <CardTitle sub="Next 7 days">Recurring occurrence calendar</CardTitle>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
          {DAYS.map((d, di) => (
            <div key={d} className="min-w-0">
              <p className="mb-1.5 font-bold text-muted">{d}</p>
              <div className="min-h-24 space-y-1 rounded-lg bg-surface-2 p-1">
                {recurring.filter((_, i) => (i + di) % 3 === 0).slice(0, 2).map((r) => (
                  <Link key={r.id} to={`/app/needer/${r.kind === 'bundle' ? 'bundles' : 'needs'}/${r.code}`} className="block truncate rounded bg-primary-100 px-1 py-1 text-[11px] font-semibold text-primary" title={r.title}>
                    {r.recurrence?.time ?? '09:00'} {r.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <div className="mt-6 space-y-3">
        {(active.isLoading || bundles.isLoading) && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-card" />)}
        {items.map((it) => {
          const late = it.deadline && new Date(it.deadline).getTime() < now
          return (
            <Card key={it.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={it.status} size="xs" />
                    {late ? <Badge tone="danger" iconName="Timer" size="xs">Overdue</Badge> : it.deadline && <Badge tone="grey" size="xs">Due {formatDate(it.deadline)}</Badge>}
                    {it.kind === 'bundle' && <Badge tone="serve" size="xs">Bundle · {it.itemCount} items</Badge>}
                  </div>
                  <Link to={`/app/needer/${it.kind === 'bundle' ? 'bundles' : 'needs'}/${it.code}`} className="mt-1.5 block font-bold text-text hover:underline">{it.title}</Link>
                  <p className="text-sm text-muted">{it.nextStep}</p>
                </div>
                <Button size="sm" variant="outline" to={`/app/needer/${it.kind === 'bundle' ? 'bundles' : 'needs'}/${it.code}`}>Open</Button>
              </div>
              <div className="mt-4">
                {it.kind === 'bundle' ? <ProgressBar value={it.progress.served} max={it.progress.total} label="Items served" /> : <ProgressBar value={(stepIndex[it.status] ?? 1) + 1} max={7} tone="serve" label="Journey progress" />}
              </div>
            </Card>
          )
        })}
        {!active.isLoading && !items.length && <EmptyState title="Nothing to track yet" description="Active Needs and Bundles appear here with timelines and deadlines." action={<Button to="/app/needer/post" variant="primary">Request a service</Button>} />}
      </div>
    </>
  )
}

/* ================================================================ Offers (received) */
export function NeederOffers() {
  const { user } = useSession()
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title="Offers" subtitle="Every offer Partners have sent you — compare, accept or reject from the Need." />
      <DataTable
        id="needer-offers"
        caption="Offers received"
        queryKey={['offers', 'received']}
        fetcher={(p) => api.list('offers', p)}
        baseParams={{ neederId: user.id }}
        columns={[
          { ...col.text('needTitle', 'Need'), cell: ({ row }) => <span className="block max-w-[260px] truncate font-semibold">{row.original.needTitle}<span className="block text-xs font-normal text-muted">{row.original.needCode}</span></span>, meta: { sortable: true, mobilePrimary: true } },
          col.person('partner.name', 'Partner', { hueKey: 'partner.avatarHue', verifiedKey: 'partner.verified' }),
          col.money('price', 'Price'),
          { ...col.text('scope.label', 'Scope'), cell: ({ row }) => <Badge tone={row.original.scope.kind === 'need' ? 'navy' : 'serve'} size="xs">{row.original.scope.label}</Badge> },
          col.date('validUntil', 'Valid until'),
          col.status(),
        ]}
        statusTabs={{ field: 'status', tabs: [{ value: 'submitted', label: 'New' }, { value: 'clarification', label: 'Clarification' }, { value: 'accepted', label: 'Accepted' }, { value: 'rejected', label: 'Rejected' }, { value: 'expired', label: 'Expired' }] }}
        searchPlaceholder="Search offers…"
        onRowClick={(r) => navigate(`/app/needer/${r.targetKind === 'bundle' ? 'bundles' : 'needs'}/${r.needCode}`)}
        emptyState={<EmptyState title="No offers yet" description="When a Partner serves one of your Needs, the offer shows here." />}
      />
    </>
  )
}

/* ================================================================ Bookings */
function ConfirmSatisfaction({ booking, open, onOpenChange }) {
  const qc = useQueryClient()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [step, setStep] = useState(0)
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) setStep(0) }}
      title={step === 0 ? 'Confirm you are satisfied?' : 'Rate your experience'}
      description={step === 0 ? `This releases ${formatMoney(booking.amount)} from escrow to ${booking.partner.name}.` : 'Your review is labelled “Verified transaction”.'}
      size="sm"
      footer={
        step === 0 ? (
          <>
            <Button variant="ghost" to="/app/needer/disputes">Report a problem</Button>
            <Button variant="trust" onClick={async () => { await api.update('bookings', booking.code, { status: 'completed', paymentState: 'released' }); qc.invalidateQueries({ queryKey: ['bookings'] }); setStep(1); toast('Escrow released — thank you!') }}>
              <CircleCheck size={16} /> Yes, release payment
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Later</Button>
            <Button variant="primary" onClick={async () => { await api.create('reviews', { partnerId: booking.partnerId, partnerName: booking.partner.name, rating, comment, authorName: 'You', status: 'pending', tags: [], verified: true, kind: 'deal', refTitle: booking.dealTitle }); onOpenChange(false); toast('Review submitted') }}>Submit review</Button>
          </>
        )
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          <StarInput value={rating} onChange={setRating} />
          <Field label="Comment" optional>{(p) => <Textarea {...p} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />}</Field>
        </div>
      )}
    </Dialog>
  )
}

export function NeederBookings() {
  const { user } = useSession()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(null)
  return (
    <>
      <PageHeader title="Deals & Bookings" subtitle="Deals you've booked, with payment state and the next step." actions={<Button to="/deals" variant="primary"><ShoppingBag size={18} /> Browse Deals</Button>} />
      <DataTable
        id="needer-bookings"
        caption="Bookings"
        queryKey={['bookings', 'mine']}
        fetcher={(p) => api.list('bookings', p)}
        baseParams={{ neederId: user.id }}
        columns={[
          { ...col.text('dealTitle', 'Deal'), cell: ({ row }) => <span className="block max-w-[260px]"><span className="block truncate font-semibold">{row.original.dealTitle}</span><span className="text-xs text-muted">{row.original.code}</span></span>, meta: { sortable: true, mobilePrimary: true } },
          col.person('partner.name', 'Partner', { hueKey: 'partner.avatarHue', verifiedKey: 'partner.verified' }),
          col.date('scheduledFor', 'Scheduled'),
          col.money('amount', 'Amount'),
          col.status('paymentState', 'Payment'),
          col.status(),
        ]}
        statusTabs={{ field: 'status', tabs: [{ value: 'requested', label: 'Requested' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'in_service', label: 'In service' }, { value: 'delivered', label: 'Delivered' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }] }}
        filters={[{ id: 'paymentState', label: 'Payment', options: ['pending', 'held', 'released', 'refunded'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) }, DATE_FILTER]}
        searchPlaceholder="Search bookings…"
        rowActions={(r) => (
          <RowMenu
            items={[
              { label: 'View Deal', icon: <Eye />, onSelect: () => navigate(`/deals/${r.dealSlug}`) },
              r.status === 'delivered' && { label: 'Confirm satisfaction', icon: <CircleCheck />, onSelect: () => setConfirming(r) },
              r.status === 'requested' && { label: 'Pay safely', icon: <Wallet />, onSelect: () => navigate(`/app/needer/checkout/${r.dealSlug}?booking=${r.code}`) },
              { label: 'Book again', icon: <RotateCcw />, onSelect: () => navigate(`/deals/${r.dealSlug}?book=1`) },
            ]}
          />
        )}
        emptyState={<EmptyState title="No bookings yet" description="Deals are ready-made offers you can book in a few taps." action={<Button to="/deals" variant="primary">Browse Deals</Button>} />}
      />
      {confirming && <ConfirmSatisfaction booking={confirming} open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)} />}
    </>
  )
}

/* ================================================================ Payments */
export function NeederPayments() {
  const { user } = useSession()
  const [receipt, setReceipt] = useState(null)
  return (
    <>
      <PageHeader title="Payments" subtitle="Checkout history, receipts, escrow state and refunds." />
      <DataTable
        id="needer-payments"
        caption="Payments"
        queryKey={['payments', 'mine']}
        fetcher={(p) => api.list('payments', p)}
        baseParams={{ payerId: user.id }}
        columns={paymentColumns}
        statusTabs={{ field: 'state', tabs: [{ value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'verifying', label: 'Verifying' }, { value: 'failed', label: 'Failed' }, { value: 'refunded', label: 'Refunded' }] }}
        filters={[{ id: 'method', label: 'Method', options: Object.entries(PAYMENT_METHODS).map(([value, m]) => ({ value, label: m.label })) }, { id: 'escrow', label: 'Escrow', options: ['held', 'released', 'partial', 'refunded'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })) }, DATE_FILTER]}
        searchPlaceholder="Search by reference or item…"
        mobileLoadMore
        rowActions={(r) => (
          <RowMenu
            items={[
              { label: 'View receipt', icon: <ReceiptIcon />, onSelect: () => setReceipt(r) },
              r.escrow === 'held' && { label: 'Request refund', icon: <Undo />, onSelect: () => toast('Refund request sent — an admin will review it', { tone: 'info' }) },
            ]}
          />
        )}
        onRowClick={(r) => setReceipt(r)}
        emptyState={<EmptyState title="No payments yet" description="Payments you make into escrow will appear here with receipts." />}
      />
      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)} title="Receipt" size="md">
        {receipt && <Receipt payment={receipt} className="border-0 p-0 shadow-none" />}
      </Dialog>
    </>
  )
}

export const paymentColumns = [
  col.code('ref', 'Reference'),
  { ...col.text('refTitle', 'For'), cell: ({ row }) => <span className="block max-w-[240px] truncate font-medium">{row.original.refTitle}</span>, meta: { sortable: true, mobilePrimary: true } },
  { ...col.text('method', 'Method'), cell: ({ row }) => PAYMENT_METHODS[row.original.method]?.label, meta: { sortable: true } },
  col.money('amount', 'Amount'),
  col.status('state', 'State'),
  col.status('escrow', 'Escrow'),
  col.date('createdAt', 'Date', { time: true }),
]

/* ================================================================ Saved */
function useSavedItems(resource, keyField) {
  const saved = useEngagement((s) => s.saved)
  const keys = Object.keys(saved)
  return useQuery({
    queryKey: [resource, 'saved', keys],
    queryFn: () => api.list(resource, { [keyField]: keys.join(','), pageSize: 100 }),
    enabled: keys.length > 0,
    placeholderData: { data: [], meta: { total: 0 } },
  })
}
export function Saved() {
  const needs = useSavedItems('needs', 'code')
  const bundles = useSavedItems('bundles', 'code')
  const deals = useSavedItems('deals', 'slug')
  const empty = (what, to) => <EmptyState title={`No saved ${what}`} description={`Tap 🔖 on any ${what.slice(0, -1)} to keep it here.`} action={<Button to={to} variant="primary">Browse {what}</Button>} />
  return (
    <>
      <PageHeader title="Saved" subtitle="Needs, Bundles and Deals you bookmarked." />
      <Tabs defaultValue="deals">
        <TabList label="Saved type">
          <Tab value="needs" count={needs.data?.data.length}>Needs</Tab>
          <Tab value="bundles" count={bundles.data?.data.length}>Bundles</Tab>
          <Tab value="deals" count={deals.data?.data.length}>Deals</Tab>
        </TabList>
        <TabPanel value="needs" className="pt-5">{needs.data?.data.length ? <div className={APP_CARD_GRID}>{needs.data.data.map((n) => <NeedCard key={n.id} need={n} />)}</div> : empty('Needs', '/needs')}</TabPanel>
        <TabPanel value="bundles" className="pt-5">{bundles.data?.data.length ? <div className={APP_CARD_GRID}>{bundles.data.data.map((b) => <BundleCard key={b.id} bundle={b} />)}</div> : empty('Bundles', '/bundles')}</TabPanel>
        <TabPanel value="deals" className="pt-5">{deals.data?.data.length ? <div className={APP_CARD_GRID}>{deals.data.data.map((d) => <DealCard key={d.id} deal={d} />)}</div> : empty('Deals', '/deals')}</TabPanel>
      </Tabs>
    </>
  )
}

/* ================================================================ History */
export function HistoryPage() {
  const { user } = useSession()
  const navigate = useNavigate()
  const open = useCardActions((s) => s.open)
  return (
    <>
      <PageHeader title="History" subtitle="Past Needs, Bundles, Deals, offers and decisions. Bring any of them back in one tap." />
      <DataTable
        id="needer-history"
        caption="History"
        queryKey={['needs', 'history']}
        fetcher={(p) => api.list('needs', p)}
        baseParams={{ posterId: user.id, statusGroup: 'done,problem' }}
        columns={[col.item({ header: 'Item', href: (r) => `/app/needer/needs/${r.code}` }), col.money('budget', 'Budget'), col.status(), col.custom('recurring', 'Type', (r) => (r.recurring ? <RecurringChip /> : <Badge size="xs">One-time</Badge>), { value: (r) => r.recurring }), col.date('createdAt', 'Date')]}
        filters={[{ id: 'category', label: 'Category', options: CAT_OPTIONS }, DATE_FILTER]}
        searchPlaceholder="Search history…"
        mobileLoadMore
        rowActions={(r) => (
          <RowMenu
            items={[
              { label: 'Re-request', icon: <FilePen />, onSelect: () => navigate(`/app/needer/post?from=${r.code}`) },
              { label: 'Repost', icon: <Repeat />, onSelect: () => open('reneed', r) },
              { label: 'Re-create as Bundle', icon: <Layers />, onSelect: () => navigate(`/app/needer/bundles/new?from=${r.code}`) },
            ]}
          />
        )}
        emptyState={<EmptyState title="No history yet" description="Completed and closed Needs show here." />}
      />
      <div className="mt-6">
        <DataTable
          id="needer-history-bookings"
          caption="Past bookings"
          queryKey={['bookings', 'history']}
          fetcher={(p) => api.list('bookings', p)}
          baseParams={{ neederId: user.id, status: 'completed,cancelled' }}
          defaultPageSize={10}
          columns={[{ ...col.text('dealTitle', 'Deal'), meta: { sortable: true, mobilePrimary: true } }, col.person('partner.name', 'Partner', { hueKey: 'partner.avatarHue' }), col.money('amount', 'Amount'), col.status(), col.date('createdAt', 'Date')]}
          rowActions={(r) => <Button size="xs" variant="outline" onClick={() => navigate(`/deals/${r.dealSlug}?book=1`)}>Book again</Button>}
          searchPlaceholder="Search past bookings…"
        />
      </div>
    </>
  )
}

/* ================================================================ Following */
export function Following() {
  const following = useEngagement((s) => s.following)
  const ids = Object.keys(following)
  const partners = useQuery({ queryKey: ['partners', 'following', ids], queryFn: () => api.list('partners', { id: ids.join(','), pageSize: 50 }), enabled: ids.length > 0 })
  const deals = useQuery({ queryKey: ['deals', 'following', ids], queryFn: () => api.list('deals', { partnerId: ids.join(','), status: 'published', sort: '-createdAt', pageSize: 12 }), enabled: ids.length > 0 })
  if (!ids.length) {
    return (
      <>
        <PageHeader title="Following" />
        <EmptyState title="You're not following any Partners yet" description="Follow Partners to see their new Deals here first." action={<Button to="/partners" variant="primary"><UserPlus size={16} /> Find Partners</Button>} />
      </>
    )
  }
  return (
    <>
      <PageHeader title="Following" subtitle={`${ids.length} Partner${ids.length > 1 ? 's' : ''} you follow`} />
      <div className={APP_CARD_GRID}>{partners.data?.data.map((p) => <PartnerCard key={p.id} partner={p} />)}</div>
      <h2 className="mb-4 mt-10 text-xl font-bold text-text">New Deals from Partners you follow</h2>
      <div className={APP_CARD_GRID}>{deals.data?.data.map((d) => <DealCard key={d.id} deal={d} />)}</div>
      {deals.data?.meta.total === 0 && <EmptyState compact title="No new Deals yet" />}
    </>
  )
}

/* ================================================================ Reviews */
const QUICK_TAGS = ['On time', 'Great value', 'Professional', 'Clean work', 'Friendly', 'Good communication']
function ReviewDialog({ target, onOpenChange }) {
  const [rating, setRating] = useState(5)
  const [tags, setTags] = useState([])
  const [comment, setComment] = useState('')
  const [photos, setPhotos] = useState([])
  const qc = useQueryClient()
  if (!target) return null
  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={`Review ${target.partner.name}`}
      description={target.dealTitle}
      footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={async () => { await api.create('reviews', { partnerId: target.partnerId, partnerName: target.partner.name, authorId: 'u-aline', authorName: 'Aline M.', rating, tags, comment, status: 'pending', verified: true, refTitle: target.dealTitle, kind: 'deal' }); qc.invalidateQueries({ queryKey: ['reviews'] }); onOpenChange(false); toast('Thanks! Your review is being checked') }}>Submit review</Button></>}
    >
      <div className="space-y-4">
        <StarInput value={rating} onChange={setRating} />
        <div className="flex flex-wrap gap-2">{QUICK_TAGS.map((t) => <Chip key={t} active={tags.includes(t)} onClick={() => setTags((l) => (l.includes(t) ? l.filter((x) => x !== t) : [...l, t]))}>{t}</Chip>)}</div>
        <Field label="Your comment">{(p) => <Textarea {...p} rows={4} value={comment} onChange={(e) => setComment(e.target.value)} />}</Field>
        <FileUploader files={photos} onChange={setPhotos} compact label="Add photos" hint="Up to 5 MB each" accept="image/*" />
        <Badge tone="trust" iconName="BadgeCheck">Verified transaction</Badge>
      </div>
    </Dialog>
  )
}
export function NeederReviews() {
  const { user } = useSession()
  const [target, setTarget] = useState(null)
  return (
    <>
      <PageHeader title="Reviews" subtitle="Help others choose — every review comes from a verified transaction." />
      <Tabs defaultValue="todo">
        <TabList label="Reviews">
          <Tab value="todo">To review</Tab>
          <Tab value="mine">My ratings</Tab>
        </TabList>
        <TabPanel value="todo" className="pt-5">
          <DataTable
            id="needer-to-review"
            caption="To review"
            queryKey={['bookings', 'to-review']}
            fetcher={(p) => api.list('bookings', p)}
            baseParams={{ neederId: user.id, status: 'completed' }}
            columns={[{ ...col.text('dealTitle', 'Completed'), meta: { mobilePrimary: true, sortable: true } }, col.person('partner.name', 'Partner', { hueKey: 'partner.avatarHue' }), col.date('scheduledFor', 'Completed on')]}
            rowActions={(r) => <Button size="xs" variant="primary" onClick={() => setTarget(r)}><Star size={13} /> Review</Button>}
            emptyState={<EmptyState title="All caught up" description="Completed bookings waiting for a review appear here." />}
          />
        </TabPanel>
        <TabPanel value="mine" className="pt-5">
          <DataTable
            id="needer-my-reviews"
            caption="My ratings"
            queryKey={['reviews', 'mine']}
            fetcher={(p) => api.list('reviews', p)}
            baseParams={{ authorId: user.id }}
            columns={[{ ...col.text('refTitle', 'For'), meta: { mobilePrimary: true } }, col.text('partnerName', 'Partner'), col.rating(), { ...col.text('comment', 'Comment'), cell: ({ row }) => <span className="line-clamp-2 max-w-[320px] text-sm">{row.original.comment}</span> }, col.status(), col.date()]}
            emptyState={<EmptyState title="No reviews yet" />}
          />
        </TabPanel>
      </Tabs>
      <ReviewDialog target={target} onOpenChange={(o) => !o && setTarget(null)} />
    </>
  )
}

/* ================================================================ Profile */
export function NeederProfile() {
  const { user } = useSession()
  const [interests, setInterests] = useState(['home-furniture', 'food-catering', 'automotive'])
  const [district, setDistrict] = useState(user.district)
  return (
    <>
      <PageHeader title="Profile" subtitle="What Partners see about you — never your phone, email or address." />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="text-center">
          <div className="relative mx-auto w-fit">
            <Avatar name={user.name} hue={user.avatarHue} size={96} />
            <IconButton label="Change photo" variant="navy" className="absolute bottom-0 right-0 ring-4 ring-surface">
              <Camera size={16} />
            </IconButton>
          </div>
          <p className="mt-3 text-lg font-bold text-text">{user.name}</p>
          <div className="mt-1 flex justify-center"><VerifiedBadge /></div>
          <p className="mt-1 text-sm text-muted">Member since 2025 · {user.sector}, {user.district}</p>
          <Button to={`/app/needer/settings`} variant="outline" size="sm" className="mt-4">Privacy settings</Button>
        </Card>
        <Card>
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); toast('Profile saved') }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name">{(p) => <Input {...p} defaultValue={`${user.firstName} ${user.name.split(' ')[1]?.[0]}.`} />}</Field>
              <Field label="Languages">{(p) => <Select {...p} defaultValue="rw"><option value="rw">Kinyarwanda, English</option><option value="en">English</option><option value="fr">Français</option><option value="sw">Kiswahili</option></Select>}</Field>
              <Field label="District">{(p) => <Select {...p} value={district} onChange={(e) => setDistrict(e.target.value)}>{Object.keys(DISTRICTS).map((d) => <option key={d}>{d}</option>)}</Select>}</Field>
              <Field label="Sector">{(p) => <Select {...p}>{DISTRICTS[district].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-text"><Heart size={15} /> Interests (for recommendations)</p>
              <div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c.slug} active={interests.includes(c.slug)} onClick={() => setInterests((l) => (l.includes(c.slug) ? l.filter((x) => x !== c.slug) : [...l, c.slug]))}>{c.name}</Chip>)}</div>
            </div>
            <Button type="submit" variant="primary">Save profile</Button>
          </form>
        </Card>
      </div>
    </>
  )
}
