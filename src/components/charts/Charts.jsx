import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, Legend } from 'recharts'
import { formatCompact, formatMoney } from '@/lib/format'
import { Card, CardTitle, Skeleton } from '@/design-system'
import { useTx } from '@/lib/phrases'

// Series colours come from brand tokens so charts follow light/dark themes.
export const SERIES = ['var(--action-600)', 'var(--action-300)', 'var(--trust-600)', 'var(--info-600)', 'var(--warn-500)', 'var(--danger-600)']

const axis = { stroke: 'var(--text-muted)', fontSize: 12, tickLine: false, axisLine: false }

function TooltipBox({ active, payload, label, money }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-2.5 text-xs shadow-modal">
      {label && <p className="mb-1 font-semibold text-text">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
          {p.name}: <span className="tabular font-semibold text-text">{money ? formatMoney(p.value) : formatCompact(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function ChartCard({ title, sub, action, children, loading, height = 240, className, summary }) {
  const tx = useTx()
  return (
    <Card className={className}>
      <CardTitle sub={tx(sub)} action={action}>
        {tx(title)}
      </CardTitle>
      {loading ? (
        <Skeleton style={{ height }} className="w-full rounded-lg" />
      ) : (
        <div style={{ height }} role="img" aria-label={summary ?? (typeof title === 'string' ? `${title} chart` : 'Chart')}>
          {children}
        </div>
      )}
    </Card>
  )
}

export function MonthlyBars({ data, keys, money, stacked }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
        <XAxis dataKey="month" {...axis} dy={6} />
        <YAxis {...axis} tickFormatter={(v) => formatCompact(v)} width={48} />
        <Tooltip cursor={{ fill: 'var(--action-soft)', radius: 8 }} content={<TooltipBox money={money} />} />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />}
        {keys.map(([k, name], i) => (
          <Bar key={k} dataKey={k} name={name} fill={SERIES[i]} radius={stacked ? 0 : [8, 8, 3, 3]} stackId={stacked ? 's' : undefined} maxBarSize={34} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TrendArea({ data, keys, money }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} tickFormatter={(v) => formatCompact(v)} width={48} />
        <Tooltip content={<TooltipBox money={money} />} />
        {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />}
        {keys.map(([k, name], i) => (
          <Area key={k} type="monotone" dataKey={k} name={name} stroke={SERIES[i]} fill={SERIES[i]} fillOpacity={0.1} strokeWidth={2.5} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function TrendLine({ data, keys }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
        <XAxis dataKey="month" {...axis} />
        <YAxis {...axis} width={48} />
        <Tooltip content={<TooltipBox />} />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
        {keys.map(([k, name], i) => (
          <Line key={k} type="monotone" dataKey={k} name={name} stroke={SERIES[i]} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

/** Donut with a side legend (values + share) so it reads without colour alone. */
export function Donut({ data, money, center }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <div className="flex h-full items-center gap-4">
      <div className="relative h-full min-w-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="94%" paddingAngle={3} cornerRadius={6} stroke="none">
              {data.map((d, i) => (
                <Cell key={d.name} fill={SERIES[i % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipBox money={money} />} />
          </PieChart>
        </ResponsiveContainer>
        {center && <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>}
      </div>
      <ul className="w-40 shrink-0 space-y-2 text-xs">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: SERIES[i % SERIES.length] }} />
            <span className="min-w-0 flex-1 truncate text-text">{d.name}</span>
            <span className="tabular font-semibold text-muted">{Math.round((d.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
