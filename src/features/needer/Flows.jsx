import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Hourglass, MessagesSquare, Signature, Wallet, CircleCheck, Gavel, Pencil, Repeat, FilePen, Archive, ArrowLeft, Tag, Upload, TableProperties, LayoutGrid, Lock, Smartphone, Landmark, Copy } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession, useCopy } from '@/lib/hooks'
import { usePaymentAccounts, ACCOUNT_TYPES } from '@/lib/paymentAccounts'
import { toast, useAuth } from '@/lib/store'
import { formatMoney, formatDate, formatDateTime, ago } from '@/lib/format'
import { Button, Card, CardTitle, JourneyStepper, StatusBadge, UrgencyBadge, Badge, Avatar, VerifiedBadge, Rating, EmptyState, Skeleton, Alert, Dialog, ConfirmDialog, Field, Input, Textarea, Select, Segmented, MediaThumb, KindLabel, DefinitionList, StarInput, LifecycleStepper, SlotMeter } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'
import { OfferCard } from '@/components/cards/OfferCard'
import { useCardActions } from '@/components/cards/actionsStore'
import { EscrowBanner, FeeBreakdown, Receipt } from '@/components/payments/Payments'
import { FileUploader } from '@/components/forms/inputs'
import { Timeline, BundleView } from '@/features/public/Details'

const JOURNEY_INDEX = { submitted: 0, under_review: 1, changes_requested: 1, published: 2, matching: 2, offers_received: 3, negotiating: 3, agreement_signed: 4, awaiting_payment: 5, payment_verified: 4, in_service: 4, delivered: 5, completed: 6, closed: 7, disputed: 5 }

function OffersCompare({ offers }) {
  const [view, setView] = useState('cards')
  if (!offers.length) return <EmptyState compact title="No offers yet" description="Verified Partners near you are being matched. We'll notify you the moment one serves." />
  const best = Math.min(...offers.map((o) => o.price.amount))
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Segmented size="sm" label="Offer view" value={view} onChange={setView} options={[{ value: 'cards', label: 'Cards', icon: <LayoutGrid size={14} /> }, { value: 'table', label: 'Compare', icon: <TableProperties size={14} /> }]} />
      </div>
      {view === 'cards' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{offers.map((o) => <OfferCard key={o.id} offer={o} highlight={o.status === 'accepted'} />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">Offer comparison</caption>
            <thead className="bg-surface-2">
              <tr>
                <th scope="col" className="px-3 py-2 text-left text-xs font-bold uppercase text-muted">Compare</th>
                {offers.map((o) => (
                  <th key={o.id} scope="col" className="px-3 py-2 text-left font-semibold text-text">{o.partner.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Price', (o) => <span className={cn('tabular font-bold', o.price.amount === best && 'text-trust-fg')}>{formatMoney(o.price)}{o.price.amount === best && ' · lowest'}</span>],
                ['Rating', (o) => <Rating value={o.partner.rating} size={12} />],
                ['Verified', (o) => (o.partner.verified ? <VerifiedBadge /> : '—')],
                ['Distance', (o) => `${o.distanceKm} km`],
                ['Timeline', (o) => o.timeline],
                ['Includes', (o) => o.inclusions.join(', ')],
                ['Valid until', (o) => formatDateTime(o.validUntil)],
                ['Status', (o) => <StatusBadge status={o.status} size="xs" />],
              ].map(([label, render]) => (
                <tr key={label} className="border-t border-border">
                  <th scope="row" className="bg-surface-2 px-3 py-2 text-left font-semibold text-muted">{label}</th>
                  {offers.map((o) => (
                    <td key={o.id} className="px-3 py-2 text-text">{render(o)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function DisputeDialog({ item, open, onOpenChange }) {
  const navigate = useNavigate()
  const [reason, setReason] = useState('Work not completed')
  const [desired, setDesired] = useState('Partial refund')
  const [details, setDetails] = useState('')
  const [files, setFiles] = useState([])
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Raise a dispute"
      description="Escrow stays held while a named admin reviews both sides."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="danger" disabled={details.trim().length < 10} onClick={async () => { const d = await api.create('disputes', { code: `DS-${Math.floor(1300 + Math.random() * 600)}`, refCode: item.code, refTitle: item.title, raisedBy: 'Aline Mukamana', raisedById: 'u-aline', against: 'Assigned Partner', reason, desiredResolution: desired, amount: item.agreedPrice ?? item.budget, status: 'open', assignedAdmin: 'Josiane U.' }); await api.update('needs', item.code, { status: 'disputed' }); onOpenChange(false); toast('Dispute opened', { description: 'Escrow is on hold until it is resolved.' }); navigate(`/app/needer/disputes/${d.code}`) }}>
            <Gavel size={16} /> Open dispute
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Reason">{(p) => <Select {...p} value={reason} onChange={(e) => setReason(e.target.value)}>{['Work not completed', 'Quality below agreement', 'Partner did not show up', 'Damaged item', 'Charged more than agreed'].map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
        <Field label="What happened?">{(p) => <Textarea {...p} rows={4} value={details} onChange={(e) => setDetails(e.target.value)} />}</Field>
        <Field label="Desired resolution">{(p) => <Select {...p} value={desired} onChange={(e) => setDesired(e.target.value)}>{['Full refund', 'Partial refund', 'Redo the work', 'Release payment'].map((r) => <option key={r}>{r}</option>)}</Select>}</Field>
        <FileUploader files={files} onChange={setFiles} compact label="Evidence (photos, receipts)" hint="Up to 5 MB each" accept="image/*,application/pdf" />
      </div>
    </Dialog>
  )
}

function ConfirmDialogFlow({ item, open, onOpenChange }) {
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) setStep(0) }}
      title={step === 0 ? 'Confirm satisfaction' : 'How did it go?'}
      description={step === 0 ? `This releases ${formatMoney(item.agreedPrice ?? item.budget)} from escrow to the Partner. Only confirm when the work is done.` : 'Your review is labelled “Verified transaction”.'}
      size="sm"
      footer={
        step === 0 ? (
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Not yet</Button>
            <Button variant="trust" onClick={async () => { await api.update('needs', item.code, { status: 'completed' }); qc.invalidateQueries(); setStep(1); toast('Escrow released — job closed') }}><CircleCheck size={16} /> Confirm & release</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Later</Button>
            <Button variant="primary" onClick={async () => { await api.create('reviews', { partnerId: item.assignedPartnerId, rating, comment, authorId: 'u-aline', authorName: 'Aline M.', status: 'pending', tags: [], verified: true, refTitle: item.title, kind: 'need' }); onOpenChange(false); toast('Thanks for your review') }}>Submit review</Button>
          </>
        )
      }
    >
      {step === 1 && (
        <div className="space-y-4">
          <StarInput value={rating} onChange={setRating} />
          <Field label="Comment" optional>{(p) => <Textarea {...p} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />}</Field>
        </div>
      )}
    </Dialog>
  )
}

/* ================================================================ Need detail (owner) */
export function NeedOwnerDetail() {
  const { code } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const open = useCardActions((s) => s.open)
  const [dispute, setDispute] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [archive, setArchive] = useState(false)
  const { data: need, isLoading, isError } = useQuery({ queryKey: ['needs', code], queryFn: () => api.one('needs', code), retry: false })
  const offers = useQuery({ queryKey: ['offers', 'need', code], queryFn: () => api.list('offers', { needCode: code, pageSize: 20, sort: 'price.amount' }) })
  const partner = useQuery({ queryKey: ['partners', need?.assignedPartnerId], queryFn: () => api.one('partners', need.assignedPartnerId), enabled: !!need?.assignedPartnerId })
  if (isLoading) return <Skeleton className="h-96 rounded-card" />
  if (isError) return <EmptyState title="Need not found" action={<Button to="/app/needer/needs">My Needs</Button>} />
  const offerList = offers.data?.data ?? []
  const accepted = offerList.find((o) => o.status === 'accepted')
  const price = need.agreedPrice ?? accepted?.price ?? need.budget

  // the one primary next action
  const next = {
    changes_requested: { label: 'Edit and resubmit', icon: Pencil, onClick: () => navigate(`/app/needer/post?edit=${need.code}`), note: 'Our reviewer asked for a change: please remove contact details from the description.' },
    offers_received: { label: 'Review offers below', icon: CircleCheck, onClick: () => document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth' }), note: `${offerList.filter((o) => ['submitted', 'revised', 'clarification'].includes(o.status)).length} offers are waiting for your decision.` },
    negotiating: { label: 'Open chat', icon: MessagesSquare, onClick: () => navigate(`/app/needer/messages?ref=${need.code}`), note: 'Agree the final price in chat; the Price panel syncs it to this Need.' },
    agreement_signed: { label: 'Pay safely', icon: Wallet, onClick: () => navigate(`/app/needer/checkout/${need.code}`), note: 'Agreement signed. Pay now — we hold the money until the work is done.' },
    awaiting_payment: { label: 'Pay safely', icon: Wallet, onClick: () => navigate(`/app/needer/checkout/${need.code}`), note: 'The provider has asked for payment.' },
    delivered: { label: 'Confirm satisfaction', icon: CircleCheck, onClick: () => setConfirm(true), note: 'The Partner marked this as delivered and uploaded evidence.' },
  }[need.status]

  return (
    <>
      <PageHeader
        back={{ to: '/app/needer/needs', label: 'My Needs' }}
        title={need.title}
        subtitle={`${need.code} · posted ${ago(need.createdAt)} · ${need.serviceArea.sector}, ${need.serviceArea.district}`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate(`/app/needer/post?edit=${need.code}`)} disabled={!['submitted', 'under_review', 'changes_requested', 'published', 'matching'].includes(need.status)}><Pencil size={15} /> Edit</Button>
            <Button variant="outline" size="sm" onClick={() => open('reneed', need)}><Repeat size={15} /> Repost</Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/app/needer/post?from=${need.code}`)}><FilePen size={15} /> Re-request</Button>
            <Button variant="ghost" size="sm" onClick={() => setArchive(true)}><Archive size={15} /> Archive</Button>
          </>
        }
      />
      <Card className="mb-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={need.status} size="md" />
          <UrgencyBadge urgency={need.urgency} />
          <Badge tone="grey">{need.visibility === 'public' ? 'Public' : 'Private'}</Badge>
          {need.anonymous && <Badge tone="grey">Posted anonymously</Badge>}
        </div>
        <JourneyStepper current={JOURNEY_INDEX[need.status] ?? 0} variant="compact" />
      </Card>

      {next && (
        <Alert tone="serve" title={next.note} className="mb-6" action={<Button variant="primary" size="sm" onClick={next.onClick}><next.icon size={15} /> {next.label}</Button>} />
      )}
      {need.status === 'disputed' && <Alert tone="danger" title="Dispute in progress" className="mb-6" action={<Button size="sm" variant="outline" to="/app/needer/disputes">View dispute</Button>}>Escrow is on hold until an admin resolves it.</Alert>}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <Card id="offers">
            <CardTitle sub="Accept · Reject · Ask clarification. Accepting closes only incompatible offers in the same scope." action={<SlotMeter used={need.offerSlots.used} limit={need.offerSlots.limit} />}>Offers</CardTitle>
            {offers.isLoading ? <Skeleton className="h-48 rounded-card" /> : <OffersCompare offers={offerList} />}
            {offerList.length > 0 && offerList.every((o) => ['rejected', 'expired', 'withdrawn'].includes(o.status)) && (
              <Alert tone="info" className="mt-4" title="All offers rejected">Matching restarts with new Partners automatically.</Alert>
            )}
          </Card>
          <Card>
            <CardTitle>Details</CardTitle>
            <div className="grid gap-5 md:grid-cols-[200px_1fr]">
              <MediaThumb item={need} media={need.media} className="aspect-square rounded-card" iconSize={48} />
              <div>
                <DefinitionList items={[['Budget', formatMoney(need.budget)], ['Negotiable', need.negotiable ? 'Yes' : 'No'], ['Timeframe', need.timeframe], ['Category', `${need.categoryName} › ${need.subtype}`], ['Recurrence', need.recurrence ? `${need.recurrence.frequency}, ${need.recurrence.cycles} cycles` : 'One-time'], ['Quantity', need.quantity]]} />
                <p className="mt-4 text-[15px] text-text">{need.description}</p>
              </div>
            </div>
          </Card>
          <Card>
            <CardTitle>Event timeline</CardTitle>
            <Timeline item={need} />
          </Card>
        </div>
        <aside className="space-y-4">
          <Card>
            <CardTitle>Assigned Partner</CardTitle>
            {partner.data ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar name={partner.data.name} hue={partner.data.avatarHue} size={44} />
                  <div>
                    <p className="flex items-center gap-1 font-semibold text-text">{partner.data.name} <VerifiedBadge compact /></p>
                    <Rating value={partner.data.rating} count={partner.data.reviewCount} size={12} className="text-xs" />
                  </div>
                </div>
                <Button variant="navy" block className="mt-4" to={`/app/needer/messages?ref=${need.code}`}><MessagesSquare size={16} /> Open chat</Button>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm text-muted"><Lock size={14} /> Assigned after you accept an offer. Partners open the chat — you can reply any time.</p>
            )}
          </Card>
          <Card>
            <CardTitle>Agreement</CardTitle>
            {['agreement_signed', 'awaiting_payment', 'payment_verified', 'in_service', 'delivered', 'completed'].includes(need.status) ? (
              <>
                <p className="flex items-center gap-2 text-sm text-trust-fg"><Signature size={16} /> Signed · version 2</p>
                <Button variant="outline" size="sm" block className="mt-3" to="/app/needer/agreements/AG-07100">View agreement</Button>
              </>
            ) : need.status === 'negotiating' ? (
              <Button variant="outline" size="sm" block to="/app/needer/agreements/AG-07100"><Signature size={15} /> Review & sign</Button>
            ) : (
              <p className="text-sm text-muted">Created automatically once you accept an offer.</p>
            )}
          </Card>
          <Card>
            <CardTitle>Payment</CardTitle>
            <FeeBreakdown amount={price.amount} />
            <EscrowBanner compact className="mt-3" />
            {['agreement_signed', 'awaiting_payment', 'negotiating'].includes(need.status) && <Button variant="primary" block className="mt-3" to={`/app/needer/checkout/${need.code}`}><Wallet size={16} /> Pay safely</Button>}
            {need.status === 'delivered' && <Button variant="trust" block className="mt-3" onClick={() => setConfirm(true)}><CircleCheck size={16} /> Confirm satisfaction</Button>}
          </Card>
          <Card>
            <CardTitle>Price history</CardTitle>
            <ol className="space-y-2 text-sm">
              <li className="flex justify-between"><span className="text-muted">Your budget</span><span className="tabular font-semibold">{formatMoney(need.budget)}</span></li>
              {offerList.slice(0, 3).map((o) => (
                <li key={o.id} className="flex justify-between"><span className="truncate text-muted">Offer · {o.partner.name}</span><span className="tabular">{formatMoney(o.price)}</span></li>
              ))}
              {accepted && <li className="flex justify-between border-t border-border pt-2"><span className="font-semibold text-text">Agreed price</span><span className="tabular font-extrabold text-trust-fg">{formatMoney(price)}</span></li>}
            </ol>
          </Card>
          {['in_service', 'delivered', 'payment_verified', 'completed'].includes(need.status) && (
            <Button variant="danger-outline" block onClick={() => setDispute(true)}><Gavel size={16} /> Raise a dispute</Button>
          )}
        </aside>
      </div>
      <DisputeDialog item={need} open={dispute} onOpenChange={setDispute} />
      <ConfirmDialogFlow item={need} open={confirm} onOpenChange={setConfirm} />
      <ConfirmDialog open={archive} onOpenChange={setArchive} title="Archive this Need?" description="It moves to History. You can Repost or Re-request it any time." confirmLabel="Archive" onConfirm={async () => { await api.update('needs', need.code, { status: 'archived' }); qc.invalidateQueries({ queryKey: ['needs'] }); setArchive(false); toast('Archived'); navigate('/app/needer/needs') }} />
    </>
  )
}

/* ================================================================ Bundle detail (owner) */
export function BundleOwnerDetail() {
  const { code } = useParams()
  const { data, isLoading, isError } = useQuery({ queryKey: ['bundles', code], queryFn: () => api.one('bundles', code), retry: false })
  if (isLoading) return <Skeleton className="h-96 rounded-card" />
  if (isError) return <EmptyState title="Bundle not found" action={<Button to="/app/needer/bundles">My Bundles</Button>} />
  const finance = data.items.reduce((acc, it) => ({ ...acc, [it.status === 'completed' ? 'paid' : 'open']: (acc[it.status === 'completed' ? 'paid' : 'open'] ?? 0) + it.budget.amount * it.quantity }), {})
  return (
    <>
      <PageHeader back={{ to: '/app/needer/bundles', label: 'My Bundles' }} title="Manage Bundle" subtitle={data.code} actions={<Button variant="outline" size="sm" to={`/app/needer/bundles/new?from=${data.code}`}><FilePen size={15} /> Re-create Bundle</Button>} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card><p className="text-sm text-muted">Paid / released</p><p className="tabular text-xl font-extrabold text-trust-fg">{formatMoney(finance.paid ?? 0)}</p></Card>
        <Card><p className="text-sm text-muted">Still to serve</p><p className="tabular text-xl font-extrabold text-text">{formatMoney(finance.open ?? 0)}</p></Card>
        <Card><p className="text-sm text-muted">Blocked items</p><p className="tabular text-xl font-extrabold text-danger-fg">{data.blockedItems}</p></Card>
      </div>
      <BundleView bundle={data} owner />
    </>
  )
}

/* ================================================================ Checkout */
function PayToAccounts({ reference, total }) {
  const accounts = usePaymentAccounts((s) => s.accounts).filter((a) => a.active)
  const copy = useCopy()
  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-display text-lg font-extrabold tracking-tight text-text">Send {formatMoney(total)} to one of these accounts</h3>
        <p className="mt-0.5 text-sm text-muted">Use <strong className="text-text">{reference}</strong> as the reference so we can match your payment, then upload the proof below.</p>
      </div>
      {accounts.length === 0 && <Alert tone="warn" title="No payment details available">Please contact support and we will send you the account to pay into.</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map((a) => {
          const Icon = a.type === 'bank' ? Landmark : Smartphone
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-surface-2/60 p-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-action-100 text-action-fg"><Icon size={18} /></span>
                <p className="font-bold text-text">{a.provider}</p>
              </div>
              <p className="mt-3 text-xs font-semibold text-muted">{ACCOUNT_TYPES[a.type]?.numberLabel}</p>
              <div className="flex items-center justify-between gap-2">
                <p className="tabular text-xl font-extrabold tracking-tight text-text">{a.number}</p>
                <Button size="sm" variant="outline" onClick={() => copy(a.number, 'Copied')} aria-label={`Copy ${a.provider} number`}><Copy size={14} /> Copy</Button>
              </div>
              <p className="mt-1 text-sm text-muted">{a.accountName}</p>
              {a.note && <p className="mt-1 text-xs text-muted">{a.note}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Checkout() {
  const { code } = useParams()
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useSession()
  const qc = useQueryClient()
  const isDeal = !/^N[SB]-/.test(code)
  const resource = isDeal ? 'deals' : code.startsWith('NB') ? 'bundles' : 'needs'
  const { data: item, isLoading } = useQuery({ queryKey: [resource, code], queryFn: () => api.one(resource, code) })
  const [step, setStep] = useState(0)
  const method = 'proof'
  const [promo, setPromo] = useState('')
  const [promoValue, setPromoValue] = useState(0)
  const [proofRef, setProofRef] = useState('')
  const [proofFiles, setProofFiles] = useState([])
  const [payment, setPayment] = useState(null)
  const assisted = useAuth((s) => !!s.assistedBy)
  const qty = Number(sp.get('qty') ?? 1)

  const amount = item ? (isDeal ? item.price.amount * qty : (item.agreedPrice ?? item.budget ?? item.totalBudget).amount) : 0
  const total = amount - promoValue

  const pay = useMutation({
    mutationFn: () => api.post('/api/payments', { method, amount: { amount: total, currency: 'RWF' }, refCode: isDeal ? sp.get('booking') ?? item.slug : item.code, refTitle: item.title, payerId: user.id, payerName: user.name, partnerId: item.partnerId ?? item.assignedPartnerId ?? 'pt-cleanpro', partnerName: item.partner?.name ?? 'CleanPro Rwanda', proofReference: proofRef.trim(), proofFile: proofFiles[0]?.name ?? 'payment-proof.jpg', proofBank: 'Proof of payment', proofUploadedBy: assisted ? 'agent' : 'needer' }),
    onSuccess: (p) => {
      setPayment(p)
      setStep(p.state === 'paid' ? 3 : 2)
      qc.invalidateQueries()
      if (isDeal) api.create('bookings', { code: `BK-${Math.floor(400000 + Math.random() * 99999)}`, dealSlug: item.slug, dealTitle: item.title, partner: item.partner, partnerId: item.partnerId, neederId: user.id, neederName: user.name, quantity: qty, amount: { amount: total, currency: 'RWF' }, scheduledFor: sp.get('date') ?? new Date().toISOString(), paymentState: p.state === 'paid' ? 'held' : 'pending', status: 'confirmed' })
    },
  })

  if (isLoading) return <Skeleton className="h-96 rounded-card" />
  if (!item) return <EmptyState title="Nothing to pay for" />
  const steps = ['Review', 'Pay & send proof', 'Approval', 'Receipt']
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader back={{ to: isDeal ? `/deals/${item.slug}` : `/app/needer/${resource}/${item.code}`, label: 'Back' }} title="Checkout" subtitle={item.title} />
      <LifecycleStepper steps={steps} current={step} className="mb-6" />
      <EscrowBanner className="mb-6" />
      {step === 0 && (
        <Card className="space-y-5">
          <div className="flex gap-3">
            <MediaThumb item={item} media={item.media} className="h-20 w-20 shrink-0 rounded-lg" iconSize={28} />
            <div>
              <KindLabel kind={item.kind} />
              <p className="mt-1 font-bold text-text">{item.title}</p>
              <p className="text-sm text-muted">{isDeal ? `${item.partner.name} · qty ${qty}${sp.get('date') ? ` · ${formatDate(sp.get('date'))}` : ''}` : `${item.code} · agreed price`}</p>
            </div>
          </div>
          <FeeBreakdown amount={amount} promo={promoValue} />
          <div className="flex gap-2">
            <Input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} placeholder="Promo code" aria-label="Promo code" leading={<Tag size={16} />} />
            <Button variant="outline" disabled={!promo} onClick={() => { if (/^(KARIBU|FIRSTNEED|WEEKEND)\d*$/.test(promo)) { setPromoValue(Math.min(5000, Math.round(amount * 0.05))); toast('Promo applied') } else toast('That promo code is not valid', { tone: 'danger' }) }}>Apply</Button>
          </div>
          {amount > 1000000 && <Alert tone="info">Large job: you can pay in milestones. The first milestone (40%) is {formatMoney(Math.round(total * 0.4))}.</Alert>}
          <PayToAccounts reference={item.code ?? item.slug} total={total} />
          <Button variant="primary" size="lg" block onClick={() => setStep(1)}>Continue to payment</Button>
        </Card>
      )}
      {step === 1 && (
        <Card className="space-y-5">
          <PayToAccounts reference={item.code ?? item.slug} total={total} />
          <div className="space-y-3">
            <Field label="Transaction ID or deposit reference">{(p) => <Input {...p} value={proofRef} onChange={(e) => setProofRef(e.target.value)} placeholder="From the confirmation SMS or deposit slip" />}</Field>
            <FileUploader files={proofFiles} onChange={setProofFiles} compact label="Upload a screenshot, receipt or deposit slip" hint="Photo or PDF" accept="image/*,application/pdf" />
            <p className="flex items-start gap-1.5 text-xs text-muted"><Lock size={13} className="mt-0.5 shrink-0" /> Our finance team checks every payment by hand before the Partner can start, usually in a few minutes.</p>
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft size={16} /> Back</Button>
            <Button variant="primary" size="lg" block loading={pay.isPending} disabled={!proofRef.trim() || !proofFiles.length} onClick={() => pay.mutate()}><Upload size={17} /> Submit proof of {formatMoney(total)}</Button>
          </div>
        </Card>
      )}
      {step === 2 && payment && (
        <Card className="py-10 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-action-100 text-action-fg"><Hourglass size={36} /></span>
          <h2 className="mt-5 text-xl font-bold text-text">Proof sent — waiting for approval</h2>
          <p className="mx-auto mt-1 max-w-md text-muted">Our finance team is checking <strong className="tabular text-text">{formatMoney(total)}</strong> against reference <strong className="text-text">{payment.proofReference}</strong>, usually in a few minutes. We'll notify you when it is approved and the Partner can start.</p>
          <Button variant="outline" className="mt-6" onClick={() => setStep(3)}>View receipt</Button>
        </Card>
      )}
      {step === 3 && payment && (
        <div className="space-y-4">
          {payment.state === 'verifying' && <Alert tone="info" title="Waiting for approval">Your proof is with our finance team. The money is held in escrow once it is approved.</Alert>}
          {payment.state === 'paid' && <Alert tone="trust" title="Paid · held in escrow">The Partner has been notified and can start. You'll release payment when you confirm satisfaction.</Alert>}
          {payment.state === 'failed' && <Alert tone="danger" title="Payment failed" action={<Button size="sm" variant="outline" onClick={() => setStep(1)}>Try again</Button>}>No money was taken.</Alert>}
          <Receipt payment={payment} />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => navigate(isDeal ? '/app/needer/bookings' : `/app/needer/${resource}/${item.code}`)}>{isDeal ? 'Go to my bookings' : 'Track my Need'}</Button>
            <Button variant="outline" to="/app/needer/payments">All payments</Button>
          </div>
        </div>
      )}
    </div>
  )
}
