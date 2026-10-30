import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Target, ThumbsUp, Gavel, ClipboardList, Banknote, Briefcase, Users, ArrowRight, CircleAlert, Download, CircleQuestionMark, ShieldCheck, Tag, IdCard, MessageSquareWarning, Phone, FileCheck, MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { formatNumber, formatCompact } from '@/lib/format'
import { Button, KpiTile, Card, CardTitle, Badge, Segmented, EmptyState, Skeleton, Dialog, Textarea, Field, ProgressBar } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'
import { NeedCard, BundleCard } from '@/components/cards/NeedCard'
import { DealCard } from '@/components/cards/DealCard'
import { APP_CARD_GRID } from '@/components/cards/AnyCard'
import { ChartCard, TrendArea, MonthlyBars } from '@/components/charts/Charts'
import { USERS } from '@/mocks/seed'

export function AdminOverview() {
  const { data } = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: () => api.get('/api/dashboard/admin') })
  const k = data?.kpis
  return (
    <>
      <PageHeader eyebrow="Workspace overview" title="Admin home" subtitle="Start with the items that need attention, then check people, requests, and payments." actions={<Button variant="outline" to="/admin/reports"><Download size={16} /> View reports</Button>} />
      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr]">
        <div className="rounded-card border border-border bg-action-soft p-5 text-text">
          <p className="flex items-center gap-2 text-sm font-semibold text-muted"><Target size={16} className="text-action-fg" /> Service health</p>
          <p className="mt-1 text-sm text-muted">Requests completed on time</p>
          <p className="tabular mt-2 font-display text-5xl font-extrabold text-action-fg">{k ? `${k.onTimePct}%` : '…'}</p>
          <p className="mt-1 text-sm text-trust-fg">▲ 2.1 points vs last month · goal 90%</p>
          <ProgressBar value={k?.onTimePct ?? 0} className="mt-3" tone="serve" label="On-time fulfilment" />
        </div>
        <KpiTile label="Customer rating" value={k ? `★ ${k.satisfaction}` : '…'} icon={<ThumbsUp />} tone="trust" hint="from verified reviews" />
        <KpiTile label="Problems reported" value={k ? `${k.disputeRate}%` : '…'} icon={<Gavel />} tone="warn" hint="of paid requests" to="/admin/disputes" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Requests today" value={k ? formatNumber(k.needsToday) : '…'} icon={<ClipboardList />} tone="serve" to="/admin/needs" />
        <KpiTile label="Payments this month" value={k ? `RWF ${formatCompact(k.gmvMonth)}` : '…'} icon={<Banknote />} tone="trust" to="/admin/payments" />
        <KpiTile label="Service providers" value={k ? formatNumber(k.activePartners) : '…'} icon={<Briefcase />} tone="navy" to="/admin/partners" />
        <KpiTile label="Customers" value={k ? formatNumber(k.activeNeeders) : '…'} icon={<Users />} tone="info" to="/admin/needers" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub="Start with these items">Needs attention</CardTitle>
          <ul className="divide-y divide-border">
            {data?.attention.map((a) => (
              <li key={a.kind}>
                <Link to={a.link} className="flex items-center gap-3 py-3 hover:bg-surface-2">
                  <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', a.kind === 'fraud' ? 'bg-danger-100 text-danger-fg' : 'bg-warn-100 text-warn-fg')}><CircleAlert size={17} /></span>
                  <span className="flex-1 text-sm font-medium text-text">{a.label}</span>
                  <span className="tabular font-bold text-text">{a.count}</span>
                  <ArrowRight size={15} className="text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Waiting for your review</CardTitle>
          <ul className="space-y-2.5">
            {data && [
              [ShieldCheck, 'Requests to review', data.pending.needs, '/admin/review-queue'],
              [Tag, 'Services awaiting approval', data.pending.deals, '/admin/deals?status=pending'],
              [IdCard, 'Identity checks', data.pending.kyc, '/admin/verification'],
              [MessageSquareWarning, 'Messages to check', data.pending.messages, '/admin/moderation/messages'],
            ].map(([Icon, l, n, to]) => (
              <li key={l}><Link to={to} className="flex items-center gap-3 rounded-lg p-2 hover:bg-surface-2"><Icon size={18} className="text-muted" /><span className="flex-1 text-sm text-text">{l}</span><Badge tone={n ? 'serve' : 'grey'}>{n}</Badge></Link></li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  )
}

export function ReviewQueue() {
  const [kind, setKind] = useState('need')
  const [asking, setAsking] = useState(null)
  const needs = useQuery({ queryKey: ['needs', 'queue'], queryFn: () => api.list('needs', { status: 'submitted,under_review,changes_requested', pageSize: 24, sort: '-createdAt' }) })
  const bundles = useQuery({ queryKey: ['bundles', 'queue'], queryFn: () => api.list('bundles', { status: 'submitted,under_review,changes_requested', pageSize: 24 }) })
  const deals = useQuery({ queryKey: ['deals', 'queue'], queryFn: () => api.list('deals', { status: 'pending', pageSize: 24 }) })
  const q = { need: needs, bundle: bundles, deal: deals }[kind]
  return (
    <>
      <PageHeader title="Things waiting for review" subtitle="Open a request, check its proof and requester details, then approve, ask a question, or reject it." />
      <Segmented label="Queue" value={kind} onChange={setKind} className="mb-5" options={[{ value: 'need', label: `Needs (${needs.data?.meta.total ?? '…'})` }, { value: 'bundle', label: `Bundles (${bundles.data?.meta.total ?? '…'})` }, { value: 'deal', label: `Deals (${deals.data?.meta.total ?? '…'})` }]} />
      {q.isLoading ? (
        <div className={APP_CARD_GRID}>{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-96 rounded-card" />)}</div>
      ) : q.data.data.length === 0 ? (
        <EmptyState title="Queue is clear" description="Nice work — nothing waiting for review." />
      ) : (
        <div className={APP_CARD_GRID}>
          {q.data.data.map((it) => (
            <div key={it.id} className="space-y-2">
              {kind === 'deal' ? <DealCard deal={it} context="admin" /> : kind === 'bundle' ? <BundleCard bundle={it} context="admin" /> : <NeedCard need={it} context="admin" />}
              {kind !== 'deal' && (() => {
                const u = USERS.find((x) => x.id === it.posterId)
                return (
                  <div className="rounded-xl bg-surface-2 p-2.5 text-xs">
                    <p className="font-semibold text-text">{u?.name ?? it.poster?.name ?? 'Requester'}</p>
                    <p className="text-muted">{u?.phone ?? 'No phone on file'} · {u?.email ?? 'No email on file'}</p>
                  </div>
                )
              })()}
              {kind !== 'deal' && (
                <div className="grid grid-cols-2 gap-1.5">
                  <Button size="xs" variant="outline" onClick={() => setAsking({ ...it, viewContact: true })}><Phone size={13} /> Requester</Button>
                  <Button size="xs" variant="ghost" onClick={() => setAsking(it)}><CircleQuestionMark size={13} /> Ask info</Button>
                  <Button size="xs" variant="ghost" to={`/admin/inbox?ref=${it.code}&needer=${encodeURIComponent(USERS.find((x) => x.id === it.posterId)?.name ?? it.poster?.name ?? 'Needer')}`}><MessagesSquare size={13} /> Chat with requester</Button>
                  <Button size="xs" variant="ghost" to={`/admin/proofs?q=${it.code}`}><FileCheck size={13} /> View proofs</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!asking} onOpenChange={(o) => !o && setAsking(null)} title={asking?.viewContact ? 'Requester details' : 'Request more information'} description={asking?.title} size="sm" footer={asking?.viewContact ? <Button variant="primary" onClick={() => setAsking(null)}>Close</Button> : <><Button variant="ghost" onClick={() => setAsking(null)}>Cancel</Button><Button variant="primary" onClick={async () => { await api.update(asking.kind === 'bundle' ? 'bundles' : 'needs', asking.code, { status: 'changes_requested' }); setAsking(null); needs.refetch(); bundles.refetch(); toast('Poster asked to edit and resubmit') }}>Send request</Button></>}>
        {asking?.viewContact ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold text-text">{USERS.find((u) => u.id === asking.posterId)?.name ?? asking.poster?.name ?? 'Requester'}</p>
            <p className="text-muted">Admin-only contact details for review and support.</p>
            <dl className="space-y-2 rounded-xl bg-surface-2 p-3">
              <div className="flex justify-between gap-4"><dt className="text-muted">Phone</dt><dd className="font-semibold text-text">{USERS.find((u) => u.id === asking.posterId)?.phone ?? 'Not available'}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Email</dt><dd className="font-semibold text-text">{USERS.find((u) => u.id === asking.posterId)?.email ?? 'Not available'}</dd></div>
            </dl>
          </div>
        ) : <Field label="What should they change?">{(p) => <Textarea {...p} rows={3} defaultValue="Please remove the phone number from the description and add the number of rooms." />}</Field>}
      </Dialog>
    </>
  )
}

export function ReportsPage() {
  const [period, setPeriod] = useState('monthly')
  const { data } = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: () => api.get('/api/dashboard/admin') })
  const reports = [
    ['Marketplace funnel', 'Impressions → Needs submitted → offers → acceptance → fulfilled'],
    ['Fulfilment & SLA', 'On-time %, overdue jobs, response times by category'],
    ['Revenue & escrow', 'GMV, fees, held vs released, refunds'],
    ['Partner performance', 'Ratings, reliability, rejections, levels'],
    ['Trust & Safety', 'Disputes, reports, moderation volume, bans'],
    ['Agents & referrals', 'Referrals, conversions, rewards, fraud flags'],
  ]
  return (
    <>
      <PageHeader title="Reports" subtitle="Daily, weekly, monthly and yearly reports with export." actions={<Segmented label="Period" value={period} onChange={setPeriod} options={['daily', 'weekly', 'monthly', 'yearly'].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) }))} />} />
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Needs vs fulfilled" sub={`${period} view`} loading={!data}>{data && <TrendArea data={data.monthly} keys={[['needs', 'Needs'], ['fulfilled', 'Fulfilled']]} />}</ChartCard>
        <ChartCard title="GMV (RWF millions)" loading={!data}>{data && <MonthlyBars data={data.monthly} keys={[['gmv', 'GMV']]} />}</ChartCard>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {reports.map(([t, d]) => (
          <Card key={t}>
            <p className="font-bold text-text">{t}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
            <div className="mt-4 flex gap-2"><Button size="sm" variant="outline" onClick={() => toast(`${t} (${period}) exported as CSV`)}><Download size={14} /> CSV</Button><Button size="sm" variant="ghost" onClick={() => toast(`${t} (${period}) exported as PDF`)}>PDF</Button></div>
          </Card>
        ))}
      </div>
    </>
  )
}
