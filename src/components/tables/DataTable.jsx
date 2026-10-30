import { useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import { useTranslation } from 'react-i18next'
import { Search, Columns, StretchHorizontal, Rows, Download, ArrowUp, ArrowDown, ArrowUpDown, X, LayoutGrid, List, ChevronDown, Bookmark, Ellipsis, Plus, FileSpreadsheet, FileText, Printer, FileDown, SlidersHorizontal, RotateCcw, Database, Eye, Hash, Filter, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { readStorage, writeStorage } from '@/lib/storage'
import { useDebounced, useMediaQuery } from '@/lib/hooks'
import { exportCSV, exportExcel, printTable } from '@/lib/export'
import { formatNumber } from '@/lib/format'
import { toast } from '@/lib/store'
import {
  Button, IconButton, Checkbox, Skeleton, EmptyState, NoResults, ErrorState, TopProgress, Tooltip,
  Menu, MenuTrigger, MenuContent, MenuItem, MenuCheckItem, MenuLabel, MenuSeparator, ConfirmDialog,
  Popover, PopoverTrigger, PopoverContent,
} from '@/design-system'
import { Pagination } from './Pagination'
import { useTx } from '@/lib/phrases'

/** URL is the source of truth for size, sort, filters and search. The page number is kept in
 *  component state so it never shows up in the address bar. */
function useTableUrlState({ id, defaultSort, defaultPageSize, filters, toggles }) {
  const [sp, setSp] = useSearchParams()
  const [page, setPage] = useState(1)
  const storedSize = readStorage(`ns-table-size:${id}`, null)
  const storedView = readStorage(`ns-table-view:${id}`, 'table')
  const state = {
    page,
    pageSize: Number(sp.get('size')) || storedSize || defaultPageSize,
    sort: sp.get('sort') === 'none' ? '' : sp.get('sort') ?? defaultSort,
    q: sp.get('q') ?? '',
    tab: sp.get('tab') ?? 'all',
    view: sp.get('view') ?? storedView,
    filters: Object.fromEntries(filters.map((f) => [f.id, sp.get(f.id) ?? ''])),
    toggles: Object.fromEntries(toggles.map((t) => [t.id, sp.get(t.id) === '1'])),
  }
  const update = (patch, { resetPage = true, replace = false } = {}) => {
    const next = new URLSearchParams(sp)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === '' || v == null || v === false || (k === 'tab' && v === 'all') || (k === 'view' && v === storedView)) next.delete(k)
      else next.set(k, v === true ? '1' : String(v))
    })
    if ('page' in patch) setPage(Math.max(1, Number(patch.page) || 1))
    else if (resetPage) setPage(1)
    next.delete('page')
    setSp(next, { replace })
  }
  // An older link may still carry ?page=2: adopt it once, then clean the address bar.
  useEffect(() => {
    const fromUrl = sp.get('page')
    if (fromUrl == null) return
    setPage(Math.max(1, Number(fromUrl) || 1))
    const next = new URLSearchParams(sp)
    next.delete('page')
    setSp(next, { replace: true })
  }, [sp, setSp])
  return [state, update, sp, setSp]
}

function SortIcon({ dir }) {
  if (dir === 'asc') return <ArrowUp size={14} aria-hidden="true" />
  if (dir === 'desc') return <ArrowDown size={14} aria-hidden="true" />
  return <ArrowUpDown size={14} className="opacity-40" aria-hidden="true" />
}

const toolbarBtn =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:border-border-strong hover:bg-surface-2'

const optionChip = (active) =>
  cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
    active
      ? 'border-action-500 bg-action-soft text-action-fg'
      : 'border-border bg-surface text-text hover:border-border-strong hover:bg-surface-2',
  )

/** One labelled group of single-select options inside the Filters panel. */
function FilterGroup({ filter, value, onChange }) {
  const tx = useTx()
  return (
    <div className="border-b border-border px-3.5 py-3 last:border-0">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted">{tx(filter.label)}</p>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onChange('')} className={optionChip(!value)}>
          Any
        </button>
        {filter.options.map((o) => {
          const ov = String(o.value)
          const count = filter.counts?.[ov]
          return (
            <button key={ov} type="button" onClick={() => onChange(ov)} className={optionChip(ov === value)}>
              {tx(o.label)}
              {count != null && <span className="tabular text-xs opacity-70">{formatNumber(count)}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function cellValue(row, col) {
  if (col.meta?.csv) return col.meta.csv(row)
  if (col.accessorFn) return col.accessorFn(row)
  if (col.accessorKey) return col.accessorKey.split('.').reduce((o, k) => o?.[k], row)
  return ''
}

/**
 * Shared management table (Section 9). Server-side pagination, URL state,
 * skeleton / empty / no-results / error states, bulk actions, export, saved views,
 * card toggle and stacked phone cards.
 */
export function DataTable({
  id,
  queryKey,
  fetcher,
  baseParams = {},
  columns,
  statusTabs,
  filters = [],
  toggles = [],
  searchPlaceholder = 'Search…',
  defaultSort = '-createdAt',
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 25,
  bulkActions = [],
  rowActions,
  viewToggle,
  emptyState,
  onRowClick,
  toolbarActions,
  savedViews = false,
  mobileLoadMore = false,
  getRowId = (r) => r.id,
  caption,
  className,
}) {
  const { t } = useTranslation()
  const tx = useTx()
  const qc = useQueryClient()
  const isPhone = useMediaQuery('(max-width: 767px)')
  // Fit columns to the table's real width (sidebar, screen and zoom all count)
  const wrapRef = useRef(null)
  const [wrapWidth, setWrapWidth] = useState(1200)
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([entry]) => setWrapWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const [expanded, setExpanded] = useState({})
  const [confirmBulk, setConfirmBulk] = useState(null)
  const [state, update, sp, setSp] = useTableUrlState({ id, defaultSort, defaultPageSize, filters, toggles })
  const [search, setSearch] = useState(state.q)
  const debounced = useDebounced(search, 300)
  const [rowSelection, setRowSelection] = useState({})
  const [allMatching, setAllMatching] = useState(false)
  const [density, setDensity] = useState(() => readStorage(`ns-table-density:${id}`, 'comfortable'))
  const [visibility, setVisibility] = useState(() => readStorage(`ns-table-cols:${id}`, {}))
  const [views, setViews] = useState(() => readStorage(`ns-table-views:${id}`, []))

  // debounced search → URL (resets to page 1)
  useEffect(() => {
    if (debounced !== state.q) update({ q: debounced }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])
  useEffect(() => setSearch(state.q), [state.q])

  const params = useMemo(() => {
    const p = { ...baseParams, page: state.page, pageSize: state.pageSize, sort: state.sort || undefined, q: state.q || undefined }
    if (statusTabs) {
      p.tabField = statusTabs.field
      if (state.tab !== 'all') p.tab = state.tab
    }
    filters.forEach((f) => {
      if (state.filters[f.id]) p[f.param ?? f.id] = state.filters[f.id]
    })
    toggles.forEach((tg) => {
      const on = state.toggles[tg.id]
      const v = on ? tg.paramOn : tg.paramOff
      if (v) Object.assign(p, v)
    })
    return p
  }, [baseParams, state, statusTabs, filters, toggles])

  const key = [...queryKey, params]
  const query = useQuery({ queryKey: key, queryFn: () => fetcher(params), placeholderData: keepPreviousData })
  const { data, isLoading, isError, error, isFetching, isPlaceholderData, refetch } = query
  const meta = data?.meta ?? { page: 1, pageSize: state.pageSize, total: 0, totalPages: 1 }
  const rows = data?.data ?? []

  // prefetch the next page in the background
  useEffect(() => {
    if (data && meta.page < meta.totalPages) {
      const next = { ...params, page: meta.page + 1 }
      qc.prefetchQuery({ queryKey: [...queryKey, next], queryFn: () => fetcher(next) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  // selection is per page view
  useEffect(() => {
    setRowSelection({})
    setAllMatching(false)
  }, [JSON.stringify(params)])

  const sorting = state.sort ? [{ id: state.sort.replace(/^-/, ''), desc: state.sort.startsWith('-') }] : []

  // Responsive like DataTables: columns that don't fit move into an expandable row (+ / −).
  const colId = (c) => c.id ?? c.accessorKey
  const shownData = columns.filter((c) => visibility[colId(c)] !== false)
  // Columns get room to breathe; the rest move into the expandable details row.
  const maxCols = Math.max(2, Math.min(7, Math.floor((wrapWidth - 300) / 190)))
  // Columns the user ticked always stay in the table; only the rest overflow into the details row.
  const autoHidden = shownData.filter((c) => visibility[colId(c)] !== true).slice(maxCols)
  const autoHiddenIds = autoHidden.map(colId)

  const rowOffset = (meta.page - 1) * meta.pageSize

  const allColumns = useMemo(() => {
    const cols = []
    if (autoHiddenIds.length) {
      cols.push({
        id: '__expand',
        enableHiding: false,
        enableSorting: false,
        header: () => <span className="sr-only">Details</span>,
        cell: ({ row }) => {
          const open = !!expanded[row.id]
          return (
            <button
              type="button"
              aria-expanded={open}
              aria-label={open ? 'Hide details' : 'Show more details'}
              onClick={() => setExpanded((x) => ({ ...x, [row.id]: !open }))}
              className={cn('flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-text', open && 'bg-surface-2 text-text')}
            >
              <ChevronDown size={16} className={cn('transition-transform duration-200', !open && '-rotate-90')} aria-hidden="true" />
            </button>
          )
        },
meta: { className: 'w-8 !px-2', stop: true },
      })
    }
    if (bulkActions.length) {
      cols.push({
        id: '__select',
        enableHiding: false,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all on this page"
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={table.getIsSomePageRowsSelected()}
            onChange={(v) => table.toggleAllPageRowsSelected(v)}
          />
        ),
        cell: ({ row }) => <Checkbox aria-label="Select row" checked={row.getIsSelected()} onChange={(v) => row.toggleSelected(v)} />,
meta: { className: 'w-8 !px-2', stop: true },
      })
    }
    cols.push({
      id: '__rownum',
      enableHiding: false,
      enableSorting: false,
      header: () => '#',
      cell: ({ row }) => <span className="tabular text-xs text-muted">{formatNumber(rowOffset + row.index + 1)}</span>,
      meta: { className: 'w-8 !px-2', csv: false },
    })
    cols.push(...columns)
    if (rowActions) {
      cols.push({ id: '__actions', enableHiding: false, enableSorting: false, header: () => <span className="sr-only">Actions</span>, cell: ({ row }) => rowActions(row.original), meta: { className: 'w-10 !pl-2 !pr-3 text-right', stop: true } })
    }
    return cols
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, rowActions, bulkActions.length, autoHiddenIds.join(), expanded, rowOffset])

  const table = useReactTable({
    data: rows,
    columns: allColumns,
    getRowId,
    state: { rowSelection, columnVisibility: { ...visibility, ...Object.fromEntries(autoHiddenIds.map((k) => [k, false])) }, sorting },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: (u) =>
      setVisibility((v) => {
        const next = typeof u === 'function' ? u(v) : u
        writeStorage(`ns-table-cols:${id}`, next)
        return next
      }),
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: meta.totalPages,
    enableRowSelection: true,
  })

  const cycleSort = (col) => {
    const sortKey = col.columnDef.meta?.sortKey ?? col.id
    const cur = state.sort?.replace(/^-/, '') === sortKey ? (state.sort.startsWith('-') ? 'desc' : 'asc') : null
    // asc → desc → none
    const next = cur === null ? sortKey : cur === 'asc' ? `-${sortKey}` : 'none'
    update({ sort: next === defaultSort ? '' : next })
  }

  const selected = table.getSelectedRowModel().rows.map((r) => r.original)
  const selectedCount = allMatching ? meta.total : selected.length
  const pageAllSelected = rows.length > 0 && table.getIsAllPageRowsSelected()

  // Status used to have its own tab row above the toolbar. It is now simply the first
  // group inside the Filters panel, so every way of narrowing the list lives in one place.
  const filterGroups = useMemo(
    () => (statusTabs ? [{ id: '__tab', label: statusTabs.label ?? 'Status', options: statusTabs.tabs, counts: meta.counts }, ...filters] : filters),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusTabs, filters, meta.counts],
  )
  const groupValue = (f) => (f.id === '__tab' ? (state.tab === 'all' ? '' : state.tab) : state.filters[f.id])
  const setGroup = (f, v) => update(f.id === '__tab' ? { tab: v || 'all' } : { [f.id]: v })

  const activeFilters = [
    ...filterGroups
      .filter((f) => groupValue(f))
      .map((f) => ({ id: f.id, label: `${f.label}: ${f.options.find((o) => String(o.value) === groupValue(f))?.label ?? groupValue(f)}` })),
    ...(state.q ? [{ id: 'q', label: `Search: “${state.q}”` }] : []),
  ]
  const activeCount = filterGroups.filter((f) => groupValue(f)).length
  const hasRefinement = activeFilters.length > 0
  const summaryCards = [
    { label: 'Total records', value: meta.total, icon: Database, tone: 'blue' },
    { label: 'Visible now', value: rows.length, icon: Eye, tone: 'green' },
    { label: 'Current page', value: `${meta.page} / ${Math.max(1, meta.totalPages)}`, icon: Hash, tone: 'amber' },
    { label: hasRefinement ? 'Active filters' : 'Ready to manage', value: hasRefinement ? activeCount : 'All records', icon: Filter, tone: 'pink' },
  ]
  const clearAll = () => {
    setSearch('')
    update({ q: '', tab: 'all', ...Object.fromEntries(filters.map((f) => [f.id, ''])) })
  }

  // One fetch of everything matching the current filters, shaped into header + rows.
  const exportRows = async () => {
    const all = await fetcher({ ...params, page: 1, pageSize: Math.min(5000, meta.total || 1) })
    const cols = columns.filter((c) => c.meta?.csv !== false && (c.accessorKey || c.accessorFn || c.meta?.csv))
    return {
      header: cols.map((c) => tx(typeof c.header === 'string' ? c.header : c.meta?.label ?? c.id)),
      rows: all.data.map((r) => cols.map((c) => cellValue(r, c))),
    }
  }

  const exportAs = async (kind) => {
    const label = caption ? tx(caption) : id.replace(/-/g, ' ')
    const stamp = new Date().toISOString().slice(0, 10)
    try {
      const { header, rows } = await exportRows()
      if (!rows.length) return toast('Nothing to export', { description: 'No rows match the current filters.' })
      const note = hasRefinement ? 'Filtered view' : 'All rows'
      if (kind === 'csv') exportCSV(`${id}-${stamp}`, header, rows)
      else if (kind === 'excel') exportExcel(`${id}-${stamp}`, label, header, rows)
      else if (!printTable(label, header, rows, { subtitle: note })) {
        return toast('Your browser blocked the print window', { description: 'Allow pop-ups for this site, then try again.', tone: 'danger' })
      }
      if (kind !== 'print') toast(`Exported ${formatNumber(rows.length)} rows`, { description: 'Uses your current filters and search.' })
    } catch {
      toast("That export didn't finish", { description: 'Check your connection and try again.', tone: 'danger' })
    }
  }

  const saveView = () => {
    const name = window.prompt('Name this view')
    if (!name) return
    const next = [...views.filter((v) => v.name !== name), { name, search: sp.toString() }]
    setViews(next)
    writeStorage(`ns-table-views:${id}`, next)
    toast(`Saved view “${name}”`)
  }

  const runBulk = async (a) => {
    await a.onRun(selected, { allMatching, params, total: meta.total })
    setRowSelection({})
    setAllMatching(false)
    qc.invalidateQueries({ queryKey })
  }

  const setPageSize = (n) => {
    writeStorage(`ns-table-size:${id}`, n)
    update({ size: n })
  }

  const cardMode = viewToggle && (state.view === 'card' || (isPhone && viewToggle.preferOnPhone))
  const pad = density === 'compact' ? 'py-1.5' : 'py-3'
  const visibleCols = table.getVisibleLeafColumns()
  const dim = isFetching && isPlaceholderData
  const tableRows = table.getRowModel().rows

  const effectiveViewToggle = viewToggle ?? {
    card: (record) => {
      const row = tableRows.find((candidate) => getRowId(candidate.original) === getRowId(record))
      const cardColumns = columns.filter((column) => column.id !== '__select' && column.id !== '__actions' && column.meta?.cardHidden !== true).slice(0, 6)
      const isRefCol = (column) => /ref|code|^id$|number/i.test(column.id)
      const titleCol = cardColumns.length > 1 && isRefCol(cardColumns[0]) ? cardColumns[1] : cardColumns[0]
      const subCol = titleCol === cardColumns[0] ? null : cardColumns[0]
      const bodyColumns = cardColumns.filter((column) => column !== titleCol && column !== subCol)
      const renderCell = (column) => flexRender(column.cell ?? ((context) => context.getValue()), { row, getValue: () => cellValue(record, column), column: { id: column.id } })
      return (
        <article
          className={cn('data-grid-card flex h-full min-h-[190px] flex-col', onRowClick && 'data-grid-card-link cursor-pointer')}
          onClick={() => onRowClick?.(record)}
          onKeyDown={(event) => event.key === 'Enter' && onRowClick?.(record)}
          role={onRowClick ? 'button' : undefined}
          tabIndex={onRowClick ? 0 : undefined}
        >
          <div className="data-grid-card-head mb-4 flex items-start gap-3 pb-3.5">
            <div className="min-w-0 flex-1">
              {titleCol && <div className="text-[15px] font-semibold leading-snug text-text">{renderCell(titleCol) || '—'}</div>}
              {subCol && <div className="mt-1 text-[12px] font-medium tracking-wide text-muted">{renderCell(subCol)}</div>}
            </div>
            {rowActions && <div className="-mr-1 -mt-1 shrink-0" onClick={(event) => event.stopPropagation()}>{rowActions(record)}</div>}
          </div>
          <div className="grid flex-1 content-start grid-cols-2 gap-x-5 gap-y-3.5">
            {bodyColumns.map((column) => {
              const value = flexRender(column.cell ?? ((context) => context.getValue()), {
                row,
                getValue: () => cellValue(record, column),
                column: { id: column.id },
              })
              return (
                <div key={column.id} className="min-w-0">
                  <p className="text-[12px] font-medium text-muted">{tx(typeof column.header === 'string' ? column.header : column.meta?.label ?? column.id)}</p>
                  <div className="mt-0.5 text-[13.5px] text-text">{value || '—'}</div>
                </div>
              )
            })}
          </div>
          
        </article>
      )
    },
  }
  const hasViewToggle = !!effectiveViewToggle
  const inCardMode = hasViewToggle && (state.view === 'card' || (isPhone && effectiveViewToggle.preferOnPhone))
  const switchView = (v) => {
    if (v === (inCardMode ? 'card' : 'table')) return
    update({ view: v }, { resetPage: false })
    if (readStorage(`ns-table-view:${id}`, 'table') === v) return
    toast(`Showing ${v === 'card' ? 'grid' : 'list'} view`, {
      duration: 12000,
      action: { label: 'Always show this', onClick: () => { writeStorage(`ns-table-view:${id}`, v); toast(`Saved. You'll see the ${v === 'card' ? 'grid' : 'list'} view every time you sign in.`) } },
    })
  }

  // ------------------------------------------------------------------ body
  let body
  if (isLoading) {
    body = isPhone || inCardMode ? (
      <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-card" />
        ))}
      </div>
    ) : (
      <table className="w-full text-sm">
        <tbody>
          {Array.from({ length: Math.min(8, state.pageSize) }, (_, i) => (
            <tr key={i} className="border-b border-border">
              {visibleCols.map((c) => (
                <td key={c.id} className={cn('px-3', pad)}>
                  <Skeleton className={cn('h-4', c.id === '__select' || c.id === '__actions' ? 'w-5' : i % 2 ? 'w-3/4' : 'w-1/2')} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  } else if (isError && !data) {
    // Only when there is nothing to fall back on. With rows already loaded the table stays put
    // and react-query retries underneath, so an idle tab never turns into an error screen.
    body = <ErrorState title="We couldn't load this list" error={error} onRetry={() => refetch()} />
  } else if (meta.total === 0) {
    body = hasRefinement ? <NoResults onClear={clearAll} label={t('table.noResults')} /> : (emptyState ?? <EmptyState title="Nothing here yet" />)
  } else if (inCardMode) {
    body = (
      <div className={cn('grid gap-4 p-4 transition-opacity grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))]', dim && 'opacity-50')}>
        {rows.map((r) => (
          <Fragment key={getRowId(r)}>{effectiveViewToggle.card(r)}</Fragment>
        ))}
      </div>
    )
  } else if (isPhone) {
    const primary = columns.find((c) => c.meta?.mobilePrimary) ?? columns[0]
    const rest = columns.filter((c) => c !== primary && !c.meta?.mobileHidden).slice(0, 4)
    body = (
      <ul className={cn('divide-y divide-border transition-opacity', dim && 'opacity-50')}>
        {table.getRowModel().rows.map((row) => (
          <li key={row.id} className="flex gap-3 p-3">
            {bulkActions.length > 0 && <Checkbox aria-label="Select row" checked={row.getIsSelected()} onChange={(v) => row.toggleSelected(v)} />}
            <div className="min-w-0 flex-1" onClick={() => onRowClick?.(row.original)} role={onRowClick ? 'button' : undefined} tabIndex={onRowClick ? 0 : undefined} onKeyDown={(e) => e.key === 'Enter' && onRowClick?.(row.original)}>
              <div className="text-sm">{flexRender(primary.cell ?? ((c) => c.getValue()), { row, getValue: () => cellValue(row.original, primary), column: { id: primary.id } })}</div>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                {rest.map((c) => (
                  <div key={c.id ?? c.accessorKey} className="min-w-0">
                    <dt className="text-muted">{typeof c.header === 'string' ? c.header : c.meta?.label}</dt>
                    <dd className="mt-0.5 min-w-0 text-text">{flexRender(c.cell ?? ((x) => String(x.getValue() ?? '—')), { row, getValue: () => cellValue(row.original, c), column: { id: c.id } })}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {rowActions && <div className="shrink-0">{rowActions(row.original)}</div>}
          </li>
        ))}
      </ul>
    )
  } else {
    body = (
      <div className="overflow-x-auto">
        <table className={cn('w-full border-collapse text-sm transition-opacity', dim && 'opacity-50')}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="sticky top-0 z-[1] bg-surface-2/95 backdrop-blur">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((h) => {
                  const canSort = h.column.columnDef.enableSorting !== false && h.column.columnDef.meta?.sortable
                  const sortKey = h.column.columnDef.meta?.sortKey ?? h.column.id
                  const dir = state.sort?.replace(/^-/, '') === sortKey ? (state.sort.startsWith('-') ? 'desc' : 'asc') : null
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : canSort ? 'none' : undefined}
                      className={cn('whitespace-nowrap px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted', h.column.columnDef.meta?.className, h.column.columnDef.meta?.align === 'right' && 'text-right')}
                    >
                      {canSort ? (
                        <button type="button" onClick={() => cycleSort(h.column)} className={cn('inline-flex items-center gap-1 uppercase hover:text-text', dir && 'text-text')}>
                          {typeof h.column.columnDef.header === 'string' ? tx(h.column.columnDef.header) : flexRender(h.column.columnDef.header, h.getContext())}
                          <SortIcon dir={dir} />
                        </button>
                      ) : typeof h.column.columnDef.header === 'string' ? (
                        tx(h.column.columnDef.header)
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
              <tr
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn('border-b border-border transition-colors hover:bg-action-soft/40', onRowClick && 'cursor-pointer', row.getIsSelected() && 'bg-action-soft/60', expanded[row.id] && 'border-b-0 bg-surface-2/60')}
              >
                {row.getVisibleCells().map((cell, i) => (
                  <td
                    key={cell.id}
                    onClick={cell.column.columnDef.meta?.stop ? (e) => e.stopPropagation() : undefined}
                    className={cn('px-4 align-middle text-text', pad, cell.column.columnDef.meta?.className, cell.column.columnDef.meta?.align === 'right' && 'text-right', i === (bulkActions.length ? 1 : 0) && 'max-w-[320px]')}
                  >
                    {flexRender(cell.column.columnDef.cell ?? ((c) => String(c.getValue() ?? '—')), cell.getContext())}
                  </td>
                ))}
              </tr>
              {expanded[row.id] && autoHidden.length > 0 && (
                <tr className="border-b border-border bg-surface-2/60">
                  <td colSpan={row.getVisibleCells().length} className="px-4 pb-4 pt-1">
                    <dl className="grid animate-fade-in gap-x-8 gap-y-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-3">
                      {autoHidden.map((c) => (
                        <div key={colId(c)} className="min-w-0">
                          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{tx(typeof c.header === 'string' ? c.header : c.meta?.label ?? colId(c))}</dt>
                          <dd className="mt-1 min-w-0 text-sm text-text">{flexRender(c.cell ?? ((x) => String(x.getValue() ?? '—')), { row, getValue: () => cellValue(row.original, c), column: { id: colId(c) } })}</dd>
                        </div>
                      ))}
                    </dl>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <section ref={wrapRef} className={cn('relative overflow-hidden rounded-card border border-border bg-surface shadow-card', className)} aria-label={caption}>
      <TopProgress active={isFetching && !isLoading} />

      <div className="grid grid-cols-2 gap-3 border-b border-border bg-surface-2/45 p-4 lg:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className={cn('table-summary-card', `tile-${tone}`)}>
            <span className="table-summary-card-icon" aria-hidden="true"><Icon size={19} /></span><ArrowUpRight size={18} className="table-summary-card-arrow" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-muted">{tx(label)}</p>
              <p className="table-summary-card-value tabular mt-1 truncate text-[22px] font-bold leading-tight tracking-tight">{typeof value === 'number' ? formatNumber(value) : value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tx(searchPlaceholder)}
            aria-label={tx(searchPlaceholder)}
            className="h-10 w-full rounded-full border border-border bg-surface-2 pl-9 pr-3 text-sm text-text placeholder:text-muted transition-colors focus-visible:border-action-500 focus-visible:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-action-500/15"
          />
        </div>
        <div className="no-scrollbar -mx-3 flex items-center gap-2 overflow-x-auto px-3 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
          {filterGroups.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className={cn(toolbarBtn, activeCount > 0 && 'border-action-500 bg-action-soft text-action-fg')}>
                  <SlidersHorizontal size={15} aria-hidden="true" />
                  Filters
                  {activeCount > 0 && <span className="tabular rounded-full bg-action-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{activeCount}</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="max-h-[70vh] w-[min(92vw,26rem)] overflow-y-auto p-0">
                <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                  <p className="text-sm font-bold text-text">Filters</p>
                  {activeCount > 0 && (
                    <button type="button" onClick={clearAll} className="text-xs font-semibold text-info-fg hover:underline">
                      {t('actions.clearAll')}
                    </button>
                  )}
                </div>
                {filterGroups.map((f) => (
                  <FilterGroup key={f.id} filter={f} value={groupValue(f)} onChange={(v) => setGroup(f, v)} />
                ))}
              </PopoverContent>
            </Popover>
          )}
          {hasRefinement && (
            <button type="button" onClick={clearAll} className={toolbarBtn}>
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
          )}
          {toggles.map((tg) => (
            <button
              key={tg.id}
              type="button"
              role="switch"
              aria-checked={!!state.toggles[tg.id]}
              onClick={() => update({ [tg.id]: !state.toggles[tg.id] })}
              className="flex shrink-0 items-center gap-2 rounded-full px-2 py-1.5 text-sm font-medium text-muted transition-colors hover:text-text"
            >
              <span className={cn('relative inline-flex h-4 w-7 items-center rounded-full transition-colors', state.toggles[tg.id] ? 'bg-action-600' : 'bg-border-strong')}>
                <span className={cn('inline-block h-3 w-3 rounded-full bg-white shadow transition-transform', state.toggles[tg.id] ? 'translate-x-3.5' : 'translate-x-0.5')} />
              </span>
              {tx(tg.label)}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1 lg:ml-auto">
          <Menu>
            <MenuTrigger asChild>
              <button type="button" className={toolbarBtn} aria-label="Columns and density">
                <Columns size={15} aria-hidden="true" />
                Columns
              </button>
            </MenuTrigger>
            <MenuContent>
              <MenuLabel>Columns</MenuLabel>
              {table
                .getAllLeafColumns()
                .filter((c) => c.columnDef.enableHiding !== false)
                .map((c) => (
                  <MenuCheckItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(v) => setVisibility((prev) => { const next = { ...prev, [c.id]: !!v }; writeStorage(`ns-table-cols:${id}`, next); return next })}>
                    {tx(typeof c.columnDef.header === 'string' ? c.columnDef.header : c.columnDef.meta?.label ?? c.id)}
                  </MenuCheckItem>
                ))}
              <MenuItem
                icon={<RotateCcw />}
                onSelect={() => {
                  setVisibility({})
                  writeStorage(`ns-table-cols:${id}`, {})
                }}
              >
                Reset columns
              </MenuItem>
              <MenuSeparator />
              <MenuLabel>Density</MenuLabel>
              {[
                ['comfortable', 'Comfortable', <Rows key="c" />],
                ['compact', 'Compact', <StretchHorizontal key="d" />],
              ].map(([v, l, icon]) => (
                <MenuItem
                  key={v}
                  icon={icon}
                  onSelect={() => {
                    setDensity(v)
                    writeStorage(`ns-table-density:${id}`, v)
                  }}
                >
                  <span className={cn(density === v && 'font-bold')}>{l}</span>
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
          {savedViews && (
            <Menu>
              <MenuTrigger asChild>
                <IconButton label="Saved views">
                  <Bookmark size={17} />
                </IconButton>
              </MenuTrigger>
              <MenuContent>
                <MenuLabel>Saved views</MenuLabel>
                {views.length === 0 && <p className="px-2.5 py-2 text-sm text-muted">No saved views yet</p>}
                {views.map((v) => (
                  <MenuItem key={v.name} onSelect={() => setSp(new URLSearchParams(v.search))}>
                    {v.name}
                  </MenuItem>
                ))}
                <MenuSeparator />
                <MenuItem icon={<Plus />} onSelect={saveView}>
                  Save current view
                </MenuItem>
              </MenuContent>
            </Menu>
          )}
          <Menu>
            <MenuTrigger asChild>
              <button type="button" disabled={!meta.total} className={cn(toolbarBtn, 'disabled:cursor-not-allowed disabled:opacity-50')} aria-label={t('actions.export')}>
                <Download size={15} aria-hidden="true" />
                Export
              </button>
            </MenuTrigger>
            <MenuContent>
              <MenuLabel>Download or print</MenuLabel>
              <MenuItem icon={<FileSpreadsheet />} onSelect={() => exportAs('excel')}>Excel (.xls)</MenuItem>
              <MenuItem icon={<FileDown />} onSelect={() => exportAs('csv')}>CSV (.csv)</MenuItem>
              <MenuItem icon={<FileText />} onSelect={() => exportAs('print')}>PDF</MenuItem>
              <MenuSeparator />
              <MenuItem icon={<Printer />} onSelect={() => exportAs('print')}>Print</MenuItem>
              <p className="px-2.5 pb-1 pt-1.5 text-[11px] leading-4 text-muted">{hasRefinement ? 'Only the rows matching your filters.' : 'Every row in this list.'}</p>
            </MenuContent>
          </Menu>
          {hasViewToggle && (
            <div className="ml-1 flex rounded-md border border-border p-0.5" role="group" aria-label="View">
              <IconButton label="List view" size="icon-sm" active={!inCardMode} className={cn('h-8 w-8', !inCardMode && 'bg-grey-100')} onClick={() => switchView('table')}>
                <List size={16} />
              </IconButton>
              <IconButton label="Grid view" size="icon-sm" active={inCardMode} className={cn('h-8 w-8', inCardMode && 'bg-grey-100')} onClick={() => switchView('card')}>
                <LayoutGrid size={16} />
              </IconButton>
            </div>
          )}
          {toolbarActions}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-sm">
          <span className="text-muted">Active:</span>
          {activeFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => (f.id === 'q' ? (setSearch(''), update({ q: '' })) : f.id === '__tab' ? update({ tab: 'all' }) : update({ [f.id]: '' }))}
              className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-border"
              aria-label={`Remove filter ${f.label}`}
            >
              {f.label} <X size={12} />
            </button>
          ))}
          <button type="button" onClick={clearAll} className="text-xs font-semibold text-info-fg hover:underline">
            {t('actions.clearAll')}
          </button>
        </div>
      )}

      {pageAllSelected && !allMatching && meta.total > rows.length && (
        <div className="border-b border-border bg-info-100 px-3 py-2 text-center text-sm text-info-fg">
          All {rows.length} on this page are selected.{' '}
          <button type="button" className="font-bold underline" onClick={() => setAllMatching(true)}>
            {t('table.selectAll', { total: formatNumber(meta.total) })}
          </button>
        </div>
      )}
      {allMatching && (
        <div className="border-b border-border bg-info-100 px-3 py-2 text-center text-sm text-info-fg">
          All {formatNumber(meta.total)} matching rows are selected.{' '}
          <button type="button" className="font-bold underline" onClick={() => { setAllMatching(false); setRowSelection({}) }}>
            Clear selection
          </button>
        </div>
      )}

      <div className="relative min-h-[200px]">{body}</div>

      {selectedCount > 0 && (
        <div className="sticky bottom-0 z-[2] flex flex-wrap items-center gap-2 border-t border-border bg-primary-900 px-3 py-2.5 text-white dark:bg-surface-2 dark:text-text">
          <span className="text-sm font-semibold" aria-live="polite">
            {t('table.selected', { count: formatNumber(selectedCount) })}:
          </span>
          {bulkActions.map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant={a.tone === 'danger' ? 'danger' : a.primary ? 'primary' : 'outline-white'}
              className="dark:border-border"
              onClick={() => (a.tone === 'danger' || a.confirm ? setConfirmBulk(a) : runBulk(a))}
            >
              {a.icon}
              {a.label}
            </Button>
          ))}
          <button type="button" className="ml-auto text-sm font-semibold text-white/80 hover:text-white dark:text-muted" onClick={() => { setRowSelection({}); setAllMatching(false) }}>
            Cancel
          </button>
        </div>
      )}

      {confirmBulk && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setConfirmBulk(null)}
          title={confirmBulk.confirm?.title ?? `${confirmBulk.label} ${formatNumber(selectedCount)} item${selectedCount === 1 ? '' : 's'}?`}
          description={confirmBulk.confirm?.description ?? 'Please confirm. This change is recorded in the audit log.'}
          confirmLabel={confirmBulk.confirm?.label ?? confirmBulk.label}
          tone={confirmBulk.tone === 'danger' ? 'danger' : 'primary'}
          onConfirm={async () => {
            const a = confirmBulk
            setConfirmBulk(null)
            await runBulk(a)
          }}
        />
      )}

      {(!isError || !!data) && meta.total > 0 && (
        <div className="border-t border-border p-4">
          {isPhone && mobileLoadMore ? (
            <div className="flex flex-col items-center gap-2">
              <p className="tabular text-sm text-muted">
                Showing {formatNumber(rows.length)} of {formatNumber(meta.total)}
              </p>
              {rows.length < meta.total && (
                <Button variant="outline" block loading={isFetching} onClick={() => update({ size: state.pageSize + 25 }, { resetPage: false })}>
                  Load more
                </Button>
              )}
            </div>
          ) : (
            <Pagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={(p) => update({ page: p }, { resetPage: false })} onPageSizeChange={setPageSize} pageSizeOptions={pageSizeOptions} compact={isPhone} />
          )}
        </div>
      )}
    </section>
  )
}

/** Generic ⋯ row menu. */
export function RowMenu({ items, label = 'Row actions' }) {
  const [pending, setPending] = useState(null)
  return (
    <>
    <Menu>
      <MenuTrigger asChild>
        <IconButton label={label} onClick={(e) => e.stopPropagation()}>
          <Ellipsis size={18} />
        </IconButton>
      </MenuTrigger>
      <MenuContent>
        {items.filter(Boolean).map((i, k) =>
          i === '-' ? (
            <MenuSeparator key={`sep-${k}`} />
          ) : (
            <MenuItem key={i.label} icon={i.icon} tone={i.tone} onSelect={() => (i.tone === 'danger' || i.confirm ? setPending(i) : i.onSelect?.())} disabled={i.disabled}>
              {i.label}
            </MenuItem>
          ),
        )}
      </MenuContent>
    </Menu>
    {pending && (
      <ConfirmDialog
        open
        onOpenChange={(o) => !o && setPending(null)}
        title={pending.confirm?.title ?? `${pending.label}?`}
        description={pending.confirm?.description ?? 'Please confirm. This change is recorded in the audit log.'}
        confirmLabel={pending.confirm?.label ?? pending.label}
        tone={pending.tone === 'danger' ? 'danger' : 'primary'}
        onConfirm={() => {
          const it = pending
          setPending(null)
          it.onSelect?.()
        }}
      />
    )}
    </>
  )
}
