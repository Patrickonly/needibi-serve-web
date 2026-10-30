import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { BellRing, MessagesSquare, X, Send, Briefcase, PiggyBank, Gauge, Lightbulb, Plus, Eye, Pencil, Undo, Truck, Play, CalendarDays, Wallet, Banknote, Landmark, Clock, Reply, Users, IdCard, Camera, Building, Signature, Award, Trash, Link as LinkIcon, Image as ImageIcon, ChartBar, Bookmark, Lock, Hourglass, Check, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession } from '@/lib/hooks'
import { toast } from '@/lib/store'
import { formatMoney, formatDate, formatNumber, formatCompact } from '@/lib/format'
import { CATEGORIES, DISTRICTS, GUILDS } from '@/mocks/seed'
import { Button, KpiTile, Card, CardTitle, EmptyState, StatusBadge, Badge, Dialog, ProgressBar, Field, Input, Textarea, Select, Alert, Avatar, VerifiedBadge, LevelBadge, Rating, LifecycleStepper, Chip, Tabs, TabList, Tab, TabPanel, RadioCards, CategoryIllustration } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'
import { DataTable, RowMenu } from '@/components/tables/DataTable'
import { col } from '@/components/tables/columns'
import { partnerCanChat } from '@/components/cards/NeedActions'
import { useCardActions } from '@/components/cards/actionsStore'
import { NeedCard, BundleCard } from '@/components/cards/NeedCard'
import { DealCard } from '@/components/cards/DealCard'
import { ChartCard, MonthlyBars, Donut } from '@/components/charts/Charts'
import { MoneyInput, FileUploader } from '@/components/forms/inputs'

const CAT_OPTIONS = CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))
const AREA_OPTIONS = Object.keys(DISTRICTS).map((d) => ({ value: d, label: d }))

/* ================================================================ Home */
export function PartnerHome() {
  const { user } = useSession()
  const { data, isLoading } = useQuery({ queryKey: ['dashboard', 'partner', user.partnerId], queryFn: () => api.get('/api/dashboard/partner', { partnerId: user.partnerId }) })
  const opps = useQuery({ queryKey: ['needs', 'opps', user.partnerId], queryFn: () => api.list('feed', { matchedPartnerIds: user.partnerId, pageSize: 3, sort: '-createdAt' }) })
  const jobs = useQuery({ queryKey: ['jobs', 'active-home', user.partnerId], queryFn: () => api.list('jobs', { partnerId: user.partnerId, stage: 'active', pageSize: 5, sort: 'dueAt' }) })
  const k = data?.kpis
  const perf = data?.performance
  return (
    <>
      <PageHeader eyebrow="Workspace overview" title={`${user.partnerName}`} subtitle="New requests you can answer, jobs in progress, and how you are doing." actions={<><Button variant="outline" to="/app/partner/deals/new"><Plus size={16} /> List a service</Button><Button variant="primary" to="/app/partner/requests"><Send size={16} /> View requests</Button></>} />
      {user.verified === false && (
        <Alert tone="info" title="Your verification is in progress" className="mb-5" action={<Button size="sm" variant="primary" to="/app/partner/verification">Check verification</Button>}>
          We usually review your ID and selfie within 24 hours. Until then you can set up your profile and list Deals, but you can't serve Needs or Bundles, send offers or receive payments.
        </Alert>
      )}
      <div className="mb-6 flex flex-wrap gap-2">
        {user.verified === false
          ? <Badge tone="grey" iconName="Hourglass" size="md">ID check pending</Badge>
          : <Badge tone="trust" iconName="BadgeCheck" size="md">ID checked</Badge>}
        {user.verified !== false && <Badge tone="serve" iconName="Sparkles" size="md">Top provider · Level 3</Badge>}
        {user.verified !== false && <Badge tone="navy" size="md">Growth plan · renews 1 Nov</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="New requests today" value={k ? k.opportunities : '…'} icon={<Send />} tone="serve" to="/app/partner/requests" />
        <KpiTile label="Active jobs" value={k ? k.activeJobs : '…'} icon={<Briefcase />} tone="info" to="/app/partner/jobs" />
        <KpiTile label="Earnings this month" value={k ? formatMoney(k.earnedMonth) : '…'} icon={<PiggyBank />} tone="trust" delta="+12%" to="/app/partner/earnings" />
        <KpiTile label="Performance score" value={perf ? `${perf.score}/100` : '…'} icon={<Gauge />} tone="navy" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <ChartCard title="Earnings & jobs" sub="Last 6 months" loading={isLoading}>
          {data && <MonthlyBars data={data.monthly} keys={[['earnings', 'Earnings (RWF)']]} money />}
        </ChartCard>
        <Card>
          <CardTitle>Performance</CardTitle>
          {perf && (
            <div className="space-y-4">
              {[['Response rate', perf.responseRate, 'trust'], ['On-time delivery', perf.onTime, 'info']].map(([l, v, t]) => (
                <div key={l}>
                  <p className="mb-1 flex justify-between text-sm"><span className="text-muted">{l}</span><span className="tabular font-bold text-text">{v}%</span></p>
                  <ProgressBar value={v} tone={t} label={l} />
                </div>
              ))}
              <p className="flex justify-between text-sm"><span className="text-muted">Rating</span><Rating value={perf.rating} /></p>
            </div>
          )}
          <div className="mt-5 border-t border-border pt-4">
            <p className="mb-2 text-sm font-semibold text-text">Commission breakdown</p>
            <div className="h-36">{data && <Donut data={data.commission} />}</div>
          </div>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0">
          <div className="mb-3 flex items-end justify-between"><h2 className="text-lg font-bold text-text">New requests</h2><Button variant="link" size="xs" to="/app/partner/requests">All requests <ArrowRight size={14} /></Button></div>
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{opps.data?.data.map((n) => (n.kind === 'bundle' ? <BundleCard key={n.id} bundle={n} context="partner" /> : <NeedCard key={n.id} need={n} context="partner" />))}</div>
        </section>
        <div className="min-w-0 space-y-6">
          <Card>
            <CardTitle action={<Button variant="link" size="xs" to="/app/partner/jobs">All jobs <ArrowRight size={14} /></Button>}>Active jobs</CardTitle>
            <ul className="divide-y divide-border">
              {jobs.data?.data.map((j) => (
                <li key={j.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="min-w-0 flex-1"><span className="block truncate font-semibold text-text">{j.title}</span><span className="text-xs text-muted">{j.neederName} · due {formatDate(j.dueAt)}</span></span>
                  <StatusBadge status={j.status} size="xs" />
                </li>
              ))}
            </ul>
          </Card>
          <Card className="bg-action-soft/50">
            <CardTitle><span className="flex items-center gap-2"><Lightbulb size={18} className="text-action-fg" /> Pricing tips</span></CardTitle>
            <ul className="space-y-2 text-sm text-text">
              <li>Offers within 5% of the customer's budget are accepted twice as often.</li>
              <li>Offers sent in the first 30 minutes win 61% of Kigali plumbing jobs.</li>
              <li>Add “7-day guarantee” — it lifts acceptance by 18%.</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}

/* ================================================================ Requests */
/** Compact table version of Serve · Chat 🔒 · Reject. */
function RequestActions({ item }) {
  const { user } = useSession()
  const navigate = useNavigate()
  const open = useCardActions((s) => s.open)
  const full = item.offerSlots.used >= item.offerSlots.limit
  const canChat = partnerCanChat(item, user.partnerId)
  return (
    <div className="flex items-center justify-end gap-1">
      {full ? (
        <Button size="xs" variant="outline" onClick={() => toast("We'll notify you if a slot frees up")}><BellRing size={13} /> Notify me</Button>
      ) : (
        <Button size="xs" variant="primary" onClick={() => open('serve', item)}>Serve</Button>
      )}
      <RowMenu
        items={[
          canChat ? { label: 'Chat', icon: <MessagesSquare />, onSelect: () => navigate(`/app/partner/messages?ref=${item.code}`) } : { label: 'Chat — unlocks after confirmation', icon: <Lock />, disabled: true },
          { label: 'Reject (reason required)', icon: <X />, tone: 'danger', onSelect: () => open('reject', { item, as: 'partner' }) },
        ]}
      />
    </div>
  )
}

export function PartnerRequests() {
  const { user } = useSession()
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title="Requests" subtitle="Needs and Bundles matched to your categories and areas. Serve before the slots fill up." />
      <DataTable
        id="partner-requests"
        caption="Matched requests"
        queryKey={['feed', 'partner-requests']}
        fetcher={(p) => api.list('feed', p)}
        baseParams={{ matchedPartnerIds: user.partnerId }}
        columns={[
          col.item({ header: 'Request', kind: true, sub: (r) => `${r.code} · ${r.serviceArea.sector}, ${r.serviceArea.district}`, href: (r) => `/${r.kind === 'bundle' ? 'bundles' : 'needs'}/${r.code}` }),
          { ...col.text('categoryName', 'Category'), meta: { sortable: true, sortKey: 'category', mobileHidden: true } },
          col.urgency(),
          col.custom('budgetAny', 'Budget', (r) => <span className="tabular whitespace-nowrap font-semibold">{formatMoney(r.budget ?? r.totalBudget)}</span>, { value: (r) => (r.budget ?? r.totalBudget).amount, align: 'right' }),
          col.slots(),
          col.custom('fit', 'Fit', (r) => <Badge tone="trust" size="xs">{60 + ((r.code.charCodeAt(r.code.length - 1) * 7) % 39)}%</Badge>, { csv: false }),
          col.date('createdAt', 'Posted', { relative: true }),
        ]}
        rowActions={(r) => <RequestActions item={r} />}
        statusTabs={{ field: 'urgency', tabs: [{ value: 'urgent', label: 'Urgent' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }] }}
        filters={[{ id: 'category', label: 'Category', options: CAT_OPTIONS }, { id: 'district', label: 'Area', options: AREA_OPTIONS }, { id: 'kind', label: 'Type', options: [{ value: 'need', label: 'Needs' }, { value: 'bundle', label: 'Bundles' }] }, { id: 'budget.amount_gte', label: 'Budget', options: [{ value: '20000', label: '≥ RWF 20,000' }, { value: '100000', label: '≥ RWF 100,000' }, { value: '1000000', label: '≥ RWF 1,000,000' }] }]}
        searchPlaceholder="Search requests…"
        viewToggle={{ card: (r) => (r.kind === 'bundle' ? <BundleCard bundle={r} context="partner" /> : <NeedCard need={r} context="partner" />), preferOnPhone: true }}
        onRowClick={(r) => navigate(`/${r.kind === 'bundle' ? 'bundles' : 'needs'}/${r.code}`)}
        emptyState={<EmptyState title="No matched requests right now" description="Widen your categories or areas in your profile to get more matches." action={<Button to="/app/partner/studio" variant="primary">Edit profile</Button>} />}
      />
    </>
  )
}

/* ================================================================ My offers */
export function PartnerOffers() {
  const { user } = useSession()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [price, setPrice] = useState(0)
  return (
    <>
      <PageHeader title="My Offers" subtitle="Everything you've served — edit while it's open, or withdraw to free the slot." />
      <DataTable
        id="partner-offers"
        caption="My offers"
        queryKey={['offers', 'partner']}
        fetcher={(p) => api.list('offers', p)}
        baseParams={{ partnerId: user.partnerId }}
        columns={[
          { ...col.text('needTitle', 'Request'), cell: ({ row }) => <span className="block max-w-[260px]"><span className="block truncate font-semibold">{row.original.needTitle}</span><span className="text-xs text-muted">{row.original.needCode} · {row.original.neederName}</span></span>, meta: { sortable: true, mobilePrimary: true } },
          { ...col.text('scope.label', 'Scope'), cell: ({ row }) => <Badge tone={row.original.scope.kind === 'need' ? 'navy' : 'serve'} size="xs">{row.original.scope.label}</Badge> },
          col.money('price', 'Price'),
          col.text('timeline', 'Timeline'),
          col.date('validUntil', 'Valid until'),
          col.status(),
        ]}
        statusTabs={{ field: 'status', tabs: [{ value: 'submitted', label: 'Submitted' }, { value: 'clarification', label: 'Clarification needed' }, { value: 'accepted', label: 'Accepted' }, { value: 'rejected', label: 'Rejected' }, { value: 'expired', label: 'Expired' }, { value: 'withdrawn', label: 'Withdrawn' }] }}
        searchPlaceholder="Search offers…"
        rowActions={(r) => (
          <RowMenu
            items={[
              ['submitted', 'clarification', 'revised'].includes(r.status) && { label: 'Edit offer', icon: <Pencil />, onSelect: () => { setEditing(r); setPrice(r.price.amount) } },
              ['submitted', 'clarification', 'revised'].includes(r.status) && { label: 'Withdraw', icon: <Undo />, tone: 'danger', onSelect: async () => { await api.post(`/api/offers/${r.id}/withdraw`, {}); qc.invalidateQueries({ queryKey: ['offers'] }); toast('Offer withdrawn — the slot is free for others') } },
              { label: 'View request', icon: <Eye />, onSelect: () => navigate(`/${r.targetKind === 'bundle' ? 'bundles' : 'needs'}/${r.needCode}`) },
            ]}
          />
        )}
        emptyState={<EmptyState title="No offers yet" description="Answer a request to send your first offer." action={<Button to="/app/partner/requests" variant="primary">See requests</Button>} />}
      />
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title="Edit offer" description={editing?.needTitle} size="sm" footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" onClick={async () => { await api.update('offers', editing.id, { price: { amount: price, currency: 'RWF' }, status: 'revised' }); qc.invalidateQueries({ queryKey: ['offers'] }); setEditing(null); toast('Offer revised — the Needer is notified') }}>Save revision</Button></>}>
        {editing?.status === 'clarification' && <Alert tone="serve" className="mb-4" title="The customer asked">“{editing.question ?? 'Does the price include replacing the pipe?'}”</Alert>}
        <Field label="Price">{(p) => <MoneyInput {...p} value={price} onChange={setPrice} size="lg" />}</Field>
        <Field label="Reply / notes" className="mt-4">{(p) => <Textarea {...p} rows={3} />}</Field>
      </Dialog>
    </>
  )
}

/* ================================================================ Jobs */
const TRANSITIONS = { scheduled: [['in_service', 'Start job', Play]], in_service: [['delivered', 'Mark delivered', Truck]], quote_pending: [['scheduled', 'Confirm schedule', CalendarDays]] }
export function PartnerJobs() {
  const { user } = useSession()
  const qc = useQueryClient()
  const [delivering, setDelivering] = useState(null)
  const [evidence, setEvidence] = useState([])
  const [note, setNote] = useState('')
  const recurring = useQuery({ queryKey: ['jobs', 'recurring', user.partnerId], queryFn: () => api.list('jobs', { partnerId: user.partnerId, recurring: true, pageSize: 10 }) })
  const move = async (job, to) => {
    if (to === 'delivered') return setDelivering(job)
    await api.update('jobs', job.code, { status: to, stage: to === 'scheduled' ? 'incoming' : 'active' })
    qc.invalidateQueries({ queryKey: ['jobs'] })
    toast(`Job ${job.code}: ${to.replace('_', ' ')}`)
  }
  return (
    <>
      <PageHeader title="Jobs in progress" subtitle="Move each job to its next step. Add photos when you finish — once the customer confirms, your money is released." />
      <Card className="mb-6">
        <CardTitle sub="Recurring jobs this week">Recurring calendar</CardTitle>
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, di) => (
            <div key={d}><p className="mb-1 font-bold text-muted">{d}</p><div className="min-h-20 space-y-1 rounded-lg bg-surface-2 p-1">{recurring.data?.data.filter((_, i) => (i + di) % 3 === 0).slice(0, 2).map((j) => <span key={j.id} className="block truncate rounded bg-action-100 px-1 py-1 text-[11px] font-semibold text-action-fg" title={j.title}>{j.title}</span>)}</div></div>
          ))}
        </div>
      </Card>
      <DataTable
        id="partner-jobs"
        caption="Jobs"
        queryKey={['jobs', 'partner']}
        fetcher={(p) => api.list('jobs', p)}
        baseParams={{ partnerId: user.partnerId }}
        defaultSort="dueAt"
        columns={[
          { ...col.text('title', 'Job'), cell: ({ row }) => <span className="block max-w-[260px]"><span className="block truncate font-semibold">{row.original.title}</span><span className="text-xs text-muted">{row.original.code} · {row.original.neederName}</span></span>, meta: { sortable: true, mobilePrimary: true } },
          col.text('area', 'Area', { muted: true }),
          col.money('amount', 'Value'),
          col.custom('dueAt', 'Due', (r) => <span className={cn(new Date(r.dueAt) < new Date() && r.stage !== 'completed' ? 'font-semibold text-danger-fg' : 'text-muted')}>{formatDate(r.dueAt)}{new Date(r.dueAt) < new Date() && r.stage !== 'completed' && ' · overdue'}</span>, { value: (r) => r.dueAt, sortable: true }),
          col.custom('recurring', 'Type', (r) => (r.recurring ? <Badge tone="navy" size="xs" iconName="RefreshCw">Recurring</Badge> : <Badge size="xs">One-time</Badge>), { value: (r) => r.recurring }),
          col.status(),
          col.custom('next', 'Next', (r) => (
            <div className="flex gap-1">{(TRANSITIONS[r.status] ?? []).map(([to, label, Icon]) => <Button key={to} size="xs" variant={to === 'delivered' ? 'primary' : 'outline'} onClick={() => move(r, to)}><Icon size={13} /> {label}</Button>)}{!TRANSITIONS[r.status] && <span className="text-xs text-muted">{r.status === 'delivered' ? 'Waiting for the customer to confirm' : '—'}</span>}</div>
          ), { csv: false, stop: true }),
        ]}
        statusTabs={{ field: 'stage', tabs: [{ value: 'incoming', label: 'Incoming' }, { value: 'active', label: 'Active' }, { value: 'pending_quote', label: 'Pending quotes' }, { value: 'completed', label: 'Completed' }] }}
        searchPlaceholder="Search jobs…"
        emptyState={<EmptyState title="No jobs yet" description="Accepted offers and booked Deals become jobs here." />}
      />
      <Dialog open={!!delivering} onOpenChange={(o) => !o && setDelivering(null)} title="Mark as finished" description="Add photos of the finished work. Once the customer confirms, your money is released." footer={<><Button variant="ghost" onClick={() => setDelivering(null)}>Cancel</Button><Button variant="primary" disabled={!evidence.length} onClick={async () => { await api.update('jobs', delivering.code, { status: 'delivered' }); qc.invalidateQueries({ queryKey: ['jobs'] }); setDelivering(null); setEvidence([]); toast('Marked delivered — the Needer has been asked to confirm') }}><Truck size={16} /> Mark delivered</Button></>}>
        <FileUploader files={evidence} onChange={setEvidence} label="Before/after photos, signed delivery note" accept="image/*,application/pdf" />
        <Field label="Notes for the customer" optional className="mt-4">{(p) => <Textarea {...p} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
      </Dialog>
    </>
  )
}

/* ================================================================ Deals */
export function PartnerDeals() {
  const { user } = useSession()
  const navigate = useNavigate()
  const [sp, setSp] = useSearchParams()
  const statsSlug = sp.get('stats')
  const stats = useQuery({ queryKey: ['deals', statsSlug], queryFn: () => api.one('deals', statsSlug), enabled: !!statsSlug })
  return (
    <>
      <PageHeader title="My services" subtitle="Ready-made offers people can book. Each one goes live after Needibi checks it." actions={<Button variant="primary" to="/app/partner/deals/new"><Plus size={18} /> List a service</Button>} />
      <DataTable
        id="partner-deals"
        caption="My services"
        queryKey={['deals', 'partner']}
        fetcher={(p) => api.list('deals', p)}
        baseParams={{ partnerId: user.partnerId }}
        columns={[
          col.item({ header: 'Service', sub: (r) => r.categoryName, href: (r) => `/deals/${r.slug}` }),
          col.money('price', 'Price'),
          col.custom('discountPct', 'Discount', (r) => (r.discountPct ? <Badge tone="danger" size="xs">-{r.discountPct}%</Badge> : '—'), { value: (r) => r.discountPct, sortable: true }),
          col.number('views', 'Views'),
          col.number('saves', 'Saves'),
          col.number('bookings', 'Bookings'),
          col.status(),
        ]}
        statusTabs={{ field: 'status', tabs: [{ value: 'published', label: 'Live' }, { value: 'pending', label: 'Pending approval' }, { value: 'draft', label: 'Draft' }, { value: 'paused', label: 'Paused' }, { value: 'rejected', label: 'Rejected' }] }}
        searchPlaceholder="Search my services…"
        viewToggle={{ card: (r) => <DealCard deal={r} context="partner" /> }}
        rowActions={(r) => <RowMenu items={[{ label: 'Edit', icon: <Pencil />, onSelect: () => navigate(`/app/partner/deals/${r.slug}/edit`) }, { label: 'Stats', icon: <ChartBar />, onSelect: () => setSp({ stats: r.slug }) }, { label: 'Bookings', icon: <CalendarDays />, onSelect: () => navigate(`/app/partner/bookings?dealSlug=${r.slug}`) }]} />}
        emptyState={<EmptyState title="Nothing listed yet" description="List a ready-made offer so people can book you directly." action={<Button variant="primary" to="/app/partner/deals/new">List a service</Button>} />}
      />
      <Dialog open={!!statsSlug} onOpenChange={(o) => !o && setSp({})} title="Deal stats" description={stats.data?.title} size="sm">
        {stats.data && (
          <div className="grid grid-cols-3 gap-3 text-center">
            {[['Views', stats.data.views, Eye], ['Saves', stats.data.saves, Bookmark], ['Bookings', stats.data.bookings, CalendarDays]].map(([l, v, Icon]) => (
              <div key={l} className="rounded-card bg-surface-2 p-3"><Icon size={18} className="mx-auto text-muted" /><p className="tabular mt-1 text-xl font-extrabold text-text">{formatCompact(v)}</p><p className="text-xs text-muted">{l}</p></div>
            ))}
            <p className="col-span-3 text-sm text-muted">Conversion {((stats.data.bookings / stats.data.views) * 100).toFixed(1)}% · rating {stats.data.rating}</p>
          </div>
        )}
      </Dialog>
    </>
  )
}

export function DealEditor() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user } = useSession()
  const qc = useQueryClient()
  const existing = useQuery({ queryKey: ['deals', slug], queryFn: () => api.one('deals', slug), enabled: !!slug })
  const d = existing.data
  const [f, setF] = useState({})
  const v = { title: '', category: 'home-furniture', type: 'service', price: 0, discount: 0, validity: '30', orderLimit: '', coverage: ['Gasabo', 'Kicukiro'], language: 'en', description: '', ...(d ? { title: d.title, category: d.category, type: d.type, price: d.oldPrice?.amount ?? d.price.amount, discount: d.discountPct, coverage: d.coverage, description: d.description } : {}), ...f }
  const set = (k) => (x) => setF((s) => ({ ...s, [k]: x?.target ? x.target.value : x }))
  const [media, setMedia] = useState([])
  const [fields, setFields] = useState([{ key: 'date', label: 'Preferred date' }, { key: 'notes', label: 'Anything we should know?' }])
  const final = Math.round(v.price * (1 - v.discount / 100))
  const submit = useMutation({
    mutationFn: () => (slug ? api.update('deals', slug, { title: v.title, status: 'pending' }) : api.create('deals', { slug: `${v.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now() % 1000}`, kind: 'deal', title: v.title, type: v.type, category: v.category, categoryName: CATEGORIES.find((c) => c.slug === v.category).name, partnerId: user.partnerId, partner: { id: user.partnerId, name: user.partnerName, handle: 'cleanpro', verified: true, level: 3, rating: 4.8, avatarHue: 150 }, price: { amount: final, currency: 'RWF' }, oldPrice: v.discount ? { amount: v.price, currency: 'RWF' } : undefined, discountPct: Number(v.discount), coverage: v.coverage, status: 'pending', rating: 0, reviewCount: 0, views: 0, saves: 0, bookings: 0, bookedThisWeek: 0, primaryAction: v.type === 'product' ? 'get' : 'book', media: [{ id: 'm', kind: 'image', url: '', cat: v.category }], customFields: fields, specs: [], inclusions: [], ratingBreakdown: [1, 0, 0, 0, 0] })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] })
      toast('Submitted for approval', { description: 'Most Deals are reviewed within 24 hours.' })
      navigate('/app/partner/deals?tab=pending')
    },
  })
  return (
    <>
      <PageHeader back={{ to: '/app/partner/deals', label: 'My services' }} title={slug ? 'Edit service' : 'List a service'} subtitle="Your deal goes live after Needibi checks it. A check is not a promise of quality — reviews still apply, and payment is held until the work is done." />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Card className="space-y-5">
          <Field label="Title">{(p) => <Input {...p} value={v.title} onChange={set('title')} placeholder="e.g. Deep clean — 3-bedroom house" />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">{(p) => <Select {...p} value={v.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</Select>}</Field>
            <Field label="Deal type">{(p) => <Select {...p} value={v.type} onChange={set('type')}>{['product', 'service', 'vehicle', 'property', 'professional', 'custom', 'bundle'].map((t) => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}</Select>}</Field>
            <Field label="Price">{(p) => <MoneyInput {...p} value={v.price} onChange={set('price')} />}</Field>
            <Field label={`Discount: ${v.discount}%`} hint={v.discount ? `Customers pay ${formatMoney(final)}` : undefined}>{(p) => <input {...p} type="range" min="0" max="50" step="5" value={v.discount} onChange={(e) => set('discount')(Number(e.target.value))} className="mt-3 w-full accent-[var(--action-500)]" />}</Field>
            <Field label="Valid for">{(p) => <Select {...p} value={v.validity} onChange={set('validity')}><option value="7">7 days</option><option value="30">30 days</option><option value="90">90 days</option><option value="0">No end date</option></Select>}</Field>
            <Field label="Order limit" optional>{(p) => <Input {...p} type="number" min="1" value={v.orderLimit} onChange={set('orderLimit')} placeholder="No limit" />}</Field>
          </div>
          <Field label="Description" hint="No phone numbers, emails or links — they're removed automatically.">{(p) => <Textarea {...p} rows={4} value={v.description} onChange={set('description')} />}</Field>
          <div>
            <p className="mb-2 text-sm font-semibold text-text">Coverage</p>
            <div className="flex flex-wrap gap-2">{Object.keys(DISTRICTS).map((dd) => <Chip key={dd} active={v.coverage.includes(dd)} onClick={() => set('coverage')(v.coverage.includes(dd) ? v.coverage.filter((x) => x !== dd) : [...v.coverage, dd])}>{dd}</Chip>)}</div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-text">Images, video & audio</p>
            <FileUploader files={media} onChange={setMedia} accept="image/*,video/*,audio/*" hint="Photos 5 MB · video 100 MB · audio 30 MB" />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-text">Custom fields the client fills in</p>
            <ul className="space-y-2">
              {fields.map((cf, i) => (
                <li key={cf.key} className="flex gap-2">
                  <Input value={cf.label} onChange={(e) => setFields((l) => l.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} aria-label={`Custom field ${i + 1}`} />
                  <Button variant="ghost" size="icon" aria-label="Remove field" onClick={() => setFields((l) => l.filter((_, k) => k !== i))}><Trash size={16} /></Button>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setFields((l) => [...l, { key: `f${l.length}`, label: 'New question' }])}><Plus size={14} /> Add field</Button>
          </div>
          <Field label="Listing language">{(p) => <Select {...p} value={v.language} onChange={set('language')}><option value="en">English</option><option value="rw">Kinyarwanda</option><option value="fr">Français</option><option value="sw">Kiswahili</option></Select>}</Field>
          <div className="flex gap-2 border-t border-border pt-5">
            <Button variant="ghost" onClick={() => toast('Draft saved')}>Save draft</Button>
            <Button variant="primary" size="lg" disabled={v.title.length < 5 || !v.price} loading={submit.isPending} onClick={() => submit.mutate()}>Submit for approval</Button>
          </div>
        </Card>
        <aside>
          <div className="sticky top-24 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Preview</p>
            <div inert className="pointer-events-none">
              <DealCard deal={{ id: 'preview', slug: 'preview', kind: 'deal', title: v.title || 'Your Deal title', category: v.category, partner: { name: user.partnerName, handle: 'cleanpro', verified: true, avatarHue: 150 }, price: { amount: final }, oldPrice: v.discount ? { amount: v.price } : undefined, discountPct: Number(v.discount), rating: 5, reviewCount: 0, bookedThisWeek: 0, primaryAction: v.type === 'product' ? 'get' : 'book', media: [{ id: 'p', kind: 'image', url: media[0]?.url ?? '', cat: v.category }], saves: 0 }} />
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}

/* ================================================================ Booked Deals */
export function PartnerBookings() {
  const { user } = useSession()
  const qc = useQueryClient()
  const [sp] = useSearchParams()
  const [open, setOpen] = useState(null)
  return (
    <>
      <PageHeader title="Booked Deals" subtitle="Client inputs, schedule and payment state for every booking." />
      <DataTable
        id="partner-bookings"
        caption="Booked Deals"
        queryKey={['bookings', 'partner']}
        fetcher={(p) => api.list('bookings', p)}
        baseParams={{ partnerId: user.partnerId, ...(sp.get('dealSlug') ? { dealSlug: sp.get('dealSlug') } : {}) }}
        columns={[
          { ...col.text('dealTitle', 'Deal'), cell: ({ row }) => <span className="block max-w-[240px]"><span className="block truncate font-semibold">{row.original.dealTitle}</span><span className="text-xs text-muted">{row.original.code}</span></span>, meta: { sortable: true, mobilePrimary: true } },
          col.text('neederName', 'Client'),
          col.date('scheduledFor', 'Scheduled'),
          col.custom('qty', 'Qty', (r) => r.quantity, { value: (r) => r.quantity }),
          col.money('amount', 'Amount'),
          col.status('paymentState', 'Payment'),
          col.status(),
        ]}
        statusTabs={{ field: 'status', tabs: [{ value: 'requested', label: 'Requested' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'in_service', label: 'In service' }, { value: 'delivered', label: 'Done' }, { value: 'completed', label: 'Completed' }] }}
        searchPlaceholder="Search bookings…"
        onRowClick={setOpen}
        rowActions={(r) => ['confirmed', 'scheduled', 'in_service'].includes(r.status) ? <Button size="xs" variant="primary" onClick={async () => { await api.update('bookings', r.code, { status: 'delivered' }); qc.invalidateQueries({ queryKey: ['bookings'] }); toast('Marked done — waiting for client confirmation') }}><Check size={13} /> Mark done</Button> : null}
        emptyState={<EmptyState title="No bookings yet" description="When someone books one of your deals it shows here." />}
      />
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)} title={open?.dealTitle} description={open?.code}>
        {open && (
          <div className="space-y-3 text-sm">
            <p><span className="text-muted">Client:</span> <strong>{open.neederName}</strong></p>
            <p><span className="text-muted">Scheduled:</span> {formatDate(open.scheduledFor)}</p>
            <p><span className="text-muted">Area:</span> {open.clientInputs.area}</p>
            <p><span className="text-muted">Client notes:</span> {open.clientInputs.notes}</p>
            <p className="flex items-center gap-2"><span className="text-muted">Payment:</span> <StatusBadge status={open.paymentState} size="xs" /></p>
            <p className="flex items-center gap-1.5 text-xs text-muted"><Lock size={12} /> The exact address and phone number appear in Chat once the payment is held safely.</p>
          </div>
        )}
      </Dialog>
    </>
  )
}

/* ================================================================ Earnings & payouts */
export function PartnerEarnings() {
  const { user } = useSession()
  const { data } = useQuery({ queryKey: ['dashboard', 'partner', user.partnerId], queryFn: () => api.get('/api/dashboard/partner', { partnerId: user.partnerId }) })
  const [calc, setCalc] = useState(450000)
  const [level, setLevel] = useState('15')
  const k = data?.kpis
  const fee = Math.round(calc * Number(level) / 100)
  return (
    <>
      <PageHeader title="Earnings" subtitle="What you have earned, what has been paid out, and what is still being held." actions={<Button variant="primary" to="/app/partner/payouts"><Banknote size={16} /> Payouts</Button>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Total earned" value={k ? formatMoney(k.totalEarned) : '…'} icon={<PiggyBank />} tone="navy" />
        <KpiTile label="Paid out" value={k ? formatMoney(k.paidOut) : '…'} icon={<Banknote />} tone="trust" />
        <KpiTile label="Still held" value={k ? formatMoney(k.pending) : '…'} icon={<Hourglass />} tone="warn" hint="released on confirmation" />
        <KpiTile label="Available" value={k ? formatMoney(k.available) : '…'} icon={<Wallet />} tone="serve" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Monthly earnings" loading={!data}>{data && <MonthlyBars data={data.monthly} keys={[['earnings', 'Earnings']]} money />}</ChartCard>
        <Card>
          <CardTitle>Fee calculator</CardTitle>
          <Field label="Job price">{(p) => <MoneyInput {...p} value={calc} onChange={setCalc} />}</Field>
          <Field label="Your rate" className="mt-3">{(p) => <Select {...p} value={level} onChange={(e) => setLevel(e.target.value)}><option value="18">Starter · 18%</option><option value="15">Growth / Level 2 · 15%</option><option value="12">Pro / Top Partner · 12%</option></Select>}</Field>
          <dl className="mt-4 space-y-1.5 rounded-lg bg-surface-2 p-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Platform fee ({level}%)</dt><dd className="tabular">{formatMoney(fee)}</dd></div>
            <div className="flex justify-between border-t border-border pt-1.5"><dt className="font-bold text-text">You receive</dt><dd className="tabular text-lg font-extrabold text-trust-fg">{formatMoney(calc - fee)}</dd></div>
          </dl>
        </Card>
      </div>
      <div className="mt-6">
        <DataTable
          id="partner-earnings-tx"
          caption="Earnings by payment"
          queryKey={['payments', 'partner-earnings']}
          fetcher={(p) => api.list('payments', p)}
          baseParams={{ partnerId: user.partnerId, state: 'paid' }}
          columns={[col.code('ref', 'Reference'), { ...col.text('refTitle', 'Job'), meta: { mobilePrimary: true, sortable: true } }, col.money('amount', 'Customer paid'), col.money('fee', 'Fee'), col.money('partnerShare', 'Your share'), col.status('escrow', 'Held money'), col.date()]}
          filters={[{ id: 'escrow', label: 'Held money', options: [{ value: 'held', label: 'Held' }, { value: 'released', label: 'Released' }, { value: 'partial', label: 'Partial' }] }, { id: 'since', label: 'Date', options: [{ value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }, { value: '365d', label: 'Last year' }] }]}
          searchPlaceholder="Search earnings…"
        />
      </div>
    </>
  )
}

export function PartnerPayouts() {
  const { user } = useSession()
  const [method, setMethod] = useState('momo')
  return (
    <>
      <PageHeader title="Payouts" subtitle="Weekly on Fridays to your chosen account. Invoices for every payout." />
      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardTitle>Payout method</CardTitle>
          <RadioCards value={method} onChange={(m) => { setMethod(m); toast('Payout method updated') }} options={[{ value: 'momo', label: 'MTN MoMo · ••• 456', description: 'Instant on payout day', icon: <Wallet size={18} /> }, { value: 'bank', label: 'Bank of Kigali · ••• 0091', description: '1 business day', icon: <Landmark size={18} /> }]} />
        </Card>
        <Card>
          <CardTitle>Schedule</CardTitle>
          <p className="text-sm text-muted">Next payout</p>
          <p className="tabular text-2xl font-extrabold text-text">Friday · {formatMoney(486500)}</p>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><Clock size={14} /> Includes jobs confirmed by Thursday 23:59</p>
        </Card>
      </div>
      <DataTable
        id="partner-payouts"
        caption="Payouts"
        queryKey={['payouts', 'partner']}
        fetcher={(p) => api.list('payouts', p)}
        baseParams={{ partnerId: user.partnerId }}
        defaultSort="-scheduledFor"
        columns={[col.code('ref', 'Payout'), col.date('scheduledFor', 'Date'), col.money('amount', 'Amount'), col.text('method', 'To'), col.number('jobs', 'Jobs'), col.status(), col.custom('invoice', 'Invoice', (r) => <Button size="xs" variant="link" onClick={() => toast(`${r.invoice} downloaded`)}>{r.invoice}</Button>, { value: (r) => r.invoice })]}
        statusTabs={{ field: 'status', tabs: [{ value: 'scheduled', label: 'Scheduled' }, { value: 'processing', label: 'Processing' }, { value: 'paid', label: 'Paid' }, { value: 'failed', label: 'Failed' }] }}
        searchPlaceholder="Search payouts…"
      />
    </>
  )
}

/* ================================================================ Reviews */
export function PartnerReviews() {
  const { user } = useSession()
  const qc = useQueryClient()
  const [replying, setReplying] = useState(null)
  const [text, setText] = useState('')
  return (
    <>
      <PageHeader title="Reviews" subtitle="You can reply once to each review. Replies are public." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-muted">Average rating</p><p className="tabular font-display text-3xl font-extrabold text-text">4.8</p><Rating value={4.8} count={412} /></Card>
        <Card className="sm:col-span-2">
          <ul className="space-y-1.5">{[[5, 74], [4, 18], [3, 5], [2, 2], [1, 1]].map(([s, p]) => <li key={s} className="flex items-center gap-2 text-sm"><span className="w-12 text-muted">{s} star</span><ProgressBar value={p} tone="serve" className="flex-1" label={`${s} star`} /><span className="tabular w-10 text-right text-muted">{p}%</span></li>)}</ul>
        </Card>
      </div>
      <DataTable
        id="partner-reviews"
        caption="Reviews"
        queryKey={['reviews', 'partner']}
        fetcher={(p) => api.list('reviews', p)}
        baseParams={{ partnerId: user.partnerId }}
        columns={[
          col.person('authorName', 'Customer', { hueKey: 'authorHue', primary: true }),
          col.rating(),
          { ...col.text('comment', 'Review'), cell: ({ row }) => <span className="block max-w-[340px] text-sm">{row.original.comment}{row.original.reply && <span className="mt-1 block border-l-2 border-action-500 pl-2 text-xs text-muted">You: {row.original.reply}</span>}</span> },
          col.custom('labels', 'Label', (r) => <Badge tone="trust" size="xs">{r.partial ? 'Partial' : 'Verified'}</Badge>, { csv: false }),
          col.date(),
        ]}
        filters={[{ id: 'rating', label: 'Stars', options: [5, 4, 3, 2, 1].map((n) => ({ value: n, label: `${n} star` })) }]}
        toggles={[{ id: 'unreplied', label: 'Needs reply', paramOn: { reply: 'undefined' } }]}
        searchPlaceholder="Search reviews…"
        rowActions={(r) => (r.reply ? <Badge size="xs" tone="grey">Replied</Badge> : <Button size="xs" variant="outline" onClick={() => { setReplying(r); setText('') }}><Reply size={13} /> Reply</Button>)}
      />
      <Dialog open={!!replying} onOpenChange={(o) => !o && setReplying(null)} title={`Reply to ${replying?.authorName}`} description="You can reply only once. Keep it professional." size="sm" footer={<><Button variant="ghost" onClick={() => setReplying(null)}>Cancel</Button><Button variant="primary" disabled={text.trim().length < 3} onClick={async () => { await api.update('reviews', replying.id, { reply: text }); qc.invalidateQueries({ queryKey: ['reviews'] }); setReplying(null); toast('Reply published') }}>Publish reply</Button></>}>
        <p className="mb-3 rounded-lg bg-surface-2 p-3 text-sm text-text">“{replying?.comment}”</p>
        <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} aria-label="Your reply" />
      </Dialog>
    </>
  )
}

/* ================================================================ Profile & Studio */
export function PartnerStudio() {
  const { user } = useSession()
  const { data: p } = useQuery({ queryKey: ['partners', user.partnerId], queryFn: () => api.one('partners', user.partnerId) })
  const [posts, setPosts] = useState([
    { id: 1, text: 'Before → after: 3-bedroom deep clean in Kimihurura ✨', deal: 'Deep clean — 3-bedroom house', likes: 214 },
    { id: 2, text: 'Rainy season tip: clean your gutters before the storms.', deal: '', likes: 88 },
  ])
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(null)
  return (
    <>
      <PageHeader title="Profile & Studio" subtitle="Your public profile and social posts. Never add contacts, links or documents." actions={<Button variant="outline" to={`/partners/${p?.handle ?? 'cleanpro'}`}><Eye size={16} /> View public profile</Button>} />
      <Tabs defaultValue="profile">
        <TabList label="Studio sections">
          <Tab value="profile">Profile</Tab>
          <Tab value="posts" count={posts.length}>Posts</Tab>
          <Tab value="badges">Badges & followers</Tab>
        </TabList>
        <TabPanel value="profile" className="pt-5">
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card className="space-y-4">
              <Field label="Business name">{(x) => <Input {...x} defaultValue={p?.name} key={p?.name} />}</Field>
              <Field label="About" hint="Contact details are removed automatically.">{(x) => <Textarea {...x} rows={4} defaultValue={p?.bio} key={p?.bio} />}</Field>
              <div><p className="mb-2 text-sm font-semibold text-text">Categories</p><div className="flex flex-wrap gap-2">{CATEGORIES.map((c) => <Chip key={c.slug} active={p?.categories.includes(c.slug)}>{c.name}</Chip>)}</div></div>
              <div><p className="mb-2 text-sm font-semibold text-text">Areas served</p><div className="flex flex-wrap gap-2">{Object.keys(DISTRICTS).map((d) => <Chip key={d} active={p?.areas.includes(d)}>{d}</Chip>)}</div></div>
              <Field label="Languages">{(x) => <Input {...x} defaultValue={p?.languages.join(', ')} key={p?.languages?.join()} />}</Field>
              <Button variant="primary" onClick={() => toast('Profile saved — changes to categories are re-checked by our team')}>Save profile</Button>
            </Card>
            <Card className="overflow-hidden p-0">
              <div className="h-20"><CategoryIllustration category={p?.categories[0] ?? 'services'} iconSize={24} /></div>
              <div className="-mt-8 px-4 pb-4">
                <Avatar name={p?.name ?? ''} hue={p?.avatarHue} size={64} ring className="ring-4" />
                <p className="mt-2 flex items-center gap-1 font-bold text-text">{p?.name} <VerifiedBadge compact /></p>
                {p && <div className="mt-1 flex items-center gap-2"><LevelBadge level={p.level} /><Rating value={p.rating} size={12} className="text-xs" /></div>}
                <Button variant="outline" size="sm" className="mt-3"><Camera size={14} /> Change cover</Button>
              </div>
            </Card>
          </div>
        </TabPanel>
        <TabPanel value="posts" className="space-y-4 pt-5">
          <Card>
            <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Share a before/after photo, a tip, or something new you offer…" aria-label="New post" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button variant="ghost" size="sm"><ImageIcon size={15} /> Photo / video</Button>
              <Button variant="ghost" size="sm"><LinkIcon size={15} /> Link a service</Button>
              <Button variant="primary" size="sm" className="ml-auto" disabled={!draft.trim()} onClick={() => { setPosts((l) => [{ id: Date.now(), text: draft, deal: '', likes: 0 }, ...l]); setDraft(''); toast('Posted to Social') }}>Post</Button>
            </div>
          </Card>
          {posts.map((post) => (
            <Card key={post.id}>
              {editing === post.id ? (
                <Textarea rows={3} defaultValue={post.text} onBlur={(e) => { setPosts((l) => l.map((x) => (x.id === post.id ? { ...x, text: e.target.value } : x))); setEditing(null) }} aria-label="Edit post" autoFocus />
              ) : (
                <p className="text-[15px] text-text">{post.text}</p>
              )}
              {post.deal && <Badge tone="trust" className="mt-2" iconName="Sparkles">Linked: {post.deal}</Badge>}
              <div className="mt-3 flex items-center gap-2 text-sm text-muted">
                <span>♥ {post.likes}</span>
                <Button variant="ghost" size="xs" className="ml-auto" onClick={() => setEditing(post.id)}><Pencil size={13} /> Edit</Button>
                <Button variant="ghost" size="xs" onClick={() => setPosts((l) => l.filter((x) => x.id !== post.id))}><Trash size={13} /> Delete</Button>
              </div>
            </Card>
          ))}
        </TabPanel>
        <TabPanel value="badges" className="pt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[['ID checked', 'BadgeCheck', 'trust'], ['Top provider', 'Sparkles', 'serve'], ['Fast responder', 'Timer', 'info'], ['100 jobs', 'Award', 'navy']].map(([l, icon, tone]) => (
              <Card key={l} className="text-center"><Badge tone={tone} iconName={icon} size="md">{l}</Badge></Card>
            ))}
          </div>
          <Card className="mt-6"><p className="text-sm text-muted">Followers</p><p className="tabular font-display text-3xl font-extrabold text-text">{formatNumber(p?.followers ?? 0)}</p><p className="text-sm text-muted">+38 this week · followers see anything new you list first</p></Card>
        </TabPanel>
      </Tabs>
    </>
  )
}

export function PartnerGuilds() {
  const [joined, setJoined] = useState(['gd-8', 'gd-11'])
  return (
    <>
      <PageHeader title="Guilds" subtitle="Join category guilds to get Bundle items matched to trusted groups of Partners." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {GUILDS.map((g) => (
          <Card key={g.id}>
            <div className="flex items-start justify-between gap-2">
              <div><p className="font-bold text-text">{g.name}</p><p className="text-sm text-muted">{g.categoryName} · {g.members} members</p></div>
              {g.matchingPriority === 'high' && <Badge tone="serve" size="xs">Priority matching</Badge>}
            </div>
            <Button variant={joined.includes(g.id) ? 'subtle' : 'navy'} size="sm" className="mt-4" onClick={() => { setJoined((l) => (l.includes(g.id) ? l.filter((x) => x !== g.id) : [...l, g.id])); toast(joined.includes(g.id) ? `Left ${g.name}` : `Request sent to ${g.name}`) }}>
              {joined.includes(g.id) ? <><Check size={14} /> Member</> : <><Users size={14} /> Join</>}
            </Button>
          </Card>
        ))}
      </div>
    </>
  )
}

export function PartnerVerification() {
  const steps = ['Submitted', 'ID check', 'Selfie match', 'Business docs', 'Approved']
  const [files, setFiles] = useState([])
  return (
    <>
      <PageHeader title="Verify my account" subtitle="How your ID check is going. Your documents stay private and are never shown publicly." />
      <Card className="mb-6"><LifecycleStepper steps={steps} current={4} /></Card>
      <Alert tone="trust" title="You're verified" className="mb-6">Approved on 12 March 2026. Re-verification is due in March 2027.</Alert>
      <div className="grid gap-4 md:grid-cols-3">
        {[[IdCard, 'National ID', 'Approved'], [Camera, 'Selfie', 'Approved'], [Building, 'RDB certificate', 'Approved']].map(([Icon, l, s]) => (
          <Card key={l} className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-trust-100 text-trust-fg"><Icon size={20} /></span><div className="flex-1"><p className="font-semibold text-text">{l}</p><StatusBadge status="approved" size="xs" label={s} /></div></Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardTitle sub="e.g. a new trade licence">Add or update a document</CardTitle>
        <FileUploader files={files} onChange={setFiles} accept="image/*,application/pdf" label="Upload document" hint="PDF or image, up to 10 MB" />
        <Button variant="primary" className="mt-3" disabled={!files.length} onClick={() => { setFiles([]); toast('Document submitted for review') }}>Submit</Button>
      </Card>
    </>
  )
}

export function PartnerPlan() {
  const [plan, setPlan] = useState('Growth')
  return (
    <>
      <PageHeader title="Agreement & Plan" subtitle="Your Partner agreement and subscription." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Partner agreement</CardTitle>
          <p className="flex items-center gap-2 text-sm text-trust-fg"><Signature size={16} /> Version 3.2 · signed by Diane Uwase on 12 March 2026</p>
          <Alert tone="serve" className="mt-4" title="Version 3.3 available">Updated payout timing (weekly → twice weekly for Pro). Review and sign by 30 November.</Alert>
          <div className="mt-4 flex gap-2"><Button variant="outline" size="sm" to="/legal/partner-agreement">Read v3.3</Button><Button variant="primary" size="sm" onClick={() => toast('Agreement v3.3 signed')}><Signature size={14} /> Sign v3.3</Button></div>
        </Card>
        <Card>
          <CardTitle>Plan & billing</CardTitle>
          <RadioCards value={plan} onChange={(p) => { setPlan(p); toast(`Plan changed to ${p} — effective next cycle`) }} options={[{ value: 'Starter', label: 'Starter · Free', description: '18% fee · 1 Deal', icon: <Award size={18} /> }, { value: 'Growth', label: 'Growth · RWF 15,000/mo', description: '15% fee · 10 Deals', icon: <Award size={18} /> }, { value: 'Pro', label: 'Pro · RWF 45,000/mo', description: '12% fee · unlimited Deals', icon: <Award size={18} /> }]} />
          <p className="mt-4 text-sm text-muted">Next invoice: 1 November · paid from your payouts.</p>
        </Card>
      </div>
    </>
  )
}
