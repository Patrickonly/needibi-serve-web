import { useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useEngagement } from '@/lib/store'
import { CardSkeleton, EmptyState, ErrorState, Button, NoResults } from '@/design-system'
import { pageRange } from '@/components/tables/Pagination'

/** Horizontal snap carousel with prev/next buttons. */
export function Carousel({ children, label, itemClass = 'w-full sm:w-[260px]', className }) {
  const ref = useRef(null)
  const [edge, setEdge] = useState({ start: true, end: false })
  const update = () => {
    const el = ref.current
    if (!el) return
    setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }
  useEffect(update, [children])
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: 'smooth' })
  return (
    <div className={cn('group/carousel relative', className)} role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={ref} onScroll={update} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-3 pt-1 md:mx-0 md:scroll-px-0 md:px-0">
        {[].concat(children).map((c, i) => (
          <div key={c?.key ?? i} className={cn('shrink-0 snap-start', itemClass)}>
            {c}
          </div>
        ))}
      </div>
      {!edge.start && (
        <button type="button" onClick={() => scroll(-1)} aria-label="Previous" className="absolute -left-3 top-1/2 z-[3] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-hover md:flex">
          <ChevronLeft size={20} />
        </button>
      )}
      {!edge.end && (
        <button type="button" onClick={() => scroll(1)} aria-label="Next" className="absolute -right-3 top-1/2 z-[3] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-hover md:flex">
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  )
}

export function BackToTop() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const on = () => setShow(window.scrollY > 1200)
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  if (!show) return null
  return (
    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-24 right-4 z-30 flex h-11 items-center gap-1.5 rounded-full bg-primary-900 px-4 text-sm font-bold text-white shadow-modal md:bottom-8">
      <ArrowUp size={16} /> Back to top
    </button>
  )
}

/**
 * Infinite card feed (useInfiniteQuery + IntersectionObserver) with "Back to top",
 * plus page links at the bottom so crawlers can reach every page (SEO).
 */
export function InfiniteFeed({ queryKey, fetchPage, renderItem, grid, emptyState, pageSize = 12, seoBase, onClear, hasFilters, startPage = 1 }) {
  const hidden = useEngagement((s) => s.hidden)
  const q = useInfiniteQuery({
    queryKey: [...queryKey, startPage],
    queryFn: ({ pageParam }) => fetchPage({ page: pageParam, pageSize }),
    initialPageParam: startPage,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  })

  if (q.isLoading) {
    return (
      <div className={grid}>
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }
  // Keep showing what we already loaded; a failed refetch retries quietly instead of wiping the feed.
  if (q.isError && !q.data) return <ErrorState error={q.error} onRetry={() => q.refetch()} />
  const items = q.data.pages.flatMap((p) => p.data).filter((x) => !hidden[x.code ?? x.slug ?? x.id])
  const meta = q.data.pages[0].meta
  if (!items.length) return hasFilters ? <NoResults onClear={onClear} /> : emptyState ?? <EmptyState title="Nothing here yet" />
  return (
    <>
      <p className="sr-only" aria-live="polite">
        Showing {items.length} of {meta.total}
      </p>
      <div className={grid}>{items.map(renderItem)}</div>
      {q.isFetchingNextPage && (
        <div className={cn(grid, 'mt-4')}>
          {Array.from({ length: 4 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {!q.hasNextPage && items.length > pageSize && <p className="mt-8 text-center text-sm text-muted">You've reached the end · {meta.total} results</p>}
      {q.hasNextPage && !q.isFetchingNextPage && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => q.fetchNextPage()}>
            Load more
          </Button>
        </div>
      )}
      {seoBase && meta.totalPages > 1 && (
        <nav aria-label="All pages" className="mt-8 flex flex-wrap justify-center gap-1 text-sm">
          {pageRange(1, meta.totalPages, 2, 1).map((p) =>
            typeof p === 'string' ? (
              <span key={p} className="px-2 text-muted">
                …
              </span>
            ) : (
              <Link key={p} to={`${seoBase}${seoBase.includes('?') ? '&' : '?'}page=${p}`} className="rounded-md px-2.5 py-1 text-muted hover:bg-grey-100 hover:text-text">
                {p}
              </Link>
            ),
          )}
        </nav>
      )}
    </>
  )
}
