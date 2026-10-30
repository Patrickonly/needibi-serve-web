import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, ArrowLeft, ArrowRight, Rocket, Image as ImageIcon, Video, Mic, Trash, Upload, Globe, Lock, UserRound, EyeOff, ClipboardList, Layers } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession } from '@/lib/hooks'
import { toast } from '@/lib/store'
import { readStorage, writeStorage } from '@/lib/storage'
import { formatMoney } from '@/lib/format'
import { CATEGORIES, NEEDERS, DISTRICTS } from '@/mocks/seed'
import { Button, Card, Field, Input, Textarea, Select, Checkbox, Avatar, Alert, Chip, RadioCards, CategoryImage, Segmented } from '@/design-system'
import { MoneyInput, VoiceRecorder, LocationFields, PhoneInput } from '@/components/forms/inputs'
import { suggestCategory } from './PostNeed'

import { useCategoryGroups, groupForCategory } from '@/lib/categoryGroups'

const TIMEFRAMES = ['Today', 'Within 3 days', 'This week', 'This month', 'Flexible']
const URGENCIES = [['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['urgent', 'Urgent']]
const FREQUENCIES = [['daily', 'Daily'], ['weekly', 'Weekly'], ['biweekly', 'Bi-weekly'], ['monthly', 'Monthly']]
const STEPS = ['What do you need?', 'Pick a category', 'Where & when?', 'Budget & type', 'Add media', 'Privacy & review']
const MB = 1024 * 1024
const SLOTS = [
  { kind: 'image', label: 'Photo', icon: ImageIcon, accept: 'image/jpeg,image/png,image/webp,image/gif', max: 5, help: 'JPG, PNG, WEBP or GIF, up to 5 MB', capture: 'environment' },
  { kind: 'video', label: 'Video', icon: Video, accept: 'video/mp4,video/webm,video/quicktime,.m4v', max: 100, help: 'MP4, WEBM, MOV or M4V, up to 100 MB' },
  { kind: 'audio', label: 'Voice note', icon: Mic, accept: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/aac,.m4a', max: 30, help: 'MP3, M4A, WAV, OGG or AAC, up to 30 MB' },
]

function RequestTypeChoice({ onBundle }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-text">What are you posting?</p>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Request type">
        <button type="button" role="radio" aria-checked="true" className="request-type-card request-type-card-active">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/90 text-action-fg"><ClipboardList size={20} /></span>
          <span className="min-w-0 text-left"><strong className="block text-sm text-white">Need</strong><span className="block text-xs text-white/80">One service request from one provider</span></span>
        </button>
        <button type="button" role="radio" aria-checked="false" onClick={onBundle} className="request-type-card">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-yellow-soft text-brand-yellow-fg"><Layers size={20} /></span>
          <span className="min-w-0 text-left"><strong className="block text-sm text-text">Bundle</strong><span className="block text-xs text-muted">Group several needs together</span></span>
        </button>
      </div>
    </div>
  )
}

function LocationComponent({ value, onChange, error }) {
  return (
    <section className="space-y-3 rounded-2xl border border-action-500/20 bg-action-soft/30 p-4" aria-labelledby="need-location-heading">
      <div>
        <h3 id="need-location-heading" className="font-semibold text-text">Location</h3>
        <p className="mt-0.5 text-xs text-muted">Where should the provider deliver this service?</p>
      </div>
      <LocationFields value={value} onChange={onChange} />
      {error && <p role="alert" className="text-sm font-medium text-danger-fg">{error}</p>}
    </section>
  )
}

const DEFAULTS = {
  description: '', category: '', subtype: '', serviceArea: { district: 'Gasabo', sector: 'Kimihurura' },
  timeframe: 'This week', urgency: 'medium', budget: null, recurring: false, frequency: 'weekly', cycles: '', schedule: '',
  anonymous: false, visibility: 'public',
}

function MediaSlot({ slot, file, onPick, onClear }) {
  const ref = useRef(null)
  const [error, setError] = useState('')
  const Icon = slot.icon
  const choose = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > slot.max * MB) {
      setError(`${slot.kind === 'audio' ? 'Audio' : slot.label} must be ${slot.max}MB or smaller.`)
      return
    }
    setError('')
    onPick({ id: `${slot.kind}-${Date.now()}`, kind: slot.kind, name: f.name, url: URL.createObjectURL(f), file: f })
  }
  return (
    <div className={cn('rounded-card border p-4', file ? 'border-action-500 bg-action-soft/40' : 'border-border bg-surface')}>
      <div className="flex items-center gap-3">
        {file && slot.kind === 'image' ? (
          <img src={file.url} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted"><Icon size={22} aria-hidden="true" /></span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">{slot.label}</p>
          <p className="truncate text-xs text-muted">{file ? file.name : slot.help}</p>
        </div>
        <input ref={ref} type="file" accept={slot.accept} capture={slot.capture} className="sr-only" onChange={choose} aria-label={`Choose ${slot.label.toLowerCase()}`} />
        {file && (
          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${slot.label.toLowerCase()}`} onClick={onClear}><Trash size={16} /></Button>
        )}
        <Button variant="secondary" size="sm" onClick={() => ref.current?.click()}><Upload size={14} /> {file ? 'Change' : 'Choose'}</Button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-danger-fg">{error}</p>}
    </div>
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

/** Six-step wizard for posting a need. Also used for re-request (`from`) and edit (`edit`). */
export function PostNeed({ onBehalf }) {
  const { user } = useSession()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [sp] = useSearchParams()
  const from = sp.get('from')
  const edit = sp.get('edit')
  const draftKey = `ns-draft-need6:${user.id}`
  const [step, setStep] = useState(0)
  const [tried, setTried] = useState(false)
  const [d, setD] = useState(() => ({ ...DEFAULTS, ...(!from && !edit ? readStorage(draftKey, {}) : {}) }))
  const [media, setMedia] = useState({})
  const [voice, setVoice] = useState(null)
  const [forWhom, setForWhom] = useState(NEEDERS[5].id)
  const [person, setPerson] = useState(null)
  const [who, setWho] = useState({ mode: 'existing', name: '', phone: '', email: '', district: 'Gasabo', sector: DISTRICTS.Gasabo[0], consent: false })
  const setWhoField = (patch) => setWho((w) => ({ ...w, ...patch }))
  const whoReady = who.consent && (who.mode === 'existing' || (who.name.trim().split(/\s+/).filter(Boolean).length >= 2 && who.phone.length === 9 && (!who.email.trim() || /^\S+@\S+\.\S+$/.test(who.email.trim()))))
  const confirmWho = () => {
    if (who.mode === 'existing') return setPerson(NEEDERS.find((n) => n.id === forWhom))
    setPerson({ id: `u-new-${Date.now()}`, name: who.name.trim(), phone: who.phone, email: who.email.trim(), district: who.district, sector: who.sector, isNew: true })
  }
  const set = (patch) => setD((x) => ({ ...x, ...patch }))

  const source = useQuery({ queryKey: ['needs', from ?? edit], queryFn: () => api.one('needs', from ?? edit), enabled: !!(from || edit) })
  useEffect(() => {
    const s = source.data
    if (!s) return
    setD({
      ...DEFAULTS, description: s.description || s.title || '', category: s.category ?? '', subtype: s.subtype ?? '',
      serviceArea: s.serviceArea ?? DEFAULTS.serviceArea, timeframe: s.timeframe ?? 'This week', urgency: s.urgency ?? 'medium',
      budget: s.budget?.amount ?? null, recurring: !!s.recurring, frequency: s.recurrence?.frequency ?? 'weekly',
      cycles: s.recurrence?.cycles ?? '', schedule: s.recurrence?.schedule ?? '', anonymous: !!s.anonymous, visibility: s.visibility ?? 'public',
    })
  }, [source.data])

  useEffect(() => {
    if (from || edit) return
    const t = setTimeout(() => writeStorage(draftKey, d), 400)
    return () => clearTimeout(t)
  }, [d, from, edit, draftKey])

  const cat = CATEGORIES.find((c) => c.slug === d.category)
  const suggested = useMemo(() => suggestCategory(d.description), [d.description])
  const groups = useCategoryGroups((s) => s.groups)
  const [pickedGroup, setPickedGroup] = useState('')
  const groupId = pickedGroup || groupForCategory(groups, d.category)
  const group = groups.find((g) => g.id === groupId)
  const groupCats = groups.length === 0 ? CATEGORIES : group ? CATEGORIES.filter((c) => group.categories.includes(c.slug)) : []
  const mediaList = [voice, media.image, media.video, media.audio].filter(Boolean)

  const errors = [
    d.description.trim().length < 10 ? 'Describe your need in a few words (10+ characters)' : '',
    '',
    !d.serviceArea?.district ? 'Choose where you need it' : '',
    d.budget == null ? 'Enter a budget (0 if unsure)' : d.budget < 0 ? 'Enter a valid amount' : d.recurring && !(Number(d.cycles) >= 1) ? 'Enter a positive number of cycles' : d.recurring && !d.schedule.trim() ? 'Tell providers when suits you' : '',
    '',
    '',
  ]
  const err = errors[step]

  const publish = useMutation({
    mutationFn: () => {
      const clean = d.description.replace(/\s+/g, ' ').trim()
      const title = clean.length > 90 ? `${clean.slice(0, 87).replace(/\s\S*$/, '')}…` : clean
      const values = {
        title, description: d.description.trim(), category: d.category, subtype: d.subtype, quantity: 1, specs: {},
        serviceArea: d.serviceArea, timeframe: d.timeframe, urgency: d.urgency, recurring: d.recurring,
        recurrence: d.recurring ? { frequency: d.frequency, cycles: Number(d.cycles), schedule: d.schedule.trim(), days: [], time: '' } : undefined,
        negotiable: true, language: 'en', visibility: d.visibility, anonymous: d.anonymous, priority: false,
      }
      const money = { amount: d.budget, currency: 'RWF' }
      if (edit) return api.update('needs', edit, { ...values, budget: money, status: 'under_review' }).then((r) => ({ ...r, code: edit }))
      const poster = onBehalf ? person : user
      const files = mediaList.map((m) => ({ id: m.id, kind: m.kind, url: m.url, cat: d.category }))
      return api.post('/api/needs', {
        ...values, kind: 'need', categoryName: cat?.name, budget: money, posterId: poster.id,
        posterName: `${poster.name.split(' ')[0]} ${poster.name.split(' ')[1]?.[0] ?? ''}.`, media: files,
        onBehalfOf: onBehalf ? user.id : undefined, district: d.serviceArea.district,
        ...(onBehalf ? { neederProfile: { name: poster.name, phone: poster.phone, email: poster.email, district: poster.district, sector: poster.sector, registeredByAgent: !!poster.isNew, consentRecorded: true, consentRecordedAt: new Date().toISOString(), source: 'agent_assisted_registration' } } : {}),
      })
    },
    onSuccess: (res) => {
      writeStorage(draftKey, {})
      qc.invalidateQueries({ queryKey: ['needs'] })
      qc.invalidateQueries({ queryKey: ['agentNeeders'] })
      if (edit) toast('Changes saved')
      navigate(onBehalf ? '/app/agent/needers' : `/app/needer/post/success/${res.code}`, { replace: true })
    },
  })

  const next = () => {
    setTried(true)
    if (err) return
    setTried(false)
    if (step === 0 && !d.category && suggested) set({ category: suggested })
    setStep((s) => s + 1)
  }
  const back = () => { setTried(false); setStep((s) => s - 1) }
  const last = step === STEPS.length - 1

  if (onBehalf && !edit && !person) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => navigate(-1)}><X size={18} /></Button>
          <h1 className="font-display text-lg font-extrabold text-text">Ask on behalf</h1>
        </div>
        <Card className="space-y-6 rounded-3xl border-0 p-5 shadow-card ring-1 ring-border sm:p-8">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-action-fg">Before you start</p>
            <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-text">Who is this for?</h2>
            <p className="mt-1 text-sm text-muted">We keep the same details for every customer, so Partners and our team can reach them, serve the request and resolve any dispute.</p>
          </header>
          <Segmented
            label="Customer"
            className="w-full sm:w-auto"
            value={who.mode}
            onChange={(mode) => setWhoField({ mode })}
            options={[{ value: 'existing', label: 'Someone I help' }, { value: 'new', label: 'New customer' }]}
          />
          {who.mode === 'existing' ? (
            <Field label="Customer">
              {(p) => <Select {...p} value={forWhom} onChange={(e) => setForWhom(e.target.value)}>{NEEDERS.map((n) => <option key={n.id} value={n.id}>{n.name} · {n.district}</option>)}</Select>}
            </Field>
          ) : (
            <div className="space-y-5">
              <Field label="Full name" hint="First and last name, as on their ID.">{(p) => <Input {...p} autoComplete="off" placeholder="e.g. Aline Mukamana" value={who.name} onChange={(e) => setWhoField({ name: e.target.value })} />}</Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Phone number" hint="Used to verify them. Never shown publicly.">{(p) => <PhoneInput {...p} value={who.phone} onChange={(v) => setWhoField({ phone: v?.target ? v.target.value : v })} />}</Field>
                <Field label="Email" optional>{(p) => <Input {...p} type="email" autoComplete="off" placeholder="name@example.rw" value={who.email} onChange={(e) => setWhoField({ email: e.target.value })} />}</Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="District">{(p) => <Select {...p} value={who.district} onChange={(e) => setWhoField({ district: e.target.value, sector: DISTRICTS[e.target.value][0] })}>{Object.keys(DISTRICTS).map((x) => <option key={x}>{x}</option>)}</Select>}</Field>
                <Field label="Sector">{(p) => <Select {...p} value={who.sector} onChange={(e) => setWhoField({ sector: e.target.value })}>{DISTRICTS[who.district].map((x) => <option key={x}>{x}</option>)}</Select>}</Field>
              </div>
            </div>
          )}
          <Checkbox checked={who.consent} onChange={(v) => setWhoField({ consent: !!v })} label="This person has agreed to me asking for this service and keeping their details on their behalf." />
        </Card>
        <div className="sticky bottom-0 -mx-1 mt-5 flex items-center justify-end gap-3 bg-bg/90 px-1 py-3 backdrop-blur">
          <Button variant="primary" size="lg" disabled={!whoReady} onClick={confirmWho}>Continue <ArrowRight size={16} /></Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={() => navigate(-1)}><X size={18} /></Button>
        <h1 className="font-display text-lg font-extrabold border-l-4 border-brand-yellow pl-3 text-text">{edit ? 'Edit need' : 'Post a need'}</h1>
      </div>
      <ol className="mb-6 flex items-center gap-1.5" role="progressbar" aria-valuemin={1} aria-valuemax={6} aria-valuenow={step + 1} aria-label={`Step ${step + 1} of 6: ${STEPS[step]}`}>
        {STEPS.map((s, i) => (
          <li key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <span className={cn('block h-full rounded-full bg-action-600 transition-all duration-300', i <= step ? 'w-full' : 'w-0')} />
          </li>
        ))}
      </ol>

      {onBehalf && person && (
        <div className="mb-5 flex items-center gap-3 rounded-card border border-border bg-surface p-3">
          <Avatar name={person.name} hue={person.avatarHue ?? 30} size={36} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text">Asking for {person.name}{person.isNew && ' (new customer)'}</p>
            <p className="truncate text-xs text-muted">{[person.sector, person.district].filter(Boolean).join(', ')}</p>
          </div>
          <Button size="xs" variant="ghost" onClick={() => setPerson(null)}>Change</Button>
        </div>
      )}
      {from && <Alert tone="info" className="mb-5">Everything is editable. This posts a new need; any earlier agreed price is not reused.</Alert>}

      <Card key={step} className="animate-slide-in-right space-y-6 rounded-3xl border-0 p-5 shadow-card ring-1 ring-border sm:p-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-action-fg">Step {step + 1} of 6</p>
          <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-text">{STEPS[step]}</h2>
        </header>

        {step === 0 && (
          <>
            {!edit && <RequestTypeChoice onBundle={() => navigate('/app/needer/bundles/new')} />}
            <Field label="Description" error={tried ? err : ''} hint="Tip: the first 120 characters become the title.">
              {(p) => <Textarea {...p} rows={6} maxLength={2000} value={d.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. I need a plumber to fix a leaking kitchen sink in Kimironko this weekend." />}
            </Field>
            <LocationComponent value={d.serviceArea} onChange={(v) => set({ serviceArea: v })} error={tried && !d.serviceArea?.district ? 'Choose where you need it' : ''} />
            {!edit && <VoiceRecorder value={voice} onChange={(m) => { setVoice(m); if (m && !d.description) set({ description: 'Voice note: please listen for details.' }) }} />}
          </>
        )}

        {step === 1 && (
          <>
            <p className="text-sm text-muted">First choose what kind of thing you need, then the closest category and service. Optional — if you skip, we file it under “Others”.</p>
            {suggested && suggested !== d.category && (
              <button type="button" onClick={() => { setPickedGroup(groupForCategory(groups, suggested)); set({ category: suggested, subtype: '' }) }} className="rounded-full bg-action-soft px-3 py-1 text-xs font-semibold text-action-fg">
                Suggested: {CATEGORIES.find((c) => c.slug === suggested)?.name}
              </button>
            )}
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
            {groups.length > 0 && !group && <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">Choose a group above to see its categories.</p>}
            {groups.length > 0 && group && groupCats.length === 0 && <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">No categories in {group.name} yet. Pick another group, or skip and we file it under “Others”.</p>}
            {groupCats.length > 0 && groups.length > 0 && <p className="text-sm font-semibold text-text">2. Pick a category</p>}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Category">
              {groupCats.map((c, i) => {
                const on = d.category === c.slug
                return (
                  <button key={c.slug} type="button" role="radio" aria-checked={on} onClick={() => set({ category: on ? '' : c.slug, subtype: '' })}
                    className={cn('group overflow-hidden rounded-2xl border-2 bg-surface text-left transition hover:-translate-y-0.5 hover:shadow-card', on ? 'border-action-600 ring-2 ring-action-600/20' : 'border-border')}>
                    <span className="block h-20 overflow-hidden"><CategoryImage category={c.slug} label="" className="transition-transform duration-300 group-hover:scale-105" /></span>
                    <span className={cn('block px-3 py-2 text-sm font-semibold leading-tight', on ? 'bg-action-soft text-action-fg' : 'text-text')}>{c.name}</span>
                  </button>
                )
              })}
            </div>
            {cat && (
              <div>
                <p className="mb-2 text-sm font-semibold text-text">Service</p>
                <div className="flex flex-wrap gap-2">
                  {cat.subtypes.map((s) => <Chip key={s} active={d.subtype === s} onClick={() => set({ subtype: d.subtype === s ? '' : s })}>{s}</Chip>)}
                </div>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <LocationComponent value={d.serviceArea} onChange={(v) => set({ serviceArea: v })} error={tried ? err : ''} />
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

        {step === 3 && (
          <>
            <Field label="Budget" error={tried && err && d.budget == null ? err : ''} hint="Enter 0 if you are unsure. Providers send their own prices.">
              {(p) => <MoneyInput {...p} size="lg" value={d.budget ?? ''} onChange={(v) => set({ budget: v === '' || v == null ? null : Number(v) })} />}
            </Field>
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Type</p>
              <div className="flex flex-wrap gap-2">
                <Chip active={!d.recurring} onClick={() => set({ recurring: false })}>One-Time Need</Chip>
                <Chip active={d.recurring} onClick={() => set({ recurring: true })}>Recurring Need</Chip>
              </div>
            </div>
            {d.recurring && (
              <div className="space-y-4 rounded-card bg-surface-2 p-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-text">How often?</p>
                  <div className="flex flex-wrap gap-2">{FREQUENCIES.map(([v, l]) => <Chip key={v} active={d.frequency === v} onClick={() => set({ frequency: v })}>{l}</Chip>)}</div>
                </div>
                <Field label="For how many cycles?">{(p) => <Input {...p} type="number" min="1" value={d.cycles} onChange={(e) => set({ cycles: e.target.value })} placeholder="e.g. 4" />}</Field>
                <Field label="Preferred schedule">{(p) => <Input {...p} value={d.schedule} onChange={(e) => set({ schedule: e.target.value })} placeholder="e.g. Saturdays, 9am–12pm" />}</Field>
                {tried && err && d.budget != null && <p role="alert" className="text-sm font-medium text-danger-fg">{err}</p>}
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            {edit ? (
              <Alert tone="info">Media cannot be changed after posting. Edit the text details, or post a new need with different media.</Alert>
            ) : (
              <>
                <p className="text-sm text-muted">All optional. One photo, one video and one audio clip.</p>
                {SLOTS.map((s) => (
                  <MediaSlot key={s.kind} slot={s} file={media[s.kind]} onPick={(f) => setMedia((m) => ({ ...m, [s.kind]: f }))} onClear={() => setMedia((m) => ({ ...m, [s.kind]: undefined }))} />
                ))}
              </>
            )}
          </>
        )}

        {step === 5 && (
          <>
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Publish as</p>
              <RadioCards
                name="publish-as"
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
            <dl className="divide-y divide-border rounded-card border border-border px-4">
              <SummaryRow k="Need">{d.description.trim().slice(0, 60)}{d.description.trim().length > 60 && '…'}</SummaryRow>
              <SummaryRow k="Category">{cat ? `${cat.name}${d.subtype ? ` › ${d.subtype}` : ''}` : 'Others'}</SummaryRow>
              <SummaryRow k="Location">{[d.serviceArea?.sector, d.serviceArea?.district].filter(Boolean).join(', ')}</SummaryRow>
              <SummaryRow k="When">{d.timeframe}</SummaryRow>
              <SummaryRow k="Urgency">{URGENCIES.find(([v]) => v === d.urgency)?.[1]}</SummaryRow>
              <SummaryRow k="Budget">{formatMoney(d.budget ?? 0)}</SummaryRow>
              <SummaryRow k="Type">{d.recurring ? `Recurring Need · ${FREQUENCIES.find(([v]) => v === d.frequency)?.[1]} × ${d.cycles}` : 'One-Time Need'}</SummaryRow>
              <SummaryRow k="Media">{mediaList.length ? mediaList.map((m) => ({ image: 'Photo', video: 'Video', audio: 'Audio' }[m.kind] ?? 'Audio')).join(', ') : 'None'}</SummaryRow>
              <SummaryRow k="Publish as">{d.anonymous ? 'Anonymous' : 'My identity'}</SummaryRow>
            </dl>
            {publish.isError && <Alert tone="danger">{publish.error?.message || 'Could not post your need. Please try again.'}</Alert>}
          </>
        )}
      </Card>

      <div className="sticky bottom-0 -mx-1 mt-5 flex items-center justify-between gap-3 bg-bg/90 px-1 py-3 backdrop-blur">
        {step > 0 ? <Button variant="secondary" onClick={back} disabled={publish.isPending}><ArrowLeft size={16} /> Back</Button> : <span />}
        {last ? (
          <Button variant="primary" size="lg" loading={publish.isPending} onClick={() => publish.mutate()}><Rocket size={18} /> {edit ? 'Save changes' : 'Submit need'}</Button>
        ) : (
          <Button variant="primary" size="lg" onClick={next}>Continue <ArrowRight size={16} /></Button>
        )}
      </div>
    </div>
  )
}
