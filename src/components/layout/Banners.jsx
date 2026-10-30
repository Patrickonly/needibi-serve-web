import { Link } from 'react-router-dom'
import { CircleAlert, Wallet, CircleQuestionMark, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'

const ICON = { quote: CircleAlert, payment: Wallet, info: CircleQuestionMark }

/** ActionNeededBanner slot from the page template: everything waiting on the user. */
export function ActionNeededBanner({ actions = [], needer, className }) {
  if (!actions.length) return null
  const who = needer && [needer.name, needer.phone, needer.district].filter(Boolean).join(' · ')
  return (
    <section aria-label="Action needed" className={cn('overflow-hidden rounded-card border border-action-500/40 bg-action-soft', className)}>
      <p className="flex items-center gap-2 border-b border-action-500/20 px-4 py-2.5 text-sm font-bold text-action-fg">
        <CircleAlert size={16} /> Action needed · {actions.length}
      </p>
      {who && <p className="border-b border-action-500/20 px-4 py-2 text-xs font-semibold text-muted">For needer: <span className="text-text">{who}</span></p>}
      <ul className="divide-y divide-action-500/15">
        {actions.map((a) => {
          const Icon = ICON[a.kind] ?? CircleAlert
          return (
            <li key={a.title}>
              <Link to={a.link} className="flex items-center gap-3 px-4 py-3 hover:bg-action-500/10">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-action-fg">
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-text">{a.title}</span>
                <span className="hidden shrink-0 items-center gap-1 text-sm font-bold text-text sm:flex">
                  {a.cta} <ArrowRight size={15} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
