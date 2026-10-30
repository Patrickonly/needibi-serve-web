import { useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu as MenuIcon, Plus, UserRound, ChevronRight, X, ClipboardList, LayoutDashboard, Briefcase, HeartHandshake, CircleHelp, House, Tag, HandHelping, Package, Users, Lightbulb } from 'lucide-react'
import * as D from '@radix-ui/react-dialog'
import { cn } from '@/lib/cn'
import { useAuth, ROLE_HOME } from '@/lib/store'
import { useGatedAction } from '@/lib/hooks'
import { CATEGORIES } from '@/mocks/seed'
import { Logo, Button, Icon, CATEGORY_ICON } from '@/design-system'
import { SearchBar } from './SearchBar'
import { useHelp } from '@/components/help/HelpCenter'
import { LocationPicker, LanguageMenu, NotificationBell, AccountMenu, ThemeToggle, ThemeSwitch } from './HeaderMenus'

// Desktop nav: browsing links on the left, programme + help links on the right.
const MAIN_LINKS = [
  ['nav.home', '/', House],
  ['nav.deals', '/deals', Tag],
  ['nav.needs', '/needs', HandHelping],
  ['nav.bundles', '/bundles', Package],
  ['nav.partners', '/partners', Users],
  ['nav.howItWorks', '/how-it-works', Lightbulb],
]
const SIDE_LINKS = [
  ['nav.becomePartner', '/become-a-partner', Briefcase],
  ['nav.becomeAgent', '/become-an-agent', HeartHandshake],
  ['nav.help', '/help', CircleHelp],
]

export function usePostNeed() {
  const navigate = useNavigate()
  const gate = useGatedAction()
  return gate(() => navigate('/app/needer/post'), { roles: ['needer', 'agent'], reason: 'Sign in to request a service — it only takes a minute' })
}

const DRAWER_MAIN = MAIN_LINKS
const DRAWER_MORE = SIDE_LINKS

function MobileDrawer({ open, onOpenChange }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const user = useAuth((s) => s.user)
  return (
    <D.Root open={open} onOpenChange={onOpenChange}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-overlay animate-fade-in" />
        <D.Content className="fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-surface shadow-modal animate-slide-in-left focus:outline-none">
          <div className="flex items-center justify-between bg-primary-900 px-4 py-4">
            <D.Title className="text-base font-bold text-white">{user ? t('nav.hello', { name: user.firstName }) : 'Browse Needibi Serve'}</D.Title>
            <D.Description className="sr-only">Main menu</D.Description>
            <D.Close asChild>
              <Button variant="ghost-white" size="icon-sm" aria-label="Close menu">
                <X size={20} />
              </Button>
            </D.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center justify-between px-2 py-2">
              <LocationPicker onDark={false} />
              <div className="flex items-center gap-1">
                <LanguageMenu onDark={false} />
                <ThemeToggle />
              </div>
            </div>
            {[['Explore', DRAWER_MAIN], ['Join & help', DRAWER_MORE]].map(([group, links]) => (
              <div key={group} className="mt-2">
                <p className="px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{group}</p>
                <ul className="space-y-0.5">
                  {links.map(([k, to, LinkIcon]) => {
                    // Radix Close merges className as a string, so the active state is computed here
                    const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
                    return (
                      <li key={to}>
                        <D.Close asChild>
                          <Link to={to} aria-current={active ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-lg px-2.5 py-2 text-[15px] font-medium transition-colors', active ? 'bg-action-soft text-action-fg' : 'text-text hover:bg-surface-2 active:bg-surface-2')}>
                            <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', active ? 'bg-action-600 text-white' : 'bg-surface-2 text-action-fg')}>
                              <LinkIcon size={18} strokeWidth={1.9} />
                            </span>
                            <span className="min-w-0 flex-1 truncate">{t(k)}</span>
                            <ChevronRight size={16} className="shrink-0 text-muted" />
                          </Link>
                        </D.Close>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
            <p className="px-3 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{t('nav.allCategories')}</p>
            <ul className="grid grid-cols-2 gap-1.5 px-1 pb-3">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <D.Close asChild>
                    <Link to={`/categories/${c.slug}`} className="flex h-11 items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] font-medium text-text hover:border-action-200 hover:bg-action-soft">
                      <Icon name={CATEGORY_ICON[c.slug]} size={16} className="shrink-0 text-action-fg" />
                      <span className="min-w-0 truncate">{c.name}</span>
                    </Link>
                  </D.Close>
                </li>
              ))}
            </ul>
          </div>
          {!user && (
            <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
              <D.Close asChild>
                <Button to="/auth/login" variant="outline">
                  {t('nav.signIn')}
                </Button>
              </D.Close>
              <D.Close asChild>
                <Button to="/auth/register" variant="primary">
                  {t('nav.joinFree')}
                </Button>
              </D.Close>
            </div>
          )}
        </D.Content>
      </D.Portal>
    </D.Root>
  )
}

export function PublicHeader() {
  const { t } = useTranslation()
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.activeRole)
  const [drawer, setDrawer] = useState(false)
  const postNeed = usePostNeed()


  return (
    <header className="sticky top-0 z-40 bg-surface shadow-[0_1px_0_var(--border)]">
      {/* Tier 1: brand · search · account */}
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-3 md:px-5 lg:h-[72px] lg:gap-6">
        <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open menu" onClick={() => setDrawer(true)}>
          <MenuIcon size={22} />
        </Button>
        <div className="flex shrink-0 items-center gap-3">
          <Logo horizontal />
          <span className="hidden h-6 w-px bg-border lg:block" aria-hidden="true" />
          <div className="hidden lg:block">
            <LocationPicker onDark={false} />
          </div>
        </div>

        <div className="mx-auto hidden w-full min-w-0 max-w-[680px] flex-1 md:block">
          <SearchBar placeholder="Search…" />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 md:ml-0">
          <div className="hidden items-center gap-2 sm:flex">
            <LanguageMenu onDark={false} />
            <ThemeSwitch className="hidden md:inline-flex" />
            <span className="mx-1.5 h-6 w-px bg-border" aria-hidden="true" />
          </div>
          {user ? (
            <>
              <Link to={ROLE_HOME[role] ?? '/'} className="hidden h-9 items-center gap-2 rounded-full border border-border px-3.5 text-sm font-semibold text-text transition hover:border-action-500 hover:text-action-fg md:flex">
                <LayoutDashboard size={16} /> <span>Dashboard</span>
              </Link>
              <NotificationBell onDark={false} />
              <AccountMenu onDark={false} showGreeting={false} />
            </>
          ) : (
            <>
              <Button to="/auth/login" variant="ghost" size="sm" aria-label={t('nav.signIn')} className="font-semibold">
                <UserRound size={19} /> <span className="hidden sm:inline">{t('nav.signIn')}</span>
              </Button>
            </>
          )}
          <Button variant="gold" size="md" className="ml-1.5 hidden sm:inline-flex" onClick={postNeed}>
            <Plus size={18} strokeWidth={2.5} /> {t('actions.postNeed')}
          </Button>
        </div>
      </div>
      {/* Phone search row */}
      <div className="px-3 pb-2.5 md:hidden">
        <SearchBar variant="compact" />
      </div>

      {/* Tier 2: navigation */}
      <nav aria-label="Primary" className="hidden border-t border-border bg-surface-2 lg:block">
        <div className="mx-auto flex h-12 max-w-[1440px] items-stretch justify-between gap-6 px-5 text-sm">
          <div className="flex items-stretch gap-0.5">
            {MAIN_LINKS.map(([k, to, LinkIcon]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => cn(
                  'group relative flex items-center gap-2 px-3.5 font-medium transition-colors',
                  isActive ? 'font-semibold text-action-fg after:absolute after:inset-x-3 after:bottom-0 after:h-[4px] after:rounded-t-full after:bg-brand-yellow' : 'text-muted hover:text-text',
                )}
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg transition-colors', isActive ? 'bg-brand-yellow text-[#0b1f3a]' : 'text-muted group-hover:bg-brand-yellow-soft group-hover:text-action-fg')}>
                      <LinkIcon size={16} strokeWidth={isActive ? 2.25 : 1.9} />
                    </span>
                    {t(k)}
                  </>
                )}
              </NavLink>
            ))}
            {user && role === 'needer' && (
              <NavLink to="/app/needer/tracking" className={({ isActive }) => cn('relative flex items-center gap-2 px-3.5 font-medium', isActive ? 'font-semibold text-action-fg' : 'text-muted hover:text-text')}>
                <ClipboardList size={16} /> Tracking
              </NavLink>
            )}
          </div>
          <div className="flex items-center gap-1">
            {SIDE_LINKS.filter(([, to]) => to !== '/help').map(([k, to, LinkIcon]) => (
              <NavLink key={to} to={to} className={({ isActive }) => cn('flex h-8 items-center gap-1.5 rounded-full px-3 font-medium transition-colors', isActive ? 'bg-brand-yellow text-[#0b1f3a]' : 'text-muted hover:bg-brand-yellow-soft hover:text-text hover:shadow-card')}>
                <LinkIcon size={15} /> {t(k)}
              </NavLink>
            ))}
            <button type="button" onClick={() => useHelp.getState().show()} className="flex h-8 items-center gap-1.5 rounded-full px-3 font-medium text-muted transition-colors hover:bg-surface hover:text-text hover:shadow-card">
              <CircleHelp size={15} /> {t('nav.help')}
            </button>
          </div>
        </div>
      </nav>
      <MobileDrawer open={drawer} onOpenChange={setDrawer} />
    </header>
  )
}
