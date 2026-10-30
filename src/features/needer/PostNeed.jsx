import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Type, Mic, Image as ImageIcon, Sparkles, Layers, ClipboardList, ArrowLeft, ArrowRight, Rocket, Globe, Lock, UserRound, EyeOff, Share, Route, CircleCheck, Hourglass, Plus, Copy, Trash, GripVertical, ChevronUp, ChevronDown, Eye, UserCheck, Sofa, Heart, Briefcase, Sprout, Package } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession, useShare } from '@/lib/hooks'
import { toast } from '@/lib/store'
import { readStorage, writeStorage } from '@/lib/storage'
import { formatMoney } from '@/lib/format'
import { CATEGORIES, specFieldsFor, NEEDERS } from '@/mocks/seed'
import { Button, Card, Field, Input, Textarea, Select, Segmented, RadioCards, Switch, Checkbox, Alert, Badge, LifecycleStepper, Dialog, Avatar, VerifiedBadge, Rating, Skeleton, UrgencyBadge, Chip } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'
import { MoneyInput, FileUploader, VoiceRecorder, LocationFields } from '@/components/forms/inputs'
import { NeedCard, BundleCard } from '@/components/cards/NeedCard'

// ---------------------------------------------------------------- smart helpers
const KEYWORDS = {
  'home-furniture': ['plumb', 'leak', 'pipe', 'clean', 'paint', 'sofa', 'bed', 'furniture', 'electric', 'roof', 'wall', 'mason', 'move', 'carpent', 'wardrobe'],
  automotive: ['car', 'vehicle', 'brake', 'tyre', 'driver', 'moto', 'battery', 'rav4', 'toyota', 'airport'],
  'food-catering': ['cater', 'food', 'cake', 'lunch', 'chef', 'brochette', 'buffet', 'meal'],
  'real-estate': ['apartment', 'house', 'rent', 'office space', 'land', 'plot', 'studio'],
  electronics: ['phone', 'laptop', 'screen', 'solar', 'tv', 'wifi', 'iphone', 'computer'],
  beauty: ['hair', 'make-up', 'makeup', 'braid', 'nail', 'barber', 'massage', 'spa'],
  education: ['tutor', 'lesson', 'class', 'course', 'teach', 'french', 'math'],
  health: ['nurse', 'physio', 'doctor', 'blood', 'pharmacy', 'health'],
  'professional-talent': ['account', 'lawyer', 'logo', 'design', 'photograph', 'website', 'translat'],
  'travel-tourism': ['safari', 'gorilla', 'trip', 'tour', 'hotel', 'kivu', 'akagera'],
  agriculture: ['farm', 'seed', 'fertil', 'harvest', 'cow', 'irrigat', 'maize', 'bean'],
  services: ['guard', 'security', 'laundry', 'garden', 'fumigat', 'pest', 'deliver'],
  'custom-solutions': ['event', 'party', 'wedding', 'uniform', 'kiosk', 'set up', 'set-up'],
}
export function suggestCategory(text = '') {
  const t = text.toLowerCase()
  let best = null
  let score = 0
  Object.entries(KEYWORDS).forEach(([slug, words]) => {
    const s = words.filter((w) => t.includes(w)).length
    if (s > score) {
      score = s
      best = slug
    }
  })
  return best
}
function suggestTitle(text = '') {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length < 8) return ''
  const first = clean.split(/[.!?]/)[0]
  const t = first.length > 60 ? `${first.slice(0, 57).replace(/\s\S*$/, '')}…` : first
  return t[0].toUpperCase() + t.slice(1)
}
const GUIDANCE = (slug) => {
  const base = { 'real-estate': [350000, 900000], 'food-catering': [180000, 1200000], automotive: [25000, 120000], electronics: [40000, 350000], 'travel-tourism': [150000, 800000] }[slug] ?? [20000, 35000]
  return base
}

const schema = z.object({
  mode: z.enum(['text', 'voice', 'media']),
  description: z.string().max(1500).optional(),
  title: z.string().min(5, 'Add a short title (at least 5 characters)').max(90),
  category: z.string().min(1, 'Choose a category'),
  subtype: z.string().optional(),
  quantity: z.coerce.number().min(1).max(10000),
  specs: z.record(z.string(), z.any()).optional(),
  serviceArea: z.object({ district: z.string(), sector: z.string().optional() }),
  timeframe: z.string(),
  urgency: z.enum(['low', 'medium', 'high', 'urgent']),
  recurring: z.boolean(),
  recurrence: z.object({ frequency: z.string(), cycles: z.coerce.number().min(1).max(52), days: z.array(z.string()), time: z.string() }).optional(),
  budget: z.number().min(1000, 'Budget must be at least RWF 1,000'),
  negotiable: z.boolean(),
  language: z.string(),
  visibility: z.enum(['public', 'private']),
  anonymous: z.boolean(),
  priority: z.boolean(),
  terms: z.boolean().refine((x) => x, 'Please accept the terms to publish'),
})

const STEP_FIELDS = [
  ['title', 'category', 'quantity'],
  ['serviceArea', 'timeframe', 'urgency', 'recurrence'],
  ['budget'],
  ['terms'],
]
const DEFAULTS = {
  mode: 'text', description: '', title: '', category: '', subtype: '', quantity: 1, specs: {},
  serviceArea: { district: 'Gasabo', sector: 'Kimihurura' }, timeframe: 'This week', urgency: 'medium',
  recurring: false, recurrence: { frequency: 'weekly', cycles: 4, days: ['Sat'], time: '09:00' },
  budget: 0, negotiable: true, language: 'en', visibility: 'public', anonymous: false, priority: false, terms: false,
}
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function previewFrom(v, user, media) {
  const cat = CATEGORIES.find((c) => c.slug === v.category)
  return {
    id: 'preview', code: 'NS-26-•••••', kind: 'need', title: v.title || 'Your Need title', description: v.description,
    category: v.category || 'home-furniture', categoryName: cat?.name ?? 'Category', subtype: v.subtype || cat?.subtypes[0] || '—',
    serviceArea: v.serviceArea, budget: { amount: v.budget || 0, currency: 'RWF' }, negotiable: v.negotiable, urgency: v.urgency,
    recurring: v.recurring, poster: { name: v.anonymous ? 'Anonymous' : `${user.firstName} ${user.name.split(' ')[1]?.[0] ?? ''}.`, avatarHue: user.avatarHue },
    anonymous: v.anonymous, media, offerSlots: { used: 0, limit: 3 }, counts: { loves: 0, messages: 0, saves: 0, shares: 0 }, createdAt: new Date().toISOString(),
  }
}

/* ================================================================ Post a Need */
export function PostNeed({ onBehalf }) {
  const { user } = useSession()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [sp] = useSearchParams()
  const from = sp.get('from')
  const edit = sp.get('edit')
  const [step, setStep] = useState(0)
  const [tab, setTab] = useState('edit')
  const [files, setFiles] = useState([])
  const [voice, setVoice] = useState(null)
  const [gate, setGate] = useState(!user.verified)
  const [forWhom, setForWhom] = useState(NEEDERS[5].id)
  const [consent, setConsent] = useState(false)
  const draftKey = `ns-draft-need:${user.id}`

  const form = useForm({ resolver: zodResolver(schema), defaultValues: { ...DEFAULTS, ...(!from && !edit ? readStorage(draftKey, {}) : {}), mode: sp.get('mode') === 'voice' || onBehalf ? 'voice' : 'text', terms: false }, mode: 'onTouched' })
  const { register, control, watch, setValue, trigger, handleSubmit, formState: { errors }, reset } = form
  const v = watch()

  // Re-request / edit: pre-fill from an existing item (an expired agreed price is never reused)
  const source = useQuery({ queryKey: ['needs', from ?? edit], queryFn: () => api.one('needs', from ?? edit), enabled: !!(from || edit) })
  useEffect(() => {
    const s = source.data
    if (!s) return
    reset({ ...DEFAULTS, mode: 'text', title: s.title, description: s.description, category: s.category, subtype: s.subtype, quantity: s.quantity ?? 1, serviceArea: s.serviceArea, timeframe: s.timeframe ?? 'This week', urgency: s.urgency, recurring: !!s.recurring, recurrence: s.recurrence ?? DEFAULTS.recurrence, budget: s.budget?.amount ?? 0, negotiable: s.negotiable, visibility: s.visibility, anonymous: s.anonymous, terms: false })
  }, [source.data, reset])

  // autosave draft
  useEffect(() => {
    if (from || edit) return
    const t = setTimeout(() => {
      const rest = { ...v }
      delete rest.terms
      writeStorage(draftKey, rest)
    }, 500)
    return () => clearTimeout(t)
  }, [JSON.stringify(v)])

  // smart suggestions from the description
  const suggestedCat = suggestCategory(`${v.description} ${v.title}`)
  const suggestedTitle = suggestTitle(v.description)
  const cat = CATEGORIES.find((c) => c.slug === v.category)
  const [lo, hi] = GUIDANCE(v.category)
  const media = voice ? [voice] : files.map((f) => ({ id: f.id, kind: f.kind, url: f.url, cat: v.category }))

  const publish = useMutation({
    mutationFn: (values) => {
      if (edit) return api.update('needs', edit, { ...values, budget: { amount: values.budget, currency: 'RWF' }, status: 'under_review' }).then((r) => ({ ...r, code: edit }))
      const poster = onBehalf ? NEEDERS.find((n) => n.id === forWhom) : user
      return api.post('/api/needs', { ...values, kind: 'need', categoryName: cat?.name, budget: { amount: values.budget, currency: 'RWF' }, recurrence: values.recurring ? values.recurrence : undefined, posterId: poster.id, posterName: `${poster.name.split(' ')[0]} ${poster.name.split(' ')[1]?.[0] ?? ''}.`, media, onBehalfOf: onBehalf ? user.id : undefined, district: values.serviceArea.district })
    },
    onSuccess: (res) => {
      writeStorage(draftKey, {})
      qc.invalidateQueries({ queryKey: ['needs'] })
      navigate(onBehalf ? '/app/agent/needers' : `/app/needer/post/success/${res.code}`, { replace: true })
      if (onBehalf) toast('Need posted on behalf of your Needer', { description: `${res.code} · consent recorded` })
    },
  })

  const next = async () => {
    if (step === 0 && !v.title && suggestedTitle) setValue('title', suggestedTitle)
    if (step === 0 && !v.category && suggestedCat) setValue('category', suggestedCat)
    const ok = await trigger(STEP_FIELDS[step])
    if (ok) setStep((s) => s + 1)
  }
  const steps = ['What you need', 'Where & when', 'Your budget', 'Check & send']
  const stepIntro = [
    ['What do you need?', 'Tell us in your own words — type it, record a voice note, or show us a photo.'],
    ['Where and when?', 'So we only show your request to providers who can actually reach you.'],
    ['What can you spend?', 'A rough figure is fine. Providers will still send you their own prices.'],
    ['Check it over', 'Have a last look, then send it. Posting is free.'],
  ][step]

  return (
    <>
      <PageHeader
        title={edit ? 'Edit request' : from ? 'Repost' : onBehalf ? 'Ask on behalf' : 'Request a service'}
        subtitle={from ? 'A fresh copy of your earlier request — change anything you like.' : 'Free to post. Trusted providers send you prices, and we hold your money until the job is done.'}
        actions={!edit && <Segmented label="Request type" value="single" onChange={(t) => t === 'bundle' && navigate('/app/needer/bundles/new')} options={[{ value: 'single', label: 'Need', icon: <ClipboardList size={14} /> }, { value: 'bundle', label: 'Bundle', icon: <Layers size={14} /> }]} />}
      />
      {onBehalf && (
        <Alert tone="navy" className="mb-5" icon={UserCheck} title={`Posting for: ${NEEDERS.find((n) => n.id === forWhom)?.name}`}>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Select size="sm" value={forWhom} onChange={(e) => setForWhom(e.target.value)} className="w-56" aria-label="Needer">
              {NEEDERS.slice(4, 30).map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
            </Select>
            <Checkbox checked={consent} onChange={setConsent} label="I recorded this Needer's consent to post for them" />
          </div>
        </Alert>
      )}
      {from && <Alert tone="info" className="mb-5">Everything is editable. Any previously agreed or expired price isn't reused — Partners will send fresh offers.</Alert>}
      <LifecycleStepper steps={steps} current={step} className="mb-6" />
      <div className="mb-4 lg:hidden">
        <Segmented label="Edit or preview" value={tab} onChange={setTab} options={[{ value: 'edit', label: 'Edit' }, { value: 'preview', label: 'Preview', icon: <Eye size={14} /> }]} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form className={cn('min-w-0', tab === 'preview' && 'hidden lg:block')} onSubmit={handleSubmit((values) => publish.mutate(values))} noValidate>
          <Card className="space-y-6 rounded-3xl border-border/80 p-5 shadow-card sm:p-7">
            <header className="border-b border-border/70 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-action-fg">Step {step + 1} of 4</p>
              <h2 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-text">{stepIntro[0]}</h2>
              <p className="mt-1 text-sm leading-6 text-muted">{stepIntro[1]}</p>
            </header>
            {step === 0 && (
              <>
                <div>
                  <p className="mb-2 text-sm font-semibold text-text">How would you like to explain it?</p>
                  <Controller control={control} name="mode" render={({ field }) => (
                    <Segmented label="Description mode" value={field.value} onChange={field.onChange} options={[{ value: 'text', label: 'Type', icon: <Type size={14} /> }, { value: 'voice', label: 'Voice note', icon: <Mic size={14} /> }, { value: 'media', label: 'Photos / video', icon: <ImageIcon size={14} /> }]} />
                  )} />
                </div>
                {v.mode === 'voice' && <VoiceRecorder value={voice} onChange={(m) => { setVoice(m); if (m && !v.description) setValue('description', 'Voice note: please listen for details.') }} />}
                {v.mode === 'media' && <FileUploader files={files} onChange={setFiles} />}
                <Field label="Describe it" optional={v.mode !== 'text'} hint="Say what you need, how much, and any brand or size. Please don't put your phone number here — providers reach you inside Needibi.">
                  {(p) => <Textarea {...p} rows={4} {...register('description')} placeholder="e.g. My kitchen sink pipe is leaking since this morning. Need someone to fix it today, with parts." />}
                </Field>
                <Field label="Give it a short name" error={errors.title?.message}>
                  {(p) => (
                    <div>
                      <Input {...p} {...register('title')} placeholder="e.g. Plumber to fix kitchen leak" />
                      {suggestedTitle && suggestedTitle !== v.title && (
                        <button type="button" onClick={() => setValue('title', suggestedTitle, { shouldValidate: true })} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-action-soft px-3 py-1 text-xs font-semibold text-action-fg">
                          <Sparkles size={13} /> Use “{suggestedTitle}”
                        </button>
                      )}
                    </div>
                  )}
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Category" error={errors.category?.message}>
                    {(p) => (
                      <div>
                        <Select {...p} {...register('category')} onChange={(e) => { setValue('category', e.target.value, { shouldValidate: true }); setValue('subtype', '') }}>
                          <option value="">Choose…</option>
                          {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                        </Select>
                        {suggestedCat && suggestedCat !== v.category && (
                          <button type="button" onClick={() => setValue('category', suggestedCat, { shouldValidate: true })} className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-action-soft px-3 py-1 text-xs font-semibold text-action-fg">
                            <Sparkles size={13} /> Suggested: {CATEGORIES.find((c) => c.slug === suggestedCat).name}
                          </button>
                        )}
                      </div>
                    )}
                  </Field>
                  <Field label="Kind of work" optional>
                    {(p) => (
                      <Select {...p} {...register('subtype')} disabled={!cat}>
                        <option value="">Any</option>
                        {cat?.subtypes.map((s) => <option key={s}>{s}</option>)}
                      </Select>
                    )}
                  </Field>
                  <Field label="How many?" error={errors.quantity?.message}>{(p) => <Input {...p} type="number" min="1" {...register('quantity')} />}</Field>
                </div>
                {cat && (
                  <fieldset className="rounded-card border border-border p-4">
                    <legend className="px-1 text-sm font-semibold text-text">A few {cat.name.toLowerCase()} details <span className="font-normal text-muted">(optional)</span></legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {specFieldsFor(cat.slug).map((f) => (
                        <Field key={f.key} label={f.label} optional>
                          {(p) => (f.type === 'select' ? <Select {...p} {...register(`specs.${f.key}`)}><option value="">—</option>{f.options.map((o) => <option key={o}>{o}</option>)}</Select> : <Input {...p} type={f.type === 'number' ? 'number' : 'text'} {...register(`specs.${f.key}`)} />)}
                        </Field>
                      ))}
                    </div>
                  </fieldset>
                )}
              </>
            )}

            {step === 1 && (
              <>
                <Controller control={control} name="serviceArea" render={({ field }) => <LocationFields value={field.value} onChange={field.onChange} />} />
                <Field label="When do you need it?">{(p) => <Select {...p} {...register('timeframe')}>{['Today', 'Within 3 days', 'This week', 'Within 2 weeks', 'This month', 'Flexible'].map((t) => <option key={t}>{t}</option>)}</Select>}</Field>
                <div>
                  <p className="mb-2 text-sm font-semibold text-text">How soon do you need it?</p>
                  <Controller control={control} name="urgency" render={({ field }) => (
                    <div role="radiogroup" aria-label="Urgency" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {['low', 'medium', 'high', 'urgent'].map((u) => (
                        <button key={u} type="button" role="radio" aria-checked={field.value === u} onClick={() => field.onChange(u)} className={cn('flex h-12 items-center justify-center rounded-card border', field.value === u ? 'border-action-500 ring-2 ring-action-500/30' : 'border-border')}>
                          <UrgencyBadge urgency={u} />
                        </button>
                      ))}
                    </div>
                  )} />
                </div>
                <Controller control={control} name="recurring" render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="I need this again and again" description="For example weekly cleaning, daily lunches or monthly supplies." />} />
                {v.recurring && (
                  <div className="grid gap-4 rounded-card bg-surface-2 p-4 sm:grid-cols-3">
                    <Field label="How often">{(p) => <Select {...p} {...register('recurrence.frequency')}><option value="daily">Every day</option><option value="weekly">Every week</option><option value="monthly">Every month</option></Select>}</Field>
                    <Field label="How many times" error={errors.recurrence?.cycles?.message}>{(p) => <Input {...p} type="number" min="1" max="52" {...register('recurrence.cycles')} />}</Field>
                    <Field label="Time">{(p) => <Input {...p} type="time" {...register('recurrence.time')} />}</Field>
                    {v.recurrence?.frequency === 'weekly' && (
                      <div className="sm:col-span-3">
                        <p className="mb-2 text-sm font-semibold text-text">Days</p>
                        <Controller control={control} name="recurrence.days" render={({ field }) => (
                          <div className="flex flex-wrap gap-2">{WEEKDAYS.map((d) => <Chip key={d} active={field.value?.includes(d)} onClick={() => field.onChange(field.value?.includes(d) ? field.value.filter((x) => x !== d) : [...(field.value ?? []), d])}>{d}</Chip>)}</div>
                        )} />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <Field label="What can you spend?" error={errors.budget?.message} hint={cat ? `Most ${cat.name.split(' ')[0].toLowerCase()} requests like this pay ${formatMoney(lo)}–${formatMoney(hi)}` : undefined}>
                  {(p) => <Controller control={control} name="budget" render={({ field }) => <MoneyInput {...p} size="lg" value={field.value} onChange={field.onChange} />} />}
                </Field>
                <Controller control={control} name="negotiable" render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="I'm open to a different price" description="Providers can suggest their own price when they reply." />} />
                <div>
                  <p className="mb-2 text-sm font-semibold text-text">Add photos or a video <span className="font-normal text-muted">(optional)</span></p>
                  <FileUploader files={files} onChange={setFiles} compact />
                </div>
                <Field label="Language you wrote in">{(p) => <Select {...p} {...register('language')}><option value="en">English</option><option value="rw">Kinyarwanda</option><option value="fr">Français</option><option value="sw">Kiswahili</option></Select>}</Field>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <p className="mb-2 text-sm font-semibold text-text">Who can see it?</p>
                  <Controller control={control} name="visibility" render={({ field }) => (
                    <RadioCards value={field.value} onChange={field.onChange} options={[{ value: 'public', label: 'Everyone', description: 'Shown publicly — you get more offers', icon: <Globe size={18} /> }, { value: 'private', label: 'Just a few providers', description: 'Only the ones we match to you', icon: <Lock size={18} /> }]} />
                  )} />
                </div>
                <div>
                  <p className="mb-2 text-sm font-semibold text-text">Show your name?</p>
                  <Controller control={control} name="anonymous" render={({ field }) => (
                    <RadioCards value={field.value ? 'anon' : 'me'} onChange={(x) => field.onChange(x === 'anon')} options={[{ value: 'me', label: `${user.firstName} ${user.name.split(' ')[1]?.[0]}.`, description: 'Your first name and initial', icon: <UserRound size={18} /> }, { value: 'anon', label: 'Hide my name', description: 'Your name stays private', icon: <EyeOff size={18} /> }]} />
                  )} />
                </div>
                <Controller control={control} name="priority" render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Show my request first · RWF 2,000" description="Optional. For 24 hours we show your request near the top for providers. It does not change how soon you said you need it." />} />
                <Card className="bg-surface-2 shadow-none">
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <div><dt className="text-muted">Title</dt><dd className="font-semibold text-text">{v.title}</dd></div>
                    <div><dt className="text-muted">Category</dt><dd className="font-semibold text-text">{cat?.name} {v.subtype && `› ${v.subtype}`}</dd></div>
                    <div><dt className="text-muted">Where</dt><dd className="font-semibold text-text">{v.serviceArea.sector}, {v.serviceArea.district}</dd></div>
                    <div><dt className="text-muted">Budget</dt><dd className="tabular font-semibold text-text">{formatMoney(v.budget)}{v.negotiable && ' · open to offers'}</dd></div>
                    <div><dt className="text-muted">When</dt><dd className="font-semibold text-text">{v.timeframe}</dd></div>
                    <div><dt className="text-muted">How often</dt><dd className="font-semibold text-text">{v.recurring ? `${v.recurrence.frequency}, ${v.recurrence.cycles} times` : 'Just once'}</dd></div>
                  </dl>
                </Card>
                <Controller control={control} name="terms" render={({ field }) => (
                  <div>
                    <Checkbox checked={field.value} onChange={field.onChange} label={<>I agree to the <Link to="/legal/terms" className="text-info-fg underline">Terms</Link> and confirm this request is genuine</>} />
                    {errors.terms && <p className="mt-1 text-sm font-medium text-danger-fg" role="alert">{errors.terms.message}</p>}
                  </div>
                )} />
              </>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
              {step > 0 ? <Button variant="ghost" onClick={() => setStep((s) => s - 1)}><ArrowLeft size={16} /> Back</Button> : <span className="text-xs text-muted">We save your draft as you type</span>}
              {step < 3 ? (
                <Button variant="primary" size="lg" className="rounded-full px-7" onClick={next}>Continue <ArrowRight size={16} /></Button>
              ) : (
                <Button type="submit" variant="primary" size="lg" className="rounded-full px-7" loading={publish.isPending} disabled={onBehalf && !consent}>
                  <Rocket size={18} /> {edit ? 'Send changes' : 'Send my request'}
                </Button>
              )}
            </div>
          </Card>
        </form>
        <aside className={cn(tab === 'edit' && 'hidden lg:block')} aria-label="Live preview">
          <div className="sticky top-24">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">How it will look</p>
            <div className="pointer-events-none" inert>
              <NeedCard need={previewFrom(v, user, media)} />
            </div>
            <p className="mt-3 text-xs text-muted">This is what providers see. Your exact address and phone number are never shown.</p>
          </div>
        </aside>
      </div>
      <Dialog open={gate} onOpenChange={setGate} title="Finish your profile first" description="Partners trust Needs from verified accounts." size="sm" footer={<><Button variant="ghost" onClick={() => navigate(-1)}>Later</Button><Button variant="primary" onClick={() => { setGate(false); toast('Phone verified') }}>Verify phone</Button></>}>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2"><CircleCheck size={16} className="text-trust-fg" /> Add your name</li>
          <li className="flex items-center gap-2"><Hourglass size={16} className="text-warn-fg" /> Verify your phone with a 6-digit code</li>
        </ul>
      </Dialog>
    </>
  )
}

/* ================================================================ Success */
export function PostSuccess() {
  const { code } = useParams()
  const share = useShare()
  const resource = code.startsWith('NB') ? 'bundles' : 'needs'
  const { data } = useQuery({ queryKey: [resource, code], queryFn: () => api.one(resource, code) })
  const partners = useQuery({ queryKey: ['partners', 'match', data?.category], queryFn: () => api.list('partners', { categories: data.category, status: 'active', pageSize: 3, sort: '-rating' }), enabled: !!data })
  const live = data?.status === 'published'
  const noun = resource === 'bundles' ? 'Bundle' : 'Need'
  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      <span className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-full', live ? 'bg-trust-100 text-trust-fg' : 'bg-warn-100 text-warn-fg')}>{live ? <CircleCheck size={40} /> : <Hourglass size={40} />}</span>
      <h1 className="mt-5 font-display text-3xl font-extrabold text-text">{live ? `Your ${noun} is live!` : 'Sent for a quick review'}</h1>
      <p className="mt-2 text-muted">{live ? 'Verified Partners nearby can now serve it. We\'ll notify you when offers arrive.' : 'Most reviews take under 2 hours. We\'ll notify you the moment it\'s live.'}</p>
      <p className="tabular mt-4 inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 font-bold text-text">{code} <Badge tone={live ? 'trust' : 'grey'} iconName={live ? 'CircleDot' : 'Hourglass'}>{live ? 'Live' : 'Under review'}</Badge></p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="primary" size="lg" to={`/app/needer/${resource}/${code}`}><Route size={18} /> Track</Button>
        <Button variant="outline" size="lg" onClick={() => share({ title: data?.title ?? 'My Need', path: `/${resource}/${code}` })}><Share size={18} /> Share</Button>
      </div>
      <Card className="mt-10 text-left">
        <p className="font-bold text-text">Matching Partners near you</p>
        <ul className="mt-3 space-y-3">
          {partners.isLoading && <Skeleton className="h-16" />}
          {partners.data?.data.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <Avatar name={p.name} hue={p.avatarHue} size={40} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 font-semibold text-text">{p.name} {p.verified && <VerifiedBadge compact />}</span>
                <span className="text-xs text-muted">Responds {p.responseTime} · {p.areas.join(', ')}</span>
              </span>
              <Rating value={p.rating} size={12} className="text-xs" />
            </li>
          ))}
        </ul>
      </Card>
      <Link to="/app/needer/post" className="mt-6 inline-block text-sm font-semibold text-info-fg hover:underline">Post another Need</Link>
    </div>
  )
}

/* ================================================================ Bundle builder */
const TEMPLATES = {
  'Furnish a home': [['Sofa', 650000, 'home-furniture'], ['Bed', 380000, 'home-furniture', 2], ['Dining set', 520000, 'home-furniture'], ['Curtains', 120000, 'home-furniture'], ['Deep clean', 45000, 'services']],
  Wedding: [['Catering', 3200000, 'food-catering'], ['Decoration', 900000, 'custom-solutions'], ['Photographer', 450000, 'professional-talent'], ['Car hire', 300000, 'automotive']],
  'Office set-up': [['Desks & chairs', 2400000, 'home-furniture'], ['Internet installation', 180000, 'electronics'], ['Weekly cleaning', 60000, 'services', 1, true]],
  'Farming season': [['Seeds', 220000, 'agriculture'], ['Fertiliser', 300000, 'agriculture'], ['Farm labour', 400000, 'agriculture', 1, true]],
  'Monthly supplies': [['Groceries', 180000, 'services', 1, true], ['Laundry pick-up', 40000, 'services', 1, true], ['Water delivery', 15000, 'services', 1, true]],
}
const TEMPLATE_ICON = { 'Furnish a home': Sofa, Wedding: Heart, 'Office set-up': Briefcase, 'Farming season': Sprout, 'Monthly supplies': Package }
let itemSeq = 0
const newItem = (title = '', amount = 0, category = 'home-furniture', quantity = 1, recurring = false) => ({ id: `new-${++itemSeq}`, title, budget: amount, category, quantity, recurring, urgency: 'medium' })

export function BundleBuilder() {
  const { user } = useSession()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [sp] = useSearchParams()
  const template = sp.get('template')
  const [title, setTitle] = useState(template ?? '')
  const [goal, setGoal] = useState('')
  const [cover, setCover] = useState([])
  const [items, setItems] = useState(() => (template && TEMPLATES[template] ? TEMPLATES[template].map((t) => newItem(...t)) : [newItem(), newItem()]))
  const [allowPartial, setAllowPartial] = useState(true)
  const [area, setArea] = useState({ district: user.district, sector: user.sector })
  const [dragId, setDragId] = useState(null)
  const [terms, setTerms] = useState(false)

  const from = useQuery({ queryKey: ['bundles', sp.get('from')], queryFn: () => api.one('bundles', sp.get('from')), enabled: !!sp.get('from') && sp.get('from').startsWith('NB') })
  useEffect(() => {
    if (from.data) {
      setTitle(from.data.title)
      setGoal(from.data.goal ?? '')
      setItems(from.data.items.map((i) => newItem(i.title, i.budget.amount, from.data.category, i.quantity, i.recurring)))
    }
  }, [from.data])

  const update = (id, patch) => setItems((l) => l.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  const move = (id, dir) => setItems((l) => {
    const i = l.findIndex((x) => x.id === id)
    const j = i + dir
    if (j < 0 || j >= l.length) return l
    const c = [...l]
    ;[c[i], c[j]] = [c[j], c[i]]
    return c
  })
  const total = items.reduce((s, i) => s + (i.budget || 0) * (i.quantity || 1), 0)
  const recurring = items.filter((i) => i.recurring).length
  const valid = title.trim().length >= 5 && items.length >= 2 && items.every((i) => i.title.trim() && i.budget > 0) && terms

  const publish = useMutation({
    mutationFn: () => api.post('/api/needs', { kind: 'bundle', title, goal, category: items[0].category, items: items.map((i, k) => ({ id: `bi-new-${k}`, title: i.title, quantity: i.quantity, budget: { amount: i.budget, currency: 'RWF' }, urgency: i.urgency, recurring: i.recurring, status: 'matching', offers: 0 })), allowPartial, serviceArea: area, posterId: user.id, posterName: `${user.firstName} ${user.name.split(' ')[1]?.[0]}.`, urgency: 'medium', visibility: 'public', media: cover.length ? [{ id: 'cover', kind: 'image', url: cover[0].url }] : [{ id: 'cover', kind: 'image', url: '', cat: items[0].category }] }),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['bundles'] })
      navigate(`/app/needer/post/success/${r.code}`, { replace: true })
    },
  })

  const preview = useMemo(() => ({ id: 'bp', code: 'NB-26-•••••', kind: 'bundle', title: title || 'Your Bundle', goal, category: items[0]?.category, items: items.map((i) => ({ ...i, budget: { amount: i.budget, currency: 'RWF' } })), itemCount: items.length, totalBudget: { amount: total, currency: 'RWF' }, allowPartial, progress: { served: 0, total: items.length }, mixedRecurring: recurring > 0 && recurring < items.length, serviceArea: area, urgency: 'medium', poster: { name: `${user.firstName} ${user.name.split(' ')[1]?.[0]}.`, avatarHue: user.avatarHue }, offerSlots: { used: 0, limit: 3 }, counts: { loves: 0, messages: 0 }, createdAt: new Date().toISOString(), media: cover.length ? [{ id: 'c', kind: 'image', url: cover[0].url }] : [{ id: 'c', kind: 'image', url: '', cat: items[0]?.category }] }), [title, goal, items, total, allowPartial, recurring, area, user, cover])

  return (
    <>
      <PageHeader back={{ to: '/app/needer/bundles', label: 'My bundles' }} title="Ask for a few things at once" subtitle="Put everything you need for one plan in a single request. Each thing gets its own budget and timing." />
      <Card className="mb-6 rounded-3xl border-border/80 bg-surface p-5 shadow-card sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-action-soft text-action-fg"><Layers size={19} /></span>
          <div>
            <p className="font-display text-lg font-bold text-text">Start from a ready-made list</p>
            <p className="mt-0.5 text-sm text-muted">Pick the one closest to your plan, then change anything you like. Or just build your own below.</p>
          </div>
        </div>
        <p className="mb-3 mt-5 text-xs font-bold uppercase tracking-[0.14em] text-muted">Common plans</p>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {Object.keys(TEMPLATES).map((t) => {
            const Icon = TEMPLATE_ICON[t]
            return (
              <button key={t} type="button" onClick={() => { setTitle(t); setItems(TEMPLATES[t].map((x) => newItem(...x))) }} className="flex shrink-0 items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-text hover:border-action-500">
                <Icon size={16} className="text-action-fg" /> {t}
              </button>
            )
          })}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card className="space-y-4 rounded-3xl border-border/80 p-5 shadow-card sm:p-6">
            <Field label="What is this for?">{(p) => <Input {...p} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Furnish my 2-bedroom flat" />}</Field>
            <Field label="When do you want it finished?" optional>{(p) => <Input {...p} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Move in by 30 November" />}</Field>
            <LocationFields value={area} onChange={setArea} />
            <div>
              <p className="mb-2 text-sm font-semibold text-text">Add a photo <span className="font-normal text-muted">(optional)</span></p>
              <FileUploader files={cover} onChange={setCover} multiple={false} compact accept="image/*" label="Add a cover photo" hint="Up to 5 MB" />
            </div>
          </Card>
          <section aria-label="Bundle items">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-text">What you need ({items.length})</h2>
                <p className="text-sm text-muted">Add at least two things. Drag to reorder.</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full" onClick={() => setItems((l) => [...l, newItem()])}><Plus size={15} /> Add</Button>
            </div>
            <ol className="space-y-3">
              {items.map((it, k) => (
                <li
                  key={it.id}
                  draggable
                  onDragStart={() => setDragId(it.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (!dragId || dragId === it.id) return
                    setItems((l) => {
                      const from = l.findIndex((x) => x.id === dragId)
                      const to = l.findIndex((x) => x.id === it.id)
                      const c = [...l]
                      const [m] = c.splice(from, 1)
                      c.splice(to, 0, m)
                      return c
                    })
                    setDragId(null)
                  }}
                  className={cn('rounded-2xl border border-border bg-surface p-4 shadow-card transition hover:border-action-300 hover:shadow-hover', dragId === it.id && 'opacity-50')}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-1 text-muted">
                      <GripVertical size={18} className="cursor-grab" aria-hidden="true" />
                      <button type="button" aria-label={`Move item ${k + 1} up`} onClick={() => move(it.id, -1)} disabled={k === 0} className="rounded p-0.5 disabled:opacity-30"><ChevronUp size={16} /></button>
                      <button type="button" aria-label={`Move item ${k + 1} down`} onClick={() => move(it.id, 1)} disabled={k === items.length - 1} className="rounded p-0.5 disabled:opacity-30"><ChevronDown size={16} /></button>
                    </div>
                    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1.2fr_80px]">
                      <Field label={`Thing ${k + 1}`}>{(p) => <Input {...p} value={it.title} onChange={(e) => update(it.id, { title: e.target.value })} placeholder="e.g. Sofa" />}</Field>
                      <Field label="Kind">{(p) => <Select {...p} value={it.category} onChange={(e) => update(it.id, { category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</Select>}</Field>
                      <Field label="Budget">{(p) => <MoneyInput {...p} value={it.budget} onChange={(b) => update(it.id, { budget: b })} />}</Field>
                      <Field label="How many">{(p) => <Input {...p} type="number" min="1" value={it.quantity} onChange={(e) => update(it.id, { quantity: Math.max(1, Number(e.target.value)) })} />}</Field>
                      <Field label="How soon">{(p) => <Select {...p} value={it.urgency} onChange={(e) => update(it.id, { urgency: e.target.value })}><option value="low">Any time</option><option value="medium">This month</option><option value="high">This week</option><option value="urgent">Today</option></Select>}</Field>
                      <div className="flex items-end pb-2"><Switch checked={it.recurring} onChange={(r) => update(it.id, { recurring: r })} label="Again and again" /></div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button variant="ghost" size="icon-sm" aria-label={`Duplicate item ${k + 1}`} onClick={() => setItems((l) => { const i = l.findIndex((x) => x.id === it.id); const c = [...l]; c.splice(i + 1, 0, { ...it, id: `new-${++itemSeq}` }); return c })}><Copy size={16} /></Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Remove item ${k + 1}`} disabled={items.length <= 2} onClick={() => setItems((l) => l.filter((x) => x.id !== it.id))}><Trash size={16} /></Button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <button type="button" onClick={() => setItems((l) => [...l, newItem()])} className="mt-3 flex w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-strong py-4 text-sm font-semibold text-muted hover:border-action-500 hover:text-text">
              <Plus size={16} /> Add another thing
            </button>
          </section>
        </div>
        <aside>
          <div className="sticky top-24 space-y-4">
            <Card className="rounded-3xl border-border/80 p-5 shadow-card">
              <p className="font-display text-lg font-bold text-text">Your request so far</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Things</dt><dd className="font-semibold text-text">{items.length}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Repeating · one-off</dt><dd className="font-semibold text-text">{recurring} · {items.length - recurring}</dd></div>
                <div className="flex justify-between border-t border-border pt-2"><dt className="font-bold text-text">What it adds up to</dt><dd className="tabular text-xl font-extrabold text-text">{formatMoney(total)}</dd></div>
              </dl>
              <Switch className="mt-4" checked={allowPartial} onChange={setAllowPartial} label="Let different providers take different parts" description="Usually gets you more offers and a better price." />
              <Checkbox className="mt-4" checked={terms} onChange={setTerms} label="I agree to the Terms and confirm this request is genuine" />
              <Button variant="primary" size="lg" block className="mt-4 rounded-full" disabled={!valid} loading={publish.isPending} onClick={() => publish.mutate()}><Rocket size={18} /> Send my request</Button>
              {!valid && <p className="mt-2 text-xs text-muted">Add a name for the plan, and at least 2 things with a name and budget.</p>}
            </Card>
            <p className="hidden text-xs font-bold uppercase tracking-wide text-muted xl:block">How it will look</p>
            <div className="pointer-events-none hidden xl:block" inert>
              <BundleCard bundle={preview} />
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
