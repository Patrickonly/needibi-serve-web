import { Link, NavLink } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, LayoutDashboard, LayoutGrid, ClipboardList, Tag, Layers3, Bookmark } from 'lucide-react'
import { useUI, useAuth, ROLE_HOME } from '@/lib/store'
import { cn } from '@/lib/cn'

/** Collapsible, role-aware left menu shared by Home and the Needs / Deals / Bundles boards. */
export function DiscoverySidebar() {
  const collapsed = useUI((s) => s.sidebarCollapsed)
  const toggle = useUI((s) => s.toggleSidebar)
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.activeRole)
  const mine = !user ? [] : role === 'partner'
    ? [['/app/partner/requests', 'Requests for me', ClipboardList], ['/app/partner/deals', 'My deals', Tag], ['/app/partner/jobs', 'My activity', Layers3]]
    : role === 'needer'
      ? [['/app/needer/needs', 'My requests', ClipboardList], ['/app/needer/bundles', 'My bundles', Layers3], ['/app/needer/tracking', 'My activity', LayoutGrid]]
      : [[ROLE_HOME[role] ?? '/', 'My dashboard', LayoutDashboard]]
  const items = [['/', 'Home', LayoutGrid], ['/needs', 'Needs', ClipboardList], ['/deals', 'Deals', Tag], ['/bundles', 'Bundles', Layers3], ['/categories', 'Categories', LayoutGrid], ['/app/needer/saved', 'Saved items', Bookmark], ...mine]
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-[10.5rem] max-h-[calc(100dvh-11.5rem)] space-y-4 overflow-y-auto overscroll-contain p-1 scroll-on-hover">
        <div className="rounded-2xl border border-border bg-surface p-2.5 shadow-card">
          <div className={cn('flex items-center', collapsed ? 'justify-center' : 'justify-between pl-2.5')}>
            {!collapsed && <p className="font-display text-[15px] font-extrabold tracking-tight text-text">Discover</p>}
            <button type="button" onClick={toggle} aria-label={collapsed ? 'Show menu' : 'Hide menu'} aria-expanded={!collapsed} title={collapsed ? 'Show menu' : 'Hide menu'} className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-2 text-text transition hover:border-action-500 hover:bg-action-soft hover:text-action-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-action-500">
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
          <nav className="mt-2.5 space-y-0.5" aria-label="Marketplace discovery">
            {items.map(([to, label, IconComponent]) => (
              <NavLink key={to + label} to={to} end title={label} className={({ isActive }) => cn('flex items-center gap-3 rounded-xl py-2.5 text-sm font-semibold transition-colors', isActive ? 'bg-action-soft text-action-fg shadow-[inset_3px_0_0_var(--brand-yellow)]' : 'text-muted hover:bg-surface-2 hover:text-text', collapsed ? 'justify-center px-0' : 'px-3')}>
                <IconComponent size={18} className="text-[var(--brand-yellow-fg)]" />{!collapsed && label}
              </NavLink>
            ))}
          </nav>
        </div>
        {!collapsed && <div className="rounded-2xl border border-border bg-action-soft p-4 text-text">
          <p className="font-bold">Need a tailored service?</p>
          <p className="mt-1 text-sm leading-5 text-muted">Ask once and let trusted partners come to you.</p>
          <Link to="/app/needer/post" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-action-fg hover:underline">Request a service <ArrowRight size={14} /></Link>
        </div>}
      </div>
    </aside>
  )
}
