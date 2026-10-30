import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Eye, Download, Signature, Plus, Gavel, Paperclip, Send, Lock, Bell, Smartphone, Mail, MessageCircle, Monitor, LogOut, Trash, KeyRound, Sun, Moon, Globe, Scale, Undo, BanknoteCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession } from '@/lib/hooks'
import { useUI, toast } from '@/lib/store'
import i18n from '@/lib/i18n'
import { useLocales } from '@/lib/locales'
import { formatMoney, formatDate, formatDateTime, timeAgo, ago } from '@/lib/format'
import { Button, Card, CardTitle, EmptyState, StatusBadge, PriorityBadge, Badge, Dialog, Field, Input, Textarea, Select, Switch, Segmented, Alert, Skeleton, LifecycleStepper, Tabs, TabList, Tab, TabPanel, Drawer, ConfirmDialog, Chip, LogoMark, DefinitionList } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'
import { DataTable, RowMenu } from '@/components/tables/DataTable'
import { col } from '@/components/tables/columns'
import { FileUploader } from '@/components/forms/inputs'
import { EscrowBanner } from '@/components/payments/Payments'

const scopeParams = (role, user) => (role === 'partner' ? { partnerId: user.partnerId } : role === 'admin' ? {} : { neederId: user.id })
const base = (role) => (role === 'admin' ? '/admin' : `/app/${role}`)
const DATE_FILTER = { id: 'since', label: 'Date', options: [{ value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }, { value: '365d', label: 'Last year' }] }

/* ================================================================ Agreements */
export function AgreementsPage({ role }) {
  const { user } = useSession()
  const navigate = useNavigate()
  return (
    <>
      <PageHeader title="Agreements" subtitle="Structured, versioned contracts for every Need, Bundle and Deal." />
      <DataTable
        id={`${role}-agreements`}
        caption="Agreements"
        queryKey={['agreements', role]}
        fetcher={(p) => api.list('agreements', p)}
        baseParams={scopeParams(role, user)}
        columns={[
          col.code(),
          { ...col.text('title', 'For'), cell: ({ row }) => <span className="block max-w-[260px] truncate font-semibold">{row.original.title}</span>, meta: { sortable: true, mobilePrimary: true } },
          col.badge('kind', 'Type', { need: { tone: 'navy', label: 'Need' }, bundle: { tone: 'serve', label: 'Bundle' }, deal: { tone: 'trust', label: 'Deal' } }),
          col.text(role === 'partner' ? 'neederName' : 'partnerName', role === 'partner' ? 'Needer' : 'Partner'),
          col.money('price', 'Price'),
          { ...col.text('version', 'Version'), cell: ({ row }) => `v${row.original.version}` },
          col.status(),
          col.date(),
        ]}
        statusTabs={{ field: 'status', tabs: [{ value: 'awaiting_signature', label: 'To sign' }, { value: 'signed', label: 'Signed' }, { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }] }}
        filters={[{ id: 'kind', label: 'Type', options: [{ value: 'need', label: 'Need' }, { value: 'bundle', label: 'Bundle' }, { value: 'deal', label: 'Deal' }] }, DATE_FILTER]}
        searchPlaceholder="Search agreements…"
        onRowClick={(r) => navigate(`${base(role)}/agreements/${r.code}`)}
        rowActions={(r) => <RowMenu items={[{ label: 'Open', icon: <Eye />, onSelect: () => navigate(`${base(role)}/agreements/${r.code}`) }, { label: 'Download PDF', icon: <Download />, onSelect: () => toast('PDF download started') }]} />}
        emptyState={<EmptyState title="No agreements yet" description="An agreement is created when an offer is accepted or a Deal is booked." />}
      />
    </>
  )
}

export function AgreementViewer({ role }) {
  const { code } = useParams()
  const { user } = useSession()
  const qc = useQueryClient()
  const { data: a, isLoading } = useQuery({ queryKey: ['agreements', code], queryFn: () => api.one('agreements', code) })
  const [name, setName] = useState('')
  const sign = useMutation({
    mutationFn: () => api.update('agreements', code, { status: 'signed', signedAt: new Date().toISOString(), signedBy: name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agreements'] })
      toast('Agreement signed', { description: 'Both sides get a copy. Next: pay safely.' })
    },
  })
  if (isLoading) return <Skeleton className="h-[600px] rounded-card" />
  if (!a) return <EmptyState title="Agreement not found" />
  const needsSig = ['awaiting_signature', 'draft'].includes(a.status)
  const fee = a.fee?.amount ?? Math.round(a.price.amount * 0.15)
  return (
    <>
      <PageHeader back={{ to: `${base(role)}/agreements`, label: 'Agreements' }} title={`Agreement ${a.code}`} subtitle={`${a.title} · version ${a.version}`} actions={<Button variant="outline" onClick={() => window.print()}><Download size={16} /> Download PDF</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card className="space-y-6 p-6 sm:p-8">
          <header className="flex items-start justify-between gap-4 border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <LogoMark size={36} />
              <div>
                <p className="font-bold text-text">Service Agreement</p>
                <p className="text-xs text-muted">NEEDIBI ONLINE SERVICES LTD · Kigali</p>
              </div>
            </div>
            <StatusBadge status={a.status} size="md" />
          </header>
          <DefinitionList items={[['Needer', a.neederName], ['Partner', a.partnerName], ['Reference', a.refCode], ['Type', a.kind]]} />
          {[
            ['1. Scope & specifications', `${a.title}. Work as described in ${a.refCode}, including all inclusions listed in the accepted offer.`],
            ['2. Price, fees & tax', `Agreed price ${formatMoney(a.price)}. Platform fee ${formatMoney(fee)} (deducted from the Partner payout). Prices include VAT where applicable.`],
            ['3. Deadlines', `Work completed by ${formatDate(a.deadline)}. Delays must be agreed in Chat.`],
            ['4. Payment & escrow', 'The Needer pays into escrow before work starts. Funds are released when the Needer confirms satisfaction, or by an admin decision in a dispute.'],
            ['5. Cancellation & refunds', 'Free cancellation until the Partner starts. After that, refunds follow the dispute process: refund, release or partial.'],
            ['6. Responsibilities', 'The Partner provides qualified staff, tools and materials as listed. The Needer gives access to the service location at the agreed time.'],
            ...(a.recurring ? [['7. Recurring schedule', 'Weekly on Saturdays at 09:00 for 12 cycles. Billed per occurrence.']] : []),
          ].map(([h, p]) => (
            <section key={h}>
              <h2 className="font-bold text-primary">{h}</h2>
              <p className="mt-1 text-[15px] text-text">{p}</p>
            </section>
          ))}
          <footer className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Needer signature</p>
              <p className="mt-1 font-display text-xl italic text-text">{a.signedBy ?? (a.signedAt ? a.neederName : '—')}</p>
              {a.signedAt && <p className="text-xs text-muted">{formatDateTime(a.signedAt)}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Partner signature</p>
              <p className="mt-1 font-display text-xl italic text-text">{a.partnerName}</p>
            </div>
          </footer>
        </Card>
        <aside className="space-y-4">
          {needsSig ? (
            <Card>
              <CardTitle>Sign this agreement</CardTitle>
              <Field label="Type your full name to sign" hint={`Must match ${user.name}`}>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} className="font-display text-lg italic" autoComplete="name" />}</Field>
              <Button variant="primary" block className="mt-4" disabled={name.trim().toLowerCase() !== user.name.toLowerCase()} loading={sign.isPending} onClick={() => sign.mutate()}><Signature size={16} /> Sign agreement</Button>
              <p className="mt-2 text-xs text-muted">Signing is legally binding and recorded in the audit log.</p>
            </Card>
          ) : (
            <Alert tone="trust" title="Signed">Both parties hold version {a.version}. Changes create a new version.</Alert>
          )}
          <EscrowBanner compact />
          <Card>
            <CardTitle>Version history</CardTitle>
            <ol className="space-y-2 text-sm">
              {Array.from({ length: a.version }, (_, i) => (
                <li key={i} className="flex justify-between"><span>v{a.version - i}{i === 0 && ' · current'}</span><span className="text-muted">{formatDate(new Date(new Date(a.createdAt).getTime() + (a.version - i) * 86400000).toISOString())}</span></li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </>
  )
}

/* ================================================================ Disputes */
const DISPUTE_REASONS = ['Work not completed', 'Quality below agreement', 'Partner did not show up', 'Damaged item', 'Charged more than agreed', 'Needer did not confirm completion', 'Other']
const DESIRED_RESOLUTIONS = ['Full refund', 'Partial refund', 'Redo the work', 'Release payment']

function OpenDisputeDialog({ open, onOpenChange, role }) {
  const { user } = useSession()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [f, setF] = useState({ refCode: '', reason: DISPUTE_REASONS[0], desiredResolution: role === 'partner' ? 'Release payment' : DESIRED_RESOLUTIONS[0], details: '' })
  const [files, setFiles] = useState([])
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = async () => {
    const code = `DS-${String(Date.now()).slice(-5)}`
    await api.create('disputes', {
      code,
      refCode: f.refCode.trim().toUpperCase(),
      refTitle: f.refCode.trim().toUpperCase(),
      raisedById: user.id,
      raisedBy: user.name,
      partnerId: role === 'partner' ? user.partnerId : undefined,
      against: role === 'partner' ? 'Needer' : 'Partner',
      reason: f.reason,
      desiredResolution: f.desiredResolution,
      details: f.details,
      amount: { amount: 0, currency: 'RWF' },
      status: 'open',
      assignedAdmin: 'Being assigned',
      createdAt: new Date().toISOString(),
    })
    qc.invalidateQueries({ queryKey: ['disputes'] })
    onOpenChange(false)
    toast('Dispute opened', { description: 'Escrow for this job is on hold. An admin reviews both sides within 48 h.' })
    navigate(`${base(role)}/disputes/${code}`)
  }
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Open a dispute"
      description="Tell us what went wrong. Escrow stays on hold until an admin resolves the case."
      footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" disabled={!f.refCode.trim() || !f.details.trim()} onClick={submit}><Gavel size={16} /> Open dispute</Button></>}
    >
      <div className="space-y-4">
        <Field label="Need, Bundle, Deal or booking code" hint="Find it on the item or in your History.">{(p) => <Input {...p} value={f.refCode} onChange={set('refCode')} placeholder="e.g. NS-26-08731" />}</Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="What went wrong?">{(p) => <Select {...p} value={f.reason} onChange={set('reason')}>{DISPUTE_REASONS.map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
          <Field label="What would resolve it?">{(p) => <Select {...p} value={f.desiredResolution} onChange={set('desiredResolution')}>{DESIRED_RESOLUTIONS.map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
        </div>
        <Field label="Describe what happened">{(p) => <Textarea {...p} rows={4} value={f.details} onChange={set('details')} placeholder="Dates, what was agreed and what was delivered." />}</Field>
        <FileUploader files={files} onChange={setFiles} compact label="Evidence: photos, receipts, screenshots" accept="image/*,application/pdf" />
      </div>
    </Dialog>
  )
}

const APPEAL_TYPES = ['Dispute decision', 'Content moderation', 'Account decision']
const APPEAL_REASONS = ['New evidence available', 'Resolution amount disputed', 'Partner response ignored', 'Decision based on wrong information', 'Other']

/** A different, senior admin reviews every appeal. One appeal per decision. */
export function AppealDialog({ open, onOpenChange, defaultRef = '', defaultType = APPEAL_TYPES[0] }) {
  const { user } = useSession()
  const qc = useQueryClient()
  const [f, setF] = useState({ type: defaultType, ref: defaultRef, reason: APPEAL_REASONS[0], details: '' })
  const [files, setFiles] = useState([])
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const submit = async () => {
    await api.create('appeals', { code: `AP-${String(Date.now()).slice(-4)}`, disputeCode: f.ref.trim().toUpperCase(), type: f.type, appellant: user.name, reason: f.reason, details: f.details, status: 'open', createdAt: new Date().toISOString() })
    qc.invalidateQueries({ queryKey: ['appeals'] })
    onOpenChange(false)
    toast('Appeal submitted', { description: 'A senior admin who was not involved reviews it within 48 h.' })
  }
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Submit an appeal"
      description="Challenge a dispute decision, a moderation decision or an account action."
      footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" disabled={!f.ref.trim() || !f.details.trim()} onClick={submit}><Scale size={16} /> Submit appeal</Button></>}
    >
      <div className="space-y-4">
        <Field label="What are you appealing?">{(p) => <Select {...p} value={f.type} onChange={set('type')}>{APPEAL_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
        <Field label="Reference" hint="Dispute code, item code or the notice you received.">{(p) => <Input {...p} value={f.ref} onChange={set('ref')} placeholder="e.g. DS-01204" />}</Field>
        <Field label="Reason">{(p) => <Select {...p} value={f.reason} onChange={set('reason')}>{APPEAL_REASONS.map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
        <Field label="Explain why the decision should change">{(p) => <Textarea {...p} rows={4} value={f.details} onChange={set('details')} />}</Field>
        <FileUploader files={files} onChange={setFiles} compact label="New evidence (optional)" accept="image/*,application/pdf" />
      </div>
    </Dialog>
  )
}

export function AppealsPage({ role }) {
  const { user } = useSession()
  const [open, setOpen] = useState(false)
  return (
    <>
      <PageHeader
        title="Appeals"
        subtitle="Challenge a dispute, moderation or account decision. A different, senior admin reviews every appeal."
        actions={<Button variant="primary" onClick={() => setOpen(true)}><Scale size={16} /> Submit an appeal</Button>}
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {[
          ['1', 'Submit within 14 days', 'Explain what should change and add any new evidence.'],
          ['2', 'Independent review', 'A senior admin who was not involved decides within 48 h.'],
          ['3', 'Final decision', 'The decision is upheld or overturned. You are notified either way.'],
        ].map(([n, t, d]) => (
          <Card key={n} className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-action-100 font-display font-bold text-action-fg">{n}</span>
            <div><p className="font-semibold text-text">{t}</p><p className="mt-0.5 text-sm text-muted">{d}</p></div>
          </Card>
        ))}
      </div>
      <DataTable
        id={`${role}-appeals`}
        caption="Appeals"
        queryKey={['appeals', role]}
        fetcher={(p) => api.list('appeals', p)}
        baseParams={{ appellant: user.name }}
        columns={[col.code(), { ...col.text('disputeCode', 'Reference'), meta: { mobilePrimary: true } }, col.text('reason', 'Reason'), col.status(), col.date()]}
        statusTabs={{ field: 'status', tabs: [{ value: 'open', label: 'Open' }, { value: 'under_review', label: 'Under review' }, { value: 'upheld', label: 'Upheld' }, { value: 'overturned', label: 'Overturned' }] }}
        searchPlaceholder="Search appeals…"
        emptyState={<EmptyState title="No appeals" description="If you disagree with a decision, you can appeal it once." action={<Button variant="outline" onClick={() => setOpen(true)}>Submit an appeal</Button>} />}
      />
      {open && <AppealDialog open={open} onOpenChange={setOpen} />}
    </>
  )
}

export function DisputesPage({ role }) {
  const { user } = useSession()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  return (
    <>
      <PageHeader
        title="Disputes"
        subtitle="Cases where something went wrong. Escrow stays on hold until resolved."
        actions={role !== 'admin' && (
          <>
            <Button variant="outline" to={`${base(role)}/appeals`}><Scale size={16} /> Appeals</Button>
            <Button variant="primary" onClick={() => setOpen(true)}><Gavel size={16} /> Open a dispute</Button>
          </>
        )}
      />
      {open && <OpenDisputeDialog open={open} onOpenChange={setOpen} role={role} />}
      <DataTable
        id={`${role}-disputes`}
        caption="Disputes"
        queryKey={['disputes', role]}
        fetcher={(p) => api.list('disputes', p)}
        baseParams={role === 'partner' ? { partnerId: user.partnerId } : role === 'admin' ? {} : { raisedById: user.id }}
        columns={[col.code(), { ...col.text('refTitle', 'About'), meta: { sortable: true, mobilePrimary: true } }, col.text('reason', 'Reason'), col.text('desiredResolution', 'Desired'), col.money('amount', 'Amount'), col.text('assignedAdmin', 'Admin'), col.status(), col.date()]}
        statusTabs={{ field: 'status', tabs: [{ value: 'open', label: 'Open' }, { value: 'under_review', label: 'Under review' }, { value: 'awaiting_evidence', label: 'Awaiting evidence' }, { value: 'resolved', label: 'Resolved' }, { value: 'appealed', label: 'Appealed' }] }}
        searchPlaceholder="Search disputes…"
        onRowClick={(r) => navigate(`${base(role)}/disputes/${r.code}`)}
        emptyState={<EmptyState title="No disputes" description="Good news — nothing has gone wrong. If it does, raise a dispute from the Need or Booking." />}
      />
    </>
  )
}

export function DisputeDetail({ role }) {
  const { code } = useParams()
  const qc = useQueryClient()
  const { data: d, isLoading } = useQuery({ queryKey: ['disputes', code], queryFn: () => api.one('disputes', code) })
  const [files, setFiles] = useState([])
  const [note, setNote] = useState('')
  const [resolution, setResolution] = useState('partial')
  const [pct, setPct] = useState(50)
  const [appealOpen, setAppealOpen] = useState(false)
  if (isLoading) return <Skeleton className="h-96 rounded-card" />
  if (!d) return <EmptyState title="Dispute not found" />
  const steps = ['Opened', 'Under review', 'Evidence', 'Resolved']
  const current = { open: 0, under_review: 1, awaiting_evidence: 2, resolved: 3, appealed: 3 }[d.status]
  const resolve = async () => {
    await api.update('disputes', d.code, { status: 'resolved', resolution: resolution === 'refund' ? 'Refund' : resolution === 'release' ? 'Release' : 'Partial' })
    qc.invalidateQueries({ queryKey: ['disputes'] })
    toast('Dispute resolved', { description: 'Both parties are notified. Logged in the audit trail.' })
  }
  return (
    <>
      <PageHeader back={{ to: `${base(role)}/disputes`, label: 'Disputes' }} title={`Dispute ${d.code}`} subtitle={d.refTitle} />
      <Card className="mb-6"><LifecycleStepper steps={steps} current={current} /></Card>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <DefinitionList cols={3} items={[['Raised by', d.raisedBy], ['Against', d.against], ['Amount on hold', formatMoney(d.amount)], ['Reason', d.reason], ['Desired resolution', d.desiredResolution], ['Assigned admin', d.assignedAdmin]]} />
          </Card>
          <Card>
            <CardTitle>Case timeline</CardTitle>
            <ol className="relative space-y-5 border-l-2 border-border pl-6">
              {[
                ['Dispute opened', `${d.raisedBy} — “${d.reason}”`, d.createdAt],
                ['Escrow put on hold', 'Funds frozen until resolution', d.createdAt],
                ['Admin assigned', d.assignedAdmin, d.createdAt],
                ['Partner responded', 'We arrived on time; the extra fitting was not in scope.', d.createdAt],
                ...(d.status === 'resolved' ? [['Resolved', `Resolution: ${d.resolution ?? 'Partial'}`, d.createdAt]] : []),
              ].map(([t, body, at], i) => (
                <li key={t} className="relative">
                  <span className={cn('absolute -left-[31px] top-0.5 h-4 w-4 rounded-full ring-4 ring-bg', i === 0 ? 'bg-danger-600' : 'bg-primary-500')} />
                  <p className="font-semibold text-text">{t}</p>
                  <p className="text-sm text-muted">{body} · {formatDate(new Date(new Date(at).getTime() + i * 5 * 3600000).toISOString(), { hour: '2-digit', minute: '2-digit' })}</p>
                </li>
              ))}
            </ol>
          </Card>
          {d.status !== 'resolved' && (
            <Card>
              <CardTitle>Add evidence or a note</CardTitle>
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Note" placeholder="Explain what happened" />
              <div className="mt-3"><FileUploader files={files} onChange={setFiles} compact label="Photos, receipts, chat screenshots" accept="image/*,application/pdf" /></div>
              <Button variant="navy" className="mt-3" disabled={!note && !files.length} onClick={() => { setNote(''); setFiles([]); toast('Evidence added to the case') }}><Paperclip size={15} /> Submit evidence</Button>
            </Card>
          )}
        </div>
        <aside className="space-y-4">
          {role === 'admin' && d.status !== 'resolved' ? (
            <Card>
              <CardTitle>Resolve</CardTitle>
              <div className="space-y-2">
                {[['refund', 'Refund the Needer', Undo], ['release', 'Release to the Partner', BanknoteCheck], ['partial', 'Partial split', Scale]].map(([v, l, Icon]) => (
                  <label key={v} className={cn('flex cursor-pointer items-center gap-3 rounded-card border p-3', resolution === v ? 'border-action-500 bg-action-soft/50' : 'border-border')}>
                    <input type="radio" name="res" checked={resolution === v} onChange={() => setResolution(v)} className="accent-[var(--action-500)]" />
                    <Icon size={16} /> <span className="text-sm font-medium">{l}</span>
                  </label>
                ))}
              </div>
              {resolution === 'partial' && (
                <Field label={`Needer refund: ${pct}% (${formatMoney(Math.round(d.amount.amount * pct / 100))})`} className="mt-3">{(p) => <input {...p} type="range" min="5" max="95" step="5" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-[var(--action-500)]" />}</Field>
              )}
              <Field label="Reason (shared with both parties)" className="mt-3">{(p) => <Textarea {...p} rows={2} />}</Field>
              <Button variant="primary" block className="mt-3" onClick={resolve}><Gavel size={16} /> Resolve dispute</Button>
            </Card>
          ) : d.status === 'resolved' ? (
            <Card>
              <Alert tone="trust" title={`Resolved · ${d.resolution ?? 'Partial'}`}>Funds have been moved according to the decision.</Alert>
              {role !== 'admin' && <Button variant="outline" block className="mt-3" onClick={() => setAppealOpen(true)}><Scale size={16} /> Appeal decision</Button>}
              {appealOpen && <AppealDialog open={appealOpen} onOpenChange={setAppealOpen} defaultRef={d.code} />}
            </Card>
          ) : (
            <Alert tone="info" title="What happens next">{d.assignedAdmin} reviews evidence from both sides, usually within 48 hours. You can appeal once after a decision.</Alert>
          )}
        </aside>
      </div>
    </>
  )
}

/* ================================================================ Support tickets */
const TICKET_STEPS = ['Open', 'Assigned', 'Awaiting', 'Escalated', 'Resolved', 'Closed']
const TICKET_INDEX = { open: 0, assigned: 1, awaiting_user: 2, escalated: 3, resolved: 4, closed: 5 }
function NewTicket({ open, onOpenChange, user, role }) {
  const qc = useQueryClient()
  const [f, setF] = useState({ subject: '', category: 'Payments', priority: 'normal', linkedItem: '', body: '' })
  const [files, setFiles] = useState([])
  const create = async () => {
    const t = await api.create('tickets', { code: `TK-${Math.floor(21000 + Math.random() * 900)}`, ...f, status: 'open', requesterId: role === 'partner' ? 'p-cleanpro' : user.id, requesterName: user.name, requesterRole: role, slaDueAt: new Date(Date.now() + 4 * 3600000).toISOString(), updatedAt: new Date().toISOString() })
    qc.invalidateQueries({ queryKey: ['tickets'] })
    onOpenChange(false)
    toast(`Ticket ${t.code} created`, { description: "We'll reply within 4 hours (usually much faster)." })
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New support ticket" description="Link the item so we can help faster." size="lg" footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" disabled={f.subject.length < 5 || f.body.length < 10} onClick={create}><Send size={16} /> Submit ticket</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject" className="sm:col-span-2">{(p) => <Input {...p} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />}</Field>
        <Field label="Category">{(p) => <Select {...p} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{['Payments', 'Verification', 'Account', 'Offers', 'Disputes', 'Technical'].map((c) => <option key={c}>{c}</option>)}</Select>}</Field>
        <Field label="Priority">{(p) => <Select {...p} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></Select>}</Field>
        <Field label="Linked item" optional className="sm:col-span-2">{(p) => <Input {...p} value={f.linkedItem} onChange={(e) => setF({ ...f, linkedItem: e.target.value.toUpperCase() })} placeholder="e.g. NS-26-08731, BK-030200, PAY-0880000" />}</Field>
        <Field label="Describe the issue" className="sm:col-span-2">{(p) => <Textarea {...p} rows={4} value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />}</Field>
        <div className="sm:col-span-2"><FileUploader files={files} onChange={setFiles} compact label="Screenshots" accept="image/*" /></div>
      </div>
    </Dialog>
  )
}

export function TicketDrawer({ ticket, onOpenChange, staff }) {
  const [reply, setReply] = useState('')
  const [internal, setInternal] = useState(false)
  const qc = useQueryClient()
  if (!ticket) return null
  const msgs = [
    { from: ticket.requesterName, body: `Hello, ${ticket.subject.toLowerCase()}. ${ticket.linkedItem ? `It's about ${ticket.linkedItem}.` : ''}`, at: ticket.createdAt },
    ...(ticket.assignee ? [{ from: ticket.assignee, staff: true, body: 'Thanks for reaching out — I’m looking into this now and will update you shortly.', at: ticket.updatedAt }] : []),
    ...(staff ? [{ from: ticket.assignee ?? 'Support', internal: true, body: 'Checked payment logs — MoMo callback delayed. Escalate to Finance if not cleared in 1 h.', at: ticket.updatedAt }] : []),
  ]
  return (
    <Drawer open={!!ticket} onOpenChange={onOpenChange} title={`${ticket.code} · ${ticket.subject}`} description={`${ticket.category} · opened ${ago(ticket.createdAt)}`} width="max-w-xl"
      footer={
        <div className="space-y-2">
          {staff && (
            <div className="flex items-center justify-between">
              <Segmented size="sm" label="Reply type" value={internal ? 'note' : 'reply'} onChange={(v) => setInternal(v === 'note')} options={[{ value: 'reply', label: 'Reply to user' }, { value: 'note', label: 'Internal note' }]} />
              <Select size="sm" className="w-44" aria-label="Canned reply" onChange={(e) => e.target.value && setReply(e.target.value)} defaultValue="">
                <option value="">Canned replies…</option>
                <option>Thanks — we've received your proof and will verify it in a few minutes.</option>
                <option>Your MoMo payment is confirmed and held in escrow.</option>
                <option>We've escalated this to our Finance team.</option>
              </Select>
            </div>
          )}
          <div className="flex gap-2">
            <Textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} aria-label="Reply" placeholder={internal ? 'Only staff can see internal notes' : 'Write a reply…'} className={cn(internal && 'bg-warn-100')} />
            <Button variant="navy" className="self-end" disabled={!reply.trim()} onClick={async () => { if (staff && !internal) await api.update('tickets', ticket.code, { status: 'awaiting_user' }); qc.invalidateQueries({ queryKey: ['tickets'] }); setReply(''); toast(internal ? 'Internal note added' : 'Reply sent') }}><Send size={16} /></Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2"><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} />{ticket.linkedItem && <Badge tone="navy">{ticket.linkedItem}</Badge>}</div>
        <LifecycleStepper steps={TICKET_STEPS} current={TICKET_INDEX[ticket.status]} />
        {staff && <p className={cn('text-sm font-semibold', new Date(ticket.slaDueAt) < new Date() ? 'text-danger-fg' : 'text-warn-fg')}>SLA {new Date(ticket.slaDueAt) < new Date() ? 'breached' : `due in ${timeAgo(new Date(Date.now() - (new Date(ticket.slaDueAt) - Date.now())).toISOString())}`}</p>}
        <ul className="space-y-3">
          {msgs.map((m, i) => (
            <li key={i} className={cn('rounded-card p-3 text-sm', m.internal ? 'border border-dashed border-warn-500 bg-warn-100' : m.staff ? 'bg-primary-100' : 'bg-surface-2')}>
              <p className="flex items-center gap-2 font-semibold text-text">{m.from} {m.internal && <Badge tone="warn" size="xs" iconName="Lock">Internal note</Badge>}{m.staff && !m.internal && <Badge tone="navy" size="xs">Needibi Support</Badge>}</p>
              <p className="mt-1 text-text">{m.body}</p>
              <p className="mt-1 text-xs text-muted">{formatDateTime(m.at)}</p>
            </li>
          ))}
        </ul>
      </div>
    </Drawer>
  )
}

export function SupportPage({ role }) {
  const { user } = useSession()
  const [creating, setCreating] = useState(false)
  const [open, setOpen] = useState(null)
  return (
    <>
      <PageHeader title="Support" subtitle="24/7 help. Tickets link to your item so we can act fast." actions={<Button variant="primary" onClick={() => setCreating(true)}><Plus size={18} /> New ticket</Button>} />
      {role === 'partner' && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          {[['serve', 'Serving a Need'], ['payouts', 'Payouts and fees'], ['verification', 'Verification (KYC)']].map(([s, t]) => (
            <Link key={s} to={`/help/${s}`} className="rounded-card border border-border bg-surface p-4 text-sm font-semibold text-text shadow-card hover:shadow-hover">{t} →</Link>
          ))}
        </div>
      )}
      <DataTable
        id={`${role}-tickets`}
        caption="Support tickets"
        queryKey={['tickets', role]}
        fetcher={(p) => api.list('tickets', p)}
        baseParams={{ requesterId: role === 'partner' ? 'p-cleanpro' : user.id }}
        columns={[col.code(), { ...col.text('subject', 'Subject'), meta: { sortable: true, mobilePrimary: true } }, col.text('category', 'Category'), col.priority(), col.text('linkedItem', 'Linked item', { muted: true }), col.status(), col.date('updatedAt', 'Updated', { relative: true })]}
        statusTabs={{ field: 'status', tabs: [{ value: 'open', label: 'Open' }, { value: 'assigned', label: 'Assigned' }, { value: 'awaiting_user', label: 'Awaiting you' }, { value: 'escalated', label: 'Escalated' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' }] }}
        searchPlaceholder="Search tickets…"
        onRowClick={setOpen}
        emptyState={<EmptyState title="No tickets" description="Need help? Open a ticket and link the Need, Booking or payment." action={<Button variant="primary" onClick={() => setCreating(true)}>New ticket</Button>} />}
      />
      <NewTicket open={creating} onOpenChange={setCreating} user={user} role={role} />
      <TicketDrawer ticket={open} onOpenChange={(o) => !o && setOpen(null)} />
    </>
  )
}

/* ================================================================ Notifications */
export function NotificationsPage({ role }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  const [prefs, setPrefs] = useState(false)
  const { data, isLoading } = useQuery({ queryKey: ['notifications', 'page', role, filter], queryFn: () => api.list('notifications', { role, pageSize: 50, sort: '-createdAt', ...(filter === 'unread' ? { read: false } : filter !== 'all' ? { priority: filter } : {}) }) })
  const rows = data?.data ?? []
  const today = rows.filter((n) => Date.now() - new Date(n.createdAt) < 86400000)
  const earlier = rows.filter((n) => Date.now() - new Date(n.createdAt) >= 86400000)
  const markAll = async () => {
    await Promise.all(rows.filter((n) => !n.read).map((n) => api.update('notifications', n.id, { read: true })))
    qc.invalidateQueries({ queryKey: ['notifications'] })
    toast('All marked as read')
  }
  const group = (title, list) =>
    list.length > 0 && (
      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{title}</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
          {list.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={async () => { await api.update('notifications', n.id, { read: true }); qc.invalidateQueries({ queryKey: ['notifications'] }); navigate(n.link) }} className={cn('flex w-full items-start gap-3 p-4 text-left hover:bg-surface-2', !n.read && 'bg-action-soft/30')}>
                <span className={cn('mt-2 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-action-500')} aria-label={n.read ? undefined : 'Unread'} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-text">{n.title}</span><PriorityBadge priority={n.priority} size="xs" /></span>
                  <span className="mt-0.5 block text-sm text-muted">{n.body}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{timeAgo(n.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    )
  return (
    <>
      <PageHeader title="Notifications" subtitle="Every notification opens the exact item." actions={<><Button variant="outline" onClick={() => setPrefs(true)}><Bell size={16} /> Preferences</Button><Button variant="navy" onClick={markAll}>Mark all read</Button></>} />
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {[['all', 'All'], ['unread', 'Unread'], ['critical', 'Critical'], ['action', 'Action required'], ['reminder', 'Reminders'], ['info', 'Info']].map(([v, l]) => (
          <Chip key={v} active={filter === v} onClick={() => setFilter(v)}>{l}</Chip>
        ))}
      </div>
      <div className="space-y-6" aria-live="polite">
        {isLoading && <Skeleton className="h-64 rounded-card" />}
        {group('Today', today)}
        {group('Earlier', earlier)}
        {!isLoading && !rows.length && <EmptyState title="You're all caught up" description="New offers, payment requests and reminders will appear here." />}
      </div>
      <NotificationPrefs open={prefs} onOpenChange={setPrefs} />
    </>
  )
}

const PREF_CATS = [['offers', 'Offers & matching'], ['payments', 'Payments & escrow', true], ['chat', 'Chat messages'], ['recurring', 'Recurring reminders'], ['following', 'Partners you follow'], ['security', 'Security alerts', true], ['marketing', 'Deals & promotions']]
const CHANNELS = [['inapp', 'In-app', Bell], ['push', 'Push', Smartphone], ['email', 'Email', Mail], ['sms', 'SMS / WhatsApp', MessageCircle]]
function NotificationPrefs({ open, onOpenChange }) {
  const [state, setState] = useState(() => Object.fromEntries(PREF_CATS.map(([k]) => [k, { inapp: true, push: true, email: k !== 'marketing', sms: k === 'payments' || k === 'security' }])))
  const [quiet, setQuiet] = useState(true)
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Notification preferences" description="Choose per category and channel. Security and transaction alerts can't be switched off." size="lg" footer={<Button variant="primary" onClick={() => { onOpenChange(false); toast('Preferences saved') }}>Save preferences</Button>}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th scope="col" className="py-2 text-left text-xs uppercase text-muted">Category</th>{CHANNELS.map(([k, l, Icon]) => <th key={k} scope="col" className="px-2 py-2 text-center text-xs uppercase text-muted"><Icon size={14} className="mx-auto" aria-hidden="true" />{l}</th>)}</tr></thead>
          <tbody>
            {PREF_CATS.map(([k, l, locked]) => (
              <tr key={k} className="border-t border-border">
                <th scope="row" className="py-3 text-left font-medium text-text">{l} {locked && <Lock size={12} className="inline text-muted" aria-label="Always on" />}</th>
                {CHANNELS.map(([c]) => (
                  <td key={c} className="px-2 text-center">
                    <input type="checkbox" aria-label={`${l} via ${c}`} className="h-5 w-5 accent-[var(--primary-900)]" checked={locked && (c === 'inapp' || c === 'sms') ? true : state[k][c]} disabled={locked && (c === 'inapp' || c === 'sms')} onChange={(e) => setState((s) => ({ ...s, [k]: { ...s[k], [c]: e.target.checked } }))} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Switch className="mt-5" checked={quiet} onChange={setQuiet} label="Quiet hours · 22:00–07:00" description="Only critical alerts break through. Repeated alerts are bundled." />
    </Dialog>
  )
}

/* ================================================================ Settings */
export function SettingsPage({ role }) {
  const { user } = useSession()
  const { theme, setTheme, language, setLanguage } = useUI()
  const languages = useLocales((s) => s.languages)
  const [twoStep, setTwoStep] = useState(true)
  const [privacy, setPrivacy] = useState({ showName: true, showDistrict: true, contactAfter: 'agreement' })
  const [del, setDel] = useState(false)
  return (
    <>
      <PageHeader title="Settings" subtitle="Appearance, notifications, security and privacy." />
      <Tabs defaultValue="general">
        <TabList label="Settings sections">
          <Tab value="general">General</Tab>
          <Tab value="security">Security</Tab>
          <Tab value="privacy">Privacy</Tab>
          <Tab value="activity">My activity</Tab>
        </TabList>
        <TabPanel value="general" className="space-y-6 pt-5">
          <Card>
            <CardTitle>Appearance</CardTitle>
            <Segmented label="Theme" value={theme} onChange={setTheme} options={[{ value: 'light', label: 'Light', icon: <Sun size={14} /> }, { value: 'dark', label: 'Dark', icon: <Moon size={14} /> }]} />
            <p className="mt-2 text-xs text-muted">Remembered on this device.</p>
          </Card>
          <Card>
            <CardTitle>Language</CardTitle>
            <div className="flex flex-wrap gap-2">
              {languages.filter((l) => l.enabled !== false).map((l) => <Chip key={l.code} active={language === l.code} onClick={() => { setLanguage(l.code); i18n.changeLanguage(l.code) }} icon={<Globe size={14} />}>{l.label}</Chip>)}
            </div>
          </Card>
          <Card>
            <CardTitle sub="Fine-tune channels in Notifications → Preferences">Notifications</CardTitle>
            <div className="space-y-4">
              <Switch checked label="Offer and payment alerts" description="Always on for your safety" disabled />
              <Switch checked={true} onChange={() => toast('Saved')} label="Recurring reminders" />
              <Switch checked={false} onChange={() => toast('Saved')} label="Deals & promotions" />
            </div>
          </Card>
        </TabPanel>
        <TabPanel value="security" className="space-y-6 pt-5">
          <Card>
            <CardTitle>Sign-in & 2-step verification</CardTitle>
            <Switch checked={twoStep} onChange={setTwoStep} label="2-step verification" description="Ask for an SMS code on new devices" />
            <Button variant="outline" size="sm" className="mt-4" to="/auth/reset"><KeyRound size={15} /> Change password</Button>
          </Card>
          <Card>
            <CardTitle action={<Button variant="danger-outline" size="sm" onClick={() => toast('Signed out of all other sessions')}><LogOut size={15} /> Sign out others</Button>}>Active sessions</CardTitle>
            <ul className="divide-y divide-border text-sm">
              {[['Windows · Edge', 'Kigali · this device', true], ['Android app', 'Kigali · 2 h ago'], ['iPhone · Safari', 'Musanze · 3 days ago']].map(([d, w, current]) => (
                <li key={d} className="flex items-center gap-3 py-3"><Monitor size={18} className="text-muted" /><span className="flex-1"><span className="block font-medium text-text">{d}</span><span className="text-muted">{w}</span></span>{current ? <Badge tone="trust" size="xs">This device</Badge> : <Button size="xs" variant="ghost">Sign out</Button>}</li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardTitle>Login history</CardTitle>
            <ul className="space-y-2 text-sm">
              {['Today 08:12 · Kigali · Edge', 'Yesterday 21:40 · Kigali · Android app', '20 Oct 07:05 · Kigali · Android app', '18 Oct 13:22 · Huye · Chrome (failed: wrong password)'].map((l) => <li key={l} className={cn('text-muted', l.includes('failed') && 'text-danger-fg')}>{l}</li>)}
            </ul>
          </Card>
        </TabPanel>
        <TabPanel value="privacy" className="space-y-6 pt-5">
          <Card>
            <CardTitle sub="Phone, email and exact address are never public.">Contact privacy</CardTitle>
            <div className="space-y-4">
              <Switch checked={privacy.showName} onChange={(v) => setPrivacy({ ...privacy, showName: v })} label="Show my first name and initial" description="Otherwise you appear as Anonymous" />
              <Switch checked={privacy.showDistrict} onChange={(v) => setPrivacy({ ...privacy, showDistrict: v })} label="Show my sector on public Needs" />
              <Field label="Share my contact details with a Partner">{(p) => <Select {...p} value={privacy.contactAfter} onChange={(e) => setPrivacy({ ...privacy, contactAfter: e.target.value })}><option value="agreement">After the agreement is signed</option><option value="payment">After payment into escrow</option><option value="never">Never — Chat only</option></Select>}</Field>
            </div>
          </Card>
          <Card>
            <CardTitle>Your data</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => toast('We’ll email your data export within 24 h')}><Download size={15} /> Download my data</Button>
              <Button variant="danger-outline" size="sm" onClick={() => setDel(true)}><Trash size={15} /> Delete account</Button>
            </div>
          </Card>
        </TabPanel>
        <TabPanel value="activity" className="pt-5">
          <DataTable
            id={`${role}-activity`}
            caption="My activity"
            queryKey={['activityLogs', 'me']}
            fetcher={(p) => api.list('activityLogs', p)}
            baseParams={{ userId: user.id }}
            columns={[{ ...col.text('event', 'Activity'), meta: { mobilePrimary: true, sortable: true } }, col.text('device', 'Device', { muted: true }), col.date('createdAt', 'When', { time: true })]}
            searchPlaceholder="Search my activity…"
            mobileLoadMore
          />
        </TabPanel>
      </Tabs>
      <ConfirmDialog open={del} onOpenChange={setDel} tone="danger" title="Delete your account?" description="You have a 30-day grace period to change your mind. Open escrow payments must be settled first." confirmLabel="Schedule deletion" onConfirm={() => { setDel(false); toast('Account scheduled for deletion in 30 days', { tone: 'info', action: { label: 'Undo', onClick: () => toast('Deletion cancelled') } }) }} />
    </>
  )
}
