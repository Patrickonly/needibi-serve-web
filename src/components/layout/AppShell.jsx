import { useEffect, useRef, useState, Suspense } from 'react'
import { NavLink, Outlet, Link, useLocation, useNavigate, Navigate, ScrollRestoration } from 'react-router-dom'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Menu as MenuIcon, PanelLeftClose, PanelLeftOpen, ChevronRight, ArrowLeft, CircleHelp, Search, Store, Tag, HandHelping, Package, CornerDownLeft } from 'lucide-react'
import * as D from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'
import { useTx } from '@/lib/phrases'
import { api } from '@/lib/api'
import { useDebounced } from '@/lib/hooks'
import { detailPath } from '@/components/cards/actionsStore'
import { useAuth, useUI, ROLE_LABEL, ROLE_HOME } from '@/lib/store'
import { Logo, Button, Skeleton, Toaster, OfflineBanner, Tooltip, Badge, Avatar } from '@/design-system'
import { SignInModal } from '@/components/auth/SignInModal'
import { ActionHost } from '@/components/cards/ActionHost'
import { HelpCenter, useHelp } from '@/components/help/HelpCenter'
import { NAV } from './nav'
import { NotificationBell, AccountMenu, LanguageMenu, ThemeToggle } from './HeaderMenus'

function resolveParams(params, user) {
  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v === '$user' ? user.id : v === '$partner' ? user.partnerId : v]))
}

function useNavCounts(groups, user) {
  const items = groups.flatMap((g) => g.items).filter((i) => i.count?.resource)
  const results = useQueries({
    queries: items.map((i) => ({
      queryKey: ['navcount', i.to, user?.id],
      queryFn: () => api.list(i.count.resource, { ...resolveParams(i.count.params, user), pageSize: 1 }),
      enabled: !!user,
      staleTime: 60_000,
    })),
  })
  const map = {}
  items.forEach((i, k) => (map[i.to] = results[k].data?.meta.total))
  return map
}

// Signed-in Needers, Partners and Agents can jump back into the public marketplace at any time.
const MARKETPLACE = { group: 'Marketplace', items: [
  { label: 'Browse Deals', to: '/deals', icon: Tag },
  { label: 'Needs board', to: '/needs', icon: HandHelping },
  { label: 'Bundles', to: '/bundles', icon: Package },
] }

// Plain-language labels are used in the desktop workspace so first-time users
// can understand the task before they learn the platform vocabulary.
const PLAIN_LABELS = {
  'Overview': 'Start here',
  'Marketplace': 'Find services',
  'My requests': 'My requests',
  'Activity': 'My activity',
  'Help': 'Help & account',
  'Deals': 'Bookings',
  'Money': 'Money',
  'Engage': 'Communication',
  'Account': 'Account',
  'Workspaces': 'People I help',
  'Work': 'My tasks',
  'People': 'People',
  'Requests': 'Service requests',
  'Moderation': 'Safety checks',
  'Catalogue': 'Categories',
  'Payments & fees': 'Money & payments',
  'Safety & support': 'Safety & help',
  'Content': 'Website content',
  'Reports & Logs': 'Reports',
  'Dashboard': 'Home',
  'Post a Need': 'Request a service',
  'My Needs': 'My requests',
  'Bundles': 'Grouped requests',
  'Tracking': 'Track my service',
  'Offers': 'Quotes from providers',
  'Deals & Bookings': 'Bookings',
  'Agreements': 'Contracts',
  'Messages': 'Messages',
  'Saved': 'Saved services',
  'History': 'Past requests',
  'Following': 'Following',
  'Reviews': 'My reviews',
  'Disputes': 'Problems with a service',
  'Appeals': 'Request a review',
  'Notifications': 'Alerts',
  'Profile': 'My profile',
  'Settings': 'Settings',
  'Requests': 'Customer requests',
  'My Offers': 'My quotes',
  'Active Jobs': 'Active work',
  'My Deals': 'My services',
  'Booked Deals': 'Bookings',
  'Earnings': 'Income',
  'Payouts': 'Withdraw money',
  'Profile & Studio': 'My business profile',
  'Guilds': 'Provider groups',
  'Verification': 'Identity check',
  'Agreement & Plan': 'Plan and contract',
  'Home': 'Home',
  'Needer Assistance': 'Help customers',
  'Partner Assistance': 'Help service providers',
  'Assigned cases': 'Assigned tasks',
  'Follow-ups': 'Follow-up reminders',
  'Referrals': 'People I referred',
  'Commissions': 'My rewards',
  'All users': 'Everyone',
  'Needers': 'Customers',
  'Partners': 'Service providers',
  'Agents': 'Community helpers',
  'Roles & permissions': 'Access settings',
  'Review queue': 'Items to review',
  'Needs': 'Service requests',
  'Matching': 'Find a provider',
  'Banned terms': 'Blocked words',
  'Payments': 'Payments',
  'Escrow': 'Protected payments',
  'Proofs': 'Proof of service',
  'Fees & commissions': 'Fees and rewards',
  'Subscriptions': 'Plans',
  'Promo codes': 'Discount codes',
  'Tickets': 'Support requests',
  'Inbox': 'Support inbox',
  'Home merchandising': 'Homepage content',
  'Help Centre': 'Help centre',
  'Audit logs': 'Change history',
  'Activity logs': 'Activity history',
  'Platform settings': 'Platform settings',
  'Browse Deals': 'Find services',
  'Needs board': 'Service requests',
}

function plainLabel(label, tx) {
  return PLAIN_LABELS[label] ?? tx(label)
}

function SidebarNav({ role, collapsed, onNavigate, simplify = false }) {
  const user = useAuth((s) => s.user)
  const tx = useTx()
  const groups = [...(NAV[role] ?? []), ...(role === 'admin' ? [] : [MARKETPLACE])]
  const counts = useNavCounts(groups, user)
  const renderGroup = (g) => (
    <div key={g.group} className="mb-3">
      {!collapsed && <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{plainLabel(g.group, tx)}</p>}
      {collapsed && <div className="mx-3 my-2 h-px bg-border" />}
      <ul className="space-y-0.5">
        {g.items.map((item) => {
          const Icon = item.icon
          const count = item.count?.static ?? counts[item.to]
          const link = (
            <NavLink
              to={item.to}
              end={item.end}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'sidebar-link group relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13px] font-medium transition-colors',
                  isActive ? 'font-semibold before:absolute before:inset-y-2 before:-left-3 before:w-1 before:rounded-r-full before:bg-action-500' : 'text-muted hover:bg-surface-2 hover:text-text',
                  collapsed && 'justify-center px-0',
                )
              }
            >
              <Icon size={17} strokeWidth={1.8} className={cn('sidebar-icon shrink-0', item.accent && 'sidebar-icon-accent')} aria-hidden="true" />
              {!collapsed && <span className="flex-1 truncate">{plainLabel(item.label, tx)}</span>}
              {count > 0 && (
                <span className={cn('tabular rounded-full bg-action-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-on-action', collapsed && 'absolute right-1 top-1 px-1')}>
                  {count > 99 ? '99+' : count}
                  <span className="sr-only"> items</span>
                </span>
              )}
            </NavLink>
          )
          return <li key={item.to}>{collapsed ? <Tooltip content={plainLabel(item.label, tx)} side="right">{link}</Tooltip> : link}</li>
        })}
      </ul>
    </div>
  )
  return (
    <nav aria-label={`${ROLE_LABEL[role]} navigation`} className="scroll-on-hover flex-1 overflow-y-auto overscroll-contain px-3 py-3">
      {groups.map(renderGroup)}
    </nav>
  )
}

/** Top-bar search: jumps to any page in your menu, or searches the marketplace. Ctrl/⌘ + K focuses it. */
function AppSearch({ role }) {
  const tx = useTx()
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const pages = [...(NAV[role] ?? []), ...(role === 'admin' ? [] : [MARKETPLACE])].flatMap((g) => g.items.map((i) => ({ ...i, group: g.group })))
  const term = q.trim().toLowerCase()
  const hits = term ? pages.filter((p) => `${tx(p.label)} ${p.label} ${tx(p.group)}`.toLowerCase().includes(term)).slice(0, 7) : pages.slice(0, 6)
  const debounced = useDebounced(term, 250)
  const remote = useQuery({
    queryKey: ['app-search', debounced],
    queryFn: () => api.get('/api/search', { q: debounced, pageSize: 6 }),
    enabled: debounced.length >= 2,
    staleTime: 30_000,
  })
  const KIND_ICON = { need: HandHelping, bundle: Package, deal: Tag, partner: Store }
  const found = term.length >= 2 ? (remote.data?.data ?? []).slice(0, 6).map((r) => ({ icon: KIND_ICON[r.kind] ?? Search, label: r.title ?? r.name, group: r.kind === 'partner' ? 'Partner' : r.kind === 'deal' ? 'Deal' : r.kind === 'bundle' ? 'Bundle' : 'Need', to: detailPath(r) })) : []
  const results = [...hits, ...found, ...(term ? [{ market: true, label: `Search the marketplace for “${q.trim()}”`, to: `/search?q=${encodeURIComponent(q.trim())}` }] : [])]
  const go = (r) => {
    setOpen(false)
    setQ('')
    inputRef.current?.blur()
    navigate(r.to)
  }
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && results[active]) { e.preventDefault(); go(results[active]) }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }
  return (
    <div className="relative w-full">
      <div className="flex h-10 items-center rounded-full border border-border bg-surface-2 transition-colors focus-within:border-action-500 focus-within:bg-surface focus-within:ring-4 focus-within:ring-action-500/15">
        <Search size={17} className="ml-3.5 shrink-0 text-muted" aria-hidden="true" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
          placeholder={tx('Search menu or marketplace…')}
          aria-label={tx('Search menu or marketplace…')}
          role="combobox"
          aria-expanded={open}
          aria-controls="app-search-list"
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-text placeholder:text-muted focus:outline-none"
        />
        <kbd className="mr-2 hidden shrink-0 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted xl:inline">Ctrl K</kbd>
      </div>
      {open && results.length > 0 && (
        <ul id="app-search-list" role="listbox" className="absolute inset-x-0 top-12 z-50 max-h-[70vh] animate-pop overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-modal">
          <li className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{tx(term ? 'Results' : 'Jump to')}</li>
          {results.map((r, n) => {
            const Icon = r.market ? Search : r.icon
            return (
              <li key={r.to + n} role="option" aria-selected={n === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(n)}
                  onClick={() => go(r)}
                  className={cn('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm', n === active ? 'bg-action-soft text-action-fg' : 'text-text')}
                >
                  <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', n === active ? 'bg-action-600 text-white' : 'bg-surface-2 text-muted')}><Icon size={16} /></span>
                  <span className="min-w-0 flex-1 truncate font-medium">{r.market ? r.label : plainLabel(r.label, tx)}</span>
                  {!r.market && <span className="shrink-0 text-xs text-muted">{plainLabel(r.group, tx)}</span>}
                  {n === active && <CornerDownLeft size={14} className="shrink-0" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function MarketplaceLabel({ text = 'Marketplace' }) {
  return useTx()(text)
}

function Breadcrumb() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs = parts
    .map((p, i) => {
      const raw = decodeURIComponent(p)
      // keep item codes (NS-26-08731, AG-07100…) intact; prettify route slugs
      const label = /^[A-Z]{2}-/.test(raw) ? raw : raw.replace(/-/g, ' ')
      return { label, to: '/' + parts.slice(0, i + 1).join('/') }
    })
    .filter((c) => !['app'].includes(c.label))
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 2xl:block">
      <ol className="flex items-center gap-1 text-sm text-muted">
        <li>
          <Link to="/" className="hover:text-text">
            Home
          </Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={c.to} className="flex min-w-0 items-center gap-1">
            <ChevronRight size={14} aria-hidden="true" />
            {i === crumbs.length - 1 ? (
              <span aria-current="page" className="truncate font-semibold capitalize text-text">
                {c.label}
              </span>
            ) : (
              <Link to={c.to} className="truncate capitalize hover:text-text">
                {c.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function PageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-card" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-card" />
    </div>
  )
}

/** Guards a role workspace; guests go to login and come back afterwards. */
export function RequireRole({ role, children }) {
  const user = useAuth((s) => s.user)
  const active = useAuth((s) => s.activeRole)
  const switchRole = useAuth((s) => s.switchRole)
  const assistTarget = useAuth((s) => s.assistTarget)
  const location = useLocation()
  const allowed = !!user?.roles.includes(role)
  useEffect(() => {
    if (allowed && active !== role) switchRole(role)
  }, [allowed, active, role, switchRole])
  if (!user) return <Navigate to={`/auth/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`} replace />
  // An area the account can't use is hidden rather than explained: send them to their own
  // dashboard instead of showing a "this area is for X accounts" dead end.
  // Starting an assist swaps the session while the agent area is still mounted; send the agent to
  // the task they picked rather than the client's home.
  if (!user.roles.includes(role)) return <Navigate to={assistTarget ?? ROLE_HOME[active] ?? '/'} replace />
  return children
}

export function AssistBanner() {
  const user = useAuth((s) => s.user)
  const assistedBy = useAuth((s) => s.assistedBy)
  const endAssist = useAuth((s) => s.endAssist)
  const assistTarget = useAuth((s) => s.assistTarget)
  const clearAssistTarget = useAuth((s) => s.clearAssistTarget)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => {
    if (assistTarget && pathname === assistTarget) clearAssistTarget()
  }, [assistTarget, pathname, clearAssistTarget])
  if (!assistedBy) return null
  const who = user?.partnerName ?? user?.name
  return (
    <div role="status" className="sticky top-16 z-20 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-warn-600/30 bg-warn-100 px-4 py-2.5 text-sm text-warn-fg md:px-6 lg:px-8">
      <HandHelping size={18} className="shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">
        <strong>Helping {who}.</strong> Everything you do here is done for them by {assistedBy.user.name}.
      </p>
      <Button size="sm" variant="outline" onClick={() => { const back = assistedBy.activeRole; endAssist(); navigate(ROLE_HOME[back] ?? '/') }}>
        <ArrowLeft size={15} /> Back to my agent workspace
      </Button>
    </div>
  )
}

export function AppShell({ role }) {
  const collapsed = useUI((s) => s.sidebarCollapsed)
  const toggle = useUI((s) => s.toggleSidebar)
  const [drawer, setDrawer] = useState(false)
  const user = useAuth((s) => s.user)
  const location = useLocation()
  const navigate = useNavigate()
  const tx = useTx()
  const simpleRole = { needer: 'Customer', partner: 'Service provider', agent: 'Agent', admin: 'Administrator' }[role] ?? tx(ROLE_LABEL[role])

  return (
    <RequireRole role={role}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-action-500 focus:px-4 focus:py-2 focus:font-bold focus:text-white">
        Skip to content
      </a>
      <OfflineBanner />
      <div className="flex min-h-dvh bg-bg">
        {/* desktop / tablet sidebar */}
        <aside className={cn('sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex reference-sidebar dashboard-sidebar', collapsed ? 'w-[72px]' : 'w-[72px] lg:w-[252px]')}>
          <div className={cn('flex h-16 shrink-0 items-center border-b border-border px-5', collapsed && 'justify-center px-0')}>
            <span className={cn(collapsed ? 'block' : 'block lg:hidden')}>
              <Logo compact />
            </span>
            <span className={cn(collapsed ? 'hidden' : 'hidden lg:block')}>
              <Logo horizontal />
            </span>
          </div>
          {/* signed-in account and access level, always at the top */}
          <div className={cn('shrink-0 px-3 pt-3', collapsed ? 'flex justify-center' : 'lg:block')}>
            <div className={cn('flex items-center gap-3 rounded-xl bg-surface-2 p-2.5 ring-1 ring-border', collapsed ? 'justify-center bg-transparent p-1 ring-0' : 'max-lg:justify-center max-lg:bg-transparent max-lg:p-1 max-lg:ring-0')}>
              <Avatar name={user?.name} hue={user?.avatarHue} size={34} />
              <div className={cn('min-w-0 flex-1 text-xs', collapsed ? 'hidden' : 'hidden lg:block')}>
                <p className="truncate text-[13px] font-semibold text-text">{user?.partnerName ?? user?.name}</p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-muted">
                  <span className="rounded bg-action-soft px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-action-fg">{ROLE_LABEL[role]}</span>
                  <span className="truncate">{role === 'partner' ? 'Level 3' : role === 'agent' ? user?.agentCode : role === 'admin' ? user?.staffRole ?? 'Admin' : user?.district}</span>
                </p>
              </div>
            </div>
          </div>
          {/* tablet: icons only; desktop: user choice */}
          <div className={cn('flex min-h-0 flex-1 flex-col', collapsed ? '' : 'lg:hidden')}>
            <SidebarNav role={role} collapsed />
          </div>
          <div className={cn('min-h-0 flex-1 flex-col', collapsed ? 'hidden' : 'hidden lg:flex')}>
            <SidebarNav role={role} collapsed={false} simplify />
          </div>
        </aside>

        {/* phone drawer */}
        <D.Root open={drawer} onOpenChange={setDrawer}>
          <D.Portal>
            <D.Overlay className="fixed inset-0 z-50 bg-overlay animate-fade-in md:hidden" />
            <D.Content className="app-mobile-drawer fixed inset-y-0 left-0 z-50 flex w-[84%] max-w-xs flex-col shadow-modal animate-slide-in-left focus:outline-none md:hidden">
              <D.Title className="sr-only">Navigation</D.Title>
              <D.Description className="sr-only">{ROLE_LABEL[role]} menu</D.Description>
              <div className="flex h-16 items-center border-b border-border px-5">
                <Logo horizontal size="sm" />
              </div>
              <SidebarNav role={role} collapsed={false} onNavigate={() => setDrawer(false)} />
            </D.Content>
          </D.Portal>
        </D.Root>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="dashboard-header sticky top-0 z-30 flex h-16 items-center gap-2.5 border-b border-border bg-surface/95 px-3 backdrop-blur-xl md:px-5 lg:px-6">
            <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open navigation" onClick={() => setDrawer(true)}>
              <MenuIcon size={22} />
            </Button>
            <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
              <Button variant="ghost" size="icon-sm" className="hidden text-muted hover:text-text lg:inline-flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-pressed={!collapsed} onClick={toggle}>
                {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
              </Button>
            </Tooltip>
            <span className="hidden h-6 w-px bg-border lg:block" aria-hidden="true" />
            <Link to="/" className="hidden h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-sm font-semibold text-text shadow-[0_1px_2px_rgb(16_24_40/0.05)] transition hover:border-action-500 hover:text-action-fg lg:flex" title="Back to the marketplace">
              <Store size={16} /> <MarketplaceLabel />
            </Link>
            <Breadcrumb />
            <div className="ml-auto hidden w-full max-w-md lg:block">
              <AppSearch role={role} />
            </div>
            <div className="ml-auto flex items-center gap-1 lg:ml-0">
              <Badge tone={role === 'partner' ? 'serve' : role === 'admin' ? 'navy' : 'info'} className="hidden sm:inline-flex">
                {simpleRole}
              </Badge>
              <ThemeToggle />
              <Tooltip content="Help & FAQ">
                <Button variant="ghost" size="icon-sm" aria-label="Help and FAQ" onClick={() => useHelp.getState().show()}>
                  <CircleHelp size={19} />
                </Button>
              </Tooltip>
              <div className="hidden sm:block">
                <LanguageMenu onDark={false} />
              </div>
              <NotificationBell onDark={false} />
              <AccountMenu onDark={false} showGreeting={false} />
            </div>
          </header>
          <AssistBanner />
          <main id="main" className={cn('dashboard-content mx-auto w-full max-w-[1440px] flex-1 animate-fade-in px-4 py-6 pb-24 md:px-6 md:pb-12 lg:px-8 lg:py-8', (location.pathname.endsWith('/dashboard') || location.pathname.endsWith('/home') || location.pathname === '/admin') && 'reference-home')}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </main>
          <footer className="dashboard-footer border-t border-border bg-surface px-4 py-4 md:px-6 lg:px-8">
            <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 text-xs text-muted sm:flex-row">
              <span>© 2026 Needibi Serve · Kigali, Rwanda</span>
              <nav className="flex flex-wrap items-center gap-x-5 gap-y-1" aria-label="Footer">
                <button type="button" onClick={() => useHelp.getState().show()} className="hover:text-text">Help & FAQ</button>
                <Link to={role === 'admin' ? '/admin/help' : `/app/${role}/support`} className="hover:text-text">Support</Link>
                <Link to="/legal/terms" className="hover:text-text">Terms</Link>
                <Link to="/legal/privacy" className="hover:text-text">Privacy</Link>
              </nav>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-trust-600" aria-hidden="true" /> <MarketplaceLabel text="All systems operational" /></span>
            </div>
          </footer>
        </div>
      </div>
      <SignInModal />
      <ActionHost />
      <HelpCenter />
      <Toaster />
      <ScrollRestoration />
    </RequireRole>
  )
}

/** Page template: title + subtitle, primary action on the right. */
export function PageHeader({ title, subtitle, actions, back, eyebrow, children }) {
  const tx = useTx()
  return (
    <div className="mb-7">
      {back && (
        <Link to={back.to} className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-muted transition hover:text-text">
          <ArrowLeft size={16} /> {back.label}
        </Link>
      )}
      <div className="relative isolate flex flex-wrap items-end justify-between gap-4 overflow-hidden rounded-[22px] border border-l-[6px] border-action-500/10 border-l-brand-yellow bg-surface px-5 py-5 shadow-[0_12px_30px_-24px_rgb(47_111_228/0.5)] sm:px-6 sm:py-6 before:absolute before:-right-16 before:-top-20 before:-z-10 before:h-48 before:w-48 before:rounded-full before:bg-action-100/70 before:blur-2xl sm:before:h-64 sm:before:w-64">
        <div className="min-w-0">
          {eyebrow && <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-action-fg">{tx(eyebrow)}</p>}
          <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-text sm:text-[32px] sm:leading-tight">{tx(title)}</h1>
          {subtitle && <p className="mt-1.5 max-w-2xl text-[15px] leading-6 text-muted">{tx(subtitle)}</p>}
        </div>
        {actions && <div className="grid w-full gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
