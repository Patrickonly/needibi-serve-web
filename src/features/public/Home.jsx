import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building, CircleCheck, Zap, Plus, Smartphone, ShieldCheck, ArrowRight, ChevronLeft, ChevronRight, LayoutDashboard, LayoutGrid, MessagesSquare, Bell, UserRound, LogIn, UserPlus, Lock, Users, Headset, MapPin, Flame, Repeat, ClipboardList, Tag, Layers3, HelpCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useUI, useAuth, ROLE_HOME } from '@/lib/store'
import { cn } from '@/lib/cn'
import { imgSrc } from '@/lib/images'
import { CATEGORIES } from '@/mocks/seed'
import { Reveal, Avatar, Button, Chip, Icon, CardSkeleton, CategoryIllustration, Segmented, ErrorState, EmptyState } from '@/design-system'
import { usePostNeed } from '@/components/layout/PublicHeader'
import { NeedCard, BundleCard } from '@/components/cards/NeedCard'
import { DealCard } from '@/components/cards/DealCard'
import { countryName } from '@/lib/countries'
import { StoreBadge } from '@/components/layout/Footer'
import { DiscoverySidebar } from '@/components/layout/DiscoverySidebar'

const PUBLIC = { status: 'published,matching,offers_received,negotiating', visibility: 'public' }

const SLIDES = [
  {
    image: 'cleaning',
    eyebrow: 'Free to post',
    title: ['Get your needs', 'served.'],
    text: "Describe what you need and trusted providers send offers. Pay safely — your money is only released when you are happy.",
    cta: ['Request a service', null],
    secondary: ['Browse Deals', '/deals'],
  },
  {
    image: 'hero-market',
    eyebrow: "Today's Deals",
    title: ['Trusted services,', 'better prices.'],
    text: 'Fixed-price offers from trusted providers across Rwanda. Book in a few taps.',
    cta: ['Shop Deals', '/deals'],
    secondary: ['Latest Needs', '/needs'],
  },
  {
    image: 'hero-work',
    eyebrow: 'A network you can trust',
    title: ['Grow your business with', 'real demand.'],
    text: 'Get sent requests in your line of work and your area, and get paid safely.',
    cta: ['Become a Partner', '/auth/register?role=partner'],
    secondary: ['How it works', '/how-it-works'],
  },
]

const BANNER_TRUST = [
  [Lock, 'Safe payments', 'Held until you are happy'],
  [Users, 'Checked providers', 'ID and business checked'],
  [Zap, 'Fast & easy', 'Post in a minute'],
  [Headset, 'Real support', '7 days a week'],
]

// Alternate the logo's blue and yellow; alpha and theme tokens keep it readable in both themes.
const hueTile = (i) => (i % 2 ? { background: 'var(--cat-yellow-bg)', color: 'var(--cat-yellow-fg)' } : { background: 'rgb(42 77 161 / 0.13)', color: 'var(--brand-blue-text)' })

function CategoryPanel({ className }) {
  return (
    <nav aria-label="Categories" className={cn('flex-col rounded-2xl border border-border bg-surface p-4', className)}>
      <h2 className="flex items-center gap-2 px-1 pb-2 text-[15px] font-bold text-text">
        <LayoutGrid size={18} className="text-action-fg" /> Browse categories
      </h2>
      <ul className="divide-y divide-border">
        {CATEGORIES.slice(0, 7).map((c, i) => (
          <li key={c.slug}>
            <Link to={`/categories/${c.slug}`} className="group flex items-center gap-3 rounded-lg px-1 py-2 transition hover:bg-surface-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={hueTile(i)}>
                <Icon name={c.icon} size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text group-hover:text-action-fg">{c.name}</span>
                <span className="block truncate text-xs text-muted">{c.subtypes.slice(0, 3).join(', ')}</span>
              </span>
              <ChevronRight size={15} className="shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-action-fg" />
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/categories" className="mt-auto flex items-center justify-between border-t border-border px-1 pt-3 text-sm font-semibold text-action-fg hover:underline">
        View all categories <ArrowRight size={15} />
      </Link>
    </nav>
  )
}

function HeroBanner() {
  const navigate = useNavigate()
  const postNeed = usePostNeed()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setIndex((n) => (n + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [paused])
  const go = (step) => setIndex((n) => (n + step + SLIDES.length) % SLIDES.length)
  const slide = SLIDES[index]
  const [ctaLabel, ctaTo] = slide.cta

  return (
    <div
      className="public-gradient-hero home-hero relative flex min-h-[400px] flex-col overflow-hidden rounded-2xl text-white sm:min-h-[420px] xl:min-h-[440px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {SLIDES.map((s, n) => (
        <img
          key={s.image}
          src={imgSrc(s.image, 800)}
          alt=""
          className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-700', n === index ? 'opacity-100' : 'opacity-0')}
          loading={n === 0 ? 'eager' : 'lazy'}
        />
      ))}
      <div className="home-hero-overlay absolute inset-0" aria-hidden="true" />

      <div key={index} className="relative flex flex-1 animate-fade-in flex-col justify-center px-6 pb-6 pt-14 sm:px-10 md:pb-0">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
          <ShieldCheck size={14} className="text-[var(--brand-yellow)]" /> {slide.eyebrow}
        </span>
        <span className="mt-5 block h-1 w-10 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
        <h1 id="hero-title" className="mt-3 max-w-xl font-display text-[clamp(2rem,3.4vw,3rem)] font-extrabold leading-[1.08] tracking-tight">
          {slide.title[0]} <span className="text-[var(--brand-yellow)]">{slide.title[1]}</span>
        </h1>
        <p className="mt-3 max-w-lg text-base leading-7 text-white/80">{slide.text}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" onClick={() => (ctaTo ? navigate(ctaTo) : postNeed())}>
            {!ctaTo && <Plus size={18} strokeWidth={2.5} />} {ctaLabel} {ctaTo && <ArrowRight size={17} />}
          </Button>
          <Button variant="outline-white" size="lg" to={slide.secondary[1]}>{slide.secondary[0]}</Button>
        </div>
      </div>

      <div className="absolute right-5 top-5 z-[1] flex items-center gap-2.5 sm:right-6 sm:top-6">
        <div className="flex gap-1.5">
          {SLIDES.map((s, n) => (
            <button
              key={s.image}
              type="button"
              onClick={() => setIndex(n)}
              aria-label={`Show slide ${n + 1}: ${s.eyebrow}`}
              aria-current={n === index || undefined}
              className={cn('h-1.5 rounded-full transition-all', n === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70')}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition hover:bg-white/25"><ChevronLeft size={17} /></button>
        <button type="button" onClick={() => go(1)} aria-label="Next slide" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition hover:bg-white/25"><ChevronRight size={17} /></button>
      </div>

      <ul className="relative mt-4 hidden grid-cols-2 border-t border-white/15 bg-primary-900/40 backdrop-blur-sm md:grid xl:grid-cols-4">
        {BANNER_TRUST.map(([TrustIcon, title, text], n) => (
          <li key={title} className={cn('flex min-w-0 items-center gap-2 px-3 py-3', n > 0 && 'xl:border-l xl:border-white/10', n % 2 === 1 && 'border-l border-white/10', n > 1 && 'border-t border-white/10 xl:border-t-0')}>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[var(--brand-yellow)] ring-1 ring-white/20"><TrustIcon size={14} /></span>
            <span className="min-w-0 leading-tight">
              <span className="block whitespace-nowrap text-[12.5px] font-semibold">{title}</span>
              <span className="block text-[11px] text-white/60">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function WelcomePanel({ className }) {
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.activeRole)
  const base = role === 'admin' ? '/admin' : `/app/${role}`
  const tiles = [
    [LayoutDashboard, 'Dashboard', ROLE_HOME[role] ?? '/'],
    [MessagesSquare, 'Messages', role === 'admin' ? '/admin/inbox' : `${base}/messages`],
    [Bell, 'Alerts', role === 'admin' ? '/admin' : `${base}/notifications`],
  ]
  return (
    <aside className={cn('flex-col gap-4', className)}>
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3">
          {user ? (
            <Avatar name={user.name} hue={user.avatarHue} size={48} />
          ) : (
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-action-100 text-action-fg">
              <UserRound size={22} />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-[var(--brand-yellow)] text-primary-900"><Lock size={10} strokeWidth={3} /></span>
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs text-muted">Get the best of <span className="font-semibold text-action-fg">Needibi Serve</span></p>
            <p className="truncate font-display text-lg font-bold text-text">{user ? `Hi, ${user.firstName}` : 'Hello there'}</p>
            {!user && <p className="mt-0.5 text-xs leading-5 text-muted">Sign in to access your account and get started.</p>}
          </div>
        </div>
        {user ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {tiles.map(([TileIcon, label, to]) => (
              <Link key={label} to={to} className="flex flex-col items-center gap-1.5 rounded-xl bg-surface-2 px-1 py-3 text-xs font-medium text-text transition hover:bg-action-soft hover:text-action-fg">
                <TileIcon size={18} className="text-action-fg" /> {label}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="primary" size="sm" to="/auth/login"><LogIn size={16} /> Sign in</Button>
            <Button variant="outline" size="sm" to="/auth/register"><UserPlus size={16} /> Sign up</Button>
          </div>
        )}
      </div>
      <Link to="/auth/register?role=partner" className="group relative flex flex-1 flex-col justify-end overflow-hidden rounded-2xl bg-primary-900 text-white">
        <img src={imgSrc('carpentry', 400)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute inset-0 bg-primary-900/70" aria-hidden="true" />
        <span className="relative p-5 pb-4">
          <span className="inline-flex -rotate-2 rounded-md bg-[var(--brand-yellow)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-900">For Partners</span>
          <span className="mt-2.5 block font-display text-lg font-bold leading-snug">Reach customers across Rwanda</span>
          <span className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-semibold text-white/90">Become a Partner <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></span>
        </span>
        <span className="relative grid grid-cols-3 border-t border-white/15 bg-primary-900/60 px-3 py-3 text-center">
          {[['12K+', 'Partners'], ['50K+', 'Needs / month'], ['100%', 'Escrow']].map(([n, l]) => (
            <span key={l}>
              <span className="tabular block text-sm font-bold">{n}</span>
              <span className="block text-[10px] text-white/60">{l}</span>
            </span>
          ))}
        </span>
      </Link>
    </aside>
  )
}

function Hero() {
  return (
    <section className="mx-auto max-w-[1440px] px-4 pt-6 md:px-6 xl:px-10" aria-labelledby="hero-title">
      <div className="grid gap-4 lg:grid-cols-[270px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)_290px]">
        <CategoryPanel className="hidden lg:flex" />
        <HeroBanner />
        <WelcomePanel className="hidden xl:flex" />
      </div>
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
        {CATEGORIES.slice(0, 8).map((c, i) => (
          <Link key={c.slug} to={`/categories/${c.slug}`} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3.5 text-sm font-medium text-text hover:border-action-500">
            <span className="flex h-7 w-7 items-center justify-center rounded-full" style={hueTile(i)}><Icon name={c.icon} size={14} /></span> {c.name}
          </Link>
        ))}
      </div>
    </section>
  )
}

function SectionTitle({ id, title, count, subtitle, to, linkLabel, children }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div className="flex min-w-0">
        <div className="min-w-0">
          <h2 id={id} className="flex flex-wrap items-center gap-2.5 font-display text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-text sm:text-[28px]">
            {title}
            <span className="mt-1 hidden h-2 w-2 rounded-full bg-[var(--brand-yellow)] sm:inline-block" aria-hidden="true" />
            {count > 0 && <span className="tabular rounded-full bg-[var(--brand-yellow-soft)] px-2.5 py-0.5 font-sans text-sm font-bold tracking-normal text-[var(--brand-yellow-fg)]">{count}</span>}
          </h2>
          {subtitle && <p className="mt-2 max-w-[56ch] text-[14px] leading-6 text-muted sm:text-[15px]">{subtitle}</p>}
          <span className="mt-3 block h-1 w-12 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end">
        {children}
        <Button variant="primary" size="sm" to={to} className="rounded-full px-5 font-bold shadow-none"><span className="hidden sm:inline">{linkLabel}</span><span className="sm:hidden">All</span> <ArrowRight size={15} /></Button>
      </div>
    </div>
  )
}

function ShopByCategory() {
  const rail = useRef(null)
  const scroll = (dir) => rail.current?.scrollBy({ left: dir * rail.current.clientWidth * 0.8, behavior: 'smooth' })
  const arrow = 'hidden h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text shadow-card transition hover:border-action-500 hover:text-action-fg sm:flex'
  return (
    <section aria-labelledby="cats">
      <SectionTitle id="cats" title="Popular categories" subtitle="Find what you need, or offer your services." to="/categories" linkLabel="View all categories">
        <button type="button" onClick={() => scroll(-1)} aria-label="Scroll categories left" className={arrow}><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => scroll(1)} aria-label="Scroll categories right" className={arrow}><ChevronRight size={18} /></button>
      </SectionTitle>
      <ul ref={rail} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-1 md:mx-0 md:px-0">
        {CATEGORIES.map((c, i) => (
          <li key={c.slug} className="w-full shrink-0 snap-start sm:w-auto">
            <Link to={`/categories/${c.slug}`} className="group relative flex h-[104px] w-full items-center sm:w-[290px] gap-3.5 overflow-hidden rounded-2xl bg-primary-900 px-4 text-white shadow-card transition hover:shadow-hover">
              <CategoryIllustration category={c.slug} seed={i % 3} className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" iconSize={40} />
              <span className="absolute inset-0 bg-primary-900/55 transition-colors group-hover:bg-primary-900/45" aria-hidden="true" />
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-card" style={{ color: i % 2 ? 'var(--cat-yellow-fg)' : 'var(--brand-blue-text)' }}>
                <Icon name={c.icon} size={22} />
              </span>
              <span className="relative min-w-0 flex-1">
                <span className="line-clamp-2 font-bold leading-tight">{c.name}</span>
                <span className="block truncate text-xs text-white/80">{c.subtypes.slice(0, 2).join(' & ')}</span>
              </span>
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 backdrop-blur-sm transition group-hover:bg-white group-hover:text-primary-900">
                <ArrowRight size={15} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

const FEED_STEP = 4
const FEED_LIMIT = 21
const FEED_GRID = 'card-stagger grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5'

/** Fetches the first 21 items once; FeedGrid reveals them 6 at a time (two rows of three) while scrolling. */
function useHomeFeed(resource, params, key, enabled = true) {
  return useQuery({
    queryKey: [resource, 'home-feed', ...key],
    queryFn: () => api.list(resource, { ...params, page: 1, pageSize: FEED_LIMIT }),
    enabled,
  })
}

function FeedGrid({ query, renderItem, noun, moreTo }) {
  const { data, isLoading, isError, refetch } = query
  const items = data?.data ?? []
  const [visible, setVisible] = useState(FEED_STEP)
  const hasMore = visible < items.length

  // Only surface the error when there is nothing to show. If the list is already on screen,
  // react-query keeps retrying underneath and the user never sees a failure.
  if (isError && !items.length) return <ErrorState onRetry={refetch} />
  if (!isLoading && !items.length) return <EmptyState compact title={`No ${noun} right now`} description="Check back soon — new ones are added every day." />

  return (
    <>
      <div className={FEED_GRID}>
        {items.slice(0, visible).map(renderItem)}
        {isLoading && Array.from({ length: FEED_STEP }, (_, i) => <CardSkeleton key={`sk-${i}`} />)}
      </div>
      {!isLoading && (
        <div className="relative mt-8 flex justify-center gap-3">
          {hasMore && (
            <Button variant="primary" size="lg" onClick={() => setVisible((v) => Math.min(v + FEED_STEP, items.length))} className="rounded-full px-7">
              Load more {noun}
            </Button>
          )}
          {!hasMore && (
            <Button variant="outline" size="lg" to={moreTo} className="rounded-full bg-surface px-7 shadow-card hover:border-action-500 hover:text-action-fg">
              View all {noun} <ArrowRight size={17} />
            </Button>
          )}
        </div>
      )}
    </>
  )
}

const DEAL_TABS = [
  ['service', 'Services'],
  ['product', 'Products'],
  ['vehicle', 'Vehicles'],
  ['property', 'Property'],
  ['professional', 'Professionals'],
  ['custom', 'Custom'],
  ['bundle', 'Bundles'],
]

function DealsSection() {
  const [tab, setTab] = useState('all')
  const { country, countryName: detectedCountryName, enabledCountries } = useUI()
  const marketCountry = country || 'RW'
  const marketLabel = detectedCountryName || countryName(marketCountry)
  const canSeeDeals = enabledCountries.includes(marketCountry)
  const query = useHomeFeed('deals', { status: 'published', sort: '-discountPct', ...(tab !== 'all' ? { type: tab } : {}) }, [tab, marketCountry], canSeeDeals)
  return (
    <section aria-labelledby="deals-h">
      <SectionTitle id="deals-h" title="Deals" subtitle="Services and products you can book straight away, at a price you can see up front." to="/deals" linkLabel="View all Deals" />
      <Segmented label="Deal type" value={tab} onChange={setTab} options={DEAL_TABS.map(([value, label]) => ({ value, label }))} className="no-scrollbar mb-5 max-w-full overflow-x-auto" />
      {canSeeDeals ? (
        <FeedGrid key={tab} query={query} noun="Deals" moreTo={`/deals?from=home&sort=-discountPct${tab !== 'all' ? `&type=${tab}` : ''}`} renderItem={(d) => <DealCard key={d.id} deal={d} />} />
      ) : (
        <EmptyState compact title={`Deals are not available in ${marketLabel}`} description="Needibi is not serving this country yet. Check back after the market is enabled by an administrator." />
      )}
    </section>
  )
}

const NEED_FILTERS = [
  ['near', 'Near me', MapPin],
  ['urgent', 'Urgent', Flame],
  ['recurring', 'Recurring', Repeat],
]

function NeedsSection() {
  const { district } = useUI()
  const [chip, setChip] = useState('')
  const extra = chip === 'near' ? { district } : chip === 'urgent' ? { urgency: 'urgent,high' } : chip === 'recurring' ? { recurring: true } : {}
  const query = useHomeFeed('needs', { ...PUBLIC, ...extra, sort: '-createdAt' }, [chip, district])
  return (
    <section aria-labelledby="needs-h">
      <SectionTitle id="needs-h" title="Latest Needs" subtitle="What people near you are asking for right now. Send an offer and you could get the job." to="/needs" linkLabel="View all Needs" />
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {NEED_FILTERS.map(([k, label, FilterIcon]) => (
          <Chip key={label} active={chip === k} onClick={() => setChip(k)} icon={<FilterIcon size={15} />}>
            {label}
          </Chip>
        ))}
      </div>
      <FeedGrid key={chip} query={query} noun="Needs" moreTo={`/needs?from=home&kind=need&${{ near: 'tab=near', urgent: 'tab=latest&urgency=urgent,high', recurring: 'tab=latest&recurring=true' }[chip] ?? 'tab=latest'}`} renderItem={(n) => <NeedCard key={n.id} need={n} />} />
    </section>
  )
}

function BundlesSection() {
  const query = useHomeFeed('bundles', { status: `${PUBLIC.status},in_service`, sort: '-createdAt' }, ['home'])
  return (
    <section aria-labelledby="bundles-h">
      <SectionTitle id="bundles-h" title="Bundles" subtitle="Need a few things done together? A bundle keeps them in one request." to="/bundles" linkLabel="View all Bundles" />
      <FeedGrid query={query} noun="Bundles" moreTo="/bundles?from=home" renderItem={(b) => <BundleCard key={b.id} bundle={b} />} />
    </section>
  )
}

/** Flat phone mock-up for the app promo (fixed light colours: it's a picture of a phone screen). */
function PhoneMock() {
  return (
    <div className="relative mx-auto h-[310px] w-[168px] rounded-[34px] border-[6px] border-black bg-white p-2.5 shadow-modal ring-1 ring-white/10" aria-hidden="true">
      <span className="mx-auto mb-2.5 block h-4 w-16 rounded-full bg-black" />
      <span className="block h-2 rounded-full bg-[#e9eef7]" />
      <span className="mt-2 block h-10 rounded-xl bg-action-500" />
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {[0, 1, 2, 3].map((k) => (
          <span key={k} className="block h-[74px] rounded-lg border border-[#e6e9ef] bg-[#f5f7fa] p-1.5">
            <span className="block h-10 rounded bg-[#e9eef7]" />
            <span className="mt-1.5 block h-1.5 w-2/3 rounded bg-action-300" />
          </span>
        ))}
      </div>
      <span className="absolute inset-x-2.5 bottom-2.5 flex justify-around rounded-xl bg-[#f5f7fa] py-2">
        {[0, 1, 2, 3].map((k) => <span key={k} className={k === 0 ? 'h-2 w-2 rounded-full bg-action-500' : 'h-2 w-2 rounded-full bg-[#c9d0dc]'} />)}
      </span>
    </div>
  )
}

function MobileAppSection() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.45fr_1fr]" aria-labelledby="app-promo-title">
      <div className="relative overflow-hidden rounded-3xl bg-primary-900 p-8 text-white sm:p-10">
        <span className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full border-[36px] border-white/[0.04]" aria-hidden="true" />
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-action-500/25 px-3 py-1 text-xs font-semibold text-[var(--brand-yellow)]">
              <Smartphone size={14} /> Mobile app · launching soon
            </span>
            <h2 id="app-promo-title" className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-[34px]">Get the Needibi Serve app</h2>
            <p className="mt-3 max-w-lg leading-7 text-white/75">Post Needs in a few taps, pay with MTN MoMo or Airtel Money into escrow, and follow every job live. Free on iPhone and Android.</p>
            <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {['Offer alerts as notifications', 'Track every step of your job', 'Saved Needs, Bundles and Deals', 'Escrow refunds you can follow'].map((point) => (
                <li key={point} className="flex items-start gap-2.5 text-[15px] text-white/90">
                  <CircleCheck size={18} className="mt-0.5 shrink-0 text-[var(--brand-yellow)]" /> {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-4">
              <StoreBadge store="App Store" />
              <StoreBadge store="Google Play" />
            </div>
          </div>
          <div className="hidden md:block">
            <PhoneMock />
          </div>
        </div>
      </div>

      <div className="flex flex-col rounded-3xl border border-action-500/20 bg-action-soft p-8 sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-action-fg shadow-card">
          <Building size={26} />
        </span>
        <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-text sm:text-[32px]">Grow your business on Needibi Serve</h2>
        <p className="mt-3 leading-7 text-muted">Get matched to real Needs in all 30 districts, get paid safely from escrow, and publish Deals customers can book. Start free and upgrade when you grow.</p>
        <div className="mt-auto flex flex-wrap gap-3 pt-8">
          <Button variant="primary" size="lg" to="/auth/register?role=partner">Become a Partner <ArrowRight size={18} /></Button>
          <Button variant="outline" size="lg" to="/auth/login?returnTo=%2Fapp%2Fpartner%2Fhome">Partner login</Button>
        </div>
        <Link to="/become-an-agent" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-action-fg hover:underline">
          Want to help your community? Become an Agent <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  )
}

const BROWSE_TABS = [
  { value: 'all', label: 'Everything', icon: LayoutGrid, text: 'Deals, Needs and Bundles together, newest first.' },
  { value: 'deals', label: 'Deals', icon: Tag, text: 'Services and products you can book now, at a price you can see.' },
  { value: 'needs', label: 'Needs', icon: ClipboardList, text: 'What people near you are asking for right now.' },
  { value: 'bundles', label: 'Bundles', icon: Layers3, text: 'A few related jobs grouped into one request.' },
]

/** The choice at the top of the feed: which of the three things you want to browse. */
function BrowseTabs({ value, onChange }) {
  const active = BROWSE_TABS.find((t) => t.value === value) ?? BROWSE_TABS[0]
  return (
    <section aria-labelledby="browse-title" className="rounded-3xl border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="browse-title" className="font-display text-xl font-extrabold text-text sm:text-2xl">What are you looking for?</h2>
          <p className="mt-1 text-sm text-muted">{active.text}</p>
        </div>
        <Link to="/categories" className="text-sm font-bold text-action-fg hover:underline">Browse categories <ArrowRight size={14} className="inline" /></Link>
      </div>
      <div role="tablist" aria-label="Browse" className="no-scrollbar -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {BROWSE_TABS.map(({ value: v, label, icon: TabIcon }) => {
          const on = v === value
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => onChange(v)}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition',
                on ? 'border-action-500 bg-action-500 text-white shadow-[0_3px_0_var(--brand-yellow)]' : 'border-border bg-surface-2 text-muted hover:border-[var(--brand-yellow)] hover:bg-[var(--brand-yellow-soft)] hover:text-text',
              )}
            >
              <TabIcon size={17} /> {label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function RailList({ title, to, items, href, label }) {
  if (!items?.length) return null
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-extrabold text-text">{title}</p>
        <Link to={to} className="text-xs font-bold text-action-fg hover:underline">See all</Link>
      </div>
      <ul className="mt-3 space-y-1">
        {items.map((x) => <li key={x.id}><Link to={href(x)} className="block rounded-xl px-2 py-2 text-sm font-semibold leading-snug text-text hover:bg-action-soft hover:text-action-fg"><span className="line-clamp-2">{label(x)}</span></Link></li>)}
      </ul>
    </div>
  )
}

function ContextSidebar() {
  const deals = useQuery({ queryKey: ['deals', 'rail'], queryFn: () => api.list('deals', { status: 'published', sort: '-discountPct', page: 1, pageSize: 3 }) }).data?.data
  const bundles = useQuery({ queryKey: ['bundles', 'rail'], queryFn: () => api.list('bundles', { status: PUBLIC.status, sort: '-createdAt', page: 1, pageSize: 3 }) }).data?.data
  return (
    <aside className="hidden min-[1100px]:block">
      <div className="sticky top-[10.5rem] max-h-[calc(100dvh-11.5rem)] space-y-4 overflow-y-auto overscroll-contain p-1 scroll-on-hover">
        <RailList title="Recommended deals" to="/deals" items={deals} href={(d) => `/deals/${d.slug}`} label={(d) => d.title ?? d.name} />
        <RailList title="Recommended bundles" to="/bundles" items={bundles} href={(b) => `/bundles/${b.code}`} label={(b) => b.title ?? b.name} />
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
          <p className="text-sm font-extrabold text-text">How it works</p>
          <ol className="mt-3 space-y-3 text-sm">
            {['Browse trusted opportunities', 'Compare clear offers', 'Pay safely through escrow'].map((item, i) => <li key={item} className="flex gap-2.5"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-action-soft text-xs font-bold text-action-fg">{i + 1}</span><span className="pt-0.5 text-muted">{item}</span></li>)}
          </ol>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
          <p className="flex items-center gap-2 font-bold text-text"><HelpCircle size={17} className="text-action-fg" /> Trust at every step</p>
          <p className="mt-2 text-sm leading-5 text-muted">Verified profiles, protected payments, and visible fulfillment updates keep every transaction accountable.</p>
          <Link to="/how-it-works" className="mt-3 inline-flex text-sm font-bold text-action-fg hover:underline">Learn more</Link>
        </div>
      </div>
    </aside>
  )
}

export function Home() {
  const collapsed = useUI((s) => s.sidebarCollapsed)
  const [tab, setTab] = useState('all')
  const show = (k) => tab === 'all' || tab === k
  return (
    <>
      <Hero />
      <div className={cn('mx-auto grid max-w-[1440px] gap-6 px-4 py-8 transition-[grid-template-columns] md:px-6 xl:px-10', collapsed ? 'min-[1024px]:grid-cols-[72px_minmax(0,1fr)] min-[1100px]:grid-cols-[72px_minmax(0,1fr)_250px]' : 'min-[1024px]:grid-cols-[220px_minmax(0,1fr)] min-[1100px]:grid-cols-[220px_minmax(0,1fr)_250px]')}>
        <DiscoverySidebar />
        <div className="min-w-0 space-y-10">
          <BrowseTabs value={tab} onChange={setTab} />
          {tab === 'all' && <Reveal><ShopByCategory /></Reveal>}
          {show('deals') && <Reveal key="deals"><DealsSection /></Reveal>}
          {show('needs') && <Reveal key="needs"><NeedsSection /></Reveal>}
          {show('bundles') && <Reveal key="bundles"><BundlesSection /></Reveal>}
        </div>
        <ContextSidebar />
      </div>
    </>
  )
}
