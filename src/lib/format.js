export const TIME_ZONE = 'Africa/Kigali'

const rwf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** RWF 450,000 */
export function formatMoney(money) {
  if (money == null) return '—'
  const amount = typeof money === 'number' ? money : money.amount
  return `RWF ${rwf.format(Math.round(amount))}`
}

/** 450,000 (no currency) */
export function formatNumber(n) {
  return rwf.format(n ?? 0)
}

/** 1.2k, 12.5k, 1.3M */
export function formatCompact(n) {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n ?? 0)
}

/** +250 788 123 456 */
export function formatPhone(raw) {
  const d = String(raw ?? '').replace(/\D/g, '').replace(/^250/, '').replace(/^0/, '')
  if (d.length !== 9) return raw
  return `+250 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
}

export function formatDate(iso, opts = {}) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...opts,
  }).format(new Date(iso))
}

export function formatDateTime(iso) {
  return formatDate(iso, { hour: '2-digit', minute: '2-digit' })
}

export function formatTime(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
}

export function timeAgo(iso) {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h`
  const d = Math.round(h / 24)
  if (d < 30) return `${d} d`
  return formatDate(iso)
}

/** "3 h ago" / "just now" / "on 25 Jul 2026" */
export function ago(iso) {
  const t = timeAgo(iso)
  if (t === 'just now') return t
  return t === formatDate(iso) ? `on ${t}` : `${t} ago`
}

/** "2d 04h left" / "04h 12m left" */
export function countdown(iso, now = Date.now()) {
  const ms = new Date(iso).getTime() - now
  if (ms <= 0) return 'Ended'
  const mins = Math.floor(ms / 60000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  const pad = (n) => String(n).padStart(2, '0')
  return d > 0 ? `${d}d ${pad(h)}h left` : `${pad(h)}h ${pad(m)}m left`
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

export function pluralize(n, one, many = `${one}s`) {
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}
