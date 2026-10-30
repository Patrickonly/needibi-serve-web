import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X, Plus, Heart, MessageSquare, Share, Play, Sparkles, ChevronRight, ChevronLeft, ChevronDown, ArrowRight, LayoutGrid, ArrowDown, ShieldCheck, BadgeCheck, Timer, Wallet, Target, Layers, Tag, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useUI } from '@/lib/store'
import { useShare } from '@/lib/hooks'
import { formatNumber, ago } from '@/lib/format'
import { CATEGORIES, DISTRICTS } from '@/mocks/seed'
import { Button, Checkbox, Drawer, Select, Input, Chip, CategoryIllustration, Icon, CATEGORY_ICON, EmptyState, Avatar, VerifiedBadge, Badge, Skeleton, Segmented, Card } from '@/design-system'
import { InfiniteFeed } from '@/components/feed/Feed'
import { AnyCard, CARD_GRID } from '@/components/cards/AnyCard'
import { DiscoverySidebar } from '@/components/layout/DiscoverySidebar'
import { DealCard } from '@/components/cards/DealCard'
import { BundleCard } from '@/components/cards/NeedCard'
import { PartnerCard } from '@/components/cards/PartnerCard'
import { usePostNeed } from '@/components/layout/PublicHeader'
import { countryName } from '@/lib/countries'
import { imgSrc, imgSrcSet } from '@/lib/images'

const PUBLIC_STATUS = 'published,matching,offers_received,negotiating'

/* ------------------------------------------------------------------ URL-driven filters */
function useFilterParams(keys) {
  const [sp, setSp] = useSearchParams()
  const values = Object.fromEntries(keys.map((k) => [k, sp.get(k) ?? '']))
  const set = (k, v) => {
    const n = new URLSearchParams(sp)
    if (v === '' || v == null) n.delete(k)
    else n.set(k, v)
    n.delete('page')
    n.delete('from')
    setSp(n, { replace: true })
  }
  const clear = () => {
    const n = new URLSearchParams()
    if (sp.get('q')) n.set('q', sp.get('q'))
    if (sp.get('type')) n.set('type', sp.get('type'))
    setSp(n, { replace: true })
  }
  return { values, set, clear, sp, active: keys.filter((k) => values[k]) }
}

/** Collapsible section. Open by default, so nothing is hidden from someone who just scans down. */
function FilterGroup({ title, children, defaultOpen = true, count }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-text"
      >
        <span className="flex items-center gap-1.5">
          {title}
          {count > 0 && <span className="tabular rounded-full bg-action-soft px-1.5 py-px text-[10px] font-bold normal-case tracking-normal text-action-fg">{count}</span>}
        </span>
        <ChevronDown size={14} className={cn('shrink-0 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open && <div className="space-y-2.5 pb-4">{children}</div>}
    </div>
  )
}

/** Checkbox list. Long lists (districts) get a search box and collapse to the first few. */
function MultiCheck({ value, onChange, options, searchable, placeholder = 'Type to find…' }) {
  const sel = value ? value.split(',') : []
  const [term, setTerm] = useState('')
  const [all, setAll] = useState(false)
  const toggle = (v, c) => onChange((c ? [...sel, v] : sel.filter((x) => x !== v)).join(','))
  const long = searchable ?? options.length > 8
  const matched = term ? options.filter(([, l]) => l.toLowerCase().includes(term.toLowerCase())) : options
  // Anything already ticked stays visible even when the list is collapsed.
  const shown = long && !all && !term ? matched.filter(([v], i) => i < 6 || sel.includes(v)) : matched
  return (
    <>
      {long && (
        <Input size="sm" value={term} onChange={(e) => setTerm(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      )}
      {shown.map(([v, l]) => (
        <Checkbox key={v} checked={sel.includes(v)} label={l} onChange={(c) => toggle(v, c)} />
      ))}
      {!shown.length && <p className="text-xs text-muted">Nothing matches “{term}”.</p>}
      {long && !term && matched.length > shown.length && (
        <button type="button" onClick={() => setAll(true)} className="text-xs font-semibold text-action-fg hover:underline">
          Show all {matched.length}
        </button>
      )}
      {long && !term && all && (
        <button type="button" onClick={() => setAll(false)} className="text-xs font-semibold text-action-fg hover:underline">
          Show fewer
        </button>
      )}
    </>
  )
}

function RangeInputs({ min, max, onMin, onMax }) {
  return (
    <div className="flex items-center gap-2">
      <Input size="sm" inputMode="numeric" placeholder="Min RWF" aria-label="Minimum" value={min} onChange={(e) => onMin(e.target.value.replace(/\D/g, ''))} />
      <span className="text-muted">–</span>
      <Input size="sm" inputMode="numeric" placeholder="Max RWF" aria-label="Maximum" value={max} onChange={(e) => onMax(e.target.value.replace(/\D/g, ''))} />
    </div>
  )
}

/** Left filter sidebar on desktop; a drawer behind a "Filters" button on phone. */
function FilterLayout({ filters, activeCount, onClear, children, title }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="grid gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="hidden lg:block" aria-label="Filters">
        <div className="sticky top-[136px] flex max-h-[calc(100dvh-152px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="shrink-0 border-b border-border bg-surface-2 px-5 py-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display font-bold text-text">
              <SlidersHorizontal size={17} className="text-action-fg" /> Filters
              {activeCount > 0 && <span className="tabular rounded-full bg-action-600 px-2 py-0.5 text-[11px] font-bold text-white">{activeCount}</span>}
              </h2>
              {activeCount > 0 && (
                <button type="button" onClick={onClear} className="text-xs font-semibold text-action-fg hover:underline">
                  Clear
                </button>
              )}
            </div>
            <p className="mt-1 text-xs leading-4 text-muted">Narrow the list to what matters most.</p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-3 scroll-on-hover">{filters}</div>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="mb-3 lg:hidden">
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <SlidersHorizontal size={16} /> Filters {activeCount > 0 && <Badge tone="serve" size="xs">{activeCount}</Badge>}
          </Button>
        </div>
        {children}
      </div>
      <Drawer open={open} onOpenChange={setOpen} side="left" title={title ?? 'Filters'} width="max-w-sm" footer={<div className="flex gap-2"><Button variant="ghost" onClick={onClear}>Clear all</Button><Button variant="primary" block onClick={() => setOpen(false)}>Show results</Button></div>}>
        <div className="p-5">{filters}</div>
      </Drawer>
    </div>
  )
}

function ActiveChips({ f, labels }) {
  if (!f.active.length) return null
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {f.active.map((k) => (
        <button key={k} type="button" onClick={() => f.set(k, '')} className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary" aria-label={`Remove ${labels[k] ?? k}`}>
          {labels[k] ?? k}: {f.values[k]} <X size={12} />
        </button>
      ))}
      <button type="button" onClick={f.clear} className="text-xs font-semibold text-info-fg hover:underline">
        Clear all
      </button>
    </div>
  )
}

const CAT_OPTS = CATEGORIES.map((c) => [c.slug, c.name])
const DIST_OPTS = Object.keys(DISTRICTS).map((d) => [d, d])

function NeedFilters({ f }) {
  return (
    <>
      <FilterGroup title="Category">
        <Select size="sm" value={f.values.category} onChange={(e) => f.set('category', e.target.value)} aria-label="Category">
          <option value="">All categories</option>
          {CAT_OPTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </FilterGroup>
      <FilterGroup title="How soon">
        <MultiCheck value={f.values.urgency} onChange={(v) => f.set('urgency', v)} options={[['urgent', 'Right away'], ['high', 'Within days'], ['medium', 'This month'], ['low', 'No rush']]} />
      </FilterGroup>
      <FilterGroup title="Budget (RWF)">
        <RangeInputs min={f.values['budget.amount_gte']} max={f.values['budget.amount_lte']} onMin={(v) => f.set('budget.amount_gte', v)} onMax={(v) => f.set('budget.amount_lte', v)} />
      </FilterGroup>
      <FilterGroup title="Location">
        <MultiCheck value={f.values.district} onChange={(v) => f.set('district', v)} options={DIST_OPTS} searchable placeholder="Search location…" />
      </FilterGroup>
      <FilterGroup title="How often">
        <MultiCheck value={f.values.frequency} onChange={(v) => f.set('frequency', v)} options={[['one_time', 'Just once'], ['recurring', 'Again and again'], ['mixed', 'Both']]} />
      </FilterGroup>
    </>
  )
}

/* ------------------------------------------------------------------ shared board chrome */
// One card per row on phones, two from sm up, matching the Home feed.
const BOARD_GRID = 'card-stagger mx-auto grid w-full max-w-2xl grid-cols-1 gap-5'
const HOME_PAGE_SIZE = 21

// Promotional banner slides per board — warm, user-friendly copy instead of the old
// technical header. Each title is [plain, highlighted]; cta is [label, target] where
// '@post' opens the Post-a-Need flow and '@bundle' the bundle builder.
const DEALS_BANNER = [
  { image: 'hero-market', eyebrow: 'Fixed prices, no haggling', title: ['Book it today,', 'pay when you are happy'], text: 'Ready-made offers from checked providers. Your money is held safely until the job is done — no surprises.', cta: ['Browse all deals', '/deals'] },
  { image: 'cleaning', eyebrow: 'Fresh every day', title: ['New deals added', 'every single day'], text: 'From home cleaning to car repair, grab a great price before it is gone.', cta: ["See today's deals", '/deals?tab=today'] },
  { image: 'carpentry', eyebrow: 'For providers', title: ['Turn your skills', 'into steady work'], text: 'List a fixed-price offer and reach thousands of customers across Rwanda.', cta: ['Sell on Needibi', '/become-a-partner'] },
]
const NEEDS_BANNER = [
  { image: 'hero-work', eyebrow: 'Free to ask', title: ['Tell us what you need,', 'offers come to you'], text: 'Post once and trusted providers reply with a price. You pick the best — it is completely free.', cta: ['Request a service', '@post'] },
  { image: 'moving', eyebrow: 'Only 3 can offer', title: ['Real quotes,', 'not endless calls'], text: 'Just three providers can make an offer, so you compare the best side by side in minutes.', cta: ['See how it works', '/how-it-works'] },
]
const BUNDLES_BANNER = [
  { image: 'party', eyebrow: 'Plan it all at once', title: ['A few jobs,', 'one simple ask'], text: 'Group everything you need into a single request and let one provider handle the lot.', cta: ['Ask for a few things', '@bundle'] },
  { image: 'wedding', eyebrow: 'One budget', title: ['Big plans made', 'wonderfully easy'], text: 'Perfect for events, moves and projects — compare offers for the whole plan at once.', cta: ['Browse bundles', '/bundles'] },
]
const PARTNERS_BANNER = [
  { image: 'electrical', eyebrow: 'Checked before they start', title: ['People you can trust,', 'right in your area'], text: 'Every partner shows their ID check, reviews and the places they work. Pick someone and ask them for a price.', cta: ['See top rated partners', '/partners?level=3'] },
  { image: 'carpentry', eyebrow: 'For partners', title: ['Turn your skills', 'into steady work'], text: 'Join Needibi, get checked once and receive requests from customers near you.', cta: ['Become a Partner', '/become-a-partner'] },
]

/** Modern promotional carousel that heads each board: friendly slides, live count and a trust strip. */
function BoardBanner({ crumb, count, countLabel = 'open now', slides }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const navigate = useNavigate()
  const postNeed = usePostNeed()
  useEffect(() => {
    if (paused || slides.length < 2) return
    const t = setInterval(() => setIndex((n) => (n + 1) % slides.length), 6000)
    return () => clearInterval(t)
  }, [paused, slides.length])
  const go = (step) => setIndex((n) => (n + step + slides.length) % slides.length)
  const slide = slides[index]
  const [ctaLabel, ctaTo] = slide.cta
  const onCta = () => {
    if (ctaTo === '@post') return postNeed()
    if (ctaTo === '@bundle') return navigate('/app/needer/bundles/new')
    navigate(ctaTo)
  }
  return (
    <section aria-roledescription="carousel" aria-label={`${crumb} highlights`}>
      <nav aria-label="Breadcrumb" className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-muted">
        <Link to="/" className="hover:text-text">Home</Link>
        <ChevronRight size={12} aria-hidden="true" />
        <span className="text-text" aria-current="page">{crumb}</span>
      </nav>
      <div
        className="relative flex min-h-[260px] flex-col justify-center overflow-hidden rounded-2xl bg-primary-900 text-white shadow-card"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((s, n) => (
          <img
            key={s.image}
            src={imgSrc(s.image, 800)}
            srcSet={imgSrcSet(s.image)}
            sizes="(min-width:1024px) 70vw, 100vw"
            alt=""
            className={cn('absolute inset-0 h-full w-full object-cover transition-opacity duration-700', n === index ? 'opacity-100' : 'opacity-0')}
            loading={n === 0 ? 'eager' : 'lazy'}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/92 via-primary-900/78 to-primary-900/45" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 z-[1] h-1 bg-[var(--brand-yellow)]" aria-hidden="true" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[var(--brand-yellow)]/25 blur-3xl" aria-hidden="true" />
        <div key={index} className="relative flex animate-fade-in flex-col px-5 py-7 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--brand-yellow)]/60 bg-[var(--brand-yellow)]/15 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <Sparkles size={13} className="text-[var(--brand-yellow)]" /> {slide.eyebrow}
            </span>
            {count != null && <span className="tabular inline-flex items-center rounded-full bg-[var(--brand-yellow)] px-2.5 py-1 text-xs font-bold text-primary-900">{formatNumber(count)} {countLabel}</span>}
          </div>
          <h1 className="mt-3 max-w-xl font-display text-[clamp(1.5rem,2.6vw,2.25rem)] font-extrabold leading-[1.1] tracking-tight">
            {slide.title[0]} <span className="text-[var(--brand-yellow)]">{slide.title[1]}</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-6 text-white/80 sm:text-[15px]">{slide.text}</p>
          <div className="mt-5">
            <Button variant="gold" size="lg" onClick={onCta} className="!bg-[var(--brand-yellow)] !text-primary-900 shadow-[0_10px_24px_-10px_rgb(250_204_21/0.7)] hover:!brightness-95">
              {ctaTo === '@post' && <Plus size={18} strokeWidth={2.5} />} {ctaLabel} {ctaTo !== '@post' && <ArrowRight size={17} />}
            </Button>
          </div>
        </div>
        {slides.length > 1 && (
          <div className="absolute right-4 top-4 z-[1] flex items-center gap-2 sm:right-5 sm:top-5">
            <div className="flex gap-1.5">
              {slides.map((s, n) => (
                <button key={s.image} type="button" onClick={() => setIndex(n)} aria-label={`Show slide ${n + 1}: ${s.eyebrow}`} aria-current={n === index || undefined} className={cn('h-1.5 rounded-full transition-all', n === index ? 'w-5 bg-[var(--brand-yellow)]' : 'w-1.5 bg-white/40 hover:bg-white/70')} />
              ))}
            </div>
            <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition hover:bg-white/25"><ChevronLeft size={16} /></button>
            <button type="button" onClick={() => go(1)} aria-label="Next slide" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm transition hover:bg-white/25"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>
    </section>
  )
}

const BROWSE_TABS = [
  ['/deals', 'Deals', Tag],
  ['/needs', 'Needs', ClipboardList],
  ['/bundles', 'Bundles', Layers],
]

/** Deals · Needs · Bundles switcher shown at the top of every feed, phone included. */
function BrowseTabs({ active }) {
  return (
    <nav aria-label="Browse" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
      {BROWSE_TABS.map(([to, label, TabIcon]) => {
        const on = active === to
        return (
          <Link
            key={to}
            to={to}
            aria-current={on ? 'page' : undefined}
            className={cn('inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition', on ? 'border-action-500 bg-action-500 text-white shadow-card' : 'border-border bg-surface text-text hover:border-[var(--brand-yellow)] hover:bg-[var(--brand-yellow-soft)]')}
          >
            <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', on ? 'bg-[var(--brand-yellow)] text-primary-900' : 'bg-[var(--brand-yellow-soft)] text-[var(--brand-yellow-fg)]')}><TabIcon size={14} aria-hidden="true" /></span> {label}
          </Link>
        )
      })}
    </nav>
  )
}

const hueTile = (i) => (i % 2 ? { background: 'var(--cat-yellow-bg)', color: 'var(--cat-yellow-fg)' } : { background: 'rgb(42 77 161 / 0.13)', color: 'var(--brand-blue-text)' })

/** One-tap category filter row. */
function CategoryRail({ value, onChange }) {
  const chip = (active) => cn('inline-flex shrink-0 items-center gap-2 rounded-full border py-1 pl-1 pr-3.5 text-sm font-medium transition', active ? 'border-action-500 bg-action-soft text-action-fg' : 'border-border bg-surface text-text hover:border-border-strong')
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="group" aria-label="Categories">
      <button type="button" aria-pressed={!value} onClick={() => onChange('')} className={chip(!value)}>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-action-100 text-action-fg"><LayoutGrid size={14} /></span> All
      </button>
      {CATEGORIES.map((c, i) => (
        <button key={c.slug} type="button" aria-pressed={value === c.slug} onClick={() => onChange(value === c.slug ? '' : c.slug)} className={chip(value === c.slug)}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full" style={hueTile(i)}><Icon name={c.icon} size={14} /></span>
          {c.name}
        </button>
      ))}
    </div>
  )
}

/** White bar above the grid: view controls on the left, result count + sort on the right. */
function BoardToolbar({ total, children, right }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-2.5 shadow-card">
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">{children}</div>
      <div className="flex shrink-0 items-center gap-3 pl-1">
        {total != null && (
          <span className="text-sm text-muted">
            <span className="tabular font-semibold text-text">{formatNumber(total)}</span> results
          </span>
        )}
        {right}
      </div>
    </div>
  )
}

function BoardContextual({ type }) {
  const content = {
    needs: {
      eyebrow: 'For providers',
      title: 'Find work near you',
      text: 'Each request says what is needed and the budget. Only 3 providers can offer, so reply early.',
      accent: 'bg-action-soft',
      icon: Target,
      links: [['/deals', 'Deals you can book'], ['/bundles', 'Bigger plans'], ['/categories', 'Browse categories']],
    },
    deals: {
      eyebrow: 'Ready to book',
      title: 'Compare before you book',
      text: 'Fixed prices from checked providers. Your money is held until the work is done.',
      accent: 'bg-trust-soft',
      icon: BadgeCheck,
      links: [['/needs', 'What people are asking for'], ['/bundles', 'Bigger plans'], ['/how-it-works', 'How it works']],
    },
    bundles: {
      eyebrow: 'Bigger plans',
      title: 'A few jobs in one ask',
      text: 'See what people are planning together, and whether one provider can do the lot or just a part.',
      accent: 'bg-primary-100',
      icon: Layers,
      links: [['/deals', 'Deals you can book'], ['/needs', 'What people are asking for'], ['/categories', 'Browse categories']],
    },
    partners: {
      eyebrow: 'Checked partners',
      title: 'Pick someone you can trust',
      text: 'Every partner is verified before they can work here. Compare ratings and areas, then request a service.',
      accent: 'bg-trust-soft',
      icon: BadgeCheck,
      links: [['/needs', 'What people are asking for'], ['/deals', 'Deals you can book'], ['/become-a-partner', 'Become a Partner']],
    },
  }[type]
  const ContextIcon = content.icon
  return (
    <aside className="hidden min-[1100px]:block" aria-label={`${type} recommendations`}>
<div className="sticky top-[10.5rem] max-h-[calc(100dvh-11.5rem)] space-y-4 overflow-y-auto overscroll-contain p-1 scroll-on-hover">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className={cn('border-b border-border p-5', content.accent)}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex rounded-full bg-[var(--brand-yellow)] px-2.5 py-1 text-xs font-bold text-primary-900 shadow-sm">{content.eyebrow}</p>
                <h2 className="mt-2 font-display text-lg font-bold leading-tight text-text">{content.title}</h2>
              </div>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface/80 text-action-fg shadow-sm">
                <ContextIcon size={20} />
              </span>
            </div>
            <p className="mt-3 text-sm leading-5 text-muted">{content.text}</p>
          </div>
          <nav className="space-y-1 p-3" aria-label="Related discovery">
            <p className="px-2.5 pb-1 text-sm font-extrabold text-text">See also</p>
            {content.links.map(([to, label]) => (
              <Link key={to} to={to} className="flex items-center justify-between rounded-xl px-2.5 py-2.5 text-sm font-semibold text-text transition hover:bg-action-soft hover:text-action-fg">
                {label}<ChevronRight size={15} />
              </Link>
            ))}
          </nav>
        </div>
        <div className="rounded-2xl border border-trust-200 bg-trust-50 p-4 shadow-card">
          <p className="flex items-center gap-2 font-bold text-text"><ShieldCheck size={17} className="text-trust-fg" /> You are covered</p>
          <ul className="mt-3 space-y-2 text-xs leading-4 text-muted">
            <li className="flex gap-2"><BadgeCheck size={15} className="shrink-0 text-trust-fg" /> Every partner is checked</li>
            <li className="flex gap-2"><Wallet size={15} className="shrink-0 text-trust-fg" /> We hold your money until you are happy</li>
            <li className="flex gap-2"><Timer size={15} className="shrink-0 text-trust-fg" /> You can follow the job as it moves</li>
          </ul>
        </div>
      </div>
    </aside>
  )
}

/** Board frame, same as Home: Discover menu · two-up feed · recommendations rail. Filters open in a drawer. */
function BoardColumns({ type, filters, activeCount = 0, onClear, filterTitle, children }) {
  const [drawer, setDrawer] = useState(false)
  const collapsed = useUI((s) => s.sidebarCollapsed)
  return (
    <div className={cn('grid gap-6 transition-[grid-template-columns]', collapsed ? 'min-[1024px]:grid-cols-[72px_minmax(0,1fr)] min-[1100px]:grid-cols-[72px_minmax(0,1fr)_250px]' : 'min-[1024px]:grid-cols-[220px_minmax(0,1fr)] min-[1100px]:grid-cols-[220px_minmax(0,1fr)_250px]')}>
      <DiscoverySidebar />
      <div className="min-w-0">
        <div className="mb-3 flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setDrawer(true)}>
            <SlidersHorizontal size={16} /> Filters {activeCount > 0 && <Badge tone="serve" size="xs">{activeCount}</Badge>}
          </Button>
          {activeCount > 0 && <button type="button" onClick={onClear} className="text-xs font-semibold text-action-fg hover:underline">Clear filters</button>}
        </div>
        {children}
      </div>
      <BoardContextual type={type} />
      <Drawer open={drawer} onOpenChange={setDrawer} side="left" title={filterTitle ?? 'Filters'} width="max-w-sm" footer={<div className="flex gap-2"><Button variant="ghost" onClick={onClear}>Clear all</Button><Button variant="primary" block onClick={() => setDrawer(false)}>Show results</Button></div>}>
        <div className="p-5">{filters}</div>
      </Drawer>
    </div>
  )
}

/** Shown when arriving from the home page's "Show more" — the list starts after the 21 already seen. */
function ContinueNote({ noun, onReset }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-action-500/25 bg-action-soft px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-text">
        <ArrowDown size={16} className="text-action-fg" /> Continuing after the {HOME_PAGE_SIZE} {noun} you saw on the home page.
      </span>
      <button type="button" onClick={onReset} className="font-semibold text-action-fg hover:underline">Start from the top</button>
    </div>
  )
}

/* ------------------------------------------------------------------ /needs */
export function NeedsBoard() {
  const { district } = useUI()
  const f = useFilterParams(['category', 'urgency', 'district', 'recurring', 'frequency', 'budget.amount_gte', 'budget.amount_lte', 'kind'])
  const tab = f.sp.get('tab') ?? 'foryou'
  const fromHome = f.sp.get('from') === 'home'
  const startPage = fromHome ? 2 : Number(f.sp.get('page')) || 1
  const postNeed = usePostNeed()
  const tabParams = { foryou: { sort: '-score' }, latest: { sort: '-createdAt' }, near: { district, sort: '-createdAt' }, urgent: { urgency: 'urgent', sort: '-createdAt' } }[tab]
  const params = { ...tabParams, ...Object.fromEntries(f.active.map((k) => [k, f.values[k]])) }
  const total = useQuery({ queryKey: ['feed', 'needs-board-count', params], queryFn: () => api.list('feed', { ...params, pageSize: 1 }) }).data?.meta.total
  return (
    <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 md:px-6 xl:px-10">
      <BoardBanner crumb="Needs" count={total} slides={NEEDS_BANNER} />
      <BrowseTabs active="/needs" />
      <CategoryRail value={f.values.category} onChange={(v) => f.set('category', v)} />
      <BoardColumns type="needs" filters={<NeedFilters f={f} />} activeCount={f.active.length} onClear={f.clear}>
        {fromHome && <ContinueNote noun="Needs" onReset={() => f.set('from', '')} />}
        <BoardToolbar total={total}>
          <Segmented
            label="Feed"
            size="sm"
            value={tab}
            onChange={(v) => f.set('tab', v === 'foryou' ? '' : v)}
            options={[
              { value: 'foryou', label: 'For you' },
              { value: 'latest', label: 'Newest' },
              { value: 'near', label: 'Near me' },
              { value: 'urgent', label: 'Needed soon' },
            ]}
          />
          <span className="h-6 w-px shrink-0 bg-border" aria-hidden="true" />
          {[['need', 'Needs'], ['bundle', 'Bundles']].map(([k, label]) => (
            <Chip key={label} active={f.values.kind === k} onClick={() => f.set('kind', k)} className="h-8">{label}</Chip>
          ))}
        </BoardToolbar>
        <ActiveChips f={f} labels={{ category: 'Category', urgency: 'How soon', district: 'Location', recurring: 'Repeats', frequency: 'How often', 'budget.amount_gte': 'Min', 'budget.amount_lte': 'Max', kind: 'Type' }} />
        <InfiniteFeed
          queryKey={['feed', 'needs-board', params]}
          fetchPage={(p) => api.list('feed', { ...params, ...p })}
          renderItem={(it) => <AnyCard key={it.id} item={it} />}
          grid={BOARD_GRID}
          pageSize={fromHome ? HOME_PAGE_SIZE : 12}
          seoBase="/needs"
          startPage={startPage}
          hasFilters={f.active.length > 0}
          onClear={f.clear}
          emptyState={<EmptyState title="Nothing here yet" description="Be the first — tell us what you need and providers will send you offers." action={<Button variant="gold" onClick={postNeed}>Request a service</Button>} />}
        />
      </BoardColumns>
    </div>
  )
}

/* ------------------------------------------------------------------ /bundles */
export function BundlesGallery() {
  const f = useFilterParams(['category', 'frequency', 'district', 'itemCount_gte', 'totalBudget.amount_lte'])
  const params = { status: `${PUBLIC_STATUS},in_service`, sort: '-createdAt', ...Object.fromEntries(f.active.map((k) => [k, f.values[k]])) }
  return (
    <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 md:px-6 xl:px-10">
      <BoardBanner crumb="Bundles" slides={BUNDLES_BANNER} />
      <BrowseTabs active="/bundles" />
      <BoardColumns
        type="bundles"
        activeCount={f.active.length}
        onClear={f.clear}
        filters={
          <>
            <FilterGroup title="Category">
              <Select size="sm" value={f.values.category} onChange={(e) => f.set('category', e.target.value)} aria-label="Category">
                <option value="">All categories</option>
                {CAT_OPTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </FilterGroup>
            <FilterGroup title="How often">
              <MultiCheck value={f.values.frequency} onChange={(v) => f.set('frequency', v)} options={[['one_time', 'Just once'], ['recurring', 'Again and again'], ['mixed', 'Both']]} />
            </FilterGroup>
            <FilterGroup title="How many jobs">
              <Select size="sm" value={f.values.itemCount_gte} onChange={(e) => f.set('itemCount_gte', e.target.value)} aria-label="How many jobs">
                <option value="">Any</option>
                <option value="4">4 or more</option>
                <option value="5">5 or more</option>
                <option value="6">6 or more</option>
              </Select>
            </FilterGroup>
            <FilterGroup title="Total budget up to">
              <Select size="sm" value={f.values['totalBudget.amount_lte']} onChange={(e) => f.set('totalBudget.amount_lte', e.target.value)} aria-label="Max total budget">
                <option value="">Any</option>
                <option value="1000000">RWF 1,000,000</option>
                <option value="3000000">RWF 3,000,000</option>
                <option value="8000000">RWF 8,000,000</option>
              </Select>
            </FilterGroup>
            <FilterGroup title="Location">
              <MultiCheck value={f.values.district} onChange={(v) => f.set('district', v)} options={DIST_OPTS} searchable placeholder="Search location…" />
            </FilterGroup>
          </>
        }
      >
        <ActiveChips f={f} labels={{ category: 'Category', frequency: 'How often', district: 'Location', itemCount_gte: 'Jobs', 'totalBudget.amount_lte': 'Budget up to' }} />
        <InfiniteFeed
          queryKey={['bundles', 'gallery', params]}
          fetchPage={(p) => api.list('bundles', { ...params, ...p })}
          renderItem={(b) => <AnyCard key={b.id} item={b} />}
          grid={BOARD_GRID}
          hasFilters={f.active.length > 0}
          onClear={f.clear}
          seoBase="/bundles"
        />
      </BoardColumns>
    </div>
  )
}

/* ------------------------------------------------------------------ /deals */
const DEAL_SORTS = [
  ['-score', 'Best match'],
  ['-bookedThisWeek', 'Most booked'],
  ['-createdAt', 'Newest'],
  ['price.amount', 'Price ↑'],
  ['-price.amount', 'Price ↓'],
  ['-rating', 'Top rated'],
  ['-discountPct', 'Biggest discount'],
]
const DEAL_QUICK = [['', 'All'], ['service', 'Services'], ['product', 'Products'], ['property', 'Property'], ['professional', 'Professionals'], ['bundle', 'Bundles']]

export function DealsBoard() {
  const f = useFilterParams(['category', 'type', 'coverage', 'price.amount_gte', 'price.amount_lte', 'rating_gte', 'partner.verified', 'tab'])
  const [sort, setSort] = useState('-score')
  const { country, countryName: detectedCountryName, enabledCountries } = useUI()
  const marketCountry = country || 'RW'
  const marketLabel = detectedCountryName || countryName(marketCountry)
  const canSeeDeals = enabledCountries.includes(marketCountry)
  const bundles = useQuery({
    queryKey: ['deals-page', 'bundles', marketCountry],
    queryFn: () => api.list('bundles', { status: `${PUBLIC_STATUS},in_service`, pageSize: 2, sort: '-createdAt' }),
    enabled: canSeeDeals,
  })
  const fromHome = f.sp.get('from') === 'home'
  const startPage = fromHome ? 2 : Number(f.sp.get('page')) || 1
  const params = { status: 'published', sort, ...Object.fromEntries(f.active.filter((k) => k !== 'tab').map((k) => [k, f.values[k]])) }
  if (f.values.tab === 'today') params.discountPct_gte = 10
  const total = useQuery({ queryKey: ['deals', 'board-count', params], queryFn: () => api.list('deals', { ...params, pageSize: 1 }), enabled: canSeeDeals }).data?.meta.total
  const filterCount = f.active.filter((k) => k !== 'tab').length
  return (
    <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 md:px-6 xl:px-10">
      <BoardBanner crumb="Deals" count={canSeeDeals ? total : undefined} slides={DEALS_BANNER} />
      <BrowseTabs active="/deals" />
      <CategoryRail value={f.values.category} onChange={(v) => f.set('category', v)} />
      <BoardColumns
        type="deals"
        activeCount={filterCount}
        onClear={f.clear}
        filters={
          <>
            <FilterGroup title="Category">
              <Select size="sm" value={f.values.category} onChange={(e) => f.set('category', e.target.value)} aria-label="Category">
                <option value="">All categories</option>
                {CAT_OPTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </FilterGroup>
            <FilterGroup title="What kind">
              <MultiCheck value={f.values.type} onChange={(v) => f.set('type', v)} options={[['service', 'Service'], ['product', 'Product'], ['vehicle', 'Vehicle'], ['property', 'Property'], ['professional', 'Professional'], ['custom', 'Custom solution'], ['bundle', 'Bundle']]} />
            </FilterGroup>
            <FilterGroup title="Price (RWF)">
              <RangeInputs min={f.values['price.amount_gte']} max={f.values['price.amount_lte']} onMin={(v) => f.set('price.amount_gte', v)} onMax={(v) => f.set('price.amount_lte', v)} />
            </FilterGroup>
            <FilterGroup title="Rating">
              {[['4.5', '★ 4.5 & up'], ['4', '★ 4.0 & up']].map(([v, l]) => (
                <Checkbox key={v} checked={f.values.rating_gte === v} label={l} onChange={(c) => f.set('rating_gte', c ? v : '')} />
              ))}
            </FilterGroup>
            <FilterGroup title="Provider">
              <Checkbox checked={f.values['partner.verified'] === 'true'} label="Checked providers only" onChange={(c) => f.set('partner.verified', c ? 'true' : '')} />
            </FilterGroup>
            <FilterGroup title="Works in">
              <MultiCheck value={f.values.coverage} onChange={(v) => f.set('coverage', v)} options={DIST_OPTS} searchable placeholder="Search location…" />
            </FilterGroup>
          </>
        }
      >
        {fromHome && <ContinueNote noun="Deals" onReset={() => f.set('from', '')} />}
        <BoardToolbar
          total={canSeeDeals ? total : undefined}
          right={
            <Select size="sm" value={sort} onChange={(e) => setSort(e.target.value)} className="w-40" aria-label="Sort by">
              {DEAL_SORTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          }
        >
          {DEAL_QUICK.map(([k, label]) => (
            <Chip key={label} active={f.values.type === k} onClick={() => f.set('type', k)} className="h-8">{label}</Chip>
          ))}
        </BoardToolbar>
        <ActiveChips f={{ ...f, active: f.active.filter((k) => k !== 'tab') }} labels={{ category: 'Category', type: 'Kind', coverage: 'Works in', 'price.amount_gte': 'Min', 'price.amount_lte': 'Max', rating_gte: 'Rating', 'partner.verified': 'Checked only' }} />
        {canSeeDeals ? (
          <InfiniteFeed
            queryKey={['deals', 'board', params, marketCountry]}
            fetchPage={(p) => api.list('deals', { ...params, ...p })}
            renderItem={(d) => <DealCard key={d.id} deal={d} />}
            grid={BOARD_GRID}
            pageSize={fromHome ? HOME_PAGE_SIZE : 12}
            seoBase="/deals"
            startPage={startPage}
            hasFilters={filterCount > 0}
            onClear={f.clear}
          />
        ) : (
          <EmptyState title={`Deals are not available in ${marketLabel}`} description="Needibi is not serving this country yet. An administrator can enable it in Platform settings." />
        )}
      </BoardColumns>
      {canSeeDeals && bundles.data?.data?.length > 0 && (
        <section className="grid gap-5 lg:grid-cols-[1.35fr_1fr]" aria-labelledby="deals-bundles-title">
          <div className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-action-fg">More ways to book</p>
                <h2 id="deals-bundles-title" className="mt-1 font-display text-xl font-bold tracking-[-0.03em] text-text">Bundles</h2>
              </div>
              <Link to="/bundles" className="text-sm font-bold text-action-fg hover:underline">View all bundles <ArrowRight size={14} className="inline" /></Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {bundles.data.data.slice(0, 2).map((bundle) => <BundleCard key={bundle.id} bundle={bundle} />)}
            </div>
          </div>
          <Card className="self-start bg-action-soft/50">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-action-fg">Need more than one service?</p>
            <h3 className="mt-2 font-display text-lg font-bold text-text">Keep related work together.</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Bundles make it easier to request, compare and book several services in one place.</p>
            <Button className="mt-4" size="sm" variant="primary" to="/bundles">Browse bundles <ArrowRight size={15} /></Button>
          </Card>
        </section>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ /categories */
export function CategoriesPage() {
  return (
    <div className="bg-surface-2/40">
      <div className="container-page py-8 md:py-10">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-info-fg">Explore Needibi Serve</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary md:text-4xl">Shop by category</h1>
          <p className="mt-2 text-muted">Find trusted Partners, live Needs and ready-to-book Deals in one place.</p>
        </div>
        <ul className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {CATEGORIES.map((c, i) => (
            <li key={c.slug} className="animate-fade-in overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-hover" style={{ animationDelay: `${Math.min(i * 45, 500)}ms` }}>
              <Link to={`/categories/${c.slug}`} className="group block">
                <div className="relative aspect-[1.65] overflow-hidden">
                  <CategoryIllustration category={c.slug} className="transition duration-500 group-hover:scale-105" label={c.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/85 via-primary-900/10 to-transparent" />
                  <span className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white text-info-fg shadow-card">
                    <LayoutGrid size={19} strokeWidth={2.2} />
                  </span>
                  <span className="absolute inset-x-4 bottom-4 text-lg font-extrabold tracking-tight text-white drop-shadow-sm">{c.name}</span>
                </div>
              </Link>
              <div className="px-4 pb-4 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
                  <span>{formatNumber(c.liveNeeds)} live Needs</span>
                  <span>{formatNumber(c.liveDeals)} Deals</span>
                </div>
                <div className="space-y-2">
                  {c.subtypes.slice(0, 3).map((s) => (
                    <Link key={s} to={`/categories/${c.slug}?subtype=${encodeURIComponent(s)}`} className="flex items-center gap-2 text-sm text-muted transition hover:text-info-fg">
                      <LayoutGrid size={15} className="shrink-0 text-info-fg" />
                      <span className="truncate">{s}</span>
                    </Link>
                  ))}
                </div>
                {c.subtypes.length > 3 && (
                  <Link to={`/categories/${c.slug}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-info-fg hover:underline">
                    +{c.subtypes.length - 3} more <ChevronRight size={15} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function CategoryPage() {
  const { slug } = useParams()
  const [sp, setSp] = useSearchParams()
  const cat = CATEGORIES.find((c) => c.slug === slug)
  const subtype = sp.get('subtype') ?? ''
  const postNeed = usePostNeed()
  const deals = useQuery({ queryKey: ['deals', 'cat', slug], queryFn: () => api.list('deals', { category: slug, status: 'published', pageSize: 8, sort: '-rating' }) })
  const partners = useQuery({ queryKey: ['partners', 'cat', slug], queryFn: () => api.list('partners', { categories: slug, status: 'active', pageSize: 4, sort: '-rating' }) })
  if (!cat) return <EmptyState title="Category not found" action={<Button to="/categories">All categories</Button>} />
  const needParams = { category: slug, ...(subtype ? { subtype } : {}), sort: '-createdAt' }
  return (
    <div>
       <div className="border-b border-border bg-surface">
         <div className="container-page flex flex-col gap-5 py-6 md:flex-row md:items-center">
           <span className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border">
            <CategoryIllustration category={slug} iconSize={36} />
          </span>
          <div className="flex-1">
             <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <Link to="/categories" className="hover:text-white">Categories</Link> › {cat.name}
              {subtype && ` › ${subtype}`}
            </nav>
             <h1 className="mt-1 font-display text-3xl font-extrabold text-text">{subtype || cat.name}</h1>
             <p className="tabular mt-1 text-sm text-muted">
               {formatNumber(cat.liveNeeds)} live Needs · {formatNumber(cat.liveDeals)} Deals
            </p>
          </div>
          <Button variant="primary" size="lg" onClick={postNeed}>
            <Plus size={18} /> Post a {cat.name.split(' ')[0]} Need
          </Button>
        </div>
      </div>
       <div className="container-page space-y-8 py-6">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Chip active={!subtype} onClick={() => setSp({})}>All {cat.name}</Chip>
          {cat.subtypes.map((s) => (
            <Chip key={s} active={subtype === s} onClick={() => setSp({ subtype: s })}>
              <Icon name={CATEGORY_ICON[slug]} size={14} /> {s}
            </Chip>
          ))}
        </div>
        <section>
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-2xl font-extrabold text-primary">Deals</h2>
            <Link to={`/deals?category=${slug}`} className="text-sm font-bold text-info-fg hover:underline">See all →</Link>
          </div>
           <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{deals.isLoading ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-card" />) : (deals.data?.data ?? []).map((d) => <DealCard key={d.id} deal={d} />)}</div>
        </section>
        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold text-primary">Live Needs</h2>
          <InfiniteFeed
            queryKey={['feed', 'cat', needParams]}
            fetchPage={(p) => api.list('feed', { ...needParams, ...p })}
            renderItem={(n) => <AnyCard key={n.id} item={n} />}
            grid={CARD_GRID}
            pageSize={8}
            emptyState={<EmptyState title={`No live ${subtype || cat.name} Needs right now`} description="Ask for yours and get offers from checked providers." action={<Button variant="gold" onClick={postNeed}>Request a service</Button>} />}
          />
        </section>
        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold text-primary">Top Partners in {cat.name}</h2>
           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{(partners.data?.data ?? []).map((p) => <PartnerCard key={p.id} partner={p} />)}</div>
        </section>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ /partners */
export function PartnersPage() {
  const f = useFilterParams(['categories', 'areas', 'level', 'rating_gte', 'q'])
  const params = { status: 'active', sort: '-rating', ...Object.fromEntries(f.active.map((k) => [k, f.values[k]])) }
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 xl:px-10">
      <BoardBanner crumb="Partners" slides={PARTNERS_BANNER} />
      <div className="mt-6">
        <BoardColumns
          type="partners"
          activeCount={f.active.length}
          onClear={f.clear}
          filters={
            <>
              <FilterGroup title="Search">
                <Input size="sm" value={f.values.q} onChange={(e) => f.set('q', e.target.value)} placeholder="Partner name" aria-label="Search partners" />
              </FilterGroup>
              <FilterGroup title="Category">
                <Select size="sm" value={f.values.categories} onChange={(e) => f.set('categories', e.target.value)} aria-label="Category">
                  <option value="">All</option>
                  {CAT_OPTS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </FilterGroup>
              <FilterGroup title="Standing">
                <MultiCheck value={f.values.level} onChange={(v) => f.set('level', v)} options={[['3', 'Top rated'], ['2', 'Well rated'], ['1', 'New here']]} />
              </FilterGroup>
              <FilterGroup title="Works in">
                <MultiCheck value={f.values.areas} onChange={(v) => f.set('areas', v)} options={DIST_OPTS} searchable placeholder="Search location…" />
              </FilterGroup>
            </>
          }
        >
          <InfiniteFeed queryKey={['partners', 'dir', params]} fetchPage={(p) => api.list('partners', { ...params, ...p })} renderItem={(p) => <PartnerCard key={p.id} partner={p} />} grid="card-stagger grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5" hasFilters={f.active.length > 0} onClear={f.clear} />
        </BoardColumns>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ /search */
const SEARCH_TYPES = [
  ['all', 'All'],
  ['needs', 'Needs'],
  ['bundles', 'Bundles'],
  ['deals', 'Deals'],
  ['partners', 'Partners'],
]
const SEARCH_SORTS = [
  ['relevance', 'Relevance'],
  ['newest', 'Newest'],
  ['price_asc', 'Price ↑'],
  ['price_desc', 'Price ↓'],
  ['nearest', 'Nearest'],
  ['updated', 'Recently updated'],
]
export function SearchPage() {
  const f = useFilterParams(['category', 'urgency', 'district', 'recurring', 'budget.amount_gte', 'budget.amount_lte', 'price.amount_gte', 'price.amount_lte', 'itemCount_gte', 'coverage', 'sort'])
  const q = f.sp.get('q') ?? ''
  const type = f.sp.get('type') ?? 'all'
  const postNeed = usePostNeed()
  const filterParams = Object.fromEntries(f.active.filter((k) => k !== 'sort').map((k) => [k, f.values[k]]))
  const params = { q, type, sort: f.values.sort, ...filterParams }
  const head = useQuery({ queryKey: ['search', 'head', q, type, filterParams], queryFn: () => api.get('/api/search', { ...params, pageSize: 1 }) })
  const counts = head.data?.meta.counts
  const filters = (
    <>
      <FilterGroup title="Category">
        <Select size="sm" value={f.values.category} onChange={(e) => f.set('category', e.target.value)} aria-label="Category">
          <option value="">All</option>
          {CAT_OPTS.map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </FilterGroup>
      {(type === 'needs' || type === 'all') && (
        <>
          <FilterGroup title="How soon">
            <MultiCheck value={f.values.urgency} onChange={(v) => f.set('urgency', v)} options={[['urgent', 'Right away'], ['high', 'Within days'], ['medium', 'This month'], ['low', 'No rush']]} />
          </FilterGroup>
          <FilterGroup title="Budget (RWF)">
            <RangeInputs min={f.values['budget.amount_gte']} max={f.values['budget.amount_lte']} onMin={(v) => f.set('budget.amount_gte', v)} onMax={(v) => f.set('budget.amount_lte', v)} />
          </FilterGroup>
          <FilterGroup title="How often">
            <Checkbox checked={f.values.recurring === 'true'} label="Repeats regularly" onChange={(c) => f.set('recurring', c ? 'true' : '')} />
          </FilterGroup>
        </>
      )}
      {type === 'deals' && (
        <FilterGroup title="Price (RWF)">
          <RangeInputs min={f.values['price.amount_gte']} max={f.values['price.amount_lte']} onMin={(v) => f.set('price.amount_gte', v)} onMax={(v) => f.set('price.amount_lte', v)} />
        </FilterGroup>
      )}
      {type === 'bundles' && (
        <FilterGroup title="How many jobs">
          <Select size="sm" value={f.values.itemCount_gte} onChange={(e) => f.set('itemCount_gte', e.target.value)} aria-label="How many jobs">
            <option value="">Any</option>
            <option value="4">4 or more</option>
            <option value="6">6 or more</option>
          </Select>
        </FilterGroup>
      )}
      <FilterGroup title="Location">
        <MultiCheck value={f.values.district} onChange={(v) => f.set('district', v)} options={DIST_OPTS} searchable placeholder="Search location…" />
      </FilterGroup>
    </>
  )
  return (
    <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6 xl:px-10">
      <h1 className="font-display text-2xl font-extrabold text-text sm:text-3xl">
        {q ? (
          <>
            Results for <span className="text-primary">“{q}”</span>
          </>
        ) : (
          'Search'
        )}
      </h1>
      {head.data?.meta.didYouMean && (
        <p className="mt-1 text-muted">
          Did you mean{' '}
          <Link to={`/search?q=${head.data.meta.didYouMean}`} className="font-semibold text-info-fg underline">
            {head.data.meta.didYouMean}
          </Link>
          ?
        </p>
      )}
      <div role="tablist" aria-label="Result type" className="no-scrollbar mt-4 flex gap-1 overflow-x-auto border-b border-border">
        {SEARCH_TYPES.map(([v, l]) => (
          <Link
            key={v}
            role="tab"
            aria-selected={type === v}
            to={`/search?q=${encodeURIComponent(q)}${v === 'all' ? '' : `&type=${v}`}`}
            className={cn('relative inline-flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-semibold', type === v ? 'text-text after:absolute after:inset-x-2 after:bottom-0 after:h-[3px] after:rounded-t after:bg-action-500' : 'text-muted hover:text-text')}
          >
            {l} {counts && <span className="tabular rounded-full bg-grey-100 px-1.5 text-xs text-grey-fg">{counts[v]}</span>}
          </Link>
        ))}
      </div>
      <div className="mt-5">
        <FilterLayout filters={filters} activeCount={f.active.filter((k) => k !== 'sort').length} onClear={f.clear}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <ActiveChips f={{ ...f, active: f.active.filter((k) => k !== 'sort') }} labels={{}} />
            <label className="ml-auto flex items-center gap-2 text-sm text-muted">
              Sort
              <Select size="sm" value={f.values.sort || 'relevance'} onChange={(e) => f.set('sort', e.target.value === 'relevance' ? '' : e.target.value)} className="w-44">
                {SEARCH_SORTS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </Select>
            </label>
          </div>
          <InfiniteFeed
            queryKey={['search', params]}
            fetchPage={(p) => api.get('/api/search', { ...params, ...p })}
            renderItem={(it) => <AnyCard key={`${it.kind}-${it.id}`} item={it} />}
            grid="grid grid-cols-1 gap-4"
            hasFilters={f.active.length > 0}
            onClear={f.clear}
            emptyState={
              <EmptyState
                art="search"
                title={q ? `No results for “${q}”` : 'Start typing to search'}
                description="Can't find it? Ask for it — it's free and checked providers will come to you."
                action={<Button variant="gold" onClick={postNeed}><Plus size={16} /> Request a service</Button>}
                secondary={<Button to="/categories" variant="outline">Browse categories</Button>}
              />
            }
          />
        </FilterLayout>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ /social & /reels */
const POSTS = [
  { id: 'sp1', partner: 'CleanPro Rwanda', handle: 'cleanpro', hue: 150, text: 'Before → after: a 3-bedroom deep clean in Kimihurura this morning. Booked through a Deal, paid via escrow. ✨', cat: 'home-furniture', likes: 214, comments: 18, video: true, deal: 'deep-clean-3-bedroom-house-1' },
  { id: 'sp2', partner: 'Akagera Events', handle: 'akagera-events', hue: 40, text: 'Set-up for 200 guests at a garden wedding in Rebero. Catering, décor and sound — one Bundle, three Partners.', cat: 'custom-solutions', likes: 532, comments: 41 },
  { id: 'sp3', partner: 'Kigali Auto Care', handle: 'kigali-auto-care', hue: 210, text: 'Rainy season tip: check your wiper blades and tyre tread. Free check with any service this week.', cat: 'automotive', likes: 98, comments: 7, video: true },
  { id: 'sp4', partner: 'Umuco Catering', handle: 'umuco-catering', hue: 25, text: 'Our new office lunch plan: 5 days, 20 staff, local menu. Now on Deals.', cat: 'food-catering', likes: 167, comments: 12 },
  { id: 'sp5', partner: 'Inzu Furniture', handle: 'inzu-furniture', hue: 30, text: 'Handmade in Gikondo: our solid wood sofa range. 20% off for Bundle buyers.', cat: 'home-furniture', likes: 301, comments: 22, video: true },
  { id: 'sp6', partner: 'Volcano Treks', handle: 'volcano-treks', hue: 120, text: 'Golden hour in Musanze after a gorilla trek. Permits sorted, transport included.', cat: 'travel-tourism', likes: 640, comments: 55 },
]
export function SocialPage({ reels }) {
  const share = useShare()
  const items = reels ? POSTS.filter((p) => p.video) : POSTS
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-6 md:px-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-primary">{reels ? 'Reels' : 'Social'}</h1>
          <p className="mt-1 text-muted">Work, tips and offers from checked providers you can follow.</p>
        </div>
        <div className="flex gap-2">
          <Button to="/social" variant={reels ? 'outline' : 'navy'} size="sm">Feed</Button>
          <Button to="/reels" variant={reels ? 'navy' : 'outline'} size="sm"><Play size={14} /> Reels</Button>
        </div>
      </div>
      <div className={cn('grid gap-5', reels ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2')}>
        {items.map((p) => (
          <Card key={p.id} padded={false} className="overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <Avatar name={p.partner} hue={p.hue} size={40} />
              <div className="min-w-0 flex-1">
                <Link to={`/partners/${p.handle}`} className="flex items-center gap-1 font-semibold text-text hover:underline">
                  {p.partner} <VerifiedBadge compact />
                </Link>
                <p className="text-xs text-muted">{ago(new Date(Date.now() - 3600_000 * (p.likes % 30)).toISOString())}</p>
              </div>
              <Badge tone="navy" icon={<Sparkles size={12} />} size="xs">Partner post</Badge>
            </div>
            <div className={cn('relative', reels ? 'aspect-[9/14]' : 'aspect-[4/3]')}>
              <CategoryIllustration category={p.cat} seed={p.likes % 4} iconSize={reels ? 72 : 56} />
              {p.video && (
                <span className="absolute inset-0 flex items-center justify-center bg-primary-900/20">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-primary-900">
                    <Play size={24} className="ml-1" fill="currentColor" aria-hidden="true" />
                    <span className="sr-only">Play video (captions available)</span>
                  </span>
                </span>
              )}
            </div>
            <div className="p-4">
              <p className="text-[15px] text-text">{p.text}</p>
              {p.deal && (
                <Link to={`/deals/${p.deal}`} className="mt-3 flex items-center justify-between rounded-lg bg-action-soft px-3 py-2 text-sm font-semibold text-text">
                  Linked Deal · Book now <ChevronRight size={16} />
                </Link>
              )}
              <div className="mt-3 flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1"><Heart size={16} /> {p.likes}</span>
                <span className="flex items-center gap-1"><MessageSquare size={16} /> {p.comments}</span>
                <button type="button" className="ml-auto flex items-center gap-1 hover:text-text" onClick={() => share({ title: p.partner, path: `/social#${p.id}` })}>
                  <Share size={16} /> Share
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
