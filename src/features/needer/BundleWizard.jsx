import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, ArrowLeft, ArrowRight, Rocket, Plus, Trash, Pencil, Globe, Lock, UserRound, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession } from '@/lib/hooks'
import { toast } from '@/lib/store'
import { formatMoney } from '@/lib/format'
import { CATEGORIES } from '@/mocks/seed'
import { useCategoryGroups, groupForCategory } from '@/lib/categoryGroups'


import { Button, Card, Field, Input, Textarea, Alert, Chip, RadioCards, Checkbox, Dialog, Badge, CategoryImage } from '@/design-system'
import { MoneyInput, LocationFields } from '@/components/forms/inputs'

const TIMEFRAMES = ['Today', 'Within 3 days', 'This week', 'This month', 'Flexible']
const URGENCIES = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['urgent', 'Urgent']]
const FREQUENCIES = [['daily', 'Daily'], ['weekly', 'Weekly'], ['biweekly', 'Bi-weekly'], ['monthly', 'Monthly']]
const STEPS = ['Name your bundle', 'Add the needs', 'Pick a category', 'Where & when?', 'Budget & type', 'Privacy & review']
const EMPTY_DRAFT = { text: '', place: { district: 'Gasabo', sector: 'Kimihurura' }, budget: null, recurring: false, frequency: 'weekly' }
let seq = 0

function DraftDialog({ open, initial, onClose, onSave }) {
  const [x, setX] = useState(initial ?? EMPTY_DRAFT)
  const [tried, setTried] = useState(false)
  useEffect(() => { if (open) { setX(initial ?? EMPTY_DRAFT); setTried(false) } }, [open, initial])
  const bad = x.text.trim().length < 10 ? 'Describe your need in a few words (10+ characters)' : x.budget == null ? 'Enter a budget (0 if unsure)' : ''
  const save = () => { setTried(true); if (!bad) onSave(x) }
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={initial ? 'Edit need' : 'Add a need'}
      size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>{initial ? 'Save changes' : 'Add to bundle'}</Button></>}
    >
      <div className="space-y-4">
        <Field label="Description" error={tried && x.text.trim().length < 10 ? bad : ''}>
          {(p) => <Textarea {...p} rows={4} maxLength={2000} value={x.text} onChange={(e) => setX({ ...x, text: e.target.value })} placeholder="e.g. I need a plumber to fix a leaking kitchen sink in Kimironko this weekend." />}
        </Field>
        <LocationFields value={x.place} onChange={(place) => setX({ ...x, place })} />
        <Field label="Budget" error={tried && x.budget == null ? bad : ''}>
          {(p) => <MoneyInput {...p} value={x.budget ?? ''} onChange={(v) => setX({ ...x, budget: v === '' || v == null ? null : Number(v) })} />}
        </Field>
        <div className="flex flex-wrap gap-2">
          <Chip active={!x.recurring} onClick={() => setX({ ...x, recurring: false })}>One-Time Need</Chip>
          <Chip active={x.recurring} onClick={() => setX({ ...x, recurring: true })}>Recurring Need</Chip>
        </div>
        {x.recurring && <div className="flex flex-wrap gap-2">{FREQUENCIES.map(([v, l]) => <Chip key={v} active={x.frequency === v} onClick={() => setX({ ...x, frequency: v })}>{l}</Chip>)}</div>}
      </div>
    </Dialog>
  )
}

function SummaryRow({ k, children }) {
  return (
    <div className="flex gap-4 py-2.5 text-sm">
      <dt className="w-28 shrink-0 text-muted">{k}</dt>
      <dd className="min-w-0 flex-1 font-medium text-text">{children}</dd>
    </div>
  )
}

/** Six-step wizard for creating a bundle of needs. */
export function BundleBuilder() {
  const { user } = useSession()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [sp] = useSearchParams()
  const [step, setStep] = useState(0)
  const [tried, setTried] = useState(false)
  const [d, setD] = useState({
    name: sp.get('template') ?? '', goal: '', description: '', category: '', subtype: '',
    place: { district: user.district ?? 'Gasabo', sector: user.sector ?? '' }, timeframe: 'This week', urgency: 'medium',
    budget: null, recurring: false, frequency: 'monthly', anonymous: false, visibility: 'public',
  })
  const [budgetTouched, setBudgetTouched] = useState(false)
  const [drafts, setDrafts] = useState([])
  const [picked, setPicked] = useState([])
  const [editing, setEditing] = useState(null)
  const set = (patch) => setD((x) => ({ ...x, ...patch }))

  const mine = useQuery({ queryKey: ['needs', 'mine-open', user.id], queryFn: () => api.list('needs', { posterId: user.id, pageSize: 50, sort: '-createdAt' }) })
  const existing = (mine.data?.data ?? mine.data?.items ?? []).filter((n) => !['problem', 'done', 'closed', 'archived', 'disputed', 'rejected', 'cancelled', 'expired', 'completed', 'delivered'].includes(n.status))
  const pickedNeeds = existing.filter((n) => picked.includes(n.id))

  const sum = drafts.reduce((s, x) => s + (x.budget || 0), 0) + pickedNeeds.reduce((s, n) => s + (n.budget?.amount || 0), 0)
  const budget = budgetTouched ? d.budget : sum
  const cat = CATEGORIES.find((c) => c.slug === d.category)
  const groups = useCategoryGroups((s) => s.groups)
  const [pickedGroup, setPickedGroup] = useState('')
  const groupId = pickedGroup || groupForCategory(groups, d.category)
  const group = groups.find((g) => g.id === groupId)
  const groupCats = groups.length === 0 ? CATEGORIES : group ? CATEGORIES.filter((c) => group.categories.includes(c.slug)) : []

  const errors = [
    d.name.trim() ? '' : 'Give it a name',
    drafts.length + picked.length ? '' : 'Add at least one need or item.',
    '',
    d.place?.district ? '' : 'Choose where you need it',
    budget == null ? 'Enter a budget (0 if unsure)' : '',
    '',
  ]
  const err = errors[step]

  const publish = useMutation({
    mutationFn: () => {
      const items = [
        ...drafts.map((x, k) => ({ id: `bi-new-${k}`, title: x.text.trim().slice(0, 90), quantity: 1, budget: { amount: x.budget, currency: 'RWF' }, urgency: d.urgency, recurring: x.recurring, status: 'matching', offers: 0 })),
        ...pickedNeeds.map((n) => ({ id: `bi-${n.id}`, title: n.title, quantity: 1, budget: n.budget ?? { amount: 0, currency: 'RWF' }, urgency: n.urgency ?? d.urgency, recurring: !!n.recurring, status: n.status, offers: 0 })),
      ]
      return api.post('/api/needs', {
        kind: 'bundle', title: d.name.trim(), goal: d.goal.trim(), description: d.description.trim(), category: d.category || 'custom-solutions',
        subtype: d.subtype, items, allowPartial: true, serviceArea: d.place, timeframe: d.timeframe, urgency: d.urgency,
        totalBudget: { amount: budget, currency: 'RWF' }, recurring: d.recurring, recurrence: d.recurring ? { frequency: d.frequency } : undefined,
        visibility: d.visibility, anonymous: d.anonymous, posterId: user.id, posterName: `${user.firstName} ${user.name.split(' ')[1]?.[0] ?? ''}.`,
        media: [{ id: 'cover', kind: 'image', url: '', cat: d.category || 'custom-solutions' }],
      })
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['bundles'] })
      qc.invalidateQueries({ queryKey: ['needs'] })
      toast('Bundle published')
      navigate(`/app/needer/post/success/${r.code}`, { replace: true })
    },
  })

  const next = () => { setTried(true); if (err) return; setTried(false); setStep((s) => s + 1) }
  const back = () => { setTried(false); setStep((s) => s - 1) }
  const last = step === STEPS.length - 1
  const saveDraft = (x) => {
    setDrafts((l) => (editing?.id ? l.map((y) => (y.id === editing.id ? { ...x, id: y.id } : y)) : [...l, { ...x, id: `d${++seq}` }]))
    setEditing(null)
    toast('Need added to the bundle.')
  }
  const shown = tried ? err : ''
  const recurringLabel = useMemo(() => FREQUENCIES.find(([v]) => v === d.frequency)?.[1], [d.frequency])

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => navigate(-1)}><X size={18} /></Button>
        <h1 className="font-display text-lg font-extrabold border-l-4 border-brand-yellow pl-3 text-text">Create a bundle</h1>
      </div>
      <ol className="mb-6 flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of 6: ${STEPS[step]}`}>
        {STEPS.map((s, i) => (
          <li key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <span className={cn('block h-full rounded-full bg-action-600 transition-all duration-300', i <= step ? 'w-full' : 'w-0')} />
          </li>
        ))}
      </ol>

      <Card key={step} className="animate-slide-in-right space-y-6 rounded-3xl border-0 p-5 shadow-card ring-1 ring-border sm:p-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-action-fg">Step {step + 1} of 6</p>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-text">{STEPS[step]}</h2>
        </header>

        {step === 0 && (
          <>
            <Field label="Bundle name" error={shown}>{(p) => <Input {...p} value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Moving to Kicukiro" />}</Field>
            <Field label="Goal" optional>{(p) => <Input {...p} value={d.goal} onChange={(e) => set({ goal: e.target.value })} placeholder="e.g. Be fully moved in by 30 Nov" />}</Field>
            <Field label="Description" optional hint="Tip: describe the bigger picture. You add each need in the next step.">
              {(p) => <Textarea {...p} rows={5} maxLength={2000} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. We are moving into a 2-bedroom flat and need furniture, internet and a deep clean before we arrive." />}
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-muted">Add each need with its description, place, budget and whether it repeats.</p>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text">Needs in this bundle</h3>
              <Badge tone="grey">{drafts.length + picked.length}</Badge>
            </div>
            <ol className="space-y-2">
              {drafts.map((x, k) => (
                <li key={x.id} className="flex items-center gap-3 rounded-card border border-border bg-surface p-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-muted">{k + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">{x.text}</p>
                    <p className="truncate text-xs text-muted">{x.place?.district} · {formatMoney(x.budget ?? 0)} · {x.recurring ? `Recurring · ${FREQUENCIES.find(([v]) => v === x.frequency)?.[1]}` : 'One-time'}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit need ${k + 1}`} onClick={() => setEditing(x)}><Pencil size={15} /></Button>
                  <Button variant="ghost" size="icon-sm" aria-label={`Remove need ${k + 1}`} onClick={() => setDrafts((l) => l.filter((y) => y.id !== x.id))}><Trash size={15} /></Button>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => setEditing({ ...EMPTY_DRAFT, id: undefined, _new: true })} className="flex w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-strong py-4 text-sm font-semibold text-muted transition-colors hover:border-action-500 hover:text-text">
              <Plus size={16} /> Add need
            </button>
            {existing.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-text">Or add needs you already posted</p>
                <div className="max-h-64 divide-y divide-border overflow-y-auto rounded-card border border-border px-3">
                  {existing.map((n) => (
                    <div key={n.id} className="flex items-center justify-between gap-3 py-2.5">
                      <Checkbox checked={picked.includes(n.id)} onChange={(c) => setPicked((l) => (c ? [...l, n.id] : l.filter((i) => i !== n.id)))} label={n.title} />
                      <Badge tone="grey">{String(n.status).replace(/_/g, ' ')}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tried && err && <p role="alert" className="text-sm font-medium text-danger-fg">{err}</p>}
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-muted">First choose the main category, then the closest category and service. Optional — if you skip, we file it under “Others”.</p>
            {groups.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-text">1. Main category: what kind of need is it?</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Main category">
                  {groups.map((g, i) => (
                    <button key={g.id} type="button" role="radio" aria-checked={groupId === g.id} onClick={() => { setPickedGroup(g.id); if (!g.categories.includes(d.category)) set({ category: '', subtype: '' }) }}
                      className={cn('rounded-2xl border-2 bg-surface px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:shadow-card', groupId === g.id ? 'border-action-600 ring-2 ring-action-600/20' : 'border-border')}>
                      <span className="block font-display text-base font-bold text-text">{g.name}</span>
                      <span className="mt-0.5 block text-xs text-muted">{g.categories.length} {g.categories.length === 1 ? 'category' : 'categories'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {groups.length > 0 && !group && <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">Choose a main category above to see its categories.</p>}
            {groups.length > 0 && group && groupCats.length === 0 && <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">No categories in {group.name} yet. Pick another, or skip and we file it under “Others”.</p>}
            {groupCats.length > 0 && groups.length > 0 && <p className="text-sm font-semibold text-text">2. Pick a category</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Category">
              {groupCats.map((c, i) => {
                const on = d.category === c.slug
                return (
                  <button key={c.slug} type="button" role="radio" aria-checked={on} onClick={() => set({ category: on ? '' : c.slug, subtype: '' })}
                    className={cn('group overflow-hidden rounded-2xl border-2 bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-card', on ? 'border-brand-yellow ring-2 ring-brand-yellow/40' : 'border-border hover:border-brand-yellow/70')}>
                    <span className="block h-20 overflow-hidden"><CategoryImage category={c.slug} label="" className="transition-transform duration-300 group-hover:scale-105" /></span>
                    <span className={cn('block px-3 py-2 text-sm font-semibold leading-tight', on ? 'bg-action-soft text-action-fg' : 'text-text')}>{c.name}</span>
                  </button>
                )
              })}
            </div>
            {cat && (
              <div className="flex flex-wrap gap-2">
                {cat.subtypes.map((s) => <Chip key={s} active={d.subtype === s} onClick={() => set({ subtype: d.subtype === s ? '' : s })}>{s}</Chip>)}
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <LocationFields value={d.place} onChange={(place) => set({ place })} />
            {shown && <p role="alert" className="text-sm font-medium text-danger-fg">{shown}</p>}
            <div>
              <p className="mb-2 text-sm font-semibold text-text">When do you need it?</p>
              <div className="flex flex-wrap gap-2">{TIMEFRAMES.map((t) => <Chip key={t} active={d.timeframe === t} onClick={() => set({ timeframe: t })}>{t}</Chip>)}</div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Urgency</p>
              <div className="flex flex-wrap gap-2">{URGENCIES.map(([v, l]) => <Chip key={v} active={d.urgency === v} onClick={() => set({ urgency: v })}>{l}</Chip>)}</div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <Field label="Total budget" error={shown} hint={sum > 0 ? `Your needs add up to ${formatMoney(sum)}.` : 'Enter 0 if you are unsure.'}>
              {(p) => <MoneyInput {...p} size="lg" value={budget ?? ''} onChange={(v) => { setBudgetTouched(true); set({ budget: v === '' || v == null ? null : Number(v) }) }} />}
            </Field>
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Type</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={!d.recurring} onClick={() => set({ recurring: false })}>One-Time Bundle</Chip>
                <Chip active={d.recurring} onClick={() => set({ recurring: true })}>Recurring Bundle</Chip>
              </div>
            </div>
            {d.recurring && (
              <div>
                <p className="mb-2 text-sm font-semibold text-text">How often?</p>
                <div className="flex flex-wrap gap-2">{FREQUENCIES.map(([v, l]) => <Chip key={v} active={d.frequency === v} onClick={() => set({ frequency: v })}>{l}</Chip>)}</div>
              </div>
            )}
            <Alert tone="info">{d.recurring ? 'The whole bundle repeats on this schedule. Needs marked recurring keep their own rhythm too.' : 'One-time bundles can still hold recurring needs; each keeps its own schedule.'}</Alert>
          </>
        )}

        {step === 5 && (
          <>
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Publish as</p>
              <RadioCards
                name="bundle-publish-as"
                value={d.anonymous ? 'anon' : 'me'}
                onChange={(v) => set({ anonymous: v === 'anon' })}
                options={[
                  { value: 'me', label: 'My identity', description: 'Providers see your name and photo.', icon: <UserRound size={18} /> },
                  { value: 'anon', label: 'Anonymous', description: 'Your name is hidden on the public feed.', icon: <EyeOff size={18} /> },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Visibility</p>
              <div className="flex gap-2">
                <Chip active={d.visibility === 'public'} onClick={() => set({ visibility: 'public' })}><Globe size={14} /> Public</Chip>
                <Chip active={d.visibility === 'private'} onClick={() => set({ visibility: 'private' })}><Lock size={14} /> Private</Chip>
              </div>
            </div>
            <dl className={cn('divide-y divide-border rounded-card border border-border px-4')}>
              <SummaryRow k="Bundle">{d.name}</SummaryRow>
              {d.goal && <SummaryRow k="Goal">{d.goal}</SummaryRow>}
              <SummaryRow k="Category">{cat ? `${cat.name}${d.subtype ? ` › ${d.subtype}` : ''}` : 'Others'}</SummaryRow>
              <SummaryRow k="Location">{[d.place?.sector, d.place?.district].filter(Boolean).join(', ')}</SummaryRow>
              <SummaryRow k="When">{d.timeframe}</SummaryRow>
              <SummaryRow k="Budget">{formatMoney(budget ?? 0)}</SummaryRow>
              <SummaryRow k="Type">{d.recurring ? `Recurring · ${recurringLabel}` : 'One-Time'}</SummaryRow>
              <SummaryRow k="Publish as">{d.anonymous ? 'Anonymous' : 'My identity'}</SummaryRow>
            </dl>
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Needs in this bundle <Badge tone="grey">{drafts.length + picked.length}</Badge></p>
              <ul className="space-y-1.5 text-sm">
                {drafts.map((x, k) => <li key={x.id} className="truncate text-text">{k + 1}. {x.text}</li>)}
                {picked.length > 0 && <li className="text-muted">+ {picked.length} posted need{picked.length > 1 ? 's' : ''}</li>}
              </ul>
            </div>
            {publish.isError && <Alert tone="danger">{publish.error?.message || 'Could not publish your bundle. Please try again.'}</Alert>}
          </>
        )}
      </Card>

      <div className="sticky bottom-0 -mx-1 mt-5 flex items-center justify-between gap-3 bg-bg/90 px-1 py-3 backdrop-blur">
        {step > 0 ? <Button variant="secondary" onClick={back} disabled={publish.isPending}><ArrowLeft size={16} /> Back</Button> : <span />}
        {last ? (
          <Button variant="primary" size="lg" loading={publish.isPending} onClick={() => publish.mutate()}><Rocket size={18} /> Publish bundle</Button>
        ) : (
          <Button variant="primary" size="lg" onClick={next}>Continue <ArrowRight size={16} /></Button>
        )}
      </div>

      <DraftDialog open={!!editing} initial={editing?._new ? null : editing} onClose={() => setEditing(null)} onSave={saveDraft} />
    </div>
  )
}
