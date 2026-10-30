import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'

/** 1 … 4 5 [6] 7 8 … 50 */
export function pageRange(page, totalPages, siblingCount = 1, boundaryCount = 1) {
  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i)
  const totalSlots = boundaryCount * 2 + siblingCount * 2 + 3
  if (totalPages <= totalSlots) return range(1, totalPages)
  const start = Math.max(Math.min(page - siblingCount, totalPages - boundaryCount - siblingCount * 2 - 1), boundaryCount + 2)
  const end = Math.min(Math.max(page + siblingCount, boundaryCount + siblingCount * 2 + 2), totalPages - boundaryCount - 1)
  return [
    ...range(1, boundaryCount),
    start > boundaryCount + 2 ? 'start-ellipsis' : boundaryCount + 1,
    ...range(start, end),
    end < totalPages - boundaryCount - 1 ? 'end-ellipsis' : totalPages - boundaryCount,
    ...range(totalPages - boundaryCount + 1, totalPages),
  ]
}

function NavButton({ label, disabled, onClick, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-disabled={disabled || undefined}
      onClick={disabled ? undefined : onClick}
      className={cn('flex h-9 min-w-9 items-center justify-center rounded-full border border-border bg-surface text-text shadow-[0_1px_2px_rgb(16_24_40/0.05)] transition-colors', disabled ? 'cursor-not-allowed opacity-40' : 'hover:border-action-500 hover:text-action-fg')}
    >
      {children}
    </button>
  )
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, siblingCount = 1, boundaryCount = 1, pageSizeOptions = [10, 25, 50, 100], compact, className }) {
  const { t } = useTranslation()
  const [goto, setGoto] = useState('')
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  const first = page <= 1
  const last = page >= totalPages

  const sizeSelect = (
    <label className="flex items-center gap-2 text-sm text-muted">
      {t('table.rows')}
      <select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} className="h-9 rounded-md border border-border bg-surface px-2 text-sm font-semibold text-text">
        {pageSizeOptions.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  )

  if (compact) {
    return (
      <div className={cn('flex items-center justify-between gap-3', className)}>
        <nav aria-label="Pagination" className="flex items-center gap-1.5">
          <NavButton label="First page" disabled={first} onClick={() => onPageChange(1)}>
            <ChevronsLeft size={17} />
          </NavButton>
          <NavButton label="Previous page" disabled={first} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft size={18} />
          </NavButton>
          <span className="tabular text-sm font-semibold text-text" aria-live="polite">
            {t('table.page', { page, total: totalPages })}
          </span>
          <NavButton label="Next page" disabled={last} onClick={() => onPageChange(page + 1)}>
            <ChevronRight size={18} />
          </NavButton>
          <NavButton label="Last page" disabled={last} onClick={() => onPageChange(totalPages)}>
            <ChevronsRight size={17} />
          </NavButton>
        </nav>
        {sizeSelect}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-x-6 gap-y-3', className)}>
      <p className="tabular text-sm text-muted" aria-live="polite">
        {t('table.showing', { from: formatNumber(from), to: formatNumber(to), total: formatNumber(total) })}
      </p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {sizeSelect}
        <nav aria-label="Pagination">
          <ul className="flex items-center gap-1">
            <li>
              <NavButton label="First page" disabled={first} onClick={() => onPageChange(1)}>
                <ChevronsLeft size={16} />
              </NavButton>
            </li>
            <li>
              <NavButton label="Previous page" disabled={first} onClick={() => onPageChange(page - 1)}>
                <ChevronLeft size={16} />
              </NavButton>
            </li>
            {pageRange(page, totalPages, siblingCount, boundaryCount).map((p) =>
              typeof p === 'string' ? (
                <li key={p} aria-hidden="true" className="px-1 text-muted">
                  …
                </li>
              ) : (
                <li key={p}>
                  <button
                    type="button"
                    onClick={() => onPageChange(p)}
                    aria-label={`Page ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    className={cn(
                      'tabular flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-sm font-semibold',
                      p === page ? 'bg-action-600 text-white shadow-[0_4px_10px_-4px_rgb(42_79_181/0.6)]' : 'text-text hover:bg-surface-2',
                    )}
                  >
                    {p}
                  </button>
                </li>
              ),
            )}
            <li>
              <NavButton label="Next page" disabled={last} onClick={() => onPageChange(page + 1)}>
                <ChevronRight size={16} />
              </NavButton>
            </li>
            <li>
              <NavButton label="Last page" disabled={last} onClick={() => onPageChange(totalPages)}>
                <ChevronsRight size={16} />
              </NavButton>
            </li>
          </ul>
        </nav>
        <form
          className="flex items-center gap-2 text-sm text-muted"
          onSubmit={(e) => {
            e.preventDefault()
            const n = Math.min(totalPages, Math.max(1, Number(goto)))
            if (n) onPageChange(n)
            setGoto('')
          }}
        >
          <label htmlFor="goto-page">{t('table.goTo')}</label>
          <input id="goto-page" value={goto} onChange={(e) => setGoto(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="tabular h-9 w-14 rounded-md border border-border bg-surface px-2 text-center text-sm text-text" placeholder={String(page)} />
        </form>
      </div>
    </div>
  )
}
