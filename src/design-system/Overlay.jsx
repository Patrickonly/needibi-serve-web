import { useState } from 'react'
import * as D from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'
import { Field, Select, Textarea } from './Form'

export function Dialog({ open, onOpenChange, title, description, children, footer, size = 'md', trigger, hideClose }) {
  const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' }[size]
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <D.Trigger asChild>{trigger}</D.Trigger>}
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-overlay animate-fade-in" />
        <D.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[calc(100vw-32px)] -translate-x-1/2 -translate-y-1/2 flex-col rounded-modal bg-surface shadow-modal animate-pop focus:outline-none',
            w,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <D.Title className="text-lg font-bold text-text">{title}</D.Title>
              {description ? <D.Description className="mt-1 text-sm text-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
            </div>
            {!hideClose && (
              <D.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close" className="-mr-2 -mt-1">
                  <X size={18} />
                </Button>
              </D.Close>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

/** Side drawer (Quick view, Serve drawer, Assign drawer, mobile nav). */
export function Drawer({ open, onOpenChange, title, description, children, footer, side = 'right', width = 'max-w-lg', headerExtra, sheet = false }) {
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-overlay animate-fade-in" />
        <D.Content
          className={cn(
            'fixed z-50 flex w-full flex-col bg-surface shadow-modal focus:outline-none',
            width,
            sheet
              ? 'inset-x-0 bottom-0 h-[85dvh] max-w-none overflow-hidden rounded-t-3xl animate-slide-up sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:h-auto sm:rounded-none sm:animate-slide-in-right ' + width
              : side === 'right' ? 'inset-y-0 right-0 animate-slide-in-right' : 'inset-y-0 left-0 animate-slide-in-left',
          )}
        >
          {sheet && <span aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong sm:hidden" />}
          {title !== null && sheet && (
            <div className="relative shrink-0 px-12 py-3 text-center">
              <D.Title className="text-[15px] font-bold text-text">{title}</D.Title>
              <D.Description className="sr-only">{description || title}</D.Description>
              <D.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full">
                  <X size={20} />
                </Button>
              </D.Close>
            </div>
          )}
          {title !== null && !sheet && (
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div className="min-w-0">
                <D.Title className="text-lg font-bold text-text">{title}</D.Title>
                {description ? <D.Description className="mt-0.5 text-sm text-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
                {headerExtra}
              </div>
              <D.Close asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Close" className="-mr-2">
                  <X size={18} />
                </Button>
              </D.Close>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="border-t border-border bg-surface px-5 py-4">{footer}</div>}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirm', tone = 'primary', onConfirm, loading, children }) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}

export const REJECT_REASONS = {
  partner: ['Outside my service area', 'Not my category', 'Budget too low', 'No availability in this timeframe', 'Not enough information', 'Other'],
  admin: ['Contains contact details', 'Prohibited item or service', 'Misleading or unclear', 'Duplicate', 'Wrong category', 'Other'],
  offer: ['Price too high', 'Timeline does not work', 'Chose another offer', 'Scope does not match', 'Other'],
  message: ['Contains contact details', 'Spam or advertising', 'Abusive language', 'Duplicate', 'Off-topic', 'Other'],
  generic: ['Incomplete information', 'Policy violation', 'Suspected fraud', 'Other'],
}

/** Rejections always need a reason. */
export function ReasonDialog({ open, onOpenChange, title, description, reasons = REJECT_REASONS.generic, confirmLabel = 'Reject', onConfirm, loading, note }) {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const needsDetails = reason === 'Other'
  const valid = reason && (!needsDetails || details.trim().length >= 5)
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setReason('')
          setDetails('')
        }
        onOpenChange(o)
      }}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={!valid} loading={loading} onClick={() => onConfirm({ reason, details })}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Reason">
          {(p) => (
            <Select {...p} value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="">Choose a reason…</option>
              {reasons.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Details" optional={!needsDetails} hint={needsDetails ? 'Please explain in a few words.' : undefined}>
          {(p) => <Textarea {...p} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Add context the other side will see" />}
        </Field>
        {note && <p className="rounded-lg bg-info-100 px-3 py-2 text-sm text-info-fg">{note}</p>}
      </div>
    </Dialog>
  )
}
