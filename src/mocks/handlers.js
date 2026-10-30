import { http, HttpResponse, delay } from 'msw'
import * as S from './seed'
import { detectContacts, CONTACT_BLOCK_REASON } from '@/lib/contactFilter'

const DB = {
  needs: S.NEEDS,
  bundles: S.BUNDLES,
  deals: S.DEALS,
  partners: S.PARTNERS,
  categories: S.CATEGORIES,
  offers: S.OFFERS,
  bookings: S.BOOKINGS,
  agreements: S.AGREEMENTS,
  payments: S.PAYMENTS,
  jobs: S.JOBS,
  payouts: S.PAYOUTS,
  reviews: S.REVIEWS,
  disputes: S.DISPUTES,
  tickets: S.TICKETS,
  notifications: S.NOTIFICATIONS,
  messages: S.MESSAGES,
  reports: S.REPORTS,
  chats: S.CHATS,
  verifications: S.VERIFICATIONS,
  agents: S.AGENTS,
  users: S.USERS,
  referrals: S.REFERRALS,
  commissions: S.COMMISSIONS,
  followups: S.FOLLOWUPS,
  cases: S.CASES,
  agentNeeders: S.AGENT_NEEDERS,
  agentPartners: S.AGENT_PARTNERS,
  auditLogs: S.AUDIT_LOGS,
  activityLogs: S.ACTIVITY_LOGS,
  promoCodes: S.PROMO_CODES,
  guilds: S.GUILDS,
  appeals: S.APPEALS,
  contracts: S.CONTRACT_TEMPLATES,
}
// Derived views
const VIEWS = {
  needers: () => S.USERS.filter((u) => u.roles.includes('needer')),
  escrow: () => S.PAYMENTS.filter((p) => p.escrow !== 'none'),
  proofs: () => S.PAYMENTS.filter((p) => p.method === 'proof' || p.proofFile),
  feed: () => [...S.NEEDS, ...S.BUNDLES].filter((x) => S.PUBLIC_NEED_STATUSES.includes(x.status) && x.visibility === 'public'),
}
const collection = (name) => (VIEWS[name] ? VIEWS[name]() : DB[name])

const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj)
const RESERVED = new Set(['page', 'pageSize', 'sort', 'q', 'tabField', 'tab', 'since', '__fail', 'cursor'])
const SINCE = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, '365d': 365 }

function applyFilters(rows, params, { skip } = {}) {
  let out = rows
  for (const [rawKey, rawVal] of params.entries()) {
    if (RESERVED.has(rawKey) || rawKey === skip || rawVal === '') continue
    const m = rawKey.match(/^(.*?)(_gte|_lte|_nin|_ne)?$/)
    const key = m[1]
    const op = m[2]
    const values = rawVal.split(',')
    out = out.filter((row) => {
      const v = get(row, key)
      if (op === '_gte') return Number(v) >= Number(rawVal)
      if (op === '_lte') return Number(v) <= Number(rawVal)
      if (op === '_nin') return !values.includes(String(v))
      if (op === '_ne') return String(v) !== rawVal
      if (Array.isArray(v)) return values.some((x) => v.map(String).includes(x))
      if (typeof v === 'boolean') return String(v) === rawVal
      return values.includes(String(v))
    })
  }
  const tabField = params.get('tabField')
  const tab = params.get('tab')
  if (tabField && tab && tab !== 'all' && skip !== '__tab') out = out.filter((r) => String(get(r, tabField)) === tab)
  const since = params.get('since')
  if (since && SINCE[since]) {
    const cutoff = Date.now() - SINCE[since] * 86400000
    out = out.filter((r) => new Date(r.createdAt).getTime() >= cutoff)
  }
  const q = params.get('q')?.trim().toLowerCase()
  if (q) out = out.filter((r) => JSON.stringify(r).toLowerCase().includes(q))
  return out
}

function applySort(rows, sort) {
  if (!sort) return rows
  const desc = sort.startsWith('-')
  const key = desc ? sort.slice(1) : sort
  return [...rows].sort((a, b) => {
    let x = get(a, key)
    let y = get(b, key)
    if (x && typeof x === 'object' && 'amount' in x) { x = x.amount; y = y?.amount }
    if (x == null) return 1
    if (y == null) return -1
    const r = typeof x === 'number' ? x - y : String(x).localeCompare(String(y))
    return desc ? -r : r
  })
}

function paginate(rows, params) {
  const pageSize = Math.min(5000, Math.max(1, Number(params.get('pageSize')) || 25))
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(totalPages, Math.max(1, Number(params.get('page')) || 1))
  return { data: rows.slice((page - 1) * pageSize, page * pageSize), meta: { page, pageSize, total, totalPages } }
}

const latency = () => delay(250 + Math.random() * 350)
const notFound = () => HttpResponse.json({ message: 'Not found' }, { status: 404 })
const findIn = (rows, id) => rows.find((r) => [r.id, r.code, r.slug, r.handle, r.ref].includes(id))
const nowIso = () => new Date().toISOString()

// rate limits for Re-need eligibility in this browser session
const reneedCount = {}

export const handlers = [
  // ------------------------------------------------------------ generic list
  http.get('/api/r/:resource', async ({ params, request }) => {
    await latency()
    const url = new URL(request.url)
    const sp = url.searchParams
    if (sp.get('__fail')) return HttpResponse.json({ message: 'The server could not load this list.' }, { status: 500 })
    const rows = collection(params.resource)
    if (!rows) return notFound()
    const filtered = applyFilters(rows, sp)
    const sorted = applySort(filtered, sp.get('sort'))
    const result = paginate(sorted, sp)
    const tabField = sp.get('tabField')
    if (tabField) {
      const base = applyFilters(rows, sp, { skip: '__tab' })
      const counts = { all: base.length }
      base.forEach((r) => {
        const k = String(get(r, tabField))
        counts[k] = (counts[k] ?? 0) + 1
      })
      result.meta.counts = counts
    }
    return HttpResponse.json(result)
  }),

  http.get('/api/r/:resource/:id', async ({ params }) => {
    await latency()
    const rows = collection(params.resource)
    const row = rows && findIn(rows, decodeURIComponent(params.id))
    return row ? HttpResponse.json(row) : notFound()
  }),

  http.patch('/api/r/:resource/:id', async ({ params, request }) => {
    await latency()
    const rows = collection(params.resource)
    const row = rows && findIn(rows, decodeURIComponent(params.id))
    if (!row) return notFound()
    const body = await request.json()
    Object.assign(row, body, { updatedAt: nowIso() })
    if (params.resource === 'payments' && body.state === 'paid') {
      const target = findIn([...S.NEEDS, ...S.BUNDLES], row.refCode)
      if (target) Object.assign(target, { status: 'payment_verified', statusGroup: 'in_progress', nextStep: S.NEXT_STEP.payment_verified })
      const booking = findIn(S.BOOKINGS, row.refCode)
      if (booking) Object.assign(booking, { paymentState: 'held', status: 'confirmed' })
    }
    if (body.status && S.STATUS_GROUP[body.status] && 'statusGroup' in row) {
      row.statusGroup = S.STATUS_GROUP[body.status]
      row.nextStep = S.NEXT_STEP[body.status]
    }
    S.AUDIT_LOGS.unshift({ id: `al-${Date.now()}`, actor: 'You', actorRole: 'Session', action: `${params.resource}.update`, target: row.code ?? row.slug ?? row.id, severity: 'medium', ip: '127.0.0.1', createdAt: nowIso() })
    return HttpResponse.json(row)
  }),

  http.post('/api/r/:resource', async ({ params, request }) => {
    await latency()
    const rows = DB[params.resource]
    if (!rows) return notFound()
    const body = await request.json()
    const row = { id: `${params.resource.slice(0, 2)}-${Date.now()}`, createdAt: nowIso(), ...body }
    rows.unshift(row)
    return HttpResponse.json(row, { status: 201 })
  }),

  // ------------------------------------------------------------ public
  http.get('/api/stats', async () => {
    await latency()
    return HttpResponse.json({ needsServed: 12480, verifiedPartners: 1350, districts: 30, avgRating: 4.8 })
  }),

  http.get('/api/search', async ({ request }) => {
    await latency()
    const sp = new URL(request.url).searchParams
    const q = (sp.get('q') ?? '').toLowerCase()
    const match = (r) => !q || JSON.stringify([r.title, r.name, r.categoryName, r.categories, r.subtype, r.description]).toLowerCase().includes(q)
    const groups = {
      needs: S.NEEDS.filter((n) => S.PUBLIC_NEED_STATUSES.includes(n.status) && n.visibility === 'public' && match(n)),
      bundles: S.BUNDLES.filter((b) => S.PUBLIC_NEED_STATUSES.includes(b.status) && match(b)),
      deals: S.DEALS.filter((d) => d.status === 'published' && match(d)),
      partners: S.PARTNERS.filter((p) => p.status === 'active' && match(p)),
    }
    const counts = Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length]))
    counts.all = Object.values(counts).reduce((a, b) => a + b, 0)
    const type = sp.get('type') || 'all'
    let rows = type === 'all' ? [...groups.deals, ...groups.needs, ...groups.bundles, ...groups.partners.map((p) => ({ ...p, kind: 'partner' }))] : groups[type].map((r) => (type === 'partners' ? { ...r, kind: 'partner' } : r))
    const sp2 = new URLSearchParams(sp)
    ;['q', 'type'].forEach((k) => sp2.delete(k))
    rows = applyFilters(rows, sp2)
    const sort = sp.get('sort')
    const sortKey = { newest: '-createdAt', price_asc: 'price.amount', price_desc: '-price.amount' }[sort]
    if (sortKey) rows = applySort(rows, sortKey)
    const result = paginate(rows, sp)
    result.meta.counts = counts
    result.meta.didYouMean = counts.all === 0 && q ? (q.includes('plum') ? 'plumber' : 'cleaning') : undefined
    return HttpResponse.json(result)
  }),

  // ------------------------------------------------------------ needs
  http.post('/api/needs', async ({ request }) => {
    await delay(700)
    const body = await request.json()
    const cat = S.CATEGORIES.find((c) => c.slug === body.category) ?? S.CATEGORIES[7]
    const flagged = detectContacts(`${body.title} ${body.description}`).blocked
    const status = flagged || body.priority ? 'under_review' : 'published'
    const isBundle = body.kind === 'bundle'
    const np = body.neederProfile
    if (np?.registeredByAgent && !S.USERS.some((u) => u.id === body.posterId)) {
      // Store the same identity and consent record used by a self-registered customer.
      const joinedAt = nowIso()
      S.USERS.unshift({
        id: body.posterId,
        name: np.name,
        email: np.email,
        phone: np.phone,
        roles: ['needer'],
        district: np.district,
        sector: np.sector,
        status: 'active',
        verified: false,
        joinedAt,
        avatarHue: 30,
        registeredBy: body.onBehalfOf,
        registrationSource: np.source,
        consentRecorded: np.consentRecorded,
        consentRecordedAt: np.consentRecordedAt ?? joinedAt,
      })
      S.AGENT_NEEDERS.unshift({
        id: `an-${Date.now()}`,
        agentId: body.onBehalfOf,
        neederId: body.posterId,
        name: np.name,
        phone: np.phone,
        email: np.email,
        district: np.district,
        sector: np.sector,
        activeNeeds: 1,
        bookings: 0,
        consent: np.consentRecorded ? 'recorded' : 'pending',
        consentRecordedAt: np.consentRecordedAt ?? joinedAt,
        lastContact: joinedAt,
      })
    }
    const code = `${isBundle ? 'NB' : 'NS'}-26-${String(Math.floor(10000 + Math.random() * 89999))}`
    const base = {
      id: `${isBundle ? 'bd' : 'nd'}-${Date.now()}`,
      code,
      kind: isBundle ? 'bundle' : 'need',
      category: cat.slug,
      categoryName: cat.name,
      status,
      statusGroup: S.STATUS_GROUP[status],
      nextStep: S.NEXT_STEP[status],
      posterId: body.posterId,
      poster: { id: body.posterId, name: body.anonymous ? 'Anonymous' : body.posterName, avatarHue: 18 },
      offerSlots: { used: 0, limit: 3 },
      offersCount: 0,
      counts: { loves: 0, messages: 0, saves: 0, shares: 0 },
      createdAt: nowIso(),
      media: body.media ?? [],
      matchedPartnerIds: ['pt-cleanpro'],
      district: body.serviceArea?.district,
      ...body,
    }
    if (isBundle) {
      base.itemCount = body.items.length
      base.progress = { served: 0, total: body.items.length }
      base.totalBudget = { amount: body.items.reduce((s, it) => s + (it.budget?.amount ?? 0) * (it.quantity ?? 1), 0), currency: 'RWF' }
      base.mixedRecurring = body.items.some((i) => i.recurring) && body.items.some((i) => !i.recurring)
      base.recurringCount = body.items.filter((i) => i.recurring).length
      S.BUNDLES.unshift(base)
    } else {
      S.NEEDS.unshift(base)
    }
    return HttpResponse.json(base, { status: 201 })
  }),

  http.post('/api/needs/:code/reneed', async ({ params, request }) => {
    await delay(600)
    const { userId } = await request.json()
    const src = findIn([...S.NEEDS, ...S.BUNDLES], params.code)
    if (!src) return notFound()
    reneedCount[userId] = (reneedCount[userId] ?? 0) + 1
    const needsReview = reneedCount[userId] > 3 || ['rejected'].includes(src.status)
    const status = needsReview ? 'under_review' : 'published'
    const copy = {
      ...structuredClone(src),
      id: `${src.kind === 'bundle' ? 'bd' : 'nd'}-${Date.now()}`,
      code: `${src.kind === 'bundle' ? 'NB' : 'NS'}-26-${String(Math.floor(10000 + Math.random() * 89999))}`,
      status,
      statusGroup: S.STATUS_GROUP[status],
      nextStep: S.NEXT_STEP[status],
      offerSlots: { used: 0, limit: 3 },
      offersCount: 0,
      createdAt: nowIso(),
      reneedOf: src.code,
    }
    ;(src.kind === 'bundle' ? S.BUNDLES : S.NEEDS).unshift(copy)
    return HttpResponse.json({ item: copy, outcome: needsReview ? 'review' : 'live', reason: needsReview ? 'You have re-needed several items today, so this one goes through a quick review.' : undefined })
  }),

  // ------------------------------------------------------------ public messages (moderated)
  http.get('/api/public-messages', async ({ request }) => {
    await latency()
    const sp = new URL(request.url).searchParams
    const target = sp.get('target')
    const me = sp.get('me')
    const rows = S.MESSAGES.filter((m) => m.targetCode === target && (m.status === 'approved' || (me && m.authorId === me)))
    return HttpResponse.json({ data: applySort(rows, '-createdAt') })
  }),

  http.post('/api/public-messages', async ({ request }) => {
    await delay(500)
    const body = await request.json()
    const check = detectContacts(body.body)
    if (check.blocked) return HttpResponse.json({ message: CONTACT_BLOCK_REASON, kinds: check.kinds }, { status: 422 })
    const row = { id: `ms-${Date.now()}`, status: 'pending', risks: [], createdAt: nowIso(), ...body }
    S.MESSAGES.unshift(row)
    return HttpResponse.json(row, { status: 201 })
  }),

  // ------------------------------------------------------------ serving & offers (atomic slots)
  http.post('/api/offers', async ({ request }) => {
    await delay(800)
    const body = await request.json()
    const target = findIn([...S.NEEDS, ...S.BUNDLES], body.needCode)
    if (!target) return notFound()
    if (target.offerSlots.used >= target.offerSlots.limit) {
      return HttpResponse.json({ message: 'Offers are full — another Partner took the last slot.', code: 'SLOTS_FULL' }, { status: 409 })
    }
    target.offerSlots = { ...target.offerSlots, used: target.offerSlots.used + 1 }
    target.offersCount = (target.offersCount ?? 0) + 1
    if (['published', 'matching'].includes(target.status)) {
      target.status = 'offers_received'
      target.statusGroup = 'action_needed'
      target.nextStep = S.NEXT_STEP.offers_received
    }
    const partner = S.PARTNERS.find((p) => p.id === body.partnerId) ?? S.PARTNERS[0]
    const offer = {
      id: `of-${Date.now()}`,
      code: `OF-${Math.floor(100000 + Math.random() * 899999)}`,
      needTitle: target.title,
      targetKind: target.kind,
      neederId: target.posterId,
      neederName: target.poster.name,
      partner: S.partnerSummary(partner),
      status: 'submitted',
      distanceKm: 2.4,
      createdAt: nowIso(),
      ...body,
    }
    S.OFFERS.unshift(offer)
    return HttpResponse.json({ offer, slots: target.offerSlots }, { status: 201 })
  }),

  http.post('/api/offers/:id/:action', async ({ params, request }) => {
    await delay(500)
    const offer = findIn(S.OFFERS, params.id)
    if (!offer) return notFound()
    const body = await request.json().catch(() => ({}))
    const target = findIn([...S.NEEDS, ...S.BUNDLES], offer.needCode)
    if (params.action === 'accept') {
      offer.status = 'accepted'
      // close only incompatible offers in the same scope
      S.OFFERS.filter((o) => o.needCode === offer.needCode && o.id !== offer.id && ['submitted', 'clarification', 'revised'].includes(o.status) && o.scope.kind === offer.scope.kind && o.scope.itemId === offer.scope.itemId).forEach((o) => (o.status = 'auto_closed'))
      if (target) Object.assign(target, { status: 'negotiating', statusGroup: 'in_progress', nextStep: S.NEXT_STEP.negotiating, assignedPartnerId: offer.partnerId, agreedPrice: offer.price })
    } else if (params.action === 'reject') {
      offer.status = 'rejected'
      offer.rejectReason = body.reason
      if (target) target.offerSlots = { ...target.offerSlots, used: Math.max(0, target.offerSlots.used - 1) }
    } else if (params.action === 'withdraw') {
      offer.status = 'withdrawn'
      if (target) target.offerSlots = { ...target.offerSlots, used: Math.max(0, target.offerSlots.used - 1) }
    } else if (params.action === 'clarify') {
      offer.status = 'clarification'
      offer.question = body.question
    }
    return HttpResponse.json(offer)
  }),

  http.post('/api/needs/:code/reject', async ({ params, request }) => {
    await delay(400)
    const target = findIn([...S.NEEDS, ...S.BUNDLES], params.code)
    const { reason, by } = await request.json()
    if (!target) return notFound()
    target.rejectCount = (target.rejectCount ?? 0) + 1
    S.AUDIT_LOGS.unshift({ id: `al-${Date.now()}`, actor: by, actorRole: 'Partner', action: 'need.partner_reject', target: target.code, severity: 'low', ip: '127.0.0.1', createdAt: nowIso(), reason })
    return HttpResponse.json({ ok: true, rejectCount: target.rejectCount, adminAlerted: target.rejectCount >= 15 })
  }),

  // ------------------------------------------------------------ payments
  http.post('/api/payments', async ({ request }) => {
    await delay(600)
    const body = await request.json()
    const amount = body.amount.amount
    const pay = {
      id: `py-${Date.now()}`,
      ref: `PAY-${Math.floor(1000000 + Math.random() * 8999999)}`,
      // Payments are manual: every method waits for finance to approve the proof.
      state: 'verifying',
      escrow: 'none',
      fee: { amount: Math.round(amount * 0.15), currency: 'RWF' },
      partnerShare: { amount: Math.round(amount * 0.85), currency: 'RWF' },
      createdAt: nowIso(),
      startedAt: Date.now(),
      ...body,
    }
    S.PAYMENTS.unshift(pay)
    return HttpResponse.json(pay, { status: 201 })
  }),

  http.get('/api/payments/:ref/status', async ({ params }) => {
    await delay(300)
    const pay = findIn(S.PAYMENTS, params.ref)
    if (!pay) return notFound()
    // MoMo / Airtel: the customer "approves on their phone" after ~6 s
    if (pay.state === 'pending' && pay.startedAt && Date.now() - pay.startedAt > 6000) {
      pay.state = 'paid'
      pay.escrow = 'held'
      const target = findIn([...S.NEEDS, ...S.BUNDLES], pay.refCode)
      if (target) Object.assign(target, { status: 'payment_verified', statusGroup: 'in_progress', nextStep: S.NEXT_STEP.payment_verified })
      const booking = findIn(S.BOOKINGS, pay.refCode)
      if (booking) Object.assign(booking, { paymentState: 'held', status: 'confirmed' })
    }
    return HttpResponse.json(pay)
  }),

  // ------------------------------------------------------------ dashboards
  http.get('/api/dashboard/:role', async ({ params, request }) => {
    await latency()
    const sp = new URL(request.url).searchParams
    const userId = sp.get('userId')
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date()
      d.setMonth(d.getMonth() - (5 - i))
      return d.toLocaleString('en-GB', { month: 'short' })
    })
    if (params.role === 'needer') {
      const mine = S.NEEDS.filter((n) => n.posterId === userId)
      const spentRows = S.PAYMENTS.filter((p) => p.payerId === userId && p.state === 'paid')
      const byCat = {}
      spentRows.forEach((p) => {
        const n = findIn([...S.NEEDS, ...S.DEALS], p.refCode)
        const k = n?.categoryName ?? 'Other'
        byCat[k] = (byCat[k] ?? 0) + p.amount.amount
      })
      return HttpResponse.json({
        kpis: {
          active: mine.filter((n) => ['matching', 'action_needed', 'submitted'].includes(n.statusGroup)).length,
          inProgress: mine.filter((n) => n.statusGroup === 'in_progress').length,
          completed: mine.filter((n) => n.statusGroup === 'done').length,
          totalSpent: spentRows.reduce((s, p) => s + p.amount.amount, 0),
        },
        spendByCategory: Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value })),
        monthly: months.map((m, i) => ({ month: m, spent: Math.round(spentRows.filter((_, k) => k % 6 === i).reduce((s, p) => s + p.amount.amount, 0) / 2) })),
        // A brand-new account has nothing to act on yet.
        actions: mine.length === 0 ? [] : [
          { kind: 'quote', title: '2 offers waiting on “Plumber to fix kitchen leak”', link: '/app/needer/needs/NS-26-08731', cta: 'Review offers' },
          { kind: 'payment', title: 'Payment request · RWF 450,000 for “Furnish my 2-bedroom flat”', link: '/app/needer/checkout/NB-26-04120', cta: 'Pay safely' },
          { kind: 'info', title: 'Kigali Auto Care asked for more information', link: '/app/needer/messages', cta: 'Reply' },
        ],
      })
    }
    if (params.role === 'partner') {
      const pid = sp.get('partnerId')
      const paid = S.PAYMENTS.filter((p) => p.partnerId === pid && p.state === 'paid')
      const sum = (rows) => rows.reduce((s, p) => s + p.partnerShare.amount, 0)
      return HttpResponse.json({
        kpis: {
          opportunities: S.NEEDS.filter((n) => n.matchedPartnerIds?.includes(pid) && S.PUBLIC_NEED_STATUSES.includes(n.status)).length,
          activeJobs: S.JOBS.filter((j) => j.partnerId === pid && j.stage === 'active').length,
          earnedMonth: Math.round(sum(paid) / 12),
          totalEarned: sum(paid),
          paidOut: sum(paid.filter((p) => p.escrow === 'released')),
          pending: sum(paid.filter((p) => p.escrow === 'held')),
          available: Math.round(sum(paid.filter((p) => p.escrow === 'released')) * 0.12),
        },
        performance: { responseRate: 96, onTime: 93, rating: 4.8, score: 91 },
        monthly: months.map((m, i) => ({ month: m, earnings: Math.round(sum(paid.filter((_, k) => k % 6 === i)) / 2), jobs: 8 + ((i * 7) % 9) })),
        commission: [
          { name: 'Your share', value: 85 },
          { name: 'Platform fee', value: 15 },
        ],
      })
    }
    if (params.role === 'agent') {
      return HttpResponse.json({
        kpis: { assisted: 26, onboarded: 18, conversions: 31, followUpsToday: 5, escalations: 2, rewardsPending: 13500 },
        monthly: months.map((m, i) => ({ month: m, referrals: 6 + ((i * 5) % 11), conversions: 2 + ((i * 3) % 6) })),
      })
    }
    // admin
    return HttpResponse.json({
      kpis: {
        onTimePct: 87.4, satisfaction: 4.7, disputeRate: 1.8, costPerFulfilled: 3200,
        needsToday: 214, gmvMonth: 482_500_000, activePartners: 1350, activeNeeders: 18240,
      },
      roles: { needers: 18240, partners: 1350, agents: 212, staff: 24 },
      monthly: months.map((m, i) => ({ month: m, needs: 2800 + i * 340 + ((i * 97) % 300), fulfilled: 2400 + i * 320 + ((i * 53) % 250), gmv: 300 + i * 32 })),
      pending: { needs: S.NEEDS.filter((n) => ['submitted', 'under_review'].includes(n.status)).length, deals: S.DEALS.filter((d) => d.status === 'pending').length, kyc: S.VERIFICATIONS.filter((v) => v.status === 'pending').length, messages: S.MESSAGES.filter((m) => m.status === 'pending').length },
      attention: [
        { kind: 'unanswered', label: 'Requests with no offer after 24 h', count: 17, link: '/admin/needs?statusGroup=matching' },
        { kind: 'rejections', label: 'Requests turned down more than 15 times', count: S.NEEDS.filter((n) => n.rejectCount >= 15).length, link: '/admin/needs' },
        { kind: 'overdue', label: 'Overdue jobs', count: 9, link: '/admin/needs?statusGroup=in_progress' },
        { kind: 'fraud', label: 'Referral fraud flags', count: S.REFERRALS.filter((r) => r.fraudFlag).length, link: '/admin/referrals?fraudFlag=true' },
      ],
    })
  }),

  // ------------------------------------------------------------ auth
  // Mock auth: any identifier + password signs in; any 6-digit code verifies.
  http.post('/api/auth/login', async ({ request }) => {
    await delay(600)
    const { identifier, password } = await request.json()
    if (!identifier?.trim() || !password) return HttpResponse.json({ message: 'Enter your email or phone and password.' }, { status: 400 })
    return HttpResponse.json({ ok: true })
  }),

  http.post('/api/auth/otp', async ({ request }) => {
    await delay(500)
    const { code } = await request.json()
    return /^\d{6}$/.test(code ?? '') ? HttpResponse.json({ ok: true }) : HttpResponse.json({ message: 'Enter all 6 digits of the code.' }, { status: 400 })
  }),

  http.get('/api/auth/username', async ({ request }) => {
    await delay(300)
    const u = new URL(request.url).searchParams.get('u')?.toLowerCase() ?? ''
    const taken = ['aline', 'eric', 'admin', 'needibi', 'cleanpro'].includes(u)
    return HttpResponse.json({ available: !taken && u.length >= 3, suggestion: taken ? `${u}${Math.floor(10 + Math.random() * 89)}` : undefined })
  }),

  http.post('/api/coverage', async ({ request }) => {
    await delay(300)
    const { district } = await request.json()
    const covered = Object.keys(S.DISTRICTS).includes(district)
    return HttpResponse.json({ covered, partners: covered ? 40 + district.length * 7 : 0 })
  }),
]
