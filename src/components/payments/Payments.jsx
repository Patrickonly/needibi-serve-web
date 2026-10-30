import { Smartphone, CreditCard, Upload, CircleCheck, Printer, Download } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatMoney, formatDateTime } from '@/lib/format'
import { PAYMENT_METHODS } from '@/lib/status'
import { Button, StatusBadge, LogoMark } from '@/design-system'

/** Shown on every payment step. */
export function EscrowBanner({ className, compact }) {
  return null
}

const METHOD_ICON = { momo: Smartphone, airtel: Smartphone, card: CreditCard, proof: Upload }
const METHOD_TONE = { momo: 'bg-primary-100 text-primary', airtel: 'bg-primary-100 text-primary', card: 'bg-primary-100 text-primary', proof: 'bg-grey-100 text-text' }
const METHOD_DESC = { momo: 'Send with MoMo Pay, then upload proof', airtel: 'Send with Airtel Money, then upload proof', card: 'Pay at the desk or by link, then upload the slip', proof: 'Bank or cash deposit, with reference' }

/** Mobile money first (MTN MoMo, Airtel Money), then Card and Upload proof. */
export function PaymentMethodPicker({ value, onChange }) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-2">
      {Object.entries(PAYMENT_METHODS).map(([k, m]) => {
        const Icon = METHOD_ICON[k]
        const active = value === k
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(k)}
            className={cn('flex items-center gap-3 rounded-card border bg-surface p-4 text-left transition', active ? 'border-action-500 ring-2 ring-action-500/30' : 'border-border hover:border-border-strong')}
          >
            <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold', METHOD_TONE[k])}>
              <Icon size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-text">{m.label}</span>
              <span className="block text-xs text-muted">{METHOD_DESC[k]}</span>
            </span>
            {active && <CircleCheck size={20} className="text-action-fg" />}
          </button>
        )
      })}
    </div>
  )
}

export function FeeBreakdown({ amount, feePct = 15, promo = 0, className }) {
  const fee = Math.round(amount * (feePct / 100))
  return (
    <dl className={cn('space-y-1.5 text-sm', className)}>
      <div className="flex justify-between">
        <dt className="text-muted">Agreed price</dt>
        <dd className="tabular font-semibold text-text">{formatMoney(amount)}</dd>
      </div>
      <div className="flex justify-between text-xs">
        <dt className="text-muted">↳ Partner receives ({100 - feePct}%)</dt>
        <dd className="tabular text-muted">{formatMoney(amount - fee)}</dd>
      </div>
      <div className="flex justify-between text-xs">
        <dt className="text-muted">↳ Platform fee ({feePct}%)</dt>
        <dd className="tabular text-muted">{formatMoney(fee)}</dd>
      </div>
      {promo > 0 && (
        <div className="flex justify-between">
          <dt className="text-trust-fg">Promo code</dt>
          <dd className="tabular font-semibold text-trust-fg">− {formatMoney(promo)}</dd>
        </div>
      )}
      <div className="flex justify-between border-t border-border pt-2">
        <dt className="font-bold text-text">Total to pay</dt>
        <dd className="tabular text-xl font-extrabold text-text">{formatMoney(amount - promo)}</dd>
      </div>
    </dl>
  )
}

export function Receipt({ payment, className }) {
  return (
    <article className={cn('rounded-card border border-border bg-surface p-5 shadow-card', className)} aria-label="Payment receipt">
      <header className="flex items-start justify-between gap-3 border-b border-dashed border-border pb-4">
        <div className="flex items-center gap-2">
          <LogoMark size={32} />
          <div>
            <p className="font-bold text-text">Payment receipt</p>
            <p className="text-xs text-muted">NEEDIBI ONLINE SERVICES LTD · Kigali</p>
          </div>
        </div>
        <StatusBadge status={payment.state} />
      </header>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 py-4 text-sm">
        <dt className="text-muted">Reference</dt>
        <dd className="tabular text-right font-semibold text-text">{payment.ref}</dd>
        <dt className="text-muted">For</dt>
        <dd className="text-right text-text">{payment.refTitle}</dd>
        <dt className="text-muted">Partner</dt>
        <dd className="text-right text-text">{payment.partnerName}</dd>
        <dt className="text-muted">Method</dt>
        <dd className="text-right text-text">{PAYMENT_METHODS[payment.method]?.label}</dd>
        <dt className="text-muted">Date</dt>
        <dd className="text-right text-text">{formatDateTime(payment.createdAt)}</dd>
        {payment.proofReference && (
          <>
            <dt className="text-muted">Proof reference</dt>
            <dd className="tabular text-right text-text">{payment.proofReference}</dd>
          </>
        )}
        <dt className="text-muted">Escrow</dt>
        <dd className="text-right">
          <StatusBadge status={payment.escrow === 'none' ? 'pending' : payment.escrow} size="xs" />
        </dd>
      </dl>
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="font-bold text-text">{payment.state === 'paid' ? 'Total paid' : 'Amount sent'}</span>
        <span className="tabular text-2xl font-extrabold text-text">{formatMoney(payment.amount)}</span>
      </div>
      <div className="mt-4 flex gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer size={15} /> Print
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Download size={15} /> Download PDF
        </Button>
      </div>
    </article>
  )
}
