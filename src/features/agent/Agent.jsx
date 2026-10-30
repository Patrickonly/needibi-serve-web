import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Tag, Layers, Users, Send, HandHelping, UserPlus, Briefcase, TrendingUp, ListChecks, Siren, Gift, Mic, Copy, Share, Check, IdCard, Camera, Plus, Eye, ClipboardList, CircleCheck, Banknote, CreditCard } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession, useCopy, useShare } from '@/lib/hooks'
import { toast, useAuth, ROLE_HOME } from '@/lib/store'
import { formatMoney, formatDate } from '@/lib/format'
import { CATEGORIES, DISTRICTS, NEEDERS, PARTNERS } from '@/mocks/seed'
import { Button, KpiTile, Card, CardTitle, EmptyState, StatusBadge, Badge, Dialog, Field, Input, Select, Checkbox, Alert, ProgressBar, LifecycleStepper, Avatar } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'
import { DataTable, RowMenu } from '@/components/tables/DataTable'
import { col } from '@/components/tables/columns'
import { PhoneInput, FileUploader } from '@/components/forms/inputs'
import { QrArt } from '@/features/public/sections'
import { useAgentRewards } from '@/lib/agentRewards'
import { NAV } from '@/components/layout/nav'

// Acting for a client swaps the session to their account so every needer/partner page works as-is;
// the agent's own session is kept in useAuth().assistedBy and restored from the banner.
function assistClient(kind, row, navigate, to) {
  const { startAssist } = useAuth.getState()
  if (kind === 'needer') {
    const n = NEEDERS.find((u) => u.id === row.neederId) ?? {}
    const name = n.name ?? row.name
    startAssist({ id: row.neederId, name, firstName: name.split(' ')[0], email: n.email, phone: n.phone, district: n.district ?? row.district, sector: n.sector, avatarHue: n.avatarHue, verified: n.verified ?? true }, 'needer', to)
  } else {
    const p = PARTNERS.find((x) => x.id === row.partnerId) ?? {}
    const owner = p.owner ?? row.name
    startAssist({ id: `u-${row.partnerId}`, name: owner, firstName: owner.split(' ')[0], partnerId: row.partnerId, partnerName: p.name ?? row.name, district: p.district ?? row.district, avatarHue: p.avatarHue, verified: p.verified ?? true }, 'partner', to)
  }
  toast(`You are now helping ${row.name}`, { tone: 'info' })
  navigate(to ?? ROLE_HOME[kind])
}

export function AgentHome() {
  const { user } = useSession()
  const { data } = useQuery({ queryKey: ['dashboard', 'agent'], queryFn: () => api.get('/api/dashboard/agent') })
  const fu = useQuery({ queryKey: ['followups', 'today', user.id], queryFn: () => api.list('followups', { agentId: user.id, status: 'open,overdue', pageSize: 5, sort: 'dueAt' }) })
  const k = data?.kpis
  return (
    <>
      <PageHeader eyebrow="Workspace overview" title={`Muraho, ${user.firstName}`} subtitle={`Your work in ${user.district}: help people, register partners, and finish today's tasks.`} actions={<><Button variant="outline" to="/app/agent/assist"><HandHelping size={16} /> Act for someone</Button><Button variant="outline" to="/app/agent/partners"><Briefcase size={16} /> Add a partner</Button><Button variant="primary" to="/app/agent/needers/post"><Mic size={16} /> Help someone ask</Button></>} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiTile label="People helped" value={k?.assisted ?? '…'} icon={<UserPlus />} tone="info" to="/app/agent/needers" />
        <KpiTile label="Partners registered" value={k?.onboarded ?? '…'} icon={<Briefcase />} tone="serve" to="/app/agent/partners" />
        <KpiTile label="People matched" value={k?.conversions ?? '…'} icon={<TrendingUp />} tone="trust" />
        <KpiTile label="Tasks due today" value={k?.followUpsToday ?? '…'} icon={<ListChecks />} tone="warn" to="/app/agent/follow-ups" />
        <KpiTile label="Problems to solve" value={k?.escalations ?? '…'} icon={<Siren />} tone="danger" to="/app/agent/cases" />
      </div>
      <div className="mt-6">
        <Card>
          <CardTitle action={<Button size="xs" variant="ghost" to="/app/agent/follow-ups">See all</Button>}>Today's tasks</CardTitle>
          <ul className="space-y-3">
            {fu.data?.data.map((f) => (
              <li key={f.id} className="flex items-center gap-3 text-sm">
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', f.status === 'overdue' ? 'bg-danger-600' : 'bg-action-500')} aria-hidden="true" />
                <span className="min-w-0 flex-1"><span className="block truncate font-medium text-text">{f.title}</span><span className="text-xs text-muted">{f.linkedName} · {f.kind === 'partner' ? 'partner' : 'customer'}</span></span>
                <StatusBadge status={f.status} size="xs" />
              </li>
            ))}
          </ul>
          <div className="mt-5 rounded-card bg-trust-100 p-3 text-sm text-trust-fg">
            <Gift size={16} className="inline" /> Rewards waiting: <strong className="tabular">{formatMoney(k?.rewardsPending ?? 0)}</strong>
          </div>
        </Card>
      </div>
    </>
  )
}

export function AgentNeeders() {
  const { user } = useSession()
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title="People I help" subtitle="Help someone describe and submit a request. Always record their consent." actions={<Button variant="primary" to="/app/agent/needers/post"><Mic size={16} /> Ask for someone</Button>} />
      <Alert tone="info" className="mb-4">Choose <strong>Act for them</strong> to open their account and post requests, book deals, pay and confirm delivery on their behalf. You can record the person describing what they need in Kinyarwanda — the words are written down automatically.</Alert>
      <DataTable
        id="agent-needers"
        caption="People I help"
        queryKey={['agentNeeders']}
        fetcher={(p) => api.list('agentNeeders', p)}
        baseParams={{ agentId: user.id }}
        defaultSort="-lastContact"
        columns={[col.person('name', 'Person', { primary: true }), col.text('district', 'District'), col.number('activeNeeds', 'Open requests'), col.number('bookings', 'Bookings'), col.status('consent', 'Consent'), col.date('lastContact', 'Last contact', { relative: true })]}
        filters={[{ id: 'consent', label: 'Consent', options: [{ value: 'recorded', label: 'Recorded' }, { value: 'pending', label: 'Pending' }] }, { id: 'district', label: 'District', options: Object.keys(DISTRICTS).map((d) => ({ value: d, label: d })) }]}
        searchPlaceholder="Search people…"
        rowActions={(r) => <RowMenu items={[{ label: 'Act for them', icon: <HandHelping />, onSelect: () => assistClient('needer', r, navigate) }, { label: 'Ask for them', icon: <Mic />, onSelect: () => navigate('/app/agent/needers/post') }, { label: 'View their requests', icon: <ClipboardList />, onSelect: () => navigate('/app/agent/cases') }, { label: 'Record consent', icon: <CircleCheck />, onSelect: () => toast(`Consent recorded for ${r.name}`) }]} />}
        emptyState={<EmptyState title="Nobody linked yet" description="Help someone ask for their first service." action={<Button to="/app/agent/needers/post" variant="primary">Ask for someone</Button>} />}
      />
    </>
  )
}

function RegisterPartner({ open, onOpenChange }) {
  const [step, setStep] = useState(0)
  const [phone, setPhone] = useState('')
  const [ids, setIds] = useState([])
  const [selfie, setSelfie] = useState([])
  const [consent, setConsent] = useState(false)
  const qc = useQueryClient()
  const steps = ['Business', 'ID check', 'Checklist']
  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setStep(0) }} title="Register a partner" description="Fill this in together with the business owner." size="lg"
      footer={
        <>
          {step > 0 && <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>Back</Button>}
          {step < 2 ? <Button variant="primary" disabled={step === 0 ? phone.length !== 9 : !ids.length || !selfie.length} onClick={() => setStep((s) => s + 1)}>Continue</Button> : <Button variant="primary" disabled={!consent} onClick={async () => { await api.create('agentPartners', { agentId: 'u-eric', name: 'New partner', district: 'Gasabo', checklist: 2, checklistTotal: 5, kycStatus: 'pending', firstDeal: false }); qc.invalidateQueries({ queryKey: ['agentPartners'] }); onOpenChange(false); setStep(0); toast('Partner registered — KYC submitted for review') }}>Submit registration</Button>}
        </>
      }
    >
      <LifecycleStepper steps={steps} current={step} className="mb-6" />
      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name">{(p) => <Input {...p} />}</Field>
          <Field label="Owner full name">{(p) => <Input {...p} />}</Field>
          <Field label="Owner phone (private)">{(p) => <PhoneInput {...p} value={phone} onChange={setPhone} />}</Field>
          <Field label="Main category">{(p) => <Select {...p}>{CATEGORIES.map((c) => <option key={c.slug}>{c.name}</option>)}</Select>}</Field>
          <Field label="District">{(p) => <Select {...p}>{Object.keys(DISTRICTS).map((d) => <option key={d}>{d}</option>)}</Select>}</Field>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <p className="flex items-center gap-2 font-semibold text-text"><IdCard size={18} /> Owner's national ID</p>
          <FileUploader files={ids} onChange={setIds} compact accept="image/*" label="Photograph the ID front & back" />
          <p className="flex items-center gap-2 font-semibold text-text"><Camera size={18} /> Owner's selfie</p>
          <FileUploader files={selfie} onChange={setSelfie} compact multiple={false} accept="image/*" label="Take a selfie of the owner" />
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          {['Business profile created', 'ID documents uploaded', 'Agreement explained', 'Plan chosen (Starter is free)', 'First service listed'].map((s, i) => (
            <p key={s} className="flex items-center gap-2 text-sm"><CircleCheck size={16} className={i < 3 ? 'text-trust-fg' : 'text-border-strong'} /> {s}</p>
          ))}
          <Checkbox checked={consent} onChange={setConsent} label="The owner agreed to register and accepted the partner agreement" />
        </div>
      )}
    </Dialog>
  )
}

export function AgentPartners() {
  const { user } = useSession()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title="Partners I register" subtitle="Help businesses join, get their account checked, and list their first service." actions={<Button variant="primary" onClick={() => setOpen(true)}><Plus size={16} /> Register a partner</Button>} />
      <Alert tone="info" className="mb-4">Choose <strong>Act for this partner</strong> to run their whole partner dashboard for them: answer requests, send offers, publish deals, manage bookings and request payouts.</Alert>
      <DataTable
        id="agent-partners"
        caption="Onboarded Partners"
        queryKey={['agentPartners']}
        fetcher={(p) => api.list('agentPartners', p)}
        baseParams={{ agentId: user.id }}
        columns={[
          col.person('name', 'Partner', { primary: true }),
          col.text('district', 'District'),
          col.custom('checklist', 'Onboarding', (r) => <div className="w-36"><p className="mb-1 text-xs text-muted">{r.checklist}/{r.checklistTotal} steps</p><ProgressBar value={r.checklist} max={r.checklistTotal} size="sm" label="Onboarding checklist" /></div>, { value: (r) => r.checklist, sortable: true }),
          col.status('kycStatus', 'ID check'),
          col.custom('firstDeal', 'First Deal', (r) => (r.firstDeal ? <Badge tone="trust" size="xs" iconName="CircleCheck">Published</Badge> : <Badge size="xs">Not yet</Badge>), { value: (r) => r.firstDeal }),
          col.date(),
        ]}
        filters={[{ id: 'kycStatus', label: 'ID check', options: [{ value: 'approved', label: 'Approved' }, { value: 'pending', label: 'Pending' }, { value: 'info_requested', label: 'Info requested' }] }]}
        searchPlaceholder="Search Partners…"
        rowActions={(r) => <RowMenu items={[{ label: 'Act for this partner', icon: <HandHelping />, onSelect: () => assistClient('partner', r, navigate) }, { label: 'Upload ID together', icon: <IdCard />, onSelect: () => setOpen(true) }, { label: 'Help list first service', icon: <Plus />, onSelect: () => toast(`Draft listing started for ${r.name}`) }]} />}
      />
      <RegisterPartner open={open} onOpenChange={setOpen} />
    </>
  )
}

// Tasks that live on public pages or sub-routes rather than in the client's sidebar.
const EXTRA_TASKS = {
  needer: { group: 'Book & buy', items: [
    { label: 'Book a deal', to: '/deals', icon: Tag },
    { label: 'Ask for a few things', to: '/app/needer/bundles/new', icon: Layers },
    { label: 'Find a partner', to: '/partners', icon: Users },
  ] },
  partner: { group: 'Sell', items: [
    { label: 'Publish a new deal', to: '/app/partner/deals/new', icon: Tag },
    { label: 'Find open requests', to: '/needs', icon: Send },
  ] },
}

export function AgentAssist() {
  const { user } = useSession()
  const navigate = useNavigate()
  const [kind, setKind] = useState('needer')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(null)
  const resource = kind === 'needer' ? 'agentNeeders' : 'agentPartners'
  const list = useQuery({ queryKey: [resource, 'assist', user.id], queryFn: () => api.list(resource, { agentId: user.id, pageSize: 100 }) })
  const term = q.trim().toLowerCase()
  const people = (list.data?.data ?? []).filter((r) => !term || r.name.toLowerCase().includes(term) || String(r.district ?? '').toLowerCase().includes(term))
  const switchKind = (k) => { setKind(k); setPicked(null); setQ('') }
  const who = kind === 'needer' ? 'customer' : 'partner'
  return (
    <>
      <PageHeader title="Act for someone" subtitle="For people who cannot use the website or app themselves. Choose the person, then do any task from their dashboard for them." />
      <div className="mb-4 flex gap-2" role="group" aria-label="Who are you helping?">
        <Button variant={kind === 'needer' ? 'primary' : 'outline'} aria-pressed={kind === 'needer'} onClick={() => switchKind('needer')}><UserPlus size={16} /> A customer</Button>
        <Button variant={kind === 'partner' ? 'primary' : 'outline'} aria-pressed={kind === 'partner'} onClick={() => switchKind('partner')}><Briefcase size={16} /> A partner</Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Card>
          <CardTitle sub={`${people.length} ${people.length === 1 ? 'person' : 'people'}`}>1. Choose the {who}</CardTitle>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or district…" aria-label={`Search ${who}s`} className="mb-3" />
          {list.isLoading ? (
            <p className="py-6 text-center text-sm text-muted">Loading…</p>
          ) : list.isError ? (
            <p className="py-6 text-center text-sm text-danger-fg">Could not load the list. <Button variant="link" size="xs" onClick={() => list.refetch()}>Try again</Button></p>
          ) : people.length === 0 ? (
            <EmptyState title="Nobody found" description={term ? 'Try another name or district.' : `Link a ${who} first.`} />
          ) : (
            <ul className="max-h-[60vh] space-y-1 overflow-y-auto overscroll-contain pr-1">
              {people.map((r) => (
                <li key={r.id}>
                  <Button type="button" variant={picked?.id === r.id ? 'soft' : 'ghost'} size="card" block aria-pressed={picked?.id === r.id} onClick={() => setPicked(r)} className={cn('justify-start rounded-card text-left', picked?.id === r.id && 'ring-1 ring-action-500')}>
                    <Avatar name={r.name} size={32} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text">{r.name}</span><span className="text-xs text-muted">{r.district}</span></span>
                    {picked?.id === r.id && <Check size={16} className="text-action-fg" aria-hidden="true" />}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardTitle sub={picked ? `Everything ${picked.name} can do on their own dashboard. You act as them until you press “Back to my agent workspace”.` : `Choose a ${who} on the left first.`}>2. {picked ? `What do you want to do for ${picked.name}?` : 'Choose a task'}</CardTitle>
          <div className="space-y-5">
            {[EXTRA_TASKS[kind], ...NAV[kind]].map((g) => (
              <section key={g.group}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{g.group}</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                  {g.items.map((t) => {
                    const Icon = t.icon
                    return (
                      <Button key={t.to} type="button" variant="surface" size="card" disabled={!picked} onClick={() => assistClient(kind, picked, navigate, t.to)} className="justify-start rounded-card text-left">
                        <Icon size={17} className="shrink-0 text-action-fg" aria-hidden="true" />
                        <span className="min-w-0 truncate">{t.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}

export function AgentCases() {
  const { user } = useSession()
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title="My cases" subtitle="Requests and bookings that need your help. You only see cases assigned to you." />
      <DataTable
        id="agent-cases"
        caption="Assigned cases"
        queryKey={['cases']}
        fetcher={(p) => api.list('cases', p)}
        baseParams={{ agentId: user.id }}
        defaultSort="-assignedAt"
        columns={[col.code('refCode', 'Ref'), { ...col.text('title', 'Case'), meta: { sortable: true, mobilePrimary: true } }, col.badge('kind', 'Type', { need: { tone: 'navy', label: 'Need' }, bundle: { tone: 'serve', label: 'Bundle' }, booking: { tone: 'trust', label: 'Booked Deal' } }), col.text('clientName', 'Client'), col.status(), col.date('assignedAt', 'Assigned')]}
        statusTabs={{ field: 'kind', tabs: [{ value: 'need', label: 'Needs' }, { value: 'bundle', label: 'Bundles' }, { value: 'booking', label: 'Booked Deals' }] }}
        searchPlaceholder="Search cases…"
        rowActions={(r) => <RowMenu items={[{ label: 'Open', icon: <Eye />, onSelect: () => navigate(r.kind === 'booking' ? '/deals' : `/${r.kind === 'bundle' ? 'bundles' : 'needs'}/${r.refCode}`) }, { label: 'Chat on this case', icon: <ClipboardList />, onSelect: () => navigate(`/app/agent/messages?ref=${r.refCode}`) }, { label: 'Escalate', icon: <Siren />, tone: 'danger', onSelect: () => toast('Escalated to admins', { tone: 'info' }) }]} />}
      />
    </>
  )
}

export function AgentFollowUps() {
  const { user } = useSession()
  const qc = useQueryClient()
  return (
    <>
      <PageHeader title="Tasks" subtitle="Simple reminders for the people and providers you help." actions={<Button variant="primary" onClick={async () => { await api.create('followups', { agentId: user.id, title: 'New follow-up', linkedName: '—', kind: 'needer', priority: 'normal', status: 'open', dueAt: new Date(Date.now() + 86400000).toISOString() }); qc.invalidateQueries({ queryKey: ['followups'] }); toast('Task added') }}><Plus size={16} /> Add task</Button>} />
      <DataTable
        id="agent-followups"
        caption="Follow-ups"
        queryKey={['followups']}
        fetcher={(p) => api.list('followups', p)}
        baseParams={{ agentId: user.id }}
        defaultSort="dueAt"
        columns={[{ ...col.text('title', 'Task'), meta: { sortable: true, mobilePrimary: true } }, col.text('linkedName', 'Person'), col.badge('kind', 'Workspace', { needer: { tone: 'info', label: 'Customer' }, partner: { tone: 'serve', label: 'Provider' } }), col.priority(), col.date('dueAt', 'Due'), col.status()]}
        statusTabs={{ field: 'status', tabs: [{ value: 'open', label: 'Open' }, { value: 'overdue', label: 'Overdue' }, { value: 'done', label: 'Done' }] }}
        bulkActions={[{ label: 'Mark done', icon: <Check size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('followups', r.id, { status: 'done' }))); toast(`${rows.length} marked done`) } }]}
        rowActions={(r) => (r.status !== 'done' ? <Button size="xs" variant="outline" onClick={async () => { await api.update('followups', r.id, { status: 'done' }); qc.invalidateQueries({ queryKey: ['followups'] }); toast('Done') }}><Check size={13} /> Done</Button> : null)}
        searchPlaceholder="Search tasks…"
      />
    </>
  )
}

export function AgentReferrals() {
  const { user } = useSession()
  const copy = useCopy()
  const share = useShare()
  const link = `${location.origin}/auth/register?ref=${user.agentCode}`
  const rw = useAgentRewards()
  return (
    <>
      <PageHeader title="Referrals" subtitle={`You earn ${formatMoney(rw.referralSignup)} when someone signs up with your code, ${formatMoney(rw.referralVerified)} when they are verified, and ${formatMoney(rw.referralFirstTransaction)} after their first transaction.`} />
      <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_auto]">
        <Card>
          <p className="text-sm text-muted">Your referral code</p>
          <p className="tabular font-display text-3xl font-extrabold tracking-wider text-primary">{user.agentCode}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => copy(user.agentCode, 'Code copied')}><Copy size={15} /> Copy code</Button>
            <Button variant="outline" size="sm" onClick={() => copy(link)}><Copy size={15} /> Copy link</Button>
            <Button variant="primary" size="sm" onClick={() => share({ title: 'Join Needibi Serve', path: `/auth/register?ref=${user.agentCode}` })}><Share size={15} /> Share</Button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
            {[['Earned', 42500, 'trust'], ['Pending', 13500, 'warn'], ['Paid', 120000, 'navy']].map(([l, v, t]) => (
              <div key={l} className="rounded-card bg-surface-2 p-3"><p className="text-muted">{l}</p><p className={`tabular font-extrabold text-${t === 'navy' ? 'primary' : `${t}-fg`}`}>{formatMoney(v)}</p></div>
            ))}
          </div>
        </Card>
        <Card className="flex flex-col items-center justify-center"><QrArt size={144} /><p className="mt-2 text-xs text-muted">Scan to join with your code</p></Card>
      </div>
      <DataTable
        id="agent-referrals"
        caption="Referred users"
        queryKey={['referrals', 'agent']}
        fetcher={(p) => api.list('referrals', p)}
        baseParams={{ agentId: user.id }}
        columns={[
          col.person('referredName', 'Referred', { primary: true }),
          col.badge('referredRole', 'Role', { needer: { tone: 'info', label: 'Customer' }, partner: { tone: 'serve', label: 'Provider' } }),
          col.custom('stage', 'Progress', (r) => <div className="flex items-center gap-1" aria-label={`Stage: ${r.stage}`}>{['signed_up', 'verified', 'first_transaction'].map((s, i) => <span key={s} className={cn('h-1.5 w-8 rounded-full', ['signed_up', 'verified', 'first_transaction'].indexOf(r.stage) >= i ? 'bg-trust-600' : 'bg-grey-100')} />)}<StatusBadge status={r.stage} size="xs" className="ml-2" /></div>, { value: (r) => r.stage, sortable: true }),
          col.money('reward', 'Reward'),
          col.status('rewardStatus', 'Reward status'),
          col.custom('fraud', 'Flags', (r) => (r.fraudFlag ? <Badge tone="danger" iconName="Flag" size="xs">Under review</Badge> : '—'), { value: (r) => r.fraudFlag }),
          col.date(),
        ]}
        statusTabs={{ field: 'stage', tabs: [{ value: 'signed_up', label: 'Signed up' }, { value: 'verified', label: 'Verified' }, { value: 'first_transaction', label: 'First transaction' }] }}
        searchPlaceholder="Search referrals…"
      />
    </>
  )
}

function RewardRates() {
  const r = useAgentRewards()
  const items = [
    ['Per customer booking', `${r.neederBookingPct}%`],
    ['Per provider deal', `${r.partnerDealPct}%`],
    ['Provider registered', formatMoney(r.partnerOnboarded)],
    ['Referral, first transaction', formatMoney(r.referralFirstTransaction)],
  ]
  return (
    <Card className="mb-4">
      <CardTitle sub={`Set by Needibi. Tiers: ${r.tiers.map((t) => `${t.name} ${t.target}+ matches (+${t.bonusPct}%)`).join(' · ')}. Minimum payment ${formatMoney(r.minPayout)}.`}>How you earn</CardTitle>
      <div className="grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
        {items.map(([l, v]) => <div key={l} className="rounded-card bg-surface-2 p-3"><p className="text-muted">{l}</p><p className="tabular font-extrabold text-text">{v}</p></div>)}
      </div>
    </Card>
  )
}

export function AgentCommissions() {
  const { user } = useSession()
  return (
    <>
      <PageHeader title="My earnings" subtitle="See what you earned and request payment to your saved mobile-money account." actions={<Button variant="primary" onClick={async () => { await api.create('payouts', { recipientId: user.id, recipientKind: 'agent', method: 'momo', status: 'requested' }); toast('Payment request sent') }}><Banknote size={16} /> Request payment</Button>} />
      <RewardRates />
      <Alert tone="info" className="mb-4"><CreditCard size={16} className="mr-2 inline" /> Payments are sent to the mobile-money number in your profile. Update it before requesting payment.</Alert>
      <DataTable
        id="agent-commissions"
        caption="Commissions"
        queryKey={['commissions', 'agent']}
        fetcher={(p) => api.list('commissions', p)}
        baseParams={{ agentId: user.id }}
        defaultSort="-month"
        columns={[{ ...col.text('month', 'Month'), cell: ({ row }) => formatDate(`${row.original.month}-01`, { day: undefined }), meta: { sortable: true, mobilePrimary: true } }, col.number('assisted', 'Assisted'), col.number('onboarded', 'Onboarded'), col.number('conversions', 'Conversions'), col.money('amount', 'Commission'), col.status()]}
        searchPlaceholder="Search months…"
      />
    </>
  )
}

export function AgentProfile() {
  const { user } = useSession()
  return (
    <>
      <PageHeader title="Profile" />
      <Card className="max-w-2xl">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} hue={user.avatarHue} size={72} />
          <div><p className="text-lg font-bold text-text">{user.name}</p><p className="text-sm text-muted">Agent {user.agentCode} · {user.sector}, {user.district}</p><Badge tone="trust" iconName="BadgeCheck" className="mt-1">Verified Agent</Badge></div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Coverage district">{(p) => <Select {...p} defaultValue={user.district}>{Object.keys(DISTRICTS).map((d) => <option key={d}>{d}</option>)}</Select>}</Field>
          <Field label="Languages">{(p) => <Input {...p} defaultValue="Kinyarwanda, English, Swahili" />}</Field>
        </div>
        <Button variant="primary" className="mt-5" onClick={() => toast('Profile saved')}>Save</Button>
      </Card>
    </>
  )
}
