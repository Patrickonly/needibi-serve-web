import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Bell, LocateFixed, CircleCheck, CircleAlert, User, Settings, LifeBuoy, LogOut, LayoutGrid, Repeat, Sun, Moon, Globe2, Search, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useAuth, useUI, ROLE_HOME, ROLE_LABEL, toast } from '@/lib/store'
import { useLocales, flagSrc } from '@/lib/locales'
import i18n from '@/lib/i18n'
import { countryFlag, countryName } from '@/lib/countries'
import { locationDetails, parseLocation, provinceForDistrict, reverseGeocode } from '@/lib/location'
import { ago } from '@/lib/format'
import { DISTRICTS } from '@/mocks/seed'
import { useHelp } from '@/components/help/HelpCenter'
import { Button, Popover, PopoverTrigger, PopoverContent, PopoverClose, Menu, MenuTrigger, MenuContent, MenuItem, MenuLabel, MenuSeparator, Avatar, PriorityBadge, Badge } from '@/design-system'

const PROVINCE = 'Kigali City'


/** "Serving in · Kigali, Gasabo ▾" — district/sector picker with a coverage check. */
export function LocationPicker({ onDark = true, compact, open: controlledOpen, onOpenChange: onControlledOpenChange, onSaved, triggerLabel }) {
  const { locationSet, country, countryName: detectedCountryName, district, sector, province, cell, village, street, setLocation } = useUI()
  const [d, setD] = useState(district || '')
  const [s, setS] = useState(sector || '')
  const [detail, setDetail] = useState({ cell: cell || '', village: village || '', street: street || '' })
  const [coverage, setCoverage] = useState(null)
  const [checking, setChecking] = useState(false)
  const [autoRequested, setAutoRequested] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)
  const popoverOpen = controlledOpen ?? internalOpen
  const [resolvedAddress, setResolvedAddress] = useState('')
  const hasLocation = Boolean(locationSet && (country || district || sector))
  const [term, setTerm] = useState('')
  const draftDistrict = d || Object.keys(DISTRICTS)[0]
  const places = useMemo(() => {
    const q = term.trim().toLowerCase()
    const rows = Object.keys(DISTRICTS).map((x) => ({ key: x, district: x }))
    if (!q) return rows
    const sectors = Object.entries(DISTRICTS).flatMap(([x, list]) => list.map((y) => ({ key: `${x}/${y}`, district: x, sector: y })))
    return [...rows, ...sectors].filter((o) => (o.sector ?? o.district).toLowerCase().includes(q) || o.district.toLowerCase().includes(q)).slice(0, 30)
  }, [term])
  const displayPlace = sector || village || cell || district || (hasLocation ? (detectedCountryName || countryName(country)) : 'ANYWHERE')
  const displayMeta = [sector, cell, village, district, detectedCountryName || countryName(country)].filter(Boolean).join(' · ')

  useEffect(() => {
    if (!locationSet) return
    setD(district || '')
    setS(sector || '')
    setDetail({ cell: cell || '', village: village || '', street: street || '' })
  }, [cell, district, locationSet, sector, street, village])

  const check = async (dist) => {
    if (!dist) return
    setChecking(true)
    try {
      const res = await api.post('/api/coverage', { district: dist })
      setCoverage(res)
    } finally {
      setChecking(false)
    }
  }

  const pickPlace = (o) => {
    const nextSector = o.sector ?? DISTRICTS[o.district]?.[0] ?? ''
    setD(o.district); setS(nextSector); setDetail(locationDetails(o.district, nextSector)); setResolvedAddress(''); check(o.district)
  }

  const applyCoordinates = async (coords) => {
    setChecking(true)
    try {
      const result = await reverseGeocode(coords)
      const parsed = parseLocation(result)
      const nextCountry = parsed.country
      if (!nextCountry) throw new Error('We could not identify the country at this location')
      const nextDistrict = parsed.district
      const nextSector = parsed.sector
      const fallbackDetail = locationDetails(nextDistrict, nextSector)
      const nextDetail = {
        cell: parsed.cell || fallbackDetail.cell,
        village: parsed.village || fallbackDetail.village,
        street: parsed.street || fallbackDetail.street,
      }
      setD(nextDistrict)
      setS(nextSector)
      setDetail(nextDetail)
      setResolvedAddress(parsed.displayName)
      if (nextDistrict) await check(nextDistrict)
      else setChecking(false)
      toast(`Location detected: ${[nextSector, nextDistrict, countryName(nextCountry)].filter(Boolean).join(', ')}`)
      setLocation(nextDistrict, nextSector, { country: nextCountry, countryName: parsed.countryName, province: parsed.province || provinceForDistrict(nextDistrict), ...nextDetail })
    } catch (error) {
      setChecking(false)
      toast(error.message || 'We could not work out your area. Pick your district below instead.', { tone: 'info' })
    }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast('Location detection is not available in this browser', { tone: 'info' })
      return
    }
    setChecking(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => applyCoordinates(coords),
      () => {
        setChecking(false)
        toast('We could not find your location. Pick your district below instead.', { tone: 'info' })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
    )
  }

  const handleOpenChange = (open) => {
    if (controlledOpen === undefined) setInternalOpen(open)
    onControlledOpenChange?.(open)
    if (!open) return
    if (d) check(d)
    if (!autoRequested) {
      setAutoRequested(true)
      detectLocation()
    }
  }

  return (
    <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {triggerLabel ? (
          <button type="button" className="shrink-0 rounded-md px-2.5 py-1.5 text-sm font-semibold text-action-fg hover:bg-action-soft">
            {triggerLabel}
          </button>
        ) : (
        <button
          type="button"
          className={cn('flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-left', onDark ? 'text-white hover:ring-1 hover:ring-white/60' : 'text-text hover:bg-grey-100')}
          aria-label={hasLocation ? `Delivery to ${displayPlace}. Change location` : 'Set delivery location'}
        >
          {hasLocation ? <img src={countryFlag(country || 'RW')} alt="" className="mt-1 h-4 w-6 rounded-sm object-cover" /> : <Globe2 size={17} className={onDark ? 'text-action-300' : 'text-action-fg'} aria-hidden="true" />}
          <span className="min-w-0 leading-tight">
            {!compact && <span className={cn('block text-[10px] font-medium', onDark ? 'text-white/70' : 'text-muted')}>Delivery to</span>}
            <span className="flex max-w-[150px] items-center gap-0.5 truncate text-sm font-bold">
              <span className="truncate uppercase">{displayPlace}</span>
              <ChevronDown size={14} aria-hidden="true" />
            </span>
            {hasLocation && displayMeta && <span className={cn('block max-w-[170px] truncate text-[10px]', onDark ? 'text-white/65' : 'text-muted')} title={displayMeta}>{displayMeta}</span>}
          </span>
        </button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[min(430px,calc(100vw-24px))] p-4">
        <p className="font-bold text-text">Where are you?</p>
        <p className="mt-0.5 text-sm text-muted">We use this to show you providers who work in your area. Your exact address stays private.</p>
        <Button variant="primary" block className="mt-3" onClick={detectLocation} loading={checking}>
          <LocateFixed size={16} /> Use my current location
        </Button>
        <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wide text-muted">or choose it yourself</p>
        <label className="mt-2 block text-xs font-semibold text-muted" htmlFor="loc-search">Search your district or sector</label>
        <div className="relative mt-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="loc-search" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="e.g. Kicukiro, Remera, Musanze…" autoComplete="off" className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text placeholder:text-muted focus:border-action-500 focus:outline-none focus:ring-2 focus:ring-action-500/30" />
        </div>
        <ul className="mt-2 max-h-44 overflow-y-auto rounded-lg border border-border" role="listbox" aria-label="Locations">
          {places.map((o) => {
            const on = o.sector ? d === o.district && s === o.sector : d === o.district && (!s || s === DISTRICTS[o.district]?.[0])
            return (
              <li key={o.key}>
                <button type="button" role="option" aria-selected={on} onClick={() => pickPlace(o)} className={cn('flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-action-soft', on && 'bg-action-soft font-semibold')}>
                  <span className="truncate">{o.sector ? <>{o.sector} <span className="text-muted">· {o.district}</span></> : o.district}</span>
                  {on && <Check size={15} className="shrink-0 text-action-fg" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
          {!places.length && <li className="px-3 py-3 text-sm text-muted">Nothing matches “{term}”.</li>}
        </ul>
        <p className="mt-3 rounded-lg bg-action-soft px-3 py-2 text-xs text-muted">
          {resolvedAddress ? 'Found you in ' : 'Showing providers in '}
          <strong className="text-text">{[d, s, detectedCountryName || countryName(country || 'RW')].filter(Boolean).join(' · ')}</strong>
        </p>
        <div className="mt-3 min-h-6 text-sm" aria-live="polite">
          {checking ? (
            <span className="text-muted">Checking coverage…</span>
          ) : coverage?.covered ? (
            <span className="flex items-center gap-1.5 font-medium text-trust-fg">
              <CircleCheck size={16} /> {coverage.partners} providers work here
            </span>
          ) : coverage ? (
            <span className="flex items-center gap-1.5 font-medium text-warn-fg">
              <CircleAlert size={16} /> Not many providers here yet — you can still post
            </span>
          ) : null}
        </div>
        <PopoverClose asChild>
           <Button variant="primary" block className="mt-3" onClick={() => { const nextDistrict = d || (country === 'RW' || !country ? draftDistrict : ''); const nextSector = s || (nextDistrict ? DISTRICTS[nextDistrict]?.[0] : ''); setLocation(nextDistrict, nextSector, { country: country || 'RW', countryName: detectedCountryName || countryName(country || 'RW'), province: province || (provinceForDistrict(nextDistrict) || PROVINCE), ...detail }); toast(`Delivering to ${detectedCountryName || countryName(country || 'RW')}`); onSaved?.() }}>
            Save
          </Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  )
}

export function LanguageMenu({ onDark = true }) {
  const lang = useUI((s) => s.language)
  const setLanguage = useUI((s) => s.setLanguage)
  const languages = useLocales((s) => s.languages).filter((l) => l.enabled !== false)
  const current = languages.find((l) => l.code === lang) ?? languages[0]
  return (
    <Menu>
      <MenuTrigger asChild>
        <button type="button" className={cn('flex h-10 items-center gap-1 rounded-md px-2 text-sm font-bold', onDark ? 'text-white hover:ring-1 hover:ring-white/60' : 'text-text hover:bg-grey-100')} aria-label={`Language: ${current.label}`}>
          <img src={flagSrc(current.flag)} alt="" className="h-4 w-5 rounded-sm object-cover" /> {current.short}
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </MenuTrigger>
      <MenuContent>
        <MenuLabel>Language</MenuLabel>
        {languages.map((l) => (
          <MenuItem
            key={l.code}
            onSelect={() => {
              setLanguage(l.code)
              i18n.changeLanguage(l.code)
            }}
          >
            <span className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-2"><img src={flagSrc(l.flag)} alt="" className="h-4 w-5 rounded-sm object-cover" /> {l.label}</span>
              {l.code === lang && <CircleCheck size={16} className="text-trust-fg" />}
            </span>
          </MenuItem>
        ))}
      </MenuContent>
    </Menu>
  )
}

/** Sun / moon pill switch for the public header. */
export function ThemeSwitch({ className }) {
  const dark = useUI((s) => s.theme) === 'dark'
  const toggle = useUI((s) => s.toggleTheme)
  return (
    <button type="button" role="switch" aria-checked={dark} aria-label="Dark theme" title="Theme" onClick={toggle} className={cn('relative inline-flex h-9 w-[72px] shrink-0 items-center rounded-full border border-border bg-surface-2 p-[3px]', className)}>
      <span className={cn('absolute left-[3px] top-[3px] h-7 w-8 rounded-full bg-surface shadow-[0_1px_3px_rgb(15_23_42/0.15)] transition-transform duration-200', dark && 'translate-x-8')} aria-hidden="true" />
      <span className={cn('relative flex h-7 w-8 items-center justify-center transition-colors', dark ? 'text-muted' : 'text-action-fg')}><Sun size={16} /></span>
      <span className={cn('relative flex h-7 w-8 items-center justify-center transition-colors', dark ? 'text-action-fg' : 'text-muted')}><Moon size={16} /></span>
    </button>
  )
}

export function ThemeToggle({ onDark }) {
  const theme = useUI((s) => s.theme)
  const toggle = useUI((s) => s.toggleTheme)
  return (
    <Button variant={onDark ? 'ghost-white' : 'ghost'} size="icon-sm" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} title="Theme">
      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  )
}

export function notificationsPath(role) {
  return role === 'admin' ? '/admin/notifications' : `/app/${role === 'visitor' ? 'needer' : role}/notifications`
}

export function NotificationBell({ onDark = true }) {
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.activeRole)
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { data } = useQuery({
    queryKey: ['notifications', 'bell', role],
    queryFn: () => api.list('notifications', { role: role === 'visitor' ? 'needer' : role, pageSize: 6, sort: '-createdAt' }),
    enabled: !!user,
  })
  const unread = data?.data.filter((n) => !n.read).length ?? 0
  if (!user) return null
  return (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          className={cn('relative flex h-10 w-10 items-center justify-center rounded-md', onDark ? 'text-white hover:ring-1 hover:ring-white/60' : 'text-text hover:bg-grey-100')}
          aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        >
          <Bell size={20} />
          {unread > 0 && <span className={cn('absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-action-500 px-1 text-[11px] font-extrabold text-white ring-2', onDark ? 'ring-primary-900' : 'ring-surface')}>{unread}</span>}
        </button>
      </MenuTrigger>
      <MenuContent className="w-[min(380px,calc(100vw-24px))] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="font-bold text-text">Notifications</p>
          <button
            type="button"
            className="text-sm font-semibold text-info-fg hover:underline"
            onClick={async () => {
              await Promise.all(data.data.filter((n) => !n.read).map((n) => api.update('notifications', n.id, { read: true })))
              qc.invalidateQueries({ queryKey: ['notifications'] })
            }}
          >
            Mark all read
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto p-1.5">
          {data?.data.map((n) => (
            <MenuItem key={n.id} onSelect={() => navigate(n.link)} className="items-start">
              <span className="flex gap-3">
                <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-transparent' : 'bg-action-500')} aria-label={n.read ? undefined : 'Unread'} />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{n.title}</span>
                    {n.priority !== 'info' && <PriorityBadge priority={n.priority} size="xs" />}
                  </span>
                  <span className="mt-0.5 block text-muted">{n.body}</span>
                  <span className="mt-0.5 block text-xs text-muted">{ago(n.createdAt)}</span>
                </span>
              </span>
            </MenuItem>
          ))}
        </div>
        <div className="border-t border-border p-2">
          <Button to={notificationsPath(role)} variant="ghost" size="sm" block>
            See all notifications
          </Button>
        </div>
      </MenuContent>
    </Menu>
  )
}

export function AccountMenu({ onDark = true, showGreeting = true }) {
  const { t } = useTranslation()
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.activeRole)
  const switchRole = useAuth((s) => s.switchRole)
  const logout = useAuth((s) => s.logout)
  const navigate = useNavigate()

  if (!user) {
    return (
      <Link to="/auth/login" className={cn('flex shrink-0 flex-col rounded-md px-2 py-1 leading-tight', onDark ? 'text-white hover:ring-1 hover:ring-white/60' : 'text-text')}>
        <span className={cn('text-[11px]', onDark ? 'text-white/70' : 'text-muted')}>{t('nav.signIn')}</span>
        <span className="text-sm font-bold">{t('nav.joinFree')}</span>
      </Link>
    )
  }
  const base = role === 'admin' ? '/admin' : `/app/${role}`
  return (
    <Menu>
      <MenuTrigger asChild>
        <button type="button" className={cn('flex shrink-0 items-center gap-2 rounded-md px-1.5 py-1 text-left', onDark ? 'text-white hover:ring-1 hover:ring-white/60' : 'text-text hover:bg-grey-100')} aria-label="Account menu">
          <Avatar name={user.name} hue={user.avatarHue} size={32} />
          {showGreeting && (
            <span className="hidden leading-tight xl:block">
              <span className={cn('block text-[11px]', onDark ? 'text-white/70' : 'text-muted')}>{t('nav.hello', { name: user.firstName })}</span>
              <span className="flex items-center gap-0.5 text-sm font-bold">
                {ROLE_LABEL[role]} <ChevronDown size={14} />
              </span>
            </span>
          )}
        </button>
      </MenuTrigger>
      <MenuContent className="w-64">
        <div className="flex items-center gap-3 px-2.5 py-2">
          <Avatar name={user.name} hue={user.avatarHue} size={40} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-text">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.partnerName ?? user.staffRole ?? user.email}</p>
          </div>
        </div>
        {user.roles.length > 1 && (
          <>
            <MenuSeparator />
            <MenuLabel>Switch role</MenuLabel>
            {user.roles.map((r) => (
              <MenuItem
                key={r}
                icon={<Repeat />}
                onSelect={() => {
                  switchRole(r)
                  navigate(ROLE_HOME[r])
                  toast(`You're now using Needibi Serve as a ${ROLE_LABEL[r]}`)
                }}
              >
                <span className="flex items-center justify-between">
                  {ROLE_LABEL[r]}
                  {r === role && <Badge tone="trust" size="xs">Active</Badge>}
                </span>
              </MenuItem>
            ))}
          </>
        )}
        <MenuSeparator />
        <MenuItem icon={<LayoutGrid />} onSelect={() => navigate(ROLE_HOME[role] ?? '/')}>
          Dashboard
        </MenuItem>
        <MenuItem icon={<User />} onSelect={() => navigate(role === 'admin' ? '/admin/settings' : `${base}/profile`)}>
          {t('actions.profile')}
        </MenuItem>
        <MenuItem icon={<Settings />} onSelect={() => navigate(role === 'admin' ? '/admin/settings' : role === 'needer' ? `${base}/settings` : `${base}/profile`)}>
          {t('actions.settings')}
        </MenuItem>
        <MenuItem icon={<LifeBuoy />} onSelect={() => useHelp.getState().show()}>
          {t('nav.help')}
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          icon={<LogOut />}
          tone="danger"
          onSelect={() => {
            logout()
            navigate('/')
            toast('You have been logged out')
          }}
        >
          {t('actions.logout')}
        </MenuItem>
      </MenuContent>
    </Menu>
  )
}
