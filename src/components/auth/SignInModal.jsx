import { useNavigate } from 'react-router-dom'
import * as D from '@radix-ui/react-dialog'
import { ShieldCheck, LogIn, UserPlus, X, Megaphone, Wallet, BadgeCheck } from 'lucide-react'
import { useGate } from '@/lib/store'
import { Button, LogoMark } from '@/design-system'

const BENEFITS = [
  [Megaphone, 'Post Needs for free'],
  [Wallet, 'Escrow-safe payments'],
  [BadgeCheck, 'Verified Partners'],
]

/** Opens on any gated action; after sign-in the user returns to the same item. */
export function SignInModal() {
  const { open, reason, returnTo, close } = useGate()
  const navigate = useNavigate()
  const go = (path) => {
    close()
    navigate(`${path}?returnTo=${encodeURIComponent(returnTo ?? '/')}`)
  }

  return (
    <D.Root open={open} onOpenChange={(o) => !o && close()}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-overlay backdrop-blur-[2px] animate-fade-in" />
        <D.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl bg-surface shadow-modal animate-pop focus:outline-none">
          <div className="relative bg-primary-900 px-6 pb-7 pt-8 text-center text-white">
            <D.Close asChild>
              <Button variant="ghost-white" size="icon-sm" aria-label="Close" className="absolute right-3 top-3">
                <X size={18} />
              </Button>
            </D.Close>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-card">
              <LogoMark size={40} />
            </span>
            <D.Title className="mt-4 font-display text-xl font-bold tracking-tight">Sign in to continue</D.Title>
            <D.Description className="mx-auto mt-1.5 max-w-xs text-sm leading-5 text-white/75">
              {reason || 'Join free — posting a Need costs nothing.'}
            </D.Description>
          </div>

          <div className="space-y-3 px-6 pb-5 pt-6">
            <Button variant="primary" size="lg" block onClick={() => go('/auth/login')}>
              <LogIn size={18} /> Sign in
            </Button>
            <Button variant="outline" size="lg" block onClick={() => go('/auth/register')}>
              <UserPlus size={18} /> Create a free account
            </Button>

            <ul className="grid grid-cols-3 gap-2 pt-3">
              {BENEFITS.map(([BenefitIcon, label]) => (
                <li key={label} className="flex flex-col items-center gap-2 rounded-xl bg-surface-2 px-2 py-3 text-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-action-100 text-action-fg">
                    <BenefitIcon size={17} />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight text-text">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center justify-center gap-1.5 border-t border-border bg-surface-2 px-6 py-3.5 text-xs text-muted">
            <ShieldCheck size={14} className="shrink-0 text-trust-fg" /> We never show your phone, email or address publicly.
          </p>
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}
