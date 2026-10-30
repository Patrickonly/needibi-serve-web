import { Link } from 'react-router-dom'
import { formatMoney, formatDate, formatDateTime, ago, formatNumber } from '@/lib/format'
import { statusMeta } from '@/lib/status'
import { StatusBadge, UrgencyBadge, PriorityBadge, Avatar, MediaThumb, KindLabel, SlotMeter, Badge, VerifiedBadge, Rating } from '@/design-system'

const get = (o, path) => path.split('.').reduce((x, k) => x?.[k], o)

// Each helper returns a TanStack ColumnDef. `meta.sortable` opts into server sorting.
export const col = {
  text: (key, header, opts = {}) => ({
    id: key,
    accessorFn: (r) => get(r, key),
    header,
    cell: ({ row }) => <span className={opts.strong ? 'font-semibold' : opts.muted ? 'text-muted' : ''}>{get(row.original, key) ?? '—'}</span>,
    meta: { sortable: opts.sortable, ...opts.meta },
  }),

  code: (key = 'code', header = 'Code') => ({
    id: key,
    accessorFn: (r) => get(r, key),
    header,
    cell: ({ row }) => <span className="tabular whitespace-nowrap text-xs font-semibold text-muted">{get(row.original, key)}</span>,
    meta: { sortable: true, mobileHidden: true },
  }),

  money: (key, header, opts = {}) => ({
    id: key,
    accessorFn: (r) => get(r, key)?.amount ?? get(r, key),
    header,
    cell: ({ row }) => <span className="tabular whitespace-nowrap font-semibold">{formatMoney(get(row.original, key))}</span>,
    meta: { sortable: opts.sortable ?? true, sortKey: `${key}.amount`, align: 'right', csv: (r) => get(r, key)?.amount ?? '' },
  }),

  number: (key, header, opts = {}) => ({
    id: key,
    accessorFn: (r) => get(r, key),
    header,
    cell: ({ row }) => <span className="tabular">{formatNumber(get(row.original, key))}{opts.suffix}</span>,
    meta: { sortable: opts.sortable ?? true, align: 'right' },
  }),

  date: (key = 'createdAt', header = 'Date', opts = {}) => ({
    id: key,
    accessorFn: (r) => get(r, key),
    header,
    cell: ({ row }) => {
      const v = get(row.original, key)
      return (
        <time dateTime={v} title={formatDateTime(v)} className="whitespace-nowrap text-muted">
          {opts.relative ? ago(v) : opts.time ? formatDateTime(v) : formatDate(v)}
        </time>
      )
    },
    meta: { sortable: true, mobileHidden: opts.mobileHidden },
  }),

  status: (key = 'status', header = 'Status') => ({
    id: key,
    accessorFn: (r) => get(r, key),
    header,
    cell: ({ row }) => <StatusBadge status={get(row.original, key)} size="xs" />,
    meta: { sortable: true, csv: (r) => statusMeta(get(r, key)).label },
  }),

  urgency: () => ({ id: 'urgency', accessorKey: 'urgency', header: 'Urgency', cell: ({ row }) => <UrgencyBadge urgency={row.original.urgency} size="xs" />, meta: { sortable: true } }),
  priority: (key = 'priority') => ({ id: key, accessorKey: key, header: 'Priority', cell: ({ row }) => <PriorityBadge priority={row.original[key]} size="xs" />, meta: { sortable: true } }),

  person: (nameKey, header, opts = {}) => ({
    id: nameKey,
    accessorFn: (r) => get(r, nameKey),
    header,
    cell: ({ row }) => (
      <span className="flex min-w-0 items-center gap-2">
        <Avatar name={get(row.original, nameKey)} hue={get(row.original, opts.hueKey ?? 'avatarHue') ?? 0} size={26} />
        <span className="truncate font-medium">{get(row.original, nameKey)}</span>
        {opts.verifiedKey && get(row.original, opts.verifiedKey) && <VerifiedBadge compact />}
      </span>
    ),
    meta: { sortable: true, mobilePrimary: opts.primary },
  }),

  /** Thumbnail + title + code (Need, Bundle, Deal rows). */
  item: (opts = {}) => ({
    id: 'title',
    accessorKey: 'title',
    header: opts.header ?? 'Item',
    cell: ({ row }) => {
      const r = row.original
      const to = opts.href?.(r)
      const inner = (
        <span className="flex min-w-0 items-center gap-3">
          {opts.thumb !== false && <MediaThumb item={r} media={r.media} mini className="h-11 w-11 shrink-0 rounded-lg [&_.rounded-3xl]:rounded-md [&_.rounded-3xl]:p-1 [&_.rounded-3xl]:shadow-none" iconSize={16} />}
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              {opts.kind && <KindLabel kind={r.kind} />}
              <span className="truncate font-semibold text-text">{r.title}</span>
            </span>
            <span className="tabular block truncate text-xs text-muted">{opts.sub ? opts.sub(r) : r.code ?? r.slug}</span>
          </span>
        </span>
      )
      return to ? (
        <Link to={to} className="hover:underline" onClick={(e) => e.stopPropagation()}>
          {inner}
        </Link>
      ) : (
        inner
      )
    },
    meta: { sortable: true, mobilePrimary: true },
  }),

  // Live slot meter only while offers can still arrive; afterwards just the count
  slots: () => ({
    id: 'offerSlots',
    accessorFn: (r) => r.offerSlots?.used,
    header: 'Offers',
    cell: ({ row }) => {
      const r = row.original
      if (!r.offerSlots) return '—'
      return ['submitted', 'matching', 'action_needed'].includes(r.statusGroup) ? <SlotMeter used={r.offerSlots.used} limit={r.offerSlots.limit} /> : <span className="tabular whitespace-nowrap text-xs text-muted">{r.offerSlots.used} received</span>
    },
    meta: { sortable: false },
  }),

  badge: (key, header, map = {}) => ({
    id: key,
    accessorFn: (r) => get(r, key),
    header,
    cell: ({ row }) => {
      const v = get(row.original, key)
      const m = map[v] ?? { tone: 'grey', label: v }
      return (
        <Badge tone={m.tone} size="xs" iconName={m.icon}>
          {m.label ?? String(v)}
        </Badge>
      )
    },
    meta: { sortable: true },
  }),

  rating: (key = 'rating') => ({ id: key, accessorKey: key, header: 'Rating', cell: ({ row }) => <Rating value={row.original[key]} size={12} className="text-xs" />, meta: { sortable: true } }),

  custom: (id, header, cell, meta = {}) => ({ id, header, cell: ({ row }) => cell(row.original), accessorFn: meta.value, meta }),
}
