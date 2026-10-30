import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { House, ClipboardList, Plus, Tag, User, Layers3 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth, ROLE_HOME } from '@/lib/store'
import { usePostNeed } from './PublicHeader'

/** Phone bottom tab bar: Home · Needs · ➕ Post · Deals · Bundles · Account */
export function BottomTabBar() {
  const { t } = useTranslation()
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.activeRole)
  const postNeed = usePostNeed()
  const item = (to, label, Icon, end) => (
    <NavLink to={to} end={end} className={({ isActive }) => cn('flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold xs:text-[11px]', isActive ? 'text-action-fg' : 'text-muted')}>
      <Icon size={22} aria-hidden="true" />
      {label}
    </NavLink>
  )
  return (
    <nav aria-label="Bottom navigation" data-bottom-tabbar className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      {item('/', t('nav.home'), House, true)}
      {item('/needs', t('nav.needs'), ClipboardList)}
      <div className="flex flex-1 items-center justify-center">
        <button type="button" onClick={postNeed} aria-label={t('actions.postNeed')} className="-mt-6 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-action-500 text-white shadow-hover ring-4 ring-surface">
          <Plus size={26} strokeWidth={2.75} />
        </button>
      </div>
      {item('/deals', t('nav.deals'), Tag)}
      {item('/bundles', 'Bundles', Layers3)}
      {item(user ? ROLE_HOME[role] ?? '/app/needer/dashboard' : '/auth/login', t('nav.account'), User)}
    </nav>
  )
}
