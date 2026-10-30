import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { IdCard, Building, Signature, BadgeCheck, Repeat, ShieldCheck, Paperclip, Plus, ArrowRight, MapPin, Clock, Layers, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession } from '@/lib/hooks'
import { toast } from '@/lib/store'
import { formatMoney, ago } from '@/lib/format'
import { PARTNERS } from '@/mocks/seed'
import { Dialog, StarInput, Drawer, ReasonDialog, ConfirmDialog, REJECT_REASONS, Button, Field, Textarea, Select, Checkbox, Segmented, SlotMeter, MediaThumb, KindLabel, Badge, UrgencyBadge, Alert, Input, Avatar, VerifiedBadge, Rating, StatusBadge, Card, ProgressBar } from '@/design-system'
import { MoneyInput, FileUploader } from '@/components/forms/inputs'
import { useCardActions, detailPath } from './actionsStore'
import { CommentsPanel } from './CommentsPanel'

const DEFAULT_INCLUSIONS = ['Labour', 'Materials', 'Transport', 'Clean-up after work', '7-day guarantee']

/* --------------------------------------------------------------- Serve drawer */
function ServeDrawer() {
  const item = useCardActions((s) => s.serve)
  const close = useCardActions((s) => s.close)
  const { user } = useSession()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const isBundle = item?.kind === 'bundle'
  const [scope, setScope] = useState('whole')
  const [selected, setSelected] = useState({})
  const [price, setPrice] = useState(0)
  const [itemPrices, setItemPrices] = useState({})
  const [inclusions, setInclusions] = useState(['Labour', 'Transport'])
  const [custom, setCustom] = useState('')
  const [timeline, setTimeline] = useState('Within 24 h')
  const [validity, setValidity] = useState('3')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState([])
  const [slots, setSlots] = useState(null)
  const [conflict, setConflict] = useState(false)

  useEffect(() => {
    if (item) {
      setPrice(Math.round((item.budget?.amount ?? item.totalBudget?.amount ?? 0) * 0.95))
      setSlots(item.offerSlots)
      setScope('whole')
      setSelected({})
      setItemPrices(Object.fromEntries((item.items ?? []).map((i) => [i.id, i.budget.amount])))
      setConflict(false)
      setNotes('')
      setFiles([])
    }
  }, [item])

  const selectedItems = (item?.items ?? []).filter((i) => selected[i.id])
  const total = isBundle && scope === 'items' ? selectedItems.reduce((s, i) => s + (itemPrices[i.id] ?? 0) * i.quantity, 0) : price

  const serve = useMutation({
    mutationFn: async () => {
      const base = {
        needCode: item.code,
        partnerId: user.partnerId,
        inclusions,
        timeline,
        note: notes,
        validUntil: new Date(Date.now() + Number(validity) * 86400000).toISOString(),
      }
      if (isBundle && scope === 'items') {
        const results = []
        for (const it of selectedItems) {
          results.push(await api.post('/api/offers', { ...base, scope: { kind: 'bundle_item', itemId: it.id, label: `Item: ${it.title}` }, price: { amount: (itemPrices[it.id] ?? 0) * it.quantity, currency: 'RWF' } }))
        }
        return results.at(-1)
      }
      return api.post('/api/offers', { ...base, scope: isBundle ? { kind: 'bundle', label: 'Whole Bundle' } : { kind: 'need', label: 'Whole Need' }, price: { amount: price, currency: 'RWF' } })
    },
    // optimistic slot: show it as taken right away, roll back if the server says full
    onMutate: () => {
      const prev = slots
      setSlots((s) => ({ ...s, used: Math.min(s.limit, s.used + 1) }))
      return { prev }
    },
    onError: (err, _v, ctx) => {
      setSlots(ctx.prev)
      if (err.status === 409) {
        setConflict(true)
        setSlots({ ...ctx.prev, used: ctx.prev.limit })
      } else toast(err.message, { tone: 'danger' })
    },
    onSuccess: (res) => {
      setSlots(res.slots)
      qc.invalidateQueries()
      close('serve')
      toast('Offer sent', { description: `${item.poster?.name ?? 'The Needer'} will review it. Chat unlocks once they confirm.`, action: { label: 'View', onClick: () => navigate('/app/partner/offers') } })
    },
  })

  if (!item) return null
  const full = slots && slots.used >= slots.limit
  return (
    <Drawer
      open={!!item}
      onOpenChange={(o) => !o && close('serve')}
      title={`Serve this ${isBundle ? 'Bundle' : 'Need'}`}
      description={item.code}
      width="max-w-xl"
      footer={
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">You'll receive (85%)</span>
            <span className="tabular font-semibold text-text">{formatMoney(Math.round(total * 0.85))}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => close('serve')}>
              Cancel
            </Button>
            <Button variant="primary" block disabled={full || !total || (isBundle && scope === 'items' && !selectedItems.length)} loading={serve.isPending} onClick={() => serve.mutate()}>
              Send offer · {formatMoney(total)}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 p-5">
        <div className="flex gap-3 rounded-card border border-border p-3">
          <MediaThumb item={item} media={item.media} className="h-16 w-16 shrink-0 rounded-lg" iconSize={24} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <KindLabel kind={item.kind} count={item.itemCount} />
              <UrgencyBadge urgency={item.urgency} size="xs" />
            </div>
            <p className="mt-1 line-clamp-2 font-semibold text-text">{item.title}</p>
            <p className="text-xs text-muted">
              Budget {formatMoney(item.budget ?? item.totalBudget)} · {item.serviceArea?.sector}, {item.serviceArea?.district}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-card bg-surface-2 p-3" aria-live="polite">
          <div>
            <p className="text-sm font-semibold text-text">Offer slots</p>
            <p className="text-xs text-muted">The first 3 eligible Partners to Serve fill the slots.</p>
          </div>
          {slots && <SlotMeter used={slots.used} limit={slots.limit} />}
        </div>
        {conflict && (
          <Alert tone="danger" title="Offers are full">
            Another Partner took the last slot a moment ago. We'll notify you if one frees up.
          </Alert>
        )}

        {isBundle && (
          <div>
            <p className="mb-2 text-sm font-semibold text-text">What will you serve?</p>
            <Segmented
              label="Serve scope"
              value={scope}
              onChange={setScope}
              options={[
                { value: 'whole', label: 'Whole Bundle' },
                { value: 'items', label: 'Selected items' },
              ]}
            />
            {scope === 'items' && (
              <ul className="mt-3 divide-y divide-border rounded-card border border-border">
                {item.items.map((it) => (
                  <li key={it.id} className="flex items-center gap-3 p-3">
                    <Checkbox checked={!!selected[it.id]} onChange={(v) => setSelected((s) => ({ ...s, [it.id]: v }))} label={`${it.title}${it.quantity > 1 ? ` ×${it.quantity}` : ''}`} description={`Budget ${formatMoney(it.budget)}${it.recurring ? ' · recurring' : ''}`} className="flex-1" />
                    {selected[it.id] && (
                      <div className="w-40">
                        <MoneyInput size="sm" value={itemPrices[it.id]} onChange={(v) => setItemPrices((p) => ({ ...p, [it.id]: v }))} aria-label={`Price for ${it.title}`} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(!isBundle || scope === 'whole') && (
          <Field label="Your price" hint={`Needer's budget: ${formatMoney(item.budget ?? item.totalBudget)}${item.negotiable ? ' · negotiable' : ''}`}>
            {(p) => <MoneyInput {...p} value={price} onChange={setPrice} size="lg" />}
          </Field>
        )}

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-text">What's included</legend>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...DEFAULT_INCLUSIONS, ...inclusions])].map((inc) => (
              <button
                key={inc}
                type="button"
                aria-pressed={inclusions.includes(inc)}
                onClick={() => setInclusions((l) => (l.includes(inc) ? l.filter((x) => x !== inc) : [...l, inc]))}
                className={cn('rounded-full border px-3 py-1.5 text-sm font-medium', inclusions.includes(inc) ? 'border-trust-600 bg-trust-100 text-trust-fg' : 'border-border-strong text-text')}
              >
                {inc}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <Input size="sm" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Add an inclusion" aria-label="Add an inclusion" />
            <Button size="sm" variant="outline" disabled={!custom.trim()} onClick={() => { setInclusions((l) => [...l, custom.trim()]); setCustom('') }}>
              <Plus size={14} /> Add
            </Button>
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Timeline / availability">
            {(p) => (
              <Select {...p} value={timeline} onChange={(e) => setTimeline(e.target.value)}>
                {['Can start today', 'Within 24 h', '2–3 days', 'Next week', 'On the requested date'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Offer valid for">
            {(p) => (
              <Select {...p} value={validity} onChange={(e) => setValidity(e.target.value)}>
                {[['1', '24 hours'], ['3', '3 days'], ['7', '7 days']].map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Notes for the Needer" optional hint="Contact details are removed automatically — chat unlocks after confirmation.">
          {(p) => <Textarea {...p} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Explain your approach, experience or what makes your offer great" />}
        </Field>
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-text">
            <Paperclip size={15} /> Attachments <span className="font-normal text-muted">(optional)</span>
          </p>
          <FileUploader files={files} onChange={setFiles} compact label="Photos of similar work, quote PDF" hint="Up to 5 MB per photo" accept="image/*,application/pdf" />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <ShieldCheck size={14} className="text-trust-fg" /> The Needer pays into escrow. You're paid when they confirm satisfaction.
        </p>
      </div>
    </Drawer>
  )
}

/* --------------------------------------------------------------- Re-need */
function ReneedDialog() {
  const item = useCardActions((s) => s.reneed)
  const close = useCardActions((s) => s.close)
  const { user } = useSession()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: () => api.post(`/api/needs/${item.code}/reneed`, { userId: user.id }),
    onSuccess: (res) => {
      qc.invalidateQueries()
      close('reneed')
      if (res.outcome === 'live') toast('Your need is live again', { action: { label: 'View', onClick: () => navigate(detailPath(res.item, { owner: true })) } })
      else toast('Sent for review', { tone: 'info', description: res.reason })
    },
    onError: (e) => toast(e.message, { tone: 'danger' }),
  })
  if (!item) return null
  return (
    <ConfirmDialog
      open={!!item}
      onOpenChange={(o) => !o && close('reneed')}
      title={`Repost this ${item.kind === 'bundle' ? 'Bundle' : 'Need'}?`}
      description={`You're about to publish this ${item.kind === 'bundle' ? 'Bundle' : 'Need'} again. Continue?`}
      confirmLabel="Repost now"
      loading={m.isPending}
      onConfirm={() => m.mutate()}
    >
      <div className="flex gap-3 rounded-card border border-border p-3">
        <MediaThumb item={item} media={item.media} className="h-16 w-16 shrink-0 rounded-lg" iconSize={24} />
        <div className="min-w-0">
          <KindLabel kind={item.kind} count={item.itemCount} />
          <p className="mt-1 line-clamp-2 font-semibold text-text">{item.title}</p>
          <p className="text-xs text-muted">{formatMoney(item.budget ?? item.totalBudget)} · {item.serviceArea?.sector}</p>
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 text-sm text-muted">
        <li className="flex items-center gap-2">
          <Repeat size={14} className="text-primary" /> It goes live again straight away after a quick safety check.
        </li>
        <li className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-trust-fg" /> Sometimes our team takes a quick look first.
        </li>
        <li className="flex items-center gap-2">
          <Clock size={14} /> The original stays in your History.
        </li>
      </ul>
      <p className="mt-3 text-sm">
        Want to change something?{' '}
        <button type="button" className="font-semibold text-info-fg hover:underline" onClick={() => { close('reneed'); navigate(`/app/needer/post?from=${item.code}`) }}>
          Re-request instead
        </button>
      </p>
    </ConfirmDialog>
  )
}

/* --------------------------------------------------------------- Reject */
function RejectHost() {
  const target = useCardActions((s) => s.reject)
  const close = useCardActions((s) => s.close)
  const { user } = useSession()
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: async ({ reason, details }) => {
      const { item, as } = target
      if (as === 'partner') return api.post(`/api/needs/${item.code}/reject`, { reason: `${reason}${details ? ` — ${details}` : ''}`, by: user.partnerName })
      if (as === 'deal') return api.update('deals', item.slug, { status: 'rejected', rejectReason: reason })
      return api.update(item.kind === 'bundle' ? 'bundles' : 'needs', item.code, { status: 'rejected', rejectReason: reason })
    },
    onSuccess: (res) => {
      qc.invalidateQueries()
      const as = target.as
      close('reject')
      if (as === 'partner') toast('Request rejected', { description: res?.adminAlerted ? 'This Need passed the rejection threshold — admins have been alerted.' : 'Admins are notified so we can improve matching.' })
      else toast('Rejected — the poster sees your reason and can edit and resubmit')
    },
  })
  if (!target) return null
  return (
    <ReasonDialog
      open={!!target}
      onOpenChange={(o) => !o && close('reject')}
      title={target.as === 'partner' ? 'Reject this request?' : `Reject “${target.item.title}”?`}
      description={target.as === 'partner' ? 'A reason is required. Admins are notified.' : 'The poster will see this reason.'}
      reasons={target.as === 'partner' ? REJECT_REASONS.partner : REJECT_REASONS.admin}
      loading={m.isPending}
      onConfirm={(r) => m.mutate(r)}
      note={target.as === 'partner' ? 'Rejections help us match you better. At 15 rejections a Need is flagged to admins.' : undefined}
    />
  )
}

/* --------------------------------------------------------------- Approve */
function ApproveHost() {
  const item = useCardActions((s) => s.approve)
  const close = useCardActions((s) => s.close)
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: () => (item.kind === 'deal' ? api.update('deals', item.slug, { status: 'published' }) : api.update(item.kind === 'bundle' ? 'bundles' : 'needs', item.code, { status: 'published' })),
    onSuccess: () => {
      qc.invalidateQueries()
      close('approve')
      toast('Approved and published', { description: 'Logged in the audit trail.' })
    },
  })
  if (!item) return null
  return (
    <ConfirmDialog open={!!item} onOpenChange={(o) => !o && close('approve')} title="Approve and publish?" description={item.title} confirmLabel="Approve" loading={m.isPending} onConfirm={() => m.mutate()}>
      <p className="text-sm text-muted">It becomes visible to the public and {item.kind === 'deal' ? 'can be booked' : 'enters matching'} immediately. Approval is not a guarantee of quality — escrow and reviews still apply.</p>
    </ConfirmDialog>
  )
}

/* --------------------------------------------------------------- Assign (manual matching) */
function AssignDrawer() {
  const item = useCardActions((s) => s.assign)
  const close = useCardActions((s) => s.close)
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState({})
  const [itemScope, setItemScope] = useState('whole')
  if (!item) return null
  const candidates = PARTNERS.filter((p) => p.status === 'active' && p.kycStatus === 'approved' && (!item.category || p.categories.includes(item.category) || p.id === 'pt-cleanpro'))
    .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
    .map((p) => ({ ...p, fit: Math.min(99, Math.round(p.reliability * 0.6 + p.rating * 8)) }))
    .sort((a, b) => b.fit - a.fit)
  const count = Object.values(picked).filter(Boolean).length
  return (
    <Drawer
      open={!!item}
      onOpenChange={(o) => !o && close('assign')}
      title="Assign Partners"
      description={item.title}
      footer={
        <Button variant="primary" block disabled={!count} onClick={() => { close('assign'); setPicked({}); toast(`${count} Partner${count > 1 ? 's' : ''} assigned`, { description: 'They receive a time-limited offer with a countdown.' }) }}>
          Assign {count || ''} Partner{count === 1 ? '' : 's'}
        </Button>
      }
    >
      <div className="space-y-4 p-5">
        {item.kind === 'bundle' && (
          <Segmented label="Scope" value={itemScope} onChange={setItemScope} options={[{ value: 'whole', label: 'Whole Bundle' }, { value: 'items', label: 'Selected items' }]} />
        )}
        <Input leading={<Search size={16} />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search verified Partners" aria-label="Search Partners" />
        <p className="text-xs text-muted">Hard filters applied: verified · eligible · category · area. Ranked by fit.</p>
        <ul className="space-y-2">
          {candidates.map((p) => (
            <li key={p.id}>
              <label className={cn('flex cursor-pointer items-center gap-3 rounded-card border p-3', picked[p.id] ? 'border-action-500 bg-action-soft/50' : 'border-border')}>
                <Checkbox checked={!!picked[p.id]} onChange={(v) => setPicked((s) => ({ ...s, [p.id]: v }))} aria-label={`Assign ${p.name}`} />
                <Avatar name={p.name} hue={p.avatarHue} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-semibold text-text">
                    <span className="truncate">{p.name}</span> {p.verified && <VerifiedBadge compact />}
                  </span>
                  <span className="flex flex-wrap gap-x-2 text-xs text-muted">
                    <Rating value={p.rating} size={10} /> <span>{p.areas.join(', ')}</span>
                  </span>
                </span>
                <Badge tone="trust" size="xs">
                  Fit {p.fit}%
                </Badge>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </Drawer>
  )
}

/* --------------------------------------------------------------- Report */
function ReportHost() {
  const item = useCardActions((s) => s.report)
  const close = useCardActions((s) => s.close)
  if (!item) return null
  return (
    <ReasonDialog
      open={!!item}
      onOpenChange={(o) => !o && close('report')}
      title="Report this content"
      description="Our Trust & Safety team reviews every report."
      reasons={['Misleading price', 'Prohibited item', 'Contact details in media', 'Offensive content', 'Duplicate listing', 'Suspected fraud', 'Other']}
      confirmLabel="Send report"
      onConfirm={async ({ reason }) => {
        await api.create('reports', { targetKind: item.kind, targetCode: item.code ?? item.slug, targetTitle: item.title, reason, reporter: 'You', status: 'open' })
        close('report')
        toast('Thanks — report sent to Trust & Safety')
      }}
    />
  )
}

/* --------------------------------------------------------------- Verify before serving */
function VerifyPartnerHost() {
  const v = useCardActions((s) => s.verifyPartner)
  const close = useCardActions((s) => s.close)
  const navigate = useNavigate()
  if (!v) return null
  const pending = v.mode === 'pending'
  const label = v.item?.kind === 'bundle' ? 'Bundle' : 'Need'
  const go = () => {
    close('verifyPartner')
    navigate(pending ? '/app/partner/verification' : '/auth/partner-onboarding')
  }
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && close('verifyPartner')}
      title={pending ? 'Finish your Partner verification' : 'Verify as a Partner to serve'}
      description={pending ? `Your verification is still in progress. You can serve this ${label} once it's approved.` : `Only verified Partners can serve Needs and Bundles. It keeps Needers safe and takes about 5 minutes.`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => close('verifyPartner')}>Not now</Button>
          <Button variant="primary" onClick={go}><ShieldCheck size={16} /> {pending ? 'Continue verification' : 'Start verification'}</Button>
        </>
      }
    >
      {v.item && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
          <MediaThumb item={v.item} media={v.item.media} className="h-14 w-14 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p className="text-xs text-muted">You want to serve</p>
            <p className="line-clamp-2 text-sm font-semibold text-text">{v.item.title}</p>
          </div>
        </div>
      )}
      <ol className="space-y-3">
        {[
          [IdCard, 'National ID and a live selfie'],
          [Building, 'Business details, categories and service areas'],
          [Signature, 'Sign the Partner agreement'],
          [BadgeCheck, 'Get the ✓ Verified badge — usually within 24 h'],
        ].map(([StepIcon, text], n) => (
          <li key={text} className="flex items-center gap-3 text-sm text-text">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-action-100 text-action-fg"><StepIcon size={16} /></span>
            <span><span className="font-semibold text-muted">{n + 1}.</span> {text}</span>
          </li>
        ))}
      </ol>
    </Dialog>
  )
}

/* --------------------------------------------------------------- Review */
const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']

function ReviewHost() {
  const item = useCardActions((s) => s.review)
  const close = useCardActions((s) => s.close)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  if (!item) return null
  const done = () => {
    close('review')
    setRating(0)
    setText('')
  }
  return (
    <Dialog
      open={!!item}
      onOpenChange={(o) => !o && done()}
      title="Write a review"
      description={item.title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={done}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!rating}
            onClick={() => {
              done()
              toast('Thanks for your review', { description: `${rating} star${rating > 1 ? 's' : ''} · it appears after a quick check.` })
            }}
          >
            Post review
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-1 rounded-xl bg-surface-2 py-4">
          <StarInput value={rating} onChange={setRating} size={30} />
          <p className="h-5 text-sm font-semibold text-text">{RATING_WORDS[rating]}</p>
        </div>
        <Field label="Your review" optional hint="Be specific and fair. No phone numbers or links.">
          {(p) => <Textarea {...p} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="What went well? What could be better?" />}
        </Field>
      </div>
    </Dialog>
  )
}

/* --------------------------------------------------------------- Quick view */
function QuickView() {
  const item = useCardActions((s) => s.quickView)
  const close = useCardActions((s) => s.close)
  const navigate = useNavigate()
  if (!item) return null
  const to = detailPath(item)
  return (
    <Drawer open={!!item} onOpenChange={(o) => !o && close('quickView')} title="Quick view" width="max-w-md" footer={<Button variant="primary" block onClick={() => { close('quickView'); navigate(to) }}>View full details <ArrowRight size={16} /></Button>}>
      <MediaThumb item={item} media={item.media} className="aspect-[4/3]" />
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-1.5">
          <KindLabel kind={item.kind} count={item.itemCount} />
          {item.urgency && <UrgencyBadge urgency={item.urgency} size="xs" />}
          {item.status && <StatusBadge status={item.status} size="xs" />}
        </div>
        <h2 className="text-xl font-bold text-text">{item.title}</h2>
        <p className="tabular text-2xl font-extrabold text-text">{formatMoney(item.price ?? item.budget ?? item.totalBudget)}</p>
        {item.partner && (
          <p className="flex items-center gap-2 text-sm">
            <Avatar name={item.partner.name} hue={item.partner.avatarHue} size={24} /> {item.partner.name} {item.partner.verified && <VerifiedBadge compact />}
          </p>
        )}
        <p className="text-sm text-muted">{item.description ?? item.goal}</p>
        {item.serviceArea && (
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <MapPin size={14} /> {item.serviceArea.sector}, {item.serviceArea.district} · posted {ago(item.createdAt)}
          </p>
        )}
        {item.items && (
          <Card padded={false} className="divide-y divide-border">
            {item.items.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-3 text-sm">
                <span className="flex items-center gap-2">
                  <Layers size={14} className="text-muted" /> {i.title}
                  {i.quantity > 1 && ` ×${i.quantity}`}
                </span>
                <span className="tabular font-semibold">{formatMoney(i.budget)}</span>
              </div>
            ))}
          </Card>
        )}
        {item.progress && <ProgressBar value={item.progress.served} max={item.progress.total} label="Items served" />}
        {item.offerSlots && <SlotMeter used={item.offerSlots.used} limit={item.offerSlots.limit} />}
      </div>
    </Drawer>
  )
}

export function ActionHost() {
  return (
    <>
      <ServeDrawer />
      <ReneedDialog />
      <RejectHost />
      <ApproveHost />
      <AssignDrawer />
      <ReportHost />
      <ReviewHost />
      <VerifyPartnerHost />
      <QuickView />
      <CommentsPanel />
    </>
  )
}

