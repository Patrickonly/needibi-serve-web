import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Hand, Bot, Timer, Save, Plus, Trash, Search, Star, Image as ImageIcon, BadgeCheck, Award, Sparkles, Shield, Lock, Eye, EyeOff, ScrollText, RotateCcwClock, GripVertical, Globe2, Smartphone, Landmark, Pencil, Copy, ArrowUp, ArrowDown, LayoutGrid, Table2, List } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { toast, useUI } from '@/lib/store'
import { LanguagesManager, CountriesManager } from './Locales'
import { formatMoney, formatDateTime } from '@/lib/format'
import { PARTNERS, CATEGORIES, STAFF_ROLES } from '@/mocks/seed'
import { HELP_ARTICLES } from '@/features/public/Info'
import { ConfirmDialog } from '@/design-system/Overlay'
import { Button, Card, CardTitle, Badge, Switch, Field, Input, Textarea, Select, Alert, Avatar, VerifiedBadge, Rating, Chip, Tabs, TabList, Tab, TabPanel, Checkbox, RadioCards } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'
import { MoneyInput } from '@/components/forms/inputs'
import { useCategoryGroups } from '@/lib/categoryGroups'
import { useAgentRewards } from '@/lib/agentRewards'
import { usePaymentAccounts, ACCOUNT_TYPES } from '@/lib/paymentAccounts'
import { useCareers, JOB_TYPES } from '@/lib/careers'

/* ================================================================ Roles & permissions */
const PERMS = [
  ['needs.approve', 'Approve / reject Needs & Bundles'],
  ['deals.approve', 'Approve & feature Deals'],
  ['matching.configure', 'Change matching settings'],
  ['users.suspend', 'Suspend accounts'],
  ['kyc.review', 'Review KYC'],
  ['messages.moderate', 'Moderate Messages & reviews'],
  ['escrow.release', 'Release / refund escrow'],
  ['payouts.run', 'Run payout batches'],
  ['disputes.resolve', 'Resolve disputes'],
  ['tickets.reply', 'Reply to tickets'],
  ['settings.edit', 'Edit platform settings'],
]
const DEFAULT_MATRIX = {
  super: PERMS.map(([p]) => p),
  moderator: ['needs.approve', 'deals.approve', 'messages.moderate', 'kyc.review'],
  finance: ['escrow.release', 'payouts.run'],
  support: ['tickets.reply', 'messages.moderate'],
  matching: ['matching.configure', 'needs.approve'],
}
export function RolesMatrix() {
  const [m, setM] = useState(DEFAULT_MATRIX)
  const [user, setUser] = useState('Josiane U.')
  const [overrides, setOverrides] = useState({ 'Josiane U.': ['escrow.release'] })
  const toggle = (role, p) => setM((s) => ({ ...s, [role]: s[role].includes(p) ? s[role].filter((x) => x !== p) : [...s[role], p] }))
  return (
    <>
      <PageHeader title="Roles & permissions" subtitle="Permissions are enforced server-side; the UI only hides actions. Changes are audited." actions={<Button variant="primary" onClick={() => toast('Permission matrix saved', { description: 'Recorded in the audit log.' })}><Save size={16} /> Save changes</Button>} />
      <Card padded={false} className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">Permission matrix</caption>
          <thead className="bg-surface-2">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase text-muted">Permission</th>
              {STAFF_ROLES.map((r) => <th key={r.id} scope="col" className="px-3 py-3 text-center text-xs font-bold uppercase text-muted">{r.name}<span className="block font-normal normal-case">{r.users} users</span></th>)}
            </tr>
          </thead>
          <tbody>
            {PERMS.map(([p, label]) => (
              <tr key={p} className="border-t border-border">
                <th scope="row" className="px-4 py-3 text-left font-medium text-text">{label}<code className="ml-2 text-xs text-muted">{p}</code></th>
                {STAFF_ROLES.map((r) => (
                  <td key={r.id} className="px-3 text-center">
                    <input type="checkbox" className="h-5 w-5 accent-[var(--primary-900)]" checked={m[r.id].includes(p)} disabled={r.id === 'super'} onChange={() => toggle(r.id, p)} aria-label={`${r.name}: ${label}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="mt-6">
        <CardTitle sub="Grant or remove a single permission for one person, on top of their role.">Per-user overrides</CardTitle>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Staff member">{(p) => <Select {...p} value={user} onChange={(e) => setUser(e.target.value)} className="w-56">{['Patrick K.', 'Josiane U.', 'Olivier M.', 'Sandrine I.'].map((u) => <option key={u}>{u}</option>)}</Select>}</Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {PERMS.map(([p, l]) => <Chip key={p} active={(overrides[user] ?? []).includes(p)} onClick={() => setOverrides((o) => ({ ...o, [user]: (o[user] ?? []).includes(p) ? o[user].filter((x) => x !== p) : [...(o[user] ?? []), p] }))}>{l}</Chip>)}
        </div>
      </Card>
    </>
  )
}

/* ================================================================ Matching */
const FACTORS = [['fit', 'Fit to request', 25], ['distance', 'Distance', 15], ['availability', 'Availability & capacity', 12], ['recurring', 'Recurring capability', 6], ['rating', 'Rating', 14], ['reliability', 'Reliability', 12], ['responsiveness', 'Responsiveness', 8], ['delivery', 'Delivery time', 5], ['history', 'History with Needer', 3]]
function MatchingPanel({ scope }) {
  const [mode, setMode] = useState(scope === 'needs' ? 'limited' : 'automatic')
  const [limits, setLimits] = useState({ need: 3, bundle: 3, item: 3 })
  const [timer, setTimer] = useState(30)
  const [threshold, setThreshold] = useState(15)
  const [autoDispatch, setAutoDispatch] = useState(true)
  const [weights, setWeights] = useState(Object.fromEntries(FACTORS.map(([k, , w]) => [k, w])))
  const top = useMemo(() => PARTNERS.filter((p) => p.status === 'active').map((p) => ({ ...p, score: Math.round((p.rating / 5) * weights.rating + (p.reliability / 100) * weights.reliability + (p.responseRate / 100) * weights.responsiveness + weights.fit * 0.8 + weights.distance * (p.areas.includes('Gasabo') ? 1 : 0.4) + weights.availability * 0.7) })).sort((a, b) => b.score - a.score).slice(0, 5), [weights])
  return (
    <div className="space-y-6">
      <RadioCards
        columns={3}
        value={mode}
        onChange={(v) => { setMode(v); toast(`${scope === 'needs' ? 'Needs' : 'Bundles'}: ${v} matching enabled`) }}
        options={[
          { value: 'manual', label: 'Manual', description: 'Staff assign Partners to a Need, a whole Bundle or selected items.', icon: <Hand size={18} /> },
          { value: 'automatic', label: 'Automatic', description: 'Hard filters + ranking. Time-limited offers move to the next Partner on expiry.', icon: <Bot size={18} /> },
          { value: 'limited', label: 'Limited-Offer', description: 'First eligible Partners to Serve fill the slots. Rejected/expired offers free a slot.', icon: <Timer size={18} /> },
        ]}
      />
      <Alert tone="info" title="Hard filters (always applied)">Verification · eligibility · category · service area.</Alert>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Offer limits & timers</CardTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            {scope === 'needs' ? <Field label="Per Need">{(p) => <Input {...p} type="number" min="1" max="10" value={limits.need} onChange={(e) => setLimits({ ...limits, need: Number(e.target.value) })} />}</Field> : (
              <>
                <Field label="Per whole Bundle">{(p) => <Input {...p} type="number" min="1" max="10" value={limits.bundle} onChange={(e) => setLimits({ ...limits, bundle: Number(e.target.value) })} />}</Field>
                <Field label="Per Bundle item">{(p) => <Input {...p} type="number" min="1" max="10" value={limits.item} onChange={(e) => setLimits({ ...limits, item: Number(e.target.value) })} />}</Field>
              </>
            )}
            <Field label="Offer timer (min)">{(p) => <Input {...p} type="number" min="5" value={timer} onChange={(e) => setTimer(Number(e.target.value))} />}</Field>
          </div>
          {scope === 'bundles' && <p className="mt-2 text-xs text-muted">Default: 3 whole-Bundle + 3 per item. Alternative: strict 6 total per Bundle.</p>}
          <Field label="Rejection alert threshold" hint="Admins are alerted when a Need reaches this many Partner rejections." className="mt-4">{(p) => <Input {...p} type="number" min="1" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />}</Field>
          <Switch className="mt-4" checked={autoDispatch} onChange={setAutoDispatch} label="Auto-dispatch" description="Send expired offers to the next ranked Partner automatically" />
        </Card>
        <Card>
          <CardTitle sub="Live preview for a plumbing Need in Kimihurura">Top 5 Partners</CardTitle>
          <ol className="space-y-2.5">
            {top.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3">
                <span className="tabular w-5 text-sm font-bold text-muted">{i + 1}</span>
                <Avatar name={p.name} hue={p.avatarHue} size={32} />
                <span className="min-w-0 flex-1"><span className="flex items-center gap-1 truncate text-sm font-semibold text-text">{p.name} {p.verified && <VerifiedBadge compact />}</span><Rating value={p.rating} size={10} className="text-xs" /></span>
                <Badge tone="trust" size="xs">{p.score}</Badge>
              </li>
            ))}
          </ol>
        </Card>
      </div>
      <Card>
        <CardTitle sub="Higher weight = more influence on ranking">Ranking weights</CardTitle>
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {FACTORS.map(([k, l]) => (
            <label key={k} className="block">
              <span className="mb-1 flex justify-between text-sm"><span className="font-medium text-text">{l}</span><span className="tabular font-bold text-text">{weights[k]}</span></span>
              <input type="range" min="0" max="40" value={weights[k]} onChange={(e) => setWeights((w) => ({ ...w, [k]: Number(e.target.value) }))} className="w-full accent-[var(--action-500)]" />
            </label>
          ))}
        </div>
        <Button variant="primary" className="mt-5" onClick={() => toast('Matching settings saved', { description: 'Logged in the change log.' })}><Save size={16} /> Save</Button>
      </Card>
    </div>
  )
}
export function MatchingSettings() {
  return (
    <>
      <PageHeader title="Matching" subtitle="Mode and limits are configured separately for Needs and Bundles." />
      <Tabs defaultValue="needs">
        <TabList label="Matching scope"><Tab value="needs">Needs</Tab><Tab value="bundles">Bundles</Tab><Tab value="log">Change log</Tab></TabList>
        <TabPanel value="needs" className="pt-5"><MatchingPanel scope="needs" /></TabPanel>
        <TabPanel value="bundles" className="pt-5"><MatchingPanel scope="bundles" /></TabPanel>
        <TabPanel value="log" className="pt-5">
          <Card padded={false}>
            <ul className="divide-y divide-border text-sm">
              {[['Patrick K.', 'Needs: mode Automatic → Limited-Offer', '2 h ago'], ['Olivier M.', 'Bundles: per-item limit 2 → 3', 'Yesterday'], ['Patrick K.', 'Rejection threshold 20 → 15', '3 days ago'], ['Sandrine I.', 'Weight “Reliability” 8 → 12', 'Last week']].map(([who, what, when]) => (
                <li key={what} className="flex items-center gap-3 p-4"><RotateCcwClock size={16} className="text-muted" /><span className="flex-1"><span className="font-semibold text-text">{who}</span> <span className="text-muted">· {what}</span></span><span className="text-xs text-muted">{when}</span></li>
              ))}
            </ul>
          </Card>
        </TabPanel>
      </Tabs>
    </>
  )
}

/* ================================================================ Fees & commissions */
export function FeesPage() {
  const [rates, setRates] = useState({ 1: 18, 2: 15, 3: 12 })
  const [boost, setBoost] = useState(2000)
  const [urgent, setUrgent] = useState(3000)
  const [urgentOn, setUrgentOn] = useState(true)
  const [overrides, setOverrides] = useState([{ id: 'pt-akagera', name: 'Akagera Events', rate: 10, reason: 'Launch partner · until 31 Dec' }])
  const [q, setQ] = useState('')
  return (
    <>
      <PageHeader title="Fees" subtitle="Choose the service fee for each Partner level and booking type." actions={<Button variant="primary" onClick={() => toast('Fee settings saved')}><Save size={16} /> Save</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Platform fee by level</CardTitle>
          {[1, 2, 3].map((l) => (
            <label key={l} className="mb-4 block">
              <span className="mb-1 flex justify-between text-sm"><span className="font-medium text-text">{l === 3 ? 'Top Partner (L3)' : `Level ${l}`}</span><span className="tabular font-bold">{rates[l]}%</span></span>
              <input type="range" min="5" max="25" value={rates[l]} onChange={(e) => setRates({ ...rates, [l]: Number(e.target.value) })} className="w-full accent-[var(--action-500)]" />
            </label>
          ))}
          <p className="rounded-lg bg-surface-2 p-3 text-sm text-muted">Example: RWF 450,000 at Level 2 → Partner {formatMoney(450000 * (1 - rates[2] / 100))} · Platform {formatMoney(450000 * rates[2] / 100)}</p>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardTitle sub="A customer can pay this extra amount to have their request reviewed first. It is separate from the Urgent label.">Priority boost fee</CardTitle>
            <Field label="Extra fee for a priority request">{(p) => <MoneyInput {...p} value={boost} onChange={setBoost} />}</Field>
            <Switch className="mt-4" checked label="Review paid priority requests first" />
          </Card>
          <Card>
            <CardTitle sub="Charged when a customer marks a Need as Urgent, so Partners see it first and know it must be done fast.">Urgent Need fee</CardTitle>
            <Field label="Extra fee for an Urgent Need">{(p) => <MoneyInput {...p} value={urgent} onChange={setUrgent} />}</Field>
            <Switch className="mt-4" checked={urgentOn} onChange={setUrgentOn} label="Charge the fee when a Need is marked Urgent" />
          </Card>
        </div>
      </div>
      <Card className="mt-6">
        <CardTitle sub="Temporary or negotiated rates for specific Partners">Per-Partner overrides</CardTitle>
        <div className="flex gap-2"><Input leading={<Search size={16} />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a Partner" aria-label="Find a Partner" /></div>
        {q && (
          <ul className="mt-2 rounded-card border border-border">
            {PARTNERS.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5).map((p) => (
              <li key={p.id}><button type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2" onClick={() => { setOverrides((o) => [...o, { id: p.id, name: p.name, rate: 12, reason: '' }]); setQ('') }}><Plus size={14} /> {p.name}</button></li>
            ))}
          </ul>
        )}
        <ul className="mt-4 divide-y divide-border">
          {overrides.map((o, i) => (
            <li key={o.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="min-w-40 flex-1 font-semibold text-text">{o.name}</span>
              <Input size="sm" type="number" className="w-20" value={o.rate} onChange={(e) => setOverrides((l) => l.map((x, k) => (k === i ? { ...x, rate: Number(e.target.value) } : x)))} aria-label="Rate %" />
              <span className="text-sm text-muted">%</span>
              <Input size="sm" className="w-64" value={o.reason} onChange={(e) => setOverrides((l) => l.map((x, k) => (k === i ? { ...x, reason: e.target.value } : x)))} placeholder="Reason (required)" aria-label="Reason" />
              <Button variant="ghost" size="icon-sm" aria-label="Remove override" onClick={() => setOverrides((l) => l.filter((_, k) => k !== i))}><Trash size={16} /></Button>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

export function SubscriptionsPage() {
  const [plans, setPlans] = useState([
    { name: 'Starter', price: 0, fee: 18, deals: 1, seats: 1 },
    { name: 'Growth', price: 15000, fee: 15, deals: 10, seats: 2 },
    { name: 'Pro', price: 45000, fee: 12, deals: 999, seats: 5 },
  ])
  const upd = (i, k, v) => setPlans((l) => l.map((p, j) => (j === i ? { ...p, [k]: v } : p)))
  return (
    <>
      <PageHeader title="Partner plans" subtitle="Set the plans, limits, and monthly prices Partners can choose." actions={<><Button variant="outline" onClick={() => setPlans((l) => [...l, { name: 'New plan', price: 0, fee: 15, deals: 5, seats: 1 }])}><Plus size={16} /> Add plan</Button><Button variant="primary" onClick={() => toast('Plans published')}><Save size={16} /> Publish</Button></>} />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p, i) => (
          <Card key={i} className="space-y-3">
            <Field label="Name">{(x) => <Input {...x} value={p.name} onChange={(e) => upd(i, 'name', e.target.value)} />}</Field>
            <Field label="Monthly price">{(x) => <MoneyInput {...x} value={p.price} onChange={(v) => upd(i, 'price', v)} />}</Field>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Fee %">{(x) => <Input {...x} type="number" value={p.fee} onChange={(e) => upd(i, 'fee', Number(e.target.value))} />}</Field>
              <Field label="Deals">{(x) => <Input {...x} type="number" value={p.deals} onChange={(e) => upd(i, 'deals', Number(e.target.value))} />}</Field>
              <Field label="Seats">{(x) => <Input {...x} type="number" value={p.seats} onChange={(e) => upd(i, 'seats', Number(e.target.value))} />}</Field>
            </div>
            <p className="text-sm text-muted">{Math.floor(400 / (i + 1))} Partners on this plan</p>
          </Card>
        ))}
      </div>
    </>
  )
}

export function BadgesPage() {
  const badges = [['KYC Verified', BadgeCheck, 'Automatic after KYC approval', 'trust'], ['Top Partner', Sparkles, 'Level 3: rating ≥ 4.7, 100+ jobs, < 2% disputes', 'serve'], ['Fast responder', Timer, 'Median response < 30 min for 30 days', 'info'], ['100 jobs', Award, '100 completed, paid jobs', 'navy'], ['Trusted Agent', Shield, '50 verified referrals, no fraud flags', 'trust']]
  return (
    <>
      <PageHeader title="Badges" subtitle="Rules for trust badges shown on cards and profiles." actions={<Button variant="primary" onClick={() => toast('New badge draft created')}><Plus size={16} /> Badge</Button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {badges.map(([n, Icon, rule, tone]) => (
          <Card key={n}>
            <Badge tone={tone} icon={<Icon size={13} />} size="md">{n}</Badge>
            <p className="mt-3 text-sm text-muted">{rule}</p>
            <div className="mt-4 flex justify-between"><Switch checked onChange={() => toast(`${n} paused`)} label="Active" /><Button size="sm" variant="ghost">Edit rule</Button></div>
          </Card>
        ))}
      </div>
    </>
  )
}

export function BannedTerms() {
  const [terms, setTerms] = useState(['whatsapp me', 'call me', 'gmail', 'wa.me', 't.me', 'instagram', 'cash only', 'pay outside', 'western union'])
  const [t, setT] = useState('')
  const [test, setTest] = useState('Call me on zero seven eight eight one two three four five six')
  return (
    <>
      <PageHeader title="Banned terms" subtitle="Blocked in public Messages, Need descriptions and Deals. Disguised numbers and emails are detected automatically." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex gap-2"><Input value={t} onChange={(e) => setT(e.target.value)} placeholder="Add a term" aria-label="Add a term" /><Button variant="primary" disabled={!t.trim()} onClick={() => { setTerms((l) => [...l, t.trim().toLowerCase()]); setT('') }}><Plus size={16} /> Add</Button></div>
          <div className="mt-4 flex flex-wrap gap-2">{terms.map((x) => <button key={x} type="button" onClick={() => setTerms((l) => l.filter((y) => y !== x))} className="inline-flex items-center gap-1 rounded-full bg-danger-100 px-3 py-1 text-sm font-medium text-danger-fg" aria-label={`Remove ${x}`}>{x} ×</button>)}</div>
        </Card>
        <Card>
          <CardTitle>Test the filter</CardTitle>
          <Textarea rows={3} value={test} onChange={(e) => setTest(e.target.value)} aria-label="Test text" />
          <TestResult text={test} terms={terms} />
        </Card>
      </div>
    </>
  )
}
export function AgentRewardsPage() {
  const r = useAgentRewards()
  const pct = (key, label, max, help) => (
    <label className="mb-4 block">
      <span className="mb-1 flex justify-between text-sm"><span className="font-medium text-text">{label}</span><span className="tabular font-bold">{r[key]}%</span></span>
      <input type="range" min="0" max={max} step="0.5" value={r[key]} onChange={(e) => r.update({ [key]: Number(e.target.value) })} className="w-full accent-[var(--action-500)]" aria-label={label} />
      {help && <span className="mt-1 block text-xs text-muted">{help}</span>}
    </label>
  )
  const money = (key, label) => <Field label={label}>{(p) => <MoneyInput {...p} value={r[key]} onChange={(v) => r.update({ [key]: Number(v) || 0 })} />}</Field>
  return (
    <>
      <PageHeader title="Agent rewards" subtitle="Set what agents earn for helping customers and providers, for referrals, and their tier bonuses." actions={<><Button variant="ghost" onClick={() => { r.reset(); toast('Agent rewards reset to defaults', { tone: 'info' }) }}>Reset</Button><Button variant="primary" onClick={() => toast('Agent reward settings saved')}><Save size={16} /> Save</Button></>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle sub="Paid from the platform fee, never from the customer or provider.">Commission on assisted work</CardTitle>
          {pct('neederBookingPct', 'Per booking made for a customer', 10, `Example: RWF 100,000 booking → agent earns ${formatMoney(100000 * r.neederBookingPct / 100)}`)}
          {pct('partnerDealPct', 'Per deal sold by a provider they assist', 10, `Example: RWF 100,000 deal → agent earns ${formatMoney(100000 * r.partnerDealPct / 100)}`)}
          <div className="grid gap-4 sm:grid-cols-2">
            {money('assistedPayoutCap', 'Max commission per booking')}
            {money('minPayout', 'Minimum payment request')}
          </div>
        </Card>
        <Card>
          <CardTitle sub="Fixed rewards paid as each referral moves forward.">Referral & onboarding rewards</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {money('referralSignup', 'Referral signs up')}
            {money('referralVerified', 'Referral gets verified')}
            {money('referralFirstTransaction', 'Referral completes a first transaction')}
            {money('partnerOnboarded', 'Provider registered and approved')}
          </div>
        </Card>
      </div>
      <Card className="mt-6">
        <CardTitle sub="Agents move up a tier when they reach the monthly number of matched people. The bonus is added on top of their commission.">Tiers</CardTitle>
        <ul className="divide-y divide-border">
          {r.tiers.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 py-3">
              <Award size={18} className="text-action-fg" aria-hidden="true" />
              <Input size="sm" className="w-36" value={t.name} onChange={(e) => r.updateTier(t.id, { name: e.target.value })} aria-label="Tier name" />
              <span className="text-sm text-muted">from</span>
              <Input size="sm" type="number" min="0" className="w-20" value={t.target} onChange={(e) => r.updateTier(t.id, { target: Math.max(0, Number(e.target.value)) })} aria-label={`${t.name} target`} />
              <span className="text-sm text-muted">matches a month, bonus</span>
              <Input size="sm" type="number" min="0" max="100" className="w-20" value={t.bonusPct} onChange={(e) => r.updateTier(t.id, { bonusPct: Math.max(0, Number(e.target.value)) })} aria-label={`${t.name} bonus %`} />
              <span className="text-sm text-muted">%</span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

export function CareersAdminPage() {
  const { jobs, save, toggle, remove, reset } = useCareers()
  const [form, setForm] = useState(null)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form && form.title.trim() && form.team.trim() && form.location.trim()
  return (
    <>
      <PageHeader title="Careers" subtitle="Roles shown on the public Careers page. Close a role to hide it without deleting it." actions={<><Button variant="outline" onClick={() => { reset(); toast('Roles reset to default') }}><RotateCcwClock size={16} /> Reset</Button><Button variant="primary" onClick={() => setForm({ title: '', team: '', location: 'Kigali', type: 'On-site', description: '', open: true })}><Plus size={16} /> Add role</Button></>} />
      {form && (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-extrabold tracking-tight text-text">{form.id ? 'Edit role' : 'New role'}</h3>
          <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!valid) return; save({ ...form, title: form.title.trim(), team: form.team.trim(), location: form.location.trim(), description: form.description.trim() }); toast('Role saved'); setForm(null) }}>
            <div className="sm:col-span-2"><Field label="Job title">{(p) => <Input {...p} value={form.title} onChange={set('title')} placeholder="e.g. Customer Support Agent" />}</Field></div>
            <Field label="Team">{(p) => <Input {...p} value={form.team} onChange={set('team')} placeholder="e.g. Operations" />}</Field>
            <Field label="Location">{(p) => <Input {...p} value={form.location} onChange={set('location')} />}</Field>
            <Field label="Work type">{(p) => <Select {...p} value={form.type} onChange={set('type')}>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
            <div className="sm:col-span-2"><Field label="Short description">{(p) => <Textarea {...p} rows={3} value={form.description} onChange={set('description')} placeholder="What the person will do" />}</Field></div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" variant="primary" disabled={!valid}><Save size={16} /> Save role</Button>
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      {jobs.length === 0 && <Alert tone="warn" title="No roles">The Careers page will show “No open roles” until you add one.</Alert>}
      <div className="grid gap-4">
        {jobs.map((j) => (
          <Card key={j.id} className={cn('flex flex-wrap items-center gap-4', !j.open && 'opacity-60')}>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-extrabold tracking-tight text-text">{j.title}</h3>
              <p className="mt-0.5 text-sm text-muted">{j.team} · {j.location} · {j.type}</p>
              {j.description && <p className="mt-1 text-sm text-muted">{j.description}</p>}
            </div>
            <Switch checked={j.open} onChange={() => toggle(j.id)} label={j.open ? 'Open' : 'Closed'} />
            <Button size="sm" variant="outline" onClick={() => setForm(j)}><Pencil size={14} /> Edit</Button>
            <Button size="sm" variant="ghost" onClick={() => { remove(j.id); toast(`Removed “${j.title}”`) }} aria-label={`Remove ${j.title}`}><Trash size={15} /></Button>
          </Card>
        ))}
      </div>
    </>
  )
}

export function PaymentAccountsPage() {
  const { accounts, save, toggle, remove, reset, duplicate, move } = usePaymentAccounts()
  const [form, setForm] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [view, setView] = useState('grid')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const openNew = () => setForm({ type: 'momo', provider: ACCOUNT_TYPES.momo.label, accountName: 'NEEDIBI ONLINE SERVICES LTD', number: '', note: '', active: true })
  const valid = form && form.provider.trim() && form.accountName.trim() && form.number.trim()
  return (
    <>
      <PageHeader title="Payment details" subtitle="Manage the mobile-money and bank details customers use at checkout. Hide an account without deleting it." actions={<><Button variant="outline" onClick={() => setConfirmReset(true)}><RotateCcwClock size={16} /> Reset defaults</Button><Button variant="primary" onClick={openNew}><Plus size={16} /> Add payment detail</Button></>} />
      {form && (
        <Card className="mb-6">
          <h3 className="font-display text-lg font-extrabold tracking-tight text-text">{form.id ? 'Edit payment detail' : 'Add payment detail'}</h3>
          <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (!valid) return; save({ ...form, provider: form.provider.trim(), accountName: form.accountName.trim(), number: form.number.trim(), note: form.note.trim() }); toast('Payment account saved'); setForm(null) }}>
            <Field label="Type">{(p) => <Select {...p} value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, provider: f.id ? f.provider : ACCOUNT_TYPES[e.target.value].label }))}>{Object.entries(ACCOUNT_TYPES).map(([k, t]) => <option key={k} value={k}>{t.label}</option>)}</Select>}</Field>
            <Field label={form.type === 'bank' ? 'Bank name' : 'Provider name'}>{(p) => <Input {...p} value={form.provider} onChange={set('provider')} />}</Field>
            <Field label="Account holder name">{(p) => <Input {...p} value={form.accountName} onChange={set('accountName')} />}</Field>
            <Field label={ACCOUNT_TYPES[form.type].numberLabel}>{(p) => <Input {...p} value={form.number} onChange={set('number')} placeholder={form.type === 'bank' ? '000-0000000-00' : form.type === 'momo' ? '012345' : '07xx xxx xxx'} />}</Field>
            <div className="sm:col-span-2"><Field label="Note for the customer (optional)">{(p) => <Input {...p} value={form.note} onChange={set('note')} placeholder="e.g. Branch, or what to write as the reference" />}</Field></div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit" variant="primary" disabled={!valid}><Save size={16} /> Save account</Button>
              <Button type="button" variant="ghost" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}
      {accounts.length === 0 && <Alert tone="warn" title="No payment accounts">Customers will see no payment details at checkout until you add one.</Alert>}
      {accounts.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted">{accounts.length} payment {accounts.length === 1 ? 'detail' : 'details'}</p>
          <div className="flex items-center rounded-xl border border-border bg-surface p-1" role="group" aria-label="Payment details view">
            {[['grid', LayoutGrid, 'Grid view'], ['table', Table2, 'Table view'], ['list', List, 'List view']].map(([value, Icon, label]) => (
              <Button key={value} size="icon-sm" variant={view === value ? 'primary' : 'ghost'} onClick={() => setView(value)} aria-label={label} aria-pressed={view === value}>
                <Icon size={16} />
              </Button>
            ))}
          </div>
        </div>
      )}
      {view === 'grid' && <div className="grid gap-5 lg:grid-cols-2">
        {accounts.map((a, idx) => {
          const Icon = a.type === 'bank' ? Landmark : Smartphone
          return (
            <Card key={a.id} className={cn('flex flex-col gap-4', !a.active && 'opacity-60')}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-action-100 text-action-fg"><Icon size={20} /></span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-display text-lg font-extrabold tracking-tight text-text">{a.provider}</h3>
                  <p className="truncate text-sm text-muted">{ACCOUNT_TYPES[a.type]?.label}</p>
                </div>
                <Switch checked={a.active} onChange={() => toggle(a.id)} label={a.active ? 'Shown' : 'Hidden'} />
              </div>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted">{ACCOUNT_TYPES[a.type]?.numberLabel}</dt><dd className="tabular font-bold text-text">{a.number}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted">Account name</dt><dd className="text-right font-semibold text-text">{a.accountName}</dd></div>
                {a.note && <div className="flex justify-between gap-3"><dt className="text-muted">Note</dt><dd className="text-right text-text">{a.note}</dd></div>}
              </dl>
              <div className="mt-auto flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => { setForm(a); window.scrollTo({ top: 0, behavior: 'smooth' }) }}><Pencil size={14} /> Edit</Button>
                <Button size="sm" variant="outline" onClick={() => { duplicate(a.id); toast(`Duplicated “${a.provider}”`) }}><Copy size={14} /> Duplicate</Button>
                <Button size="sm" variant="danger-outline" onClick={() => setToDelete(a)} aria-label={`Delete payment detail for ${a.provider}`}><Trash size={15} /> Delete</Button>
                <span className="ml-auto flex gap-1">
                  <Button size="sm" variant="ghost" disabled={idx === 0} onClick={() => move(a.id, -1)} aria-label={`Move ${a.provider} up`}><ArrowUp size={14} /></Button>
                  <Button size="sm" variant="ghost" disabled={idx === accounts.length - 1} onClick={() => move(a.id, 1)} aria-label={`Move ${a.provider} down`}><ArrowDown size={14} /></Button>
                </span>
              </div>
            </Card>
          )
        })}
      </div>}
      {view === 'table' && accounts.length > 0 && (
        <Card padded={false} className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <caption className="sr-only">Payment details table</caption>
            <thead className="bg-surface-2 text-left text-xs font-bold uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Payment number</th>
                <th className="px-4 py-3">Account holder</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a, idx) => (
                <tr key={a.id} className={cn('border-t border-border', !a.active && 'opacity-60')}>
                  <td className="px-4 py-3 font-bold text-text">{a.provider}</td>
                  <td className="px-4 py-3 text-muted">{ACCOUNT_TYPES[a.type]?.label}</td>
                  <td className="px-4 py-3 tabular font-semibold text-text">{a.number}</td>
                  <td className="px-4 py-3 text-text">{a.accountName}</td>
                  <td className="px-4 py-3"><Switch checked={a.active} onChange={() => toggle(a.id)} label={a.active ? 'Shown' : 'Hidden'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="outline" onClick={() => { setForm(a); window.scrollTo({ top: 0, behavior: 'smooth' }) }} aria-label={`Edit ${a.provider}`}><Pencil size={14} /></Button>
                      <Button size="sm" variant="danger-outline" onClick={() => setToDelete(a)} aria-label={`Delete ${a.provider}`}><Trash size={14} /></Button>
                      <Button size="sm" variant="ghost" disabled={idx === 0} onClick={() => move(a.id, -1)} aria-label={`Move ${a.provider} up`}><ArrowUp size={14} /></Button>
                      <Button size="sm" variant="ghost" disabled={idx === accounts.length - 1} onClick={() => move(a.id, 1)} aria-label={`Move ${a.provider} down`}><ArrowDown size={14} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      {view === 'list' && accounts.length > 0 && (
        <div className="divide-y divide-border rounded-2xl border border-border bg-surface">
          {accounts.map((a, idx) => {
            const Icon = a.type === 'bank' ? Landmark : Smartphone
            return (
              <div key={a.id} className={cn('flex flex-wrap items-center gap-4 p-4', !a.active && 'opacity-60')}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-action-100 text-action-fg"><Icon size={18} /></span>
                <div className="min-w-[180px] flex-1">
                  <p className="font-bold text-text">{a.provider}</p>
                  <p className="text-sm text-muted">{ACCOUNT_TYPES[a.type]?.label} · {a.number}</p>
                </div>
                <p className="min-w-[180px] text-sm text-text">{a.accountName}</p>
                <Switch checked={a.active} onChange={() => toggle(a.id)} label={a.active ? 'Shown' : 'Hidden'} />
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => { setForm(a); window.scrollTo({ top: 0, behavior: 'smooth' }) }} aria-label={`Edit ${a.provider}`}><Pencil size={14} /> Edit</Button>
                  <Button size="sm" variant="danger-outline" onClick={() => setToDelete(a)} aria-label={`Delete ${a.provider}`}><Trash size={14} /></Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} title={`Delete “${toDelete?.provider ?? ''}”?`} description="Customers will no longer see these payment details at checkout. This cannot be undone." confirmLabel="Delete" tone="danger" onConfirm={() => { remove(toDelete.id); toast(`Deleted “${toDelete.provider}”`); setToDelete(null) }} />
      <ConfirmDialog open={confirmReset} onOpenChange={setConfirmReset} title="Reset payment accounts?" description="Your changes will be replaced with the three default demo accounts." confirmLabel="Reset" tone="danger" onConfirm={() => { reset(); toast('Accounts reset to default'); setConfirmReset(false) }} />
    </>
  )
}

export function CategoryGroupsPage() {
  const groups = useCategoryGroups((s) => s.groups)
  const add = useCategoryGroups((s) => s.add)
  const remove = useCategoryGroups((s) => s.remove)
  const rename = useCategoryGroups((s) => s.rename)
  const [editing, setEditing] = useState(null)
  const toggleCategory = useCategoryGroups((s) => s.toggleCategory)
  const reset = useCategoryGroups((s) => s.reset)
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const exists = groups.some((g) => g.name.toLowerCase() === name.trim().toLowerCase())
  const empty = !name.trim()
  const submit = () => {
    setTouched(true)
    if (empty || exists) return
    add(name)
    toast(`Added “${name.trim()}”. Now tap the categories that belong in it.`)
    setName('')
    setTouched(false)
  }
  return (
    <>
      <PageHeader title="Main categories" subtitle="The first choice people make when they post a Need or Bundle (e.g. Products, Services, Properties, Vehicles, Professionals). Add or remove them, and pick which categories sit under each." actions={<Button variant="outline" onClick={() => { reset(); toast('Groups reset to default') }}><RotateCcwClock size={16} /> Reset</Button>} />
      <Card className="mb-6">
        <h3 className="font-display text-lg font-extrabold tracking-tight text-text">Add a main category</h3>
        <p className="mt-1 text-sm text-muted">Type a name such as Events or Equipment, then press Add. It appears below, where you choose which categories belong in it.</p>
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New main category, e.g. Events" aria-label="New main category name" aria-invalid={(exists || (touched && empty)) || undefined} />
          <Button type="submit" variant="primary" className="shrink-0"><Plus size={16} /> Add main category</Button>
        </form>
        {exists && <p className="mt-2 text-sm text-danger-fg">A main category with that name already exists.</p>}
        {touched && empty && <p className="mt-2 text-sm text-danger-fg">Type a name first.</p>}
      </Card>
      {groups.length === 0 ? (
        <Alert tone="info" title="No groups yet">Add a group above. Until then, people pick from every category directly.</Alert>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {editing?.id === g.id ? (
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); rename(g.id, editing.value); toast('Main category renamed'); setEditing(null) }}>
                      <Input autoFocus value={editing.value} onChange={(e) => setEditing({ id: g.id, value: e.target.value })} aria-label={`Rename ${g.name}`} onKeyDown={(e) => e.key === 'Escape' && setEditing(null)} />
                      <Button type="submit" size="sm" variant="primary" disabled={!editing.value.trim()}>Save</Button>
                    </form>
                  ) : (
                    <h3 className="font-display text-xl font-extrabold tracking-tight text-text">{g.name}</h3>
                  )}
                  <p className="mt-1 text-sm text-muted">{g.categories.length} {g.categories.length === 1 ? 'category' : 'categories'} inside</p>
                </div>
                {editing?.id !== g.id && (
                  <div className="flex shrink-0 gap-1">
                    <Button variant="outline" size="sm" onClick={() => setEditing({ id: g.id, value: g.name })} aria-label={`Rename ${g.name}`}>Rename</Button>
                    <Button variant="ghost" size="sm" onClick={() => { remove(g.id); toast(`Removed “${g.name}”`) }} aria-label={`Remove ${g.name}`}><Trash size={15} /></Button>
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs font-semibold text-muted">Tap a category to add or remove it</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => <Chip key={c.slug} active={g.categories.includes(c.slug)} onClick={() => toggleCategory(g.id, c.slug)}>{c.name}</Chip>)}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

function TestResult({ text, terms }) {
  const [res, setRes] = useState(null)
  useEffect(() => {
    import('@/lib/contactFilter').then(({ detectContacts }) => {
      const d = detectContacts(text)
      const hit = terms.filter((t) => text.toLowerCase().includes(t))
      setRes({ blocked: d.blocked || hit.length > 0, kinds: [...d.kinds, ...hit.map((h) => `term: ${h}`)] })
    })
  }, [text, terms])
  if (!res) return null
  return res.blocked ? <Alert tone="danger" className="mt-3" title="Blocked">{res.kinds.join(' · ')}</Alert> : <Alert tone="trust" className="mt-3" title="Allowed">No contact details or banned terms found.</Alert>
}

/* ================================================================ Content */
export function HomeMerch() {
  const { data } = useQuery({ queryKey: ['deals', 'merch'], queryFn: () => api.list('deals', { status: 'published', pageSize: 12, sort: '-rating' }) })
  const [featured, setFeatured] = useState([])
  const [banner, setBanner] = useState({ title: 'Rainy season ready', sub: 'Roof, gutters and drainage Deals up to 25% off', cta: 'Shop Deals' })
  return (
    <>
      <PageHeader title="Home merchandising" subtitle="Featured Deals, Needs and Bundles, and home page banners." actions={<Button variant="primary" onClick={() => toast('Home page updated')}><Save size={16} /> Publish</Button>} />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card>
          <CardTitle sub="Click to feature in the Today's Deals carousel">Featured Deals ({featured.length})</CardTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {data?.data.map((d) => (
              <li key={d.id}>
                <button type="button" onClick={() => setFeatured((f) => (f.includes(d.id) ? f.filter((x) => x !== d.id) : [...f, d.id]))} className={cn('flex w-full items-center gap-3 rounded-card border p-3 text-left', featured.includes(d.id) ? 'border-action-500 bg-action-soft/50' : 'border-border')} aria-pressed={featured.includes(d.id)}>
                  <GripVertical size={16} className="text-muted" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text">{d.title}</span><span className="text-xs text-muted">{d.partner.name} · {formatMoney(d.price)}</span></span>
                  {featured.includes(d.id) ? <Star size={16} className="fill-current text-action-fg" /> : <Star size={16} className="text-muted" />}
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardTitle>Hero banner</CardTitle>
          <div className="space-y-3">
            <Field label="Title">{(p) => <Input {...p} value={banner.title} onChange={(e) => setBanner({ ...banner, title: e.target.value })} />}</Field>
            <Field label="Subtitle">{(p) => <Input {...p} value={banner.sub} onChange={(e) => setBanner({ ...banner, sub: e.target.value })} />}</Field>
            <Field label="Button">{(p) => <Input {...p} value={banner.cta} onChange={(e) => setBanner({ ...banner, cta: e.target.value })} />}</Field>
            <Button variant="outline" size="sm"><ImageIcon size={15} /> Upload image</Button>
          </div>
          <div className="mt-5 rounded-card bg-primary-900 p-5 text-white">
            <p className="font-display text-xl font-extrabold">{banner.title}</p>
            <p className="mt-1 text-sm text-white/80">{banner.sub}</p>
            <span className="mt-3 inline-block rounded-[10px] bg-action-500 px-3 py-1.5 text-sm font-bold text-white">{banner.cta}</span>
          </div>
        </Card>
      </div>
    </>
  )
}

export function HelpEditor() {
  const [sel, setSel] = useState(HELP_ARTICLES[0])
  const [body, setBody] = useState(HELP_ARTICLES[0][3])
  return (
    <>
      <PageHeader title="Help Centre editor" subtitle="Articles, FAQ, user manual, legal pages and app links." actions={<Button variant="primary" onClick={() => toast('Article published')}><Save size={16} /> Publish</Button>} />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card padded={false}>
          <ul className="divide-y divide-border">
            {HELP_ARTICLES.map((a) => (
              <li key={a[0]}><button type="button" onClick={() => { setSel(a); setBody(a[3]) }} className={cn('block w-full px-4 py-3 text-left text-sm', sel[0] === a[0] ? 'bg-action-soft font-semibold text-text' : 'text-text hover:bg-surface-2')}>{a[1]}<span className="block text-xs text-muted">{a[2]}</span></button></li>
            ))}
          </ul>
        </Card>
        <Card className="space-y-4">
          <Field label="Title">{(p) => <Input {...p} key={sel[0]} defaultValue={sel[1]} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Section">{(p) => <Select {...p} key={sel[0]} defaultValue={sel[2]}>{['Needers', 'Partners', 'Payments', 'Safety'].map((s) => <option key={s}>{s}</option>)}</Select>}</Field>
            <Field label="Language">{(p) => <Select {...p}><option>English</option><option>Kinyarwanda</option><option>Français</option><option>Kiswahili</option></Select>}</Field>
          </div>
          <Field label="Body">{(p) => <Textarea {...p} rows={10} value={body} onChange={(e) => setBody(e.target.value)} />}</Field>
          <Checkbox label="Also show in FAQ" defaultChecked />
        </Card>
      </div>
    </>
  )
}

/* ================================================================ Platform settings (incl. privacy matrix) */
const FIELDS = ['Phone number', 'Email', 'Exact address', 'Sector / district', 'Full name', 'KYC documents', 'Chat messages', 'Payment details', 'Reviews']
const VIEWERS = ['Public', 'Needer', 'Assigned Partner', 'Agent (assigned)', 'Admin']
const DEFAULT_PRIVACY = {
  'Phone number': ['Admin', 'Assigned Partner*'],
  Email: ['Admin'],
  'Exact address': ['Assigned Partner*', 'Admin'],
  'Sector / district': VIEWERS,
  'Full name': ['Needer', 'Assigned Partner', 'Agent (assigned)', 'Admin'],
  'KYC documents': ['Admin'],
  'Chat messages': ['Needer', 'Assigned Partner', 'Admin'],
  'Payment details': ['Needer', 'Admin'],
  Reviews: VIEWERS,
}
export function PlatformSettings() {
  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY)
  const has = (f, v) => privacy[f].includes(v) || privacy[f].includes(`${v}*`)
  return (
    <>
      <PageHeader title="Platform settings" subtitle="Intelligence rules, privacy, pricing guidance, languages, notification templates and tasks." actions={<Button variant="primary" onClick={() => toast('Settings saved', { description: 'Recorded in the audit log.' })}><Save size={16} /> Save</Button>} />
      <Tabs defaultValue="privacy">
        <TabList label="Settings">
          <Tab value="privacy">Privacy matrix</Tab>
          <Tab value="rules">Intelligence rules</Tab>
          <Tab value="pricing">Pricing guidance</Tab>
          <Tab value="languages">Languages</Tab>
          <Tab value="countries">Countries</Tab>
          <Tab value="templates">Notification templates</Tab>
          <Tab value="tasks">Tasks</Tab>
        </TabList>
        <TabPanel value="privacy" className="pt-5">
          <Card padded={false} className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <caption className="sr-only">Who sees each field</caption>
              <thead className="bg-surface-2"><tr><th scope="col" className="px-4 py-3 text-left text-xs font-bold uppercase text-muted">Field</th>{VIEWERS.map((v) => <th key={v} scope="col" className="px-3 py-3 text-center text-xs font-bold uppercase text-muted">{v}</th>)}</tr></thead>
              <tbody>
                {FIELDS.map((f) => (
                  <tr key={f} className="border-t border-border">
                    <th scope="row" className="px-4 py-3 text-left font-medium text-text">{f}</th>
                    {VIEWERS.map((v) => (
                      <td key={v} className="px-3 text-center">
                        <button type="button" disabled={v === 'Public' && ['Phone number', 'Email', 'Exact address', 'KYC documents'].includes(f)} onClick={() => setPrivacy((p) => ({ ...p, [f]: has(f, v) ? p[f].filter((x) => x.replace('*', '') !== v) : [...p[f], v] }))} aria-pressed={has(f, v)} aria-label={`${v} can see ${f}`} className={cn('inline-flex h-8 w-8 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-60', has(f, v) ? 'bg-trust-100 text-trust-fg' : 'bg-grey-100 text-grey-fg')}>
                          {has(f, v) ? <Eye size={15} /> : <EyeOff size={15} />}
                        </button>
                        {privacy[f].includes(`${v}*`) && <span className="block text-[10px] text-muted">after agreement</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><Lock size={12} /> Phone, email, exact address and KYC documents can never be public.</p>
        </TabPanel>
        <TabPanel value="rules" className="space-y-4 pt-5">
          <Card className="space-y-4">
            <Switch checked label="Auto-publish Needs that pass the policy check" description="Otherwise every Need goes to the review queue" />
            <Switch checked label="Send Repost to review after 3 reposts per day" />
            <Switch checked label="Flag duplicate Needs (same title + area within 24 h)" />
            <Switch checked={false} label="Auto-translate Needs between Kinyarwanda and English" />
            <Field label="Need expiry (days without an offer)">{(p) => <Input {...p} type="number" defaultValue={14} className="w-32" />}</Field>
          </Card>
        </TabPanel>
        <TabPanel value="pricing" className="pt-5">
          <Card padded={false}>
            <table className="w-full text-sm">
              <thead className="bg-surface-2"><tr><th scope="col" className="px-4 py-3 text-left text-xs uppercase text-muted">Category</th><th scope="col" className="px-4 py-3 text-left text-xs uppercase text-muted">Guidance shown to Needers</th></tr></thead>
              <tbody>{CATEGORIES.map((c, i) => <tr key={c.slug} className="border-t border-border"><th scope="row" className="px-4 py-2.5 text-left font-medium text-text">{c.name}</th><td className="px-4 py-2.5"><Input size="sm" defaultValue={`${formatMoney(20000 + i * 15000)}–${formatMoney(35000 + i * 40000)}`} aria-label={`${c.name} guidance`} /></td></tr>)}</tbody>
            </table>
          </Card>
        </TabPanel>
        <TabPanel value="languages" className="pt-5">
          <LanguagesManager />
        </TabPanel>
        <TabPanel value="countries" className="space-y-4 pt-5">
          <CountriesManager />
        </TabPanel>
        <TabPanel value="templates" className="pt-5">
          <div className="grid gap-4 md:grid-cols-2">
            {[['New offer', 'Hi {needer_name}, {partner_name} served “{need_title}” for {price}.'], ['Payment request', 'Approve {price} on your phone to pay into escrow for {need_title}.'], ['Escrow released', 'You confirmed satisfaction. {price} was released to {partner_name}.'], ['KYC approved', 'Welcome, {partner_name}! You are now a verified Partner.']].map(([t, b]) => (
              <Card key={t}><p className="font-semibold text-text">{t}</p><Textarea rows={3} defaultValue={b} className="mt-2" aria-label={`${t} template`} /><div className="mt-2 flex gap-1.5"><Badge size="xs">In-app</Badge><Badge size="xs">Push</Badge><Badge size="xs">SMS</Badge></div></Card>
            ))}
          </div>
        </TabPanel>
        <TabPanel value="tasks" className="pt-5">
          <Card padded={false}><ul className="divide-y divide-border text-sm">{[['Expire stale offers', 'Every 15 min', true], ['Send recurring reminders', 'Daily 07:00', true], ['Payout batch', 'Fridays 10:00', true], ['Re-verify KYC older than 12 months', 'Weekly', false]].map(([t, s, on]) => <li key={t} className="flex items-center gap-3 p-4"><span className="flex-1"><span className="font-medium text-text">{t}</span><span className="block text-xs text-muted">{s}</span></span><Switch checked={on} onChange={() => toast('Task updated')} label={t} className="[&_label]:sr-only" /></li>)}</ul></Card>
        </TabPanel>
      </Tabs>
    </>
  )
}

/* ================================================================ Contract template editor */
const PLACEHOLDERS = ['{needer_name}', '{partner_name}', '{need_title}', '{price}', '{fee}', '{deadline}', '{service_area}', '{recurring_schedule}']
export function ContractEditor() {
  const { id } = useParams()
  const { data } = useQuery({ queryKey: ['contracts', id], queryFn: () => api.one('contracts', id), enabled: id !== 'new' })
  const [name, setName] = useState('')
  const [body, setBody] = useState(`SERVICE AGREEMENT\n\nThis agreement is between {needer_name} ("Needer") and {partner_name} ("Partner") for "{need_title}".\n\n1. Price: {price}. Platform fee {fee} is deducted from the Partner payout.\n2. Deadline: {deadline}.\n3. Service area: {service_area}.\n4. Payment is held in escrow and released when the Needer confirms satisfaction.\n5. Recurring schedule: {recurring_schedule}.`)
  const [saved, setSaved] = useState(null)
  useEffect(() => { if (data) setName(data.name) }, [data])
  useEffect(() => {
    const t = setTimeout(() => setSaved(new Date().toISOString()), 900)
    return () => clearTimeout(t)
  }, [body, name])
  const sample = { '{needer_name}': 'Aline Mukamana', '{partner_name}': 'CleanPro Rwanda', '{need_title}': 'Plumber to fix kitchen leak', '{price}': 'RWF 24,000', '{fee}': 'RWF 3,600', '{deadline}': '25 Oct 2026', '{service_area}': 'Kimihurura, Gasabo', '{recurring_schedule}': 'Not recurring' }
  const preview = PLACEHOLDERS.reduce((s, p) => s.split(p).join(sample[p]), body)
  return (
    <>
      <PageHeader back={{ to: '/admin/contracts', label: 'Contracts' }} title={id === 'new' ? 'New template' : `Edit · ${data?.name ?? ''}`} subtitle={saved ? `Autosaved ${formatDateTime(saved)}` : 'Autosave on'} actions={<Button variant="primary" onClick={() => toast('New version published', { description: 'Existing agreements keep their version.' })}><ScrollText size={16} /> Publish version</Button>} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <Field label="Template name">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
          <div>
            <p className="mb-2 text-sm font-semibold text-text">Insert placeholder</p>
            <div className="flex flex-wrap gap-1.5">{PLACEHOLDERS.map((p) => <button key={p} type="button" onClick={() => setBody((b) => `${b} ${p}`)} className="rounded-md bg-primary-100 px-2 py-1 font-mono text-xs text-primary hover:bg-border">{p}</button>)}</div>
          </div>
          <Field label="Body">{(p) => <Textarea {...p} rows={16} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-sm" />}</Field>
        </Card>
        <Card>
          <CardTitle sub="With sample data">Preview</CardTitle>
          <pre className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-text">{preview}</pre>
        </Card>
      </div>
    </>
  )
}
