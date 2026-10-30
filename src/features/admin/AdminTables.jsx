import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Check, X, Ban, Eye, Pencil, Star, UserCog, Pause, Play, Undo, BanknoteCheck, Scale, Send, Archive, RotateCcw, IdCard, Camera, Building, Plus, Copy, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { formatMoney, formatNumber } from '@/lib/format'
import { NEED_STATUS_TABS, PAYMENT_METHODS } from '@/lib/status'
import { CATEGORIES, DISTRICTS } from '@/mocks/seed'
import { Button, Badge, Drawer, Dialog, ReasonDialog, REJECT_REASONS, Field, Textarea, Input, Alert, StatusBadge, CategoryIllustration, Avatar, Select } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'
import { DataTable, RowMenu } from '@/components/tables/DataTable'
import { col } from '@/components/tables/columns'
import { NeedCard, BundleCard } from '@/components/cards/NeedCard'
import { DealCard } from '@/components/cards/DealCard'
import { useCardActions } from '@/components/cards/actionsStore'
import { TicketDrawer } from '@/features/shared/Shared'
import { paymentColumns } from '@/features/needer/Needer'

const opts = (arr) => arr.map((v) => (Array.isArray(v) ? { value: v[0], label: v[1] } : { value: v, label: String(v)[0].toUpperCase() + String(v).slice(1).replace(/_/g, ' ') }))
const CAT_OPTIONS = CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))
const DISTRICT_OPTIONS = Object.keys(DISTRICTS).map((d) => ({ value: d, label: d }))
const DATE = { id: 'since', label: 'Date', options: opts([['24h', 'Last 24 h'], ['7d', 'Last 7 days'], ['30d', 'Last 30 days'], ['90d', 'Last 90 days']]) }
const tabs = (field, values) => ({ field, tabs: opts(values) })

/** Small helper so every admin action patches, refreshes, toasts and is audited server-side. */
function useAct() {
  const qc = useQueryClient()
  return async (resource, id, patch, message) => {
    await api.update(resource, id, patch)
    qc.invalidateQueries()
    toast(message, { description: 'Recorded in the audit log.' })
  }
}

/* --------------------------------------------------------------- KYC review drawer */
function KycDrawer({ row, onClose }) {
  const act = useAct()
  const [reject, setReject] = useState(false)
  if (!row) return null
  return (
    <>
      <Drawer open={!!row} onOpenChange={(o) => !o && onClose()} title={`Verify ${row.applicantName}`} description={`${row.kind} · submitted ${new Date(row.submittedAt).toLocaleDateString()}`} width="max-w-2xl"
        footer={<div className="flex flex-wrap gap-2"><Button variant="danger-outline" onClick={() => setReject(true)}><X size={16} /> Reject</Button><Button variant="outline" onClick={() => { act('verifications', row.id, { status: 'info_requested' }, 'Asked applicant for clearer documents'); onClose() }}>Request info</Button><Button variant="primary" className="ml-auto" onClick={() => { act('verifications', row.id, { status: 'approved' }, `${row.applicantName} verified`); onClose() }}><Check size={16} /> Approve</Button></div>}
      >
        <div className="space-y-5 p-5">
          <div className="flex gap-2"><StatusBadge status={row.status} /><Badge tone={row.risk === 'high' ? 'danger' : row.risk === 'medium' ? 'warn' : 'trust'} iconName="ShieldCheck">Risk: {row.risk}</Badge></div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[[IdCard, 'National ID'], [Camera, 'Selfie'], [Building, 'Business docs']].map(([Icon, l]) => (
              <figure key={l} className="overflow-hidden rounded-card border border-border">
                <div className="flex aspect-[4/3] items-center justify-center bg-surface-2 text-muted"><Icon size={40} /></div>
                <figcaption className="p-2 text-center text-xs font-semibold text-text">{l}</figcaption>
              </figure>
            ))}
          </div>
          <Alert tone="trust" title="Automated checks">Face match 96% · ID number format valid · no duplicate accounts found.</Alert>
        </div>
      </Drawer>
      <ReasonDialog open={reject} onOpenChange={setReject} title="Reject verification" reasons={['Document unreadable', 'Selfie does not match ID', 'Expired document', 'Suspected fraud', 'Other']} onConfirm={({ reason }) => { act('verifications', row.id, { status: 'rejected', rejectReason: reason }, 'Verification rejected'); setReject(false); onClose() }} />
    </>
  )
}

/* --------------------------------------------------------------- Message moderation drawer */
function MessageDrawer({ row, onClose }) {
  const act = useAct()
  const [edited, setEdited] = useState('')
  const [reject, setReject] = useState(false)
  if (!row) return null
  return (
    <>
      <Drawer open={!!row} onOpenChange={(o) => !o && onClose()} title="Moderate message" description={`On ${row.targetKind} · ${row.targetTitle}`}
        footer={<div className="flex flex-wrap gap-2"><Button variant="danger" onClick={() => { act('messages', row.id, { status: 'rejected', rejectReason: 'Author banned' }, `${row.authorName} banned from Messages`); onClose() }}><Ban size={15} /> Ban</Button><Button variant="danger-outline" onClick={() => setReject(true)}>Reject</Button><Button variant="outline" disabled={!edited} onClick={() => { act('messages', row.id, { status: 'approved', body: edited }, 'Edited and approved'); onClose() }}>Edit & approve</Button><Button variant="primary" className="ml-auto" onClick={() => { act('messages', row.id, { status: 'approved' }, 'Message approved and public'); onClose() }}><Check size={15} /> Approve</Button></div>}
      >
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-2"><Avatar name={row.authorName} hue={row.authorHue} size={32} /><span className="font-semibold text-text">{row.authorName}</span></div>
          <p className="rounded-card bg-surface-2 p-4 text-[15px] text-text">{row.body}</p>
          {row.risks.length > 0 && <div className="flex flex-wrap gap-1.5">{row.risks.map((r) => <Badge key={r} tone="danger" iconName="Flag">{r.replace('_', ' ')}</Badge>)}</div>}
          <Field label="Edit before approving" hint="Remove contact details or offensive words.">{(p) => <Textarea {...p} rows={3} defaultValue={row.body} onChange={(e) => setEdited(e.target.value)} />}</Field>
        </div>
      </Drawer>
      <ReasonDialog open={reject} onOpenChange={setReject} title="Reject message" description="The sender sees this reason and can edit and resubmit." reasons={REJECT_REASONS.message} onConfirm={({ reason }) => { act('messages', row.id, { status: 'rejected', rejectReason: reason }, 'Message rejected'); setReject(false); onClose() }} />
    </>
  )
}

/* --------------------------------------------------------------- Escrow action */
function EscrowDialog({ row, onClose }) {
  const act = useAct()
  const [action, setAction] = useState('released')
  const [pct, setPct] = useState(50)
  const [reason, setReason] = useState('')
  if (!row) return null
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()} title={`Escrow · ${row.ref}`} description={`${formatMoney(row.amount)} held for ${row.refTitle}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={reason.trim().length < 5} onClick={() => { act('escrow', row.id, { escrow: action }, action === 'released' ? 'Escrow released to Partner' : action === 'refunded' ? 'Refunded to Needer' : `Partial: ${pct}% refunded`); onClose() }}>Confirm</Button></>}
    >
      <div className="space-y-3">
        {[['released', 'Release to Partner', BanknoteCheck], ['refunded', 'Refund to Needer', Undo], ['partial', 'Partial split', Scale]].map(([v, l, Icon]) => (
          <label key={v} className={cn('flex cursor-pointer items-center gap-3 rounded-card border p-3', action === v ? 'border-action-500 bg-action-soft/50' : 'border-border')}>
            <input type="radio" name="escrow" checked={action === v} onChange={() => setAction(v)} className="accent-[var(--action-500)]" /><Icon size={16} /> <span className="text-sm font-medium">{l}</span>
          </label>
        ))}
        {action === 'partial' && <Field label={`Refund ${pct}% · ${formatMoney(Math.round((row.amount.amount * pct) / 100))}`}>{(p) => <input {...p} type="range" min="5" max="95" step="5" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-[var(--action-500)]" />}</Field>}
        <Field label="Reason (required)">{(p) => <Textarea {...p} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
      </div>
    </Dialog>
  )
}

/* --------------------------------------------------------------- Payment proof viewer */
const xmlEsc = (s) => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]))
function slipImage(row) {
  const lines = [['Bank', row.proofBank], ['Reference', row.proofReference], ['Paid by', row.payerName], ['Amount', formatMoney(row.amount)], ['File', row.proofFile]]
  const body = lines.map(([k, v], i) => `<text x="40" y="${150 + i * 56}" font-size="22" fill="#6b6458">${xmlEsc(k)}</text><text x="220" y="${150 + i * 56}" font-size="26" font-weight="700" fill="#1f1b14">${xmlEsc(v)}</text>`).join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" font-family="Arial,sans-serif"><rect width="800" height="600" fill="#faf7f0"/><rect x="16" y="16" width="768" height="568" fill="none" stroke="#d9d2c1" stroke-dasharray="8 6"/><text x="40" y="84" font-size="32" font-weight="700" fill="#1f1b14">Deposit slip</text>${body}<text x="40" y="552" font-size="18" fill="#9a917f">Uploaded by the ${row.proofUploadedBy === 'agent' ? 'agent' : 'customer'}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function ProofDrawer({ row, onClose }) {
  const act = useAct()
  const [reject, setReject] = useState(false)
  const [zoom, setZoom] = useState(false)
  if (!row) return null
  const slip = slipImage(row)
  return (
    <>
      <Drawer open={!!row} onOpenChange={(o) => !o && onClose()} title={`Deposit ${row.proofReference}`} description={`${formatMoney(row.amount)} from ${row.payerName}`} width="max-w-2xl"
        footer={row.state === 'verifying' ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="danger-outline" onClick={() => setReject(true)}><X size={16} /> Reject</Button>
            <Button variant="primary" className="ml-auto" onClick={() => { act('payments', row.id, { state: 'paid', escrow: 'held' }, 'Proof verified · money held in escrow'); onClose() }}><Check size={16} /> Verify and hold the money</Button>
          </div>
        ) : <Button variant="outline" onClick={onClose}>Close</Button>}
      >
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={row.state} />
            <Badge tone="grey" iconName="Building">{row.proofBank}</Badge>
            <Badge tone={row.proofUploadedBy === 'agent' ? 'info' : 'navy'} iconName="UserRound">Uploaded by the {row.proofUploadedBy === 'agent' ? 'agent' : 'customer'}</Badge>
          </div>
          <figure className="overflow-hidden rounded-card border border-border">
            <button type="button" onClick={() => setZoom(true)} className="block w-full bg-surface-2" aria-label="Open the deposit slip full size">
              <img src={slip} alt={`Deposit slip ${row.proofReference}`} className="aspect-[4/3] w-full object-contain" />
            </button>
            <figcaption className="flex items-center justify-between gap-2 border-t border-border p-2.5">
              <span className="flex items-center gap-1.5 text-xs text-muted"><Camera size={14} /> {row.proofFile}</span>
              <Button size="xs" variant="outline" onClick={() => setZoom(true)}><Eye size={13} /> Open full size</Button>
            </figcaption>
          </figure>
          {row.proofNote && (
            <div>
              <p className="text-sm font-semibold text-text">What they wrote</p>
              <p className="mt-1 rounded-card bg-surface-2 p-3 text-sm text-text">{row.proofNote}</p>
            </div>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            {[['Payment', row.ref], ['Deposit reference', row.proofReference], ['For', row.refTitle], ['Provider', row.partnerName]].map(([k, v]) => (
              <div key={k} className="rounded-card bg-surface-2 p-3"><dt className="text-xs text-muted">{k}</dt><dd className="text-sm font-semibold text-text">{v}</dd></div>
            ))}
          </dl>
          <Alert tone="info" title="Check before you verify">The deposit reference and the amount must match the bank statement. Verifying moves the money into escrow for this job.</Alert>
        </div>
      </Drawer>
      <Dialog open={zoom} onOpenChange={setZoom} title={`Deposit slip ${row.proofReference}`} size="lg" footer={<Button variant="outline" onClick={() => setZoom(false)}>Close</Button>}>
        <img src={slip} alt={`Deposit slip ${row.proofReference}`} className="w-full rounded-card border border-border" />
      </Dialog>
      <ReasonDialog open={reject} onOpenChange={setReject} title="Reject this proof" description="The customer sees this reason and can upload a clearer slip." reasons={['Slip is not readable', 'Amount does not match', 'Reference not found on the statement', 'Duplicate of another payment', 'Other']} onConfirm={({ reason }) => { act('payments', row.id, { state: 'failed', rejectReason: reason }, 'Proof rejected'); setReject(false); onClose() }} />
    </>
  )
}

/* --------------------------------------------------------------- Pay a Partner or Agent */
function PayDialog({ row, onClose }) {
  const act = useAct()
  const [method, setMethod] = useState('MTN MoMo')
  const [note, setNote] = useState('')
  if (!row) return null
  const isAgent = row.kind === 'commission'
  const name = isAgent ? row.agentName : row.partnerName
  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()} title={`Pay ${name}`} description={`${formatMoney(row.amount)} · ${isAgent ? `commission for ${row.month}` : `${row.jobs} jobs`}`}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={() => { act(isAgent ? 'commissions' : 'payouts', isAgent ? row.id : row.ref, { status: 'paid', paidMethod: method, paidNote: note }, `${formatMoney(row.amount)} sent to ${name}`); onClose() }}><BanknoteCheck size={16} /> Send {formatMoney(row.amount)}</Button></>}
    >
      <div className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-card bg-surface-2 p-3"><dt className="text-xs text-muted">Who gets paid</dt><dd className="text-sm font-semibold text-text">{name}</dd></div>
          <div className="rounded-card bg-surface-2 p-3"><dt className="text-xs text-muted">Amount</dt><dd className="tabular text-sm font-semibold text-text">{formatMoney(row.amount)}</dd></div>
        </dl>
        <Field label="Send it how?">{(p) => <Select {...p} value={method} onChange={(e) => setMethod(e.target.value)}><option>MTN MoMo</option><option>Airtel Money</option><option>Bank transfer</option><option>Cash at the office</option></Select>}</Field>
        <Field label="Note for the record" optional>{(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Paid with the Friday batch" />}</Field>
        <Alert tone="warn" title="This records a real payment">Only confirm once the money has actually left the account. It is written to the audit log with your name.</Alert>
      </div>
    </Dialog>
  )
}

function PayoutBatch({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Payout batch preview" description="Friday batch · 128 Partners" size="lg" footer={<><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="primary" onClick={() => { onOpenChange(false); toast('Payout batch submitted', { description: 'MoMo and bank transfers are processing.' }) }}><Send size={16} /> Run batch · {formatMoney(38450000)}</Button></>}>
      <dl className="grid gap-3 sm:grid-cols-3">
        {[['MTN MoMo', 92, 21300000], ['Airtel Money', 18, 4150000], ['Bank transfer', 18, 13000000]].map(([m, n, a]) => (
          <div key={m} className="rounded-card bg-surface-2 p-4"><dt className="text-sm text-muted">{m}</dt><dd className="tabular text-lg font-extrabold text-text">{formatMoney(a)}</dd><dd className="text-xs text-muted">{n} payouts</dd></div>
        ))}
      </dl>
      <Alert tone="warn" className="mt-4" title="3 payouts held">Partners with open disputes are excluded until resolved.</Alert>
    </Dialog>
  )
}

/* --------------------------------------------------------------- table configs */
function useConfigs(setters) {
  const navigate = useNavigate()
  const act = useAct()
  const open = useCardActions((s) => s.open)
  const statusMenu = (resource, idKey, r, extra = []) => (
    <RowMenu
      items={[
        ...extra,
        r.status !== 'suspended' && { label: 'Suspend', icon: <Pause />, tone: 'danger', onSelect: () => act(resource, r[idKey], { status: 'suspended' }, 'Account suspended') },
        r.status === 'suspended' && { label: 'Reactivate', icon: <Play />, onSelect: () => act(resource, r[idKey], { status: 'active' }, 'Account reactivated') },
      ]}
    />
  )
  const peopleBulk = (resource) => [
    { label: 'Approve', icon: <Check size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update(resource, r.id, { status: 'active' }))); toast(`${rows.length} approved`) } },
    { label: 'Suspend', icon: <Pause size={15} />, tone: 'danger', onRun: async (rows) => { await Promise.all(rows.map((r) => api.update(resource, r.id, { status: 'suspended' }))); toast(`${rows.length} suspended`) } },
  ]
  return {
    users: { title: 'All users', resource: 'users', columns: [col.person('name', 'User', { primary: true, verifiedKey: 'verified' }), col.custom('roles', 'Roles', (r) => <div className="flex gap-1">{r.roles.map((x) => <Badge key={x} size="xs" tone={x === 'partner' ? 'serve' : x === 'agent' ? 'info' : 'grey'}>{x}</Badge>)}</div>, { value: (r) => r.roles.join(' ') }), col.text('email', 'Email', { muted: true }), col.text('phone', 'Phone', { muted: true }), col.text('district', 'District'), col.status(), col.date('joinedAt', 'Joined')], tabs: tabs('status', ['active', 'pending', 'suspended']), filters: [{ id: 'roles', label: 'Role', options: opts(['needer', 'partner', 'agent']) }, { id: 'district', label: 'District', options: DISTRICT_OPTIONS }], bulk: peopleBulk('users'), rowActions: (r) => statusMenu('users', 'id', r), savedViews: true },
    needers: { title: 'Customers', resource: 'needers', columns: [col.person('name', 'Customer', { primary: true, verifiedKey: 'verified' }), col.text('phone', 'Phone', { muted: true }), col.text('district', 'District'), col.status(), col.date('joinedAt', 'Joined')], tabs: tabs('status', ['active', 'pending', 'suspended']), filters: [{ id: 'district', label: 'District', options: DISTRICT_OPTIONS }], bulk: peopleBulk('users'), rowActions: (r) => statusMenu('users', 'id', r) },
    partners: { title: 'Service providers', resource: 'partners', columns: [col.person('name', 'Provider', { primary: true, verifiedKey: 'verified' }), col.custom('level', 'Level', (r) => <Badge size="xs" tone={r.level === 3 ? 'serve' : 'navy'}>L{r.level}</Badge>, { value: (r) => r.level, sortable: true }), col.rating(), col.number('completedJobs', 'Jobs'), col.number('reliability', 'Reliability'), col.text('plan', 'Plan'), col.status('kycStatus', 'ID check'), col.status()], tabs: tabs('status', ['active', 'pending', 'suspended']), filters: [{ id: 'categories', label: 'Category', options: CAT_OPTIONS }, { id: 'areas', label: 'Area', options: DISTRICT_OPTIONS }, { id: 'level', label: 'Level', options: opts([[1, 'Level 1'], [2, 'Level 2'], [3, 'Top Partner']]) }], bulk: peopleBulk('partners'), rowActions: (r) => statusMenu('partners', 'id', r, [{ label: 'View public profile', icon: <Eye />, onSelect: () => navigate(`/partners/${r.handle}`) }, { label: 'Commission override', icon: <Pencil />, onSelect: () => navigate('/admin/fees') }]), savedViews: true },
    agents: { title: 'Agents', resource: 'agents', columns: [col.person('name', 'Agent', { primary: true }), col.code('code', 'Code'), col.text('district', 'District'), col.number('assistedNeeders', 'Assisted'), col.number('onboardedPartners', 'Onboarded'), col.number('conversions', 'Conversions'), col.money('commissionMonth', 'This month'), col.status()], tabs: tabs('status', ['active', 'pending', 'suspended']), bulk: peopleBulk('agents'), rowActions: (r) => statusMenu('agents', 'id', r) },
    verification: { title: 'Verify accounts', subtitle: 'ID photos, selfies and business papers. Approve the safe ones together.', resource: 'verifications', defaultSort: '-submittedAt', columns: [col.text('applicantName', 'Applicant', { strong: true, meta: { mobilePrimary: true } }), col.badge('kind', 'Type', { partner: { tone: 'serve', label: 'Provider' }, agent: { tone: 'info', label: 'Agent' }, needer: { tone: 'grey', label: 'Customer' } }), col.custom('docs', 'Documents', (r) => r.docs.join(' · '), { value: (r) => r.docs.join(' ') }), col.badge('risk', 'Risk', { low: { tone: 'trust', label: 'Low' }, medium: { tone: 'warn', label: 'Medium' }, high: { tone: 'danger', label: 'High' } }), col.text('district', 'District'), col.status(), col.date('submittedAt', 'Submitted', { relative: true })], tabs: tabs('status', ['pending', 'info_requested', 'approved', 'rejected']), filters: [{ id: 'kind', label: 'Type', options: opts(['partner', 'agent', 'needer']) }, { id: 'risk', label: 'Risk', options: opts(['low', 'medium', 'high']) }], bulk: [{ label: 'Approve', icon: <Check size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('verifications', r.id, { status: 'approved' }))); toast(`${rows.length} verified`) } }, { label: 'Reject', icon: <X size={15} />, tone: 'danger', onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('verifications', r.id, { status: 'rejected', rejectReason: 'Bulk: documents unreadable' }))); toast(`${rows.length} rejected with reason`) } }], onRowClick: setters.kyc, rowActions: (r) => <Button size="sm" variant="outline" className="review-action" onClick={() => setters.kyc(r)}>Review</Button> },
    needs: { title: 'Requests', subtitle: 'Every request — waiting, approved and rejected. You can also pick a provider yourself.', resource: 'needs', columns: [col.item({ header: 'Request', href: (r) => `/needs/${r.code}` }), col.text('categoryName', 'Category'), col.text('district', 'District'), col.money('budget', 'Budget'), col.urgency(), col.slots(), col.number('rejectCount', 'Rejections'), col.status(), col.date()], tabs: { field: 'statusGroup', tabs: NEED_STATUS_TABS }, filters: [{ id: 'category', label: 'Category', options: CAT_OPTIONS }, { id: 'district', label: 'District', options: DISTRICT_OPTIONS }, { id: 'urgency', label: 'Urgency', options: opts(['urgent', 'high', 'medium', 'low']) }, { id: 'rejectCount_gte', label: 'Rejections', options: opts([['15', '≥ 15 (alert)'], ['5', '≥ 5']]) }, DATE], bulk: [{ label: 'Approve', icon: <Check size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('needs', r.code, { status: 'published' }))); toast(`${rows.length} published`) } }, { label: 'Archive', icon: <Archive size={15} />, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('needs', r.code, { status: 'archived' }))); toast(`${rows.length} archived`) } }], viewToggle: { card: (r) => <NeedCard need={r} context="admin" /> }, rowActions: (r) => <RowMenu items={[{ label: 'Approve', icon: <Check />, onSelect: () => open('approve', r) }, { label: 'Reject', icon: <X />, tone: 'danger', onSelect: () => open('reject', { item: r, as: 'admin' }) }, { label: 'Choose providers', icon: <UserCog />, onSelect: () => open('assign', r) }, { label: 'Chat', icon: <Send />, onSelect: () => navigate(`/admin/inbox?ref=${r.code}`) }]} />, savedViews: true },
    bundles: { title: 'Bundles', subtitle: 'Approve, archive, restore, or send to a group of providers.', resource: 'bundles', columns: [col.item({ header: 'Bundle', sub: (r) => `${r.code} · ${r.itemCount} items`, href: (r) => `/bundles/${r.code}` }), col.money('totalBudget', 'Total'), col.custom('progress', 'Served', (r) => `${r.progress.served}/${r.progress.total}`, { value: (r) => r.progress.served }), col.text('district', 'District'), col.status(), col.date()], tabs: { field: 'statusGroup', tabs: NEED_STATUS_TABS }, filters: [{ id: 'category', label: 'Category', options: CAT_OPTIONS }], viewToggle: { card: (r) => <BundleCard bundle={r} context="admin" /> }, rowActions: (r) => <RowMenu items={[{ label: 'Approve', icon: <Check />, onSelect: () => open('approve', r) }, { label: 'Assign (whole / items)', icon: <UserCog />, onSelect: () => open('assign', r) }, { label: 'Match to guild', icon: <UserCog />, onSelect: () => toast('Sent to Home Guild for matching') }, r.status === 'archived' ? { label: 'Restore', icon: <RotateCcw />, onSelect: () => act('bundles', r.code, { status: 'published' }, 'Bundle restored') } : { label: 'Archive', icon: <Archive />, onSelect: () => act('bundles', r.code, { status: 'archived' }, 'Bundle archived') }]} /> },
    deals: { title: 'Deals', subtitle: 'Approve new deals, feature the good ones, and choose who provides them.', resource: 'deals', columns: [col.item({ header: 'Deal', sub: (r) => r.partner.name, href: (r) => `/deals/${r.slug}` }), col.text('categoryName', 'Category'), col.money('price', 'Price'), col.custom('matchScore', 'Match score', (r) => <Badge tone={r.matchScore > 80 ? 'trust' : 'grey'} size="xs">{r.matchScore}</Badge>, { value: (r) => r.matchScore, sortable: true }), col.custom('featured', 'Featured', (r) => (r.featured ? <Badge tone="serve" iconName="Sparkles" size="xs">Featured</Badge> : '—'), { value: (r) => r.featured }), col.number('bookings', 'Bookings'), col.status()], tabs: tabs('status', ['pending', 'published', 'paused', 'rejected', 'expired', 'draft']), filters: [{ id: 'category', label: 'Category', options: CAT_OPTIONS }, { id: 'type', label: 'Type', options: opts(['product', 'service', 'vehicle', 'property', 'professional', 'custom', 'bundle']) }, { id: 'featured', label: 'Featured', options: opts([['true', 'Featured only']]) }], bulk: [{ label: 'Approve', icon: <Check size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('deals', r.slug, { status: 'published' }))); toast(`${rows.length} Deals published`) } }], viewToggle: { card: (r) => <DealCard deal={r} context="admin" /> }, rowActions: (r) => <RowMenu items={[{ label: 'Approve', icon: <Check />, onSelect: () => open('approve', r) }, { label: 'Reject', icon: <X />, tone: 'danger', onSelect: () => open('reject', { item: r, as: 'deal' }) }, { label: r.featured ? 'Unfeature' : 'Feature', icon: <Star />, onSelect: () => act('deals', r.slug, { featured: !r.featured }, r.featured ? 'Unfeatured' : 'Featured') }, { label: 'Choose provider', icon: <UserCog />, onSelect: () => open('assign', r) }]} /> },
    'moderation/messages': { title: 'Messages to check', subtitle: 'Messages flagged for phone numbers, spam, abuse or repeats.', resource: 'messages', columns: [col.person('authorName', 'Author', { hueKey: 'authorHue' }), { ...col.text('body', 'Message'), cell: ({ row }) => <span className="block max-w-[320px] text-sm">{row.original.body}</span>, meta: { mobilePrimary: true } }, col.custom('risks', 'Risks', (r) => (r.risks.length ? <div className="flex flex-wrap gap-1">{r.risks.map((x) => <Badge key={x} tone="danger" size="xs" iconName="Flag">{x.replace('_', ' ')}</Badge>)}</div> : <Badge tone="trust" size="xs">None</Badge>), { value: (r) => r.risks.join(' ') }), col.text('targetTitle', 'On', { muted: true }), col.status(), col.date('createdAt', 'Sent', { relative: true })], tabs: tabs('status', ['pending', 'approved', 'rejected']), filters: [{ id: 'risks', label: 'Risk', options: opts([['contact_info', 'Contact info'], ['spam', 'Spam'], ['abuse', 'Abuse'], ['duplicate', 'Duplicate']]) }, { id: 'targetKind', label: 'On', options: opts(['need', 'bundle', 'deal']) }], bulk: [{ label: 'Approve', icon: <Check size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('messages', r.id, { status: 'approved' }))); toast(`${rows.length} approved`) } }, { label: 'Reject', icon: <X size={15} />, tone: 'danger', onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('messages', r.id, { status: 'rejected', rejectReason: 'Contains contact details' }))); toast(`${rows.length} rejected`) } }], onRowClick: setters.msg, rowActions: (r) => <Button size="xs" variant="outline" onClick={() => setters.msg(r)}>Moderate</Button> },
    'moderation/reports': { title: 'Reports', resource: 'reports', columns: [{ ...col.text('targetTitle', 'Reported item'), meta: { mobilePrimary: true, sortable: true } }, col.badge('targetKind', 'Type', { need: { tone: 'navy', label: 'Need' }, deal: { tone: 'trust', label: 'Deal' }, bundle: { tone: 'serve', label: 'Bundle' } }), col.text('reason', 'Reason'), col.text('reporter', 'Reporter'), col.status(), col.date()], tabs: tabs('status', ['open', 'actioned', 'dismissed']), rowActions: (r) => <RowMenu items={[{ label: 'Take down item', icon: <Ban />, tone: 'danger', onSelect: () => act('reports', r.id, { status: 'actioned' }, 'Item taken down') }, { label: 'Dismiss', icon: <X />, onSelect: () => act('reports', r.id, { status: 'dismissed' }, 'Report dismissed') }]} /> },
    'moderation/reviews': { title: 'Reviews to check', resource: 'reviews', columns: [col.person('authorName', 'Author', { hueKey: 'authorHue' }), col.text('partnerName', 'Provider'), col.rating(), { ...col.text('comment', 'Review'), cell: ({ row }) => <span className="block max-w-[320px] text-sm">{row.original.comment}</span>, meta: { mobilePrimary: true } }, col.status(), col.date()], tabs: tabs('status', ['pending', 'flagged', 'published']), bulk: [{ label: 'Publish', icon: <Check size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('reviews', r.id, { status: 'published' }))); toast(`${rows.length} published`) } }], rowActions: (r) => <RowMenu items={[{ label: 'Publish', icon: <Check />, onSelect: () => act('reviews', r.id, { status: 'published' }, 'Review published') }, { label: 'Hide', icon: <X />, tone: 'danger', onSelect: () => act('reviews', r.id, { status: 'flagged' }, 'Review hidden') }]} /> },
    categories: { title: 'Categories', subtitle: 'Sub-types, the extra questions each one asks, and whether it is live.', resource: 'categories', defaultSort: 'name', columns: [col.custom('name', 'Category', (r) => <span className="flex items-center gap-3"><span className="h-9 w-9 overflow-hidden rounded-lg"><CategoryIllustration category={r.slug} iconSize={14} /></span><span className="font-semibold">{r.name}</span></span>, { value: (r) => r.name, sortable: true, mobilePrimary: true }), col.custom('subtypes', 'Subtypes', (r) => <span className="block max-w-[280px] truncate text-sm text-muted">{r.subtypes.join(', ')}</span>, { value: (r) => r.subtypes.join('; ') }), col.number('specFields', 'Spec fields'), col.number('liveNeeds', 'Live requests'), col.number('liveDeals', 'Deals'), col.status()], rowActions: (r) => <RowMenu items={[{ label: 'Edit subtypes & spec fields', icon: <Pencil />, onSelect: () => setters.cat(r) }, { label: 'Pause category', icon: <Pause />, onSelect: () => act('categories', r.id, { status: 'paused' }, `${r.name} paused`) }]} />, toolbar: <><Button size="sm" variant="outline" to="/admin/category-groups"><LayoutGrid size={15} /> Main categories</Button><Button size="sm" variant="primary" onClick={() => setters.cat({ name: '', subtypes: [], slug: 'new' })}><Plus size={15} /> Category</Button></> },
    guilds: { title: 'Guilds', resource: 'guilds', columns: [{ ...col.text('name', 'Guild', { strong: true }), meta: { mobilePrimary: true, sortable: true } }, col.text('categoryName', 'Category'), col.number('members', 'Members'), col.badge('matchingPriority', 'Matching', { normal: { tone: 'grey', label: 'Normal' }, high: { tone: 'serve', label: 'High priority' } }), col.status()], rowActions: (r) => <RowMenu items={[{ label: r.matchingPriority === 'high' ? 'Normal priority' : 'High priority', icon: <Star />, onSelect: () => act('guilds', r.id, { matchingPriority: r.matchingPriority === 'high' ? 'normal' : 'high' }, 'Guild priority updated') }]} /> },
    payments: { title: 'Payments', subtitle: 'Every payment. Filter, search and download the list.', resource: 'payments', columns: [...paymentColumns.slice(0, 2), col.text('payerName', 'Paid by'), col.text('partnerName', 'Provider'), ...paymentColumns.slice(2)], tabs: tabs('state', ['paid', 'pending', 'verifying', 'failed', 'refunded']), filters: [{ id: 'method', label: 'Method', options: Object.entries(PAYMENT_METHODS).map(([value, m]) => ({ value, label: m.label })) }, { id: 'escrow', label: 'Escrow', options: opts(['held', 'released', 'partial', 'refunded']) }, DATE], savedViews: true },
    escrow: { title: 'Money held safely', subtitle: 'Money is held until the work is done, then sent on or refunded — always with a reason.', resource: 'escrow', columns: [col.code('ref', 'Payment'), { ...col.text('refTitle', 'For'), meta: { mobilePrimary: true } }, col.text('payerName', 'Paid by'), col.text('partnerName', 'Provider'), col.money('amount', 'Amount'), col.status('escrow', 'Held money'), col.date()], tabs: tabs('escrow', ['held', 'released', 'refunded', 'partial']), rowActions: (r) => (r.escrow === 'held' ? <Button size="xs" variant="outline" onClick={() => setters.escrow(r)}>Act</Button> : null) },
    proofs: { title: 'Payment proofs', subtitle: 'Deposit slips sent in by customers and agents. Open one to see the slip before you verify it.', resource: 'proofs', columns: [col.code('ref', 'Payment'), col.text('proofReference', 'Deposit ref', { strong: true }), col.text('payerName', 'Paid by'), col.text('proofBank', 'Where'), col.money('amount', 'Amount'), col.status('state', 'State'), col.date()], tabs: tabs('state', ['verifying', 'paid', 'failed']), bulk: [{ label: 'Verify', icon: <Check size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('payments', r.id, { state: 'paid', escrow: 'held' }))); toast(`${rows.length} proofs verified`) } }], onRowClick: setters.proof, rowActions: (r) => <div className="flex gap-1"><Button size="xs" variant={r.state === 'verifying' ? 'primary' : 'outline'} onClick={() => setters.proof(r)}><Eye size={13} /> See the slip</Button></div> },
    payouts: { title: 'Paying providers', subtitle: 'What each provider has earned and still has to be paid. Pay one at a time, or run the whole batch.', resource: 'payouts', defaultSort: '-scheduledFor', columns: [col.code('ref', 'Payout'), col.text('partnerName', 'Provider', { strong: true, meta: { mobilePrimary: true } }), col.money('amount', 'Amount'), col.text('method', 'Send to'), col.number('jobs', 'Jobs'), col.date('scheduledFor', 'Date'), col.status()], tabs: tabs('status', ['scheduled', 'processing', 'paid', 'failed']), bulk: [{ label: 'Mark as paid', icon: <BanknoteCheck size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('payouts', r.ref, { status: 'paid' }))); toast(`${rows.length} providers paid`) } }], toolbar: <Button size="sm" variant="primary" onClick={() => setters.batch(true)}><Send size={15} /> Pay everyone at once</Button>, rowActions: (r) => (r.status === 'paid' ? null : <Button size="xs" variant={r.status === 'failed' ? 'outline' : 'primary'} onClick={() => setters.pay(r)}><BanknoteCheck size={13} /> {r.status === 'failed' ? 'Try again' : 'Pay now'}</Button>) },
    commissions: { title: 'Paying agents', subtitle: 'What each agent earned for the people they brought in. Approve it first, then pay.', resource: 'commissions', defaultSort: '-month', columns: [col.text('agentName', 'Agent', { strong: true, meta: { mobilePrimary: true } }), col.text('month', 'Month'), col.number('assisted', 'People helped'), col.number('onboarded', 'Providers signed up'), col.money('amount', 'Amount'), col.status()], tabs: tabs('status', ['pending', 'approved', 'paid']), bulk: [{ label: 'Approve', icon: <Check size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('commissions', r.id, { status: 'approved' }))); toast(`${rows.length} approved`) } }, { label: 'Mark as paid', icon: <BanknoteCheck size={15} />, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('commissions', r.id, { status: 'paid' }))); toast(`${rows.length} agents paid`) } }], rowActions: (r) => (r.status === 'paid' ? null : r.status === 'pending' ? <Button size="xs" variant="outline" onClick={() => act('commissions', r.id, { status: 'approved' }, 'Commission approved')}><Check size={13} /> Approve</Button> : <Button size="xs" variant="primary" onClick={() => setters.pay({ ...r, kind: 'commission' })}><BanknoteCheck size={13} /> Pay now</Button>) },
    'promo-codes': { title: 'Promo codes', subtitle: 'Discounts you create here. Not the same as agent referral codes.', resource: 'promoCodes', columns: [col.text('code', 'Code', { strong: true, meta: { mobilePrimary: true, sortable: true } }), col.custom('value', 'Discount', (r) => (r.type === 'percent' ? `${r.value}%` : formatMoney(r.value)), { value: (r) => r.value }), col.custom('uses', 'Uses', (r) => `${formatNumber(r.uses)}${r.limit ? ` / ${formatNumber(r.limit)}` : ''}`, { value: (r) => r.uses, sortable: true }), col.date('validUntil', 'Valid until'), col.status()], tabs: tabs('status', ['active', 'paused', 'expired']), toolbar: <Button size="sm" variant="primary" onClick={() => setters.promo(true)}><Plus size={15} /> New code</Button>, rowActions: (r) => <RowMenu items={[{ label: r.status === 'active' ? 'Pause' : 'Activate', icon: r.status === 'active' ? <Pause /> : <Play />, onSelect: () => act('promoCodes', r.id, { status: r.status === 'active' ? 'paused' : 'active' }, 'Promo updated') }, { label: 'Duplicate', icon: <Copy />, onSelect: () => toast('Duplicated') }]} /> },
    referrals: { title: 'Referrals', resource: 'referrals', columns: [col.text('agentName', 'Agent', { strong: true }), col.code('code', 'Code'), col.text('referredName', 'Referred', { meta: { mobilePrimary: true } }), col.status('stage', 'Stage'), col.money('reward', 'Reward'), col.status('rewardStatus', 'Reward'), col.custom('fraudFlag', 'Fraud', (r) => (r.fraudFlag ? <Badge tone="danger" iconName="Flag" size="xs">Flagged</Badge> : '—'), { value: (r) => r.fraudFlag }), col.date()], tabs: tabs('stage', ['signed_up', 'verified', 'first_transaction']), filters: [{ id: 'fraudFlag', label: 'Fraud', options: opts([['true', 'Flagged']]) }, { id: 'rewardStatus', label: 'Reward', options: opts(['pending', 'earned', 'paid']) }], rowActions: (r) => (r.fraudFlag ? <RowMenu items={[{ label: 'Clear flag', icon: <Check />, onSelect: () => act('referrals', r.id, { fraudFlag: false }, 'Flag cleared') }, { label: 'Void reward', icon: <Ban />, tone: 'danger', onSelect: () => act('referrals', r.id, { rewardStatus: 'pending', reward: { amount: 0, currency: 'RWF' } }, 'Reward voided') }]} /> : null) },
    disputes: { title: 'Disputes', resource: 'disputes', columns: [col.code(), { ...col.text('refTitle', 'About'), meta: { mobilePrimary: true, sortable: true } }, col.text('raisedBy', 'Raised by'), col.text('against', 'Against'), col.money('amount', 'On hold'), col.text('assignedAdmin', 'Admin'), col.status(), col.date()], tabs: tabs('status', ['open', 'under_review', 'awaiting_evidence', 'resolved', 'appealed']), filters: [{ id: 'assignedAdmin', label: 'Admin', options: opts(['Patrick K.', 'Josiane U.', 'Olivier M.', 'Sandrine I.']) }], onRowClick: (r) => navigate(`/admin/disputes/${r.code}`), savedViews: true },
    appeals: { title: 'Appeals', resource: 'appeals', columns: [col.code(), col.code('disputeCode', 'Dispute'), col.text('appellant', 'Appellant', { strong: true, meta: { mobilePrimary: true } }), col.text('reason', 'Reason'), col.status(), col.date()], tabs: tabs('status', ['open', 'under_review', 'upheld', 'overturned']), rowActions: (r) => <RowMenu items={[{ label: 'Uphold decision', icon: <Check />, onSelect: () => act('appeals', r.code, { status: 'upheld' }, 'Decision upheld') }, { label: 'Overturn', icon: <RotateCcw />, onSelect: () => act('appeals', r.code, { status: 'overturned' }, 'Decision overturned') }]} /> },
    contracts: { title: 'Contract templates', subtitle: 'Words like {needer_name} and {price} are filled in for you.', resource: 'contracts', defaultSort: '-updatedAt', columns: [{ ...col.text('name', 'Template', { strong: true }), meta: { mobilePrimary: true, sortable: true } }, col.text('kind', 'Used for'), col.text('version', 'Version'), col.number('uses', 'Uses'), col.status(), col.date('updatedAt', 'Updated')], onRowClick: (r) => navigate(`/admin/contracts/${r.id}`), toolbar: <Button size="sm" variant="primary" onClick={() => navigate('/admin/contracts/new')}><Plus size={15} /> Template</Button> },
    tickets: { title: 'Support tickets', subtitle: 'Reply to people who asked for help, with time limits on each one.', resource: 'tickets', defaultSort: 'slaDueAt', columns: [col.code(), { ...col.text('subject', 'Subject'), meta: { mobilePrimary: true, sortable: true } }, col.text('requesterName', 'Requester'), col.text('category', 'Category'), col.priority(), col.custom('slaDueAt', 'SLA', (r) => { const late = new Date(r.slaDueAt) < new Date() && !['resolved', 'closed'].includes(r.status); return <Badge tone={late ? 'danger' : 'grey'} iconName="Timer" size="xs">{late ? 'Breached' : new Date(r.slaDueAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Badge> }, { value: (r) => r.slaDueAt, sortable: true }), col.text('assignee', 'Assignee'), col.status()], tabs: tabs('status', ['open', 'assigned', 'awaiting_user', 'escalated', 'resolved', 'closed']), filters: [{ id: 'priority', label: 'Priority', options: opts(['urgent', 'high', 'normal', 'low']) }, { id: 'category', label: 'Category', options: opts(['Payments', 'Verification', 'Account', 'Offers', 'Disputes', 'Technical']) }], bulk: [{ label: 'Assign to me', icon: <UserCog size={15} />, primary: true, onRun: async (rows) => { await Promise.all(rows.map((r) => api.update('tickets', r.code, { status: 'assigned', assignee: 'Patrick K.' }))); toast(`${rows.length} assigned to you`) } }], onRowClick: setters.ticket, savedViews: true },
    'audit-logs': { title: 'Audit logs', subtitle: 'Every sensitive action, who did it and from where.', resource: 'auditLogs', columns: [col.date('createdAt', 'When', { time: true }), col.text('actor', 'Actor', { strong: true }), col.text('actorRole', 'Role', { muted: true }), { ...col.text('action', 'Action'), cell: ({ row }) => <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs">{row.original.action}</code>, meta: { mobilePrimary: true, sortable: true } }, col.text('target', 'Target'), col.badge('severity', 'Severity', { low: { tone: 'grey', label: 'Low' }, medium: { tone: 'info', label: 'Medium' }, high: { tone: 'danger', label: 'High' } }), col.text('ip', 'IP', { muted: true })], filters: [{ id: 'severity', label: 'Severity', options: opts(['low', 'medium', 'high']) }, { id: 'actor', label: 'Actor', options: opts(['Patrick K.', 'Josiane U.', 'Olivier M.', 'Sandrine I.']) }, DATE], savedViews: true, defaultPageSize: 50 },
    'activity-logs': { title: 'Activity logs', resource: 'activityLogs', columns: [col.date('createdAt', 'When', { time: true }), col.text('who', 'User', { strong: true, meta: { mobilePrimary: true } }), col.badge('role', 'Role', { needer: { tone: 'info', label: 'Customer' }, partner: { tone: 'serve', label: 'Provider' } }), col.text('event', 'Event'), col.text('device', 'Device', { muted: true })], filters: [{ id: 'role', label: 'Role', options: opts(['needer', 'partner']) }, DATE], defaultPageSize: 50 },
  }
}

/* --------------------------------------------------------------- page */
export function AdminTablePage({ table }) {
  const [kyc, setKyc] = useState(null)
  const [msg, setMsg] = useState(null)
  const [escrow, setEscrow] = useState(null)
  const [batch, setBatch] = useState(false)
  const [ticket, setTicket] = useState(null)
  const [cat, setCat] = useState(null)
  const [promo, setPromo] = useState(false)
  const [proof, setProof] = useState(null)
  const [pay, setPay] = useState(null)
  const configs = useConfigs({ kyc: setKyc, msg: setMsg, escrow: setEscrow, batch: setBatch, ticket: setTicket, cat: setCat, promo: setPromo, proof: setProof, pay: setPay })
  const c = configs[table]
  if (!c) return null
  return (
    <>
      <PageHeader title={c.title} subtitle={c.subtitle} />
      <DataTable
        id={`admin-${table}`}
        caption={c.title}
        queryKey={[c.resource, 'admin', table]}
        fetcher={(p) => api.list(c.resource, p)}
        columns={c.columns}
        statusTabs={c.tabs}
        filters={c.filters}
        defaultSort={c.defaultSort ?? '-createdAt'}
        defaultPageSize={c.defaultPageSize ?? 25}
        bulkActions={c.bulk}
        rowActions={c.rowActions}
        viewToggle={c.viewToggle}
        onRowClick={c.onRowClick}
        toolbarActions={c.toolbar}
        savedViews={c.savedViews}
        searchPlaceholder={`Search ${c.title.toLowerCase()}…`}
      />
      <KycDrawer row={kyc} onClose={() => setKyc(null)} />
      <MessageDrawer row={msg} onClose={() => setMsg(null)} />
      <EscrowDialog row={escrow} onClose={() => setEscrow(null)} />
      <ProofDrawer row={proof} onClose={() => setProof(null)} />
      <PayDialog row={pay} onClose={() => setPay(null)} />
      <PayoutBatch open={batch} onOpenChange={setBatch} />
      <TicketDrawer ticket={ticket} onOpenChange={(o) => !o && setTicket(null)} staff />
      <Dialog open={!!cat} onOpenChange={(o) => !o && setCat(null)} title={cat?.name ? `Edit ${cat.name}` : 'New category'} footer={<Button variant="primary" onClick={() => { setCat(null); toast('Category saved') }}>Save</Button>}>
        {cat && (
          <div className="space-y-4">
            <Field label="Name">{(p) => <Input {...p} defaultValue={cat.name} />}</Field>
            <Field label="Subtypes (comma separated)">{(p) => <Textarea {...p} rows={2} defaultValue={cat.subtypes.join(', ')} />}</Field>
            <Field label="Spec fields" hint="Shown in the Post a Need wizard for this category">{(p) => <Textarea {...p} rows={3} defaultValue={'Rooms (number)\nMaterials provided? (select: Yes, No, Partner provides)'} />}</Field>
          </div>
        )}
      </Dialog>
      <Dialog open={promo} onOpenChange={setPromo} title="New promo code" footer={<Button variant="primary" onClick={async () => { await api.create('promoCodes', { code: `KARIBU${Math.floor(10 + Math.random() * 89)}`, type: 'percent', value: 10, uses: 0, limit: 500, validUntil: new Date(Date.now() + 30 * 86400000).toISOString(), status: 'active' }); setPromo(false); toast('Promo code created') }}>Create</Button>}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code">{(p) => <Input {...p} defaultValue="KARIBU10" />}</Field>
          <Field label="Type">{(p) => <Select {...p}><option>Percent</option><option>Fixed RWF</option></Select>}</Field>
          <Field label="Value">{(p) => <Input {...p} type="number" defaultValue={10} />}</Field>
          <Field label="Usage limit">{(p) => <Input {...p} type="number" defaultValue={500} />}</Field>
        </div>
      </Dialog>
    </>
  )
}
