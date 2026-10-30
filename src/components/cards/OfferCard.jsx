import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Check, X, CircleQuestionMark, Timer, MapPin, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { toast } from '@/lib/store'
import { formatMoney, countdown } from '@/lib/format'
import { useNow } from '@/lib/hooks'
import { Avatar, VerifiedBadge, Rating, Badge, Button, StatusBadge, ReasonDialog, REJECT_REASONS, Dialog, Textarea, Field } from '@/design-system'

/** Offer card with price breakdown, scope, validity countdown and Accept · Reject · Ask clarification. */
export function OfferCard({ offer, decidable = true, className, highlight }) {
  const qc = useQueryClient()
  const now = useNow(60_000)
  const [rejecting, setRejecting] = useState(false)
  const [asking, setAsking] = useState(false)
  const [question, setQuestion] = useState('')
  const fee = Math.round(offer.price.amount * 0.15)
  const expired = new Date(offer.validUntil).getTime() < now
  const live = ['submitted', 'clarification', 'revised'].includes(offer.status) && !expired

  const act = useMutation({
    mutationFn: ({ action, body }) => api.post(`/api/offers/${offer.id}/${action}`, body),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries()
      toast(action === 'accept' ? `Offer accepted — ${offer.partner.name} can now chat with you` : action === 'reject' ? 'Offer rejected — the slot is free again' : 'Question sent to the Partner')
      setRejecting(false)
      setAsking(false)
    },
  })

  return (
    <article className={cn('flex flex-col rounded-2xl border bg-surface-3 p-4 shadow-none', highlight ? 'border-trust-600 ring-2 ring-trust-600/20' : 'border-border', className)}>
      <div className="flex items-start gap-3">
        <Avatar name={offer.partner.name} hue={offer.partner.avatarHue} size={44} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-bold text-text">
            <Link to={`/partners/${offer.partner.handle}`} className="truncate hover:underline">
              {offer.partner.name}
            </Link>
            {offer.partner.verified && <VerifiedBadge compact />}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <Rating value={offer.partner.rating} size={11} />
            <span className="flex items-center gap-0.5">
              <MapPin size={12} aria-hidden="true" /> {offer.distanceKm} km
            </span>
          </div>
        </div>
        <StatusBadge status={expired && live ? 'expired' : offer.status} size="xs" />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone={offer.scope.kind === 'need' ? 'navy' : 'serve'} size="xs">
          {offer.scope.label ?? 'Whole Need'}
        </Badge>
        <Badge tone="grey" size="xs">
          {offer.timeline}
        </Badge>
        {live && (
          <Badge tone="warn" icon={<Timer size={12} />} size="xs">
            Valid {countdown(offer.validUntil, now)}
          </Badge>
        )}
      </div>

      <dl className="mt-3 space-y-1 rounded-lg bg-surface-2 p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Partner price</dt>
          <dd className="tabular font-semibold text-text">{formatMoney(offer.price.amount - fee)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Service fee (15%)</dt>
          <dd className="tabular text-text">{formatMoney(fee)}</dd>
        </div>
        <div className="flex justify-between border-t border-border pt-1.5">
          <dt className="font-bold text-text">You pay</dt>
          <dd className="tabular text-lg font-extrabold text-text">{formatMoney(offer.price)}</dd>
        </div>
      </dl>

      <ul className="mt-3 space-y-1 text-sm text-text">
        {offer.inclusions.map((i) => (
          <li key={i} className="flex items-center gap-2">
            <CircleCheck size={14} className="shrink-0 text-trust-fg" aria-hidden="true" /> {i}
          </li>
        ))}
      </ul>
      {offer.note && <p className="mt-2 text-sm italic text-muted">“{offer.note}”</p>}

      {decidable && live && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Button size="sm" variant="primary" loading={act.isPending && act.variables?.action === 'accept'} onClick={() => act.mutate({ action: 'accept' })}>
            <Check size={15} /> Accept
          </Button>
          <Button size="sm" variant="danger-outline" onClick={() => setRejecting(true)}>
            <X size={15} /> Reject
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAsking(true)} title="Ask clarification">
            <CircleQuestionMark size={15} /> Ask
          </Button>
        </div>
      )}

      <ReasonDialog
        open={rejecting}
        onOpenChange={setRejecting}
        title={`Reject ${offer.partner.name}'s offer?`}
        description="The Partner sees your reason. Their slot opens for another Partner."
        reasons={REJECT_REASONS.offer}
        loading={act.isPending}
        onConfirm={(r) => act.mutate({ action: 'reject', body: r })}
      />
      <Dialog
        open={asking}
        onOpenChange={setAsking}
        title="Ask for clarification"
        description="Structured Q&A before acceptance — contact details are not allowed."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAsking(false)}>
              Cancel
            </Button>
            <Button variant="primary" disabled={question.trim().length < 5} loading={act.isPending} onClick={() => act.mutate({ action: 'clarify', body: { question } })}>
              Send question
            </Button>
          </>
        }
      >
        <Field label="Your question">{(p) => <Textarea {...p} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. Does the price include replacing the pipe?" />}</Field>
      </Dialog>
    </article>
  )
}
