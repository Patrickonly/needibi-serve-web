import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Clock, TrendingUp, Mic, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { readStorage, writeStorage } from '@/lib/storage'
import { CATEGORIES } from '@/mocks/seed'
import { Icon, CATEGORY_ICON } from '@/design-system'

const POPULAR = ['Plumber', 'House cleaning', 'Car hire', 'Wedding catering', 'Apartment Kimihurura', 'Laptop repair']

/** Amazon-style search: scope dropdown + live suggestions (recent, popular, categories). */
export function SearchBar({ variant = 'header', className, autoFocus, placeholder }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const scope = params.get('type') ?? 'all'
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [recent, setRecent] = useState(() => readStorage('ns-recent-search', []))
  const wrap = useRef(null)
  const listId = `search-suggestions-${variant}`

  useEffect(() => {
    const close = (e) => wrap.current && !wrap.current.contains(e.target) && setOpen(false)
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  const ql = q.trim().toLowerCase()
  const suggestions = [
    ...(ql ? [] : recent.slice(0, 4).map((r) => ({ type: 'recent', label: r }))),
    ...POPULAR.filter((p) => !ql || p.toLowerCase().includes(ql)).slice(0, ql ? 4 : 4).map((p) => ({ type: 'popular', label: p })),
    ...CATEGORIES.filter((c) => !ql || c.name.toLowerCase().includes(ql) || c.subtypes.some((s) => s.toLowerCase().includes(ql)))
      .slice(0, 4)
      .map((c) => ({ type: 'category', label: c.name, slug: c.slug })),
  ]

  const submit = (term = q, s = scope) => {
    const value = term.trim()
    if (value) {
      const next = [value, ...recent.filter((r) => r !== value)].slice(0, 6)
      setRecent(next)
      writeStorage('ns-recent-search', next)
    }
    setOpen(false)
    navigate(`/search?q=${encodeURIComponent(value)}${s !== 'all' ? `&type=${s}` : ''}`)
  }

  const choose = (s) => {
    if (s.type === 'category') {
      setOpen(false)
      navigate(`/categories/${s.slug}`)
    } else {
      setQ(s.label)
      submit(s.label)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setActive((a) => Math.min(suggestions.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(-1, a - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (active >= 0 && suggestions[active]) choose(suggestions[active])
      else submit()
    } else if (e.key === 'Escape') setOpen(false)
  }

  const hero = variant === 'hero'
  return (
    <div ref={wrap} className={cn('relative w-full', className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className={cn(
          'flex w-full items-stretch overflow-hidden bg-surface ring-action-500 focus-within:ring-[3px]',
          hero ? 'h-14 rounded-xl shadow-hover sm:h-16' : variant === 'compact' ? 'h-10 rounded-full border border-border bg-surface-2 ring-action-500/20 transition-colors focus-within:border-action-500 focus-within:bg-surface focus-within:ring-4' : 'h-11 rounded-[10px]',
        )}
      >
        {variant === 'compact' && <Search size={17} className="ml-3.5 shrink-0 self-center text-muted" aria-hidden="true" />}
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder ?? (hero ? t('search.hero') : t('search.placeholder'))}
          aria-label={hero ? t('search.hero') : 'Search'}
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className={cn('min-w-0 flex-1 bg-transparent px-3 text-text placeholder:text-muted focus:outline-none', hero ? 'text-base sm:px-5 sm:text-lg' : 'text-[15px]')}
        />
        {q && (
          <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="flex items-center px-2 text-muted hover:text-text">
            <X size={16} />
          </button>
        )}
        {hero && (
          <button type="button" aria-label="Search by voice" className="hidden items-center px-3 text-muted hover:text-text sm:flex" onClick={() => navigate('/app/needer/post?mode=voice')}>
            <Mic size={20} />
          </button>
        )}
        {variant === 'compact' && !q && <kbd className="mr-2 hidden shrink-0 self-center rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium text-muted lg:inline">Enter ↵</kbd>}
        <button type="submit" aria-label="Search" className={cn('flex shrink-0 items-center justify-center bg-action-500 text-white hover:bg-action-600', hero ? 'w-14 sm:w-auto sm:gap-2 sm:px-6 sm:font-bold' : variant === 'compact' ? 'sr-only' : 'w-12')}>
          <Search size={hero ? 22 : 20} strokeWidth={2.25} />
          {hero && <span className="hidden sm:inline">Search</span>}
        </button>
      </form>

      {open && suggestions.length > 0 && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-50 mt-1.5 max-h-96 overflow-y-auto rounded-card border border-border bg-surface py-1.5 text-left shadow-hover animate-pop">
          {suggestions.map((s, i) => (
            <li
              key={`${s.type}-${s.label}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault()
                choose(s)
              }}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-center gap-3 px-3.5 py-2 text-sm text-text', i === active && 'bg-grey-100')}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-muted">
                {s.type === 'recent' ? <Clock size={14} /> : s.type === 'popular' ? <TrendingUp size={14} /> : <Icon name={CATEGORY_ICON[s.slug]} size={14} />}
              </span>
              <span className="flex-1 truncate">{s.label}</span>
              <span className="text-xs text-muted">{s.type === 'recent' ? t('search.recent') : s.type === 'popular' ? t('search.popular') : t('search.categories')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
