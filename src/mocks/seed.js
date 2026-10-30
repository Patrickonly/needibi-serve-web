// Deterministic seed data for the MSW mock API — realistic Rwandan names,
// districts and RWF prices. Volumes are large enough to exercise pagination.

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20261022)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const int = (min, max) => Math.floor(rand() * (max - min + 1)) + min
const chance = (p) => rand() < p
const pad = (n, w) => String(n).padStart(w, '0')
const sample = (arr, n) => {
  const copy = [...arr]
  const out = []
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0])
  return out
}
const roundTo = (n, step) => Math.max(step, Math.round(n / step) * step)

const NOW = Date.now()
const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const ago = (ms) => new Date(NOW - ms).toISOString()
const ahead = (ms) => new Date(NOW + ms).toISOString()
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// ---------------------------------------------------------------- geography
export const DISTRICTS = {
  Gasabo: ['Kimihurura', 'Remera', 'Kacyiru', 'Kimironko', 'Gisozi', 'Kinyinya', 'Nduba'],
  Kicukiro: ['Niboye', 'Gikondo', 'Kagarama', 'Kanombe', 'Gatenga', 'Kicukiro', 'Mahoro'],
  Nyarugenge: ['Nyamirambo', 'Nyarugenge', 'Muhima', 'Kimisagara', 'Gitega', 'Rwezamenyo'],
  Musanze: ['Muhoza', 'Cyuve', 'Kinigi', 'Busogo'],
  Huye: ['Ngoma', 'Tumba', 'Mukura', 'Huye'],
  Rubavu: ['Gisenyi', 'Rubavu', 'Nyamyumba', 'Kanama'],
}
const DISTRICT_NAMES = Object.keys(DISTRICTS)
const area = () => {
  const district = chance(0.62) ? pick(['Gasabo', 'Kicukiro', 'Nyarugenge']) : pick(DISTRICT_NAMES)
  return { district, sector: pick(DISTRICTS[district]) }
}

// ---------------------------------------------------------------- categories
export const CATEGORIES = [
  { slug: 'agriculture', name: 'Agriculture', icon: 'Sprout', hue: 110, subtypes: ['Seeds & inputs', 'Farm labour', 'Irrigation', 'Livestock care', 'Harvest transport'] },
  { slug: 'automotive', name: 'Automotive & Vehicles', icon: 'Car', hue: 215, subtypes: ['Car hire', 'Repairs', 'Car wash', 'Driver hire', 'Spare parts', 'Moto transport'] },
  { slug: 'beauty', name: 'Beauty & Wellness', icon: 'Sparkles', hue: 330, subtypes: ['Hair', 'Make-up', 'Massage', 'Nails', 'Barber'] },
  { slug: 'education', name: 'Education & Training', icon: 'GraduationCap', hue: 260, subtypes: ['Tutoring', 'Languages', 'Driving school', 'Coding', 'Music lessons'] },
  { slug: 'electronics', name: 'Electronics', icon: 'Cpu', hue: 195, subtypes: ['Phones', 'Laptops', 'Repairs', 'Solar & power', 'TV & sound'] },
  { slug: 'food-catering', name: 'Food & Catering', icon: 'UtensilsCrossed', hue: 25, subtypes: ['Event catering', 'Meal plans', 'Cakes', 'Office lunch', 'Private chef'] },
  { slug: 'health', name: 'Health', icon: 'HeartPulse', hue: 355, subtypes: ['Home nursing', 'Physiotherapy', 'Lab tests', 'Pharmacy delivery'] },
  { slug: 'home-furniture', name: 'Home & Furniture', icon: 'Sofa', hue: 35, subtypes: ['Plumbing', 'Electrical', 'Cleaning', 'Furniture', 'Painting', 'Carpentry', 'Moving'] },
  { slug: 'real-estate', name: 'Real Estate & Property', icon: 'Building', hue: 200, subtypes: ['Apartments', 'Houses', 'Office space', 'Land', 'Short stay'] },
  { slug: 'professional-talent', name: 'Professional Talent', icon: 'Briefcase', hue: 230, subtypes: ['Accounting', 'Legal', 'Design', 'Software', 'Translation', 'Photography'] },
  { slug: 'services', name: 'Services', icon: 'Wrench', hue: 15, subtypes: ['Security', 'Laundry', 'Gardening', 'Pest control', 'Delivery'] },
  { slug: 'travel-tourism', name: 'Travel & Tourism', icon: 'Plane', hue: 175, subtypes: ['Safari tours', 'Gorilla trekking', 'Airport transfer', 'Hotels', 'Lake Kivu trips'] },
  { slug: 'custom-solutions', name: 'Custom Solutions', icon: 'Lightbulb', hue: 45, subtypes: ['Event planning', 'Office set-up', 'Branding', 'Custom build'] },
]
const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]))

const SPEC_FIELDS = {
  'home-furniture': [{ key: 'rooms', label: 'Rooms', type: 'number' }, { key: 'materials', label: 'Materials provided?', type: 'select', options: ['Yes', 'No', 'Partner provides'] }],
  automotive: [{ key: 'vehicle', label: 'Vehicle type', type: 'select', options: ['Saloon', 'SUV', 'Minibus', 'Pick-up'] }, { key: 'driver', label: 'With driver?', type: 'select', options: ['Yes', 'No'] }],
  'food-catering': [{ key: 'guests', label: 'Number of guests', type: 'number' }, { key: 'diet', label: 'Dietary needs', type: 'text' }],
  'real-estate': [{ key: 'bedrooms', label: 'Bedrooms', type: 'number' }, { key: 'furnished', label: 'Furnished?', type: 'select', options: ['Furnished', 'Unfurnished', 'Either'] }],
  electronics: [{ key: 'brand', label: 'Brand', type: 'text' }, { key: 'condition', label: 'Condition', type: 'select', options: ['New', 'Used', 'Refurbished'] }],
}
export const specFieldsFor = (slug) => SPEC_FIELDS[slug] ?? [{ key: 'details', label: 'Key details', type: 'text' }]

// ---------------------------------------------------------------- people
const FIRST = ['Aline', 'Eric', 'Grace', 'Jean-Paul', 'Claudine', 'Olivier', 'Diane', 'Patrick', 'Divine', 'Emmanuel', 'Josiane', 'Thierry', 'Sandrine', 'Fabrice', 'Esperance', 'Innocent', 'Solange', 'Yves', 'Chantal', 'Kevin', 'Alice', 'Didier', 'Nadine', 'Gilbert', 'Vestine', 'Samuel', 'Clarisse', 'Bosco', 'Ange', 'Moses', 'Liliane', 'Jules', 'Henriette', 'Pacifique', 'Joselyne', 'Aimable']
const LAST = ['Mukamana', 'Niyonzima', 'Uwimana', 'Habimana', 'Mugisha', 'Ishimwe', 'Uwase', 'Kayitare', 'Ingabire', 'Nshimiyimana', 'Mukeshimana', 'Hakizimana', 'Umutoni', 'Niyigena', 'Iradukunda', 'Tuyishime', 'Mutesi', 'Bizimana', 'Uwera', 'Nkurunziza']
const shortName = (full) => {
  const [f, l] = full.split(' ')
  return `${f} ${l ? l[0] + '.' : ''}`.trim()
}

export const NEEDERS = [
  { id: 'u-aline', name: 'Aline Mukamana' },
  { id: 'u-eric', name: 'Eric Niyonzima' },
  { id: 'u-grace', name: 'Grace Uwimana' },
  { id: 'u-jeanpaul', name: 'Jean-Paul Habimana' },
]
for (let i = 0; i < 56; i++) {
  const name = `${pick(FIRST)} ${pick(LAST)}`
  NEEDERS.push({ id: `u-${pad(i + 100, 3)}`, name })
}
NEEDERS.forEach((u, i) => {
  Object.assign(u, {
    ...area(),
    phone: `+250 78${int(0, 9)} ${int(100, 999)} ${int(100, 999)}`,
    email: `${slugify(u.name).replace(/-/g, '.')}@example.rw`,
    avatarHue: int(0, 360),
    joinedAt: ago(int(10, 700) * DAY),
    status: i < 4 ? 'active' : pick(['active', 'active', 'active', 'active', 'suspended', 'pending']),
    verified: i < 4 || chance(0.8),
    role: 'needer',
  })
})

// ---------------------------------------------------------------- partners
const NAMED_PARTNERS = [
  { id: 'pt-cleanpro', name: 'CleanPro Rwanda', handle: 'cleanpro', categories: ['home-furniture', 'services'], level: 3 },
  { id: 'pt-kac', name: 'Kigali Auto Care', handle: 'kigali-auto-care', categories: ['automotive'], level: 3 },
  { id: 'pt-inzu', name: 'Inzu Furniture', handle: 'inzu-furniture', categories: ['home-furniture', 'custom-solutions'], level: 2 },
  { id: 'pt-akagera', name: 'Akagera Events', handle: 'akagera-events', categories: ['custom-solutions', 'food-catering', 'travel-tourism'], level: 3 },
  { id: 'pt-umuco', name: 'Umuco Catering', handle: 'umuco-catering', categories: ['food-catering'], level: 2 },
]
const MORE_PARTNERS = [
  ['Ikaze Homes', ['real-estate']], ['Volcano Treks', ['travel-tourism']], ['Hinga Agro Supplies', ['agriculture']],
  ['Ubwiza Beauty Lounge', ['beauty']], ['TechFix Kigali', ['electronics']], ['Isoko Electronics', ['electronics']],
  ['Kivu Lake Tours', ['travel-tourism']], ['Amahoro Home Care', ['health']], ['Ubumenyi Tutors', ['education']],
  ['Nyamirambo Plumbing Co.', ['home-furniture']], ['Sparkle Laundry', ['services']], ['Rwanda Drive Hire', ['automotive']],
  ['Ingoma Photography', ['professional-talent']], ['Kigali Legal Partners', ['professional-talent']], ['Agaciro Accounting', ['professional-talent']],
  ['Green Hills Gardening', ['services', 'agriculture']], ['SolarNet Rwanda', ['electronics', 'custom-solutions']], ['Musanze Movers', ['home-furniture', 'services']],
  ['Huye Fresh Foods', ['food-catering', 'agriculture']], ['Gisenyi Stays', ['real-estate', 'travel-tourism']], ['FitLife Physio', ['health']],
  ['CodeHub Academy', ['education', 'professional-talent']], ['Imena Interiors', ['home-furniture', 'custom-solutions']], ['SafeGuard Security', ['services']],
  ['Igisubizo Pest Control', ['services']],
]
export const PARTNERS = [
  ...NAMED_PARTNERS,
  ...MORE_PARTNERS.map(([name, categories], i) => ({ id: `pt-${pad(i + 10, 3)}`, name, handle: slugify(name), categories, level: pick([1, 1, 2, 2, 3]) })),
].map((p, i) => {
  const a = area()
  return {
    ...p,
    avatarHue: int(0, 360),
    coverHue: CAT[p.categories[0]].hue,
    verified: i < 5 || chance(0.85),
    rating: Math.round((4 + rand() * 0.95) * 10) / 10,
    reviewCount: int(12, 420),
    areas: [...new Set([a.district, ...sample(DISTRICT_NAMES, int(0, 3))])],
    district: a.district,
    responseTime: pick(['< 15 min', '< 30 min', '< 1 h', '< 2 h', '< 4 h']),
    responseRate: int(82, 100),
    onTime: int(84, 100),
    memberSince: ago(int(60, 1100) * DAY),
    reliability: int(78, 99),
    followers: int(40, 5200),
    completedJobs: int(15, 1300),
    languages: sample(['Kinyarwanda', 'English', 'French', 'Swahili'], int(2, 4)),
    status: i < 5 ? 'active' : pick(['active', 'active', 'active', 'active', 'suspended', 'pending']),
    kycStatus: i < 5 ? 'approved' : pick(['approved', 'approved', 'approved', 'pending', 'info_requested']),
    plan: pick(['Starter', 'Growth', 'Pro']),
    bio: `${p.name} serves clients across ${a.district} and beyond with verified, insured professionals and transparent pricing.`,
    owner: `${pick(FIRST)} ${pick(LAST)}`,
  }
})
const PT = Object.fromEntries(PARTNERS.map((p) => [p.id, p]))
export const partnerSummary = (p) => ({ id: p.id, handle: p.handle, name: p.name, avatarHue: p.avatarHue, verified: p.verified, level: p.level, rating: p.rating })

// ---------------------------------------------------------------- needs
const NEED_TITLES = {
  agriculture: ['Need 20 bags of NPK fertiliser delivered', 'Farm workers for 2-day bean harvest', 'Drip irrigation set-up for 1 ha', 'Vet visit for 6 dairy cows', 'Transport maize harvest to Musanze market'],
  automotive: ['Car hire with driver for a wedding', 'Fix brakes on Toyota RAV4', 'Weekly car wash at home', 'Airport pick-up for 4 people', 'Driver for a 3-day field trip', 'Replace car battery today'],
  beauty: ['Bridal make-up for 5 people', 'Home braiding this Saturday', 'Monthly barber visit at office', 'Spa day voucher for two'],
  education: ['Maths tutor for S3 student', 'French lessons twice a week', 'Kinyarwanda classes for expats', 'Python course for 6 staff', 'Piano teacher for my child'],
  electronics: ['Repair cracked iPhone 13 screen', 'Install 3 kW solar system', 'Laptop for university student', 'Set up home Wi-Fi mesh', 'TV wall mount and sound bar'],
  'food-catering': ['Catering for 150 wedding guests', 'Daily lunch for 25 office staff', 'Birthday cake for 40 people', 'Private chef for family dinner', 'Brochettes for a garden party'],
  health: ['Home nurse for elderly mother', 'Physiotherapy after knee surgery', 'Home blood test collection', 'Weekly pharmacy delivery'],
  'home-furniture': ['Plumber to fix kitchen leak', 'Deep clean of 3-bedroom house', 'Paint living room and corridor', 'Electrician to rewire 2 rooms', 'Custom wardrobe for master bedroom', 'Move house from Kicukiro to Gasabo', 'Fix leaking roof before rains'],
  'real-estate': ['2-bedroom apartment near Kimihurura', 'Office space for 10 people', 'Plot of land in Bugesera', 'Short stay for a visiting family', 'Furnished studio for 6 months'],
  'professional-talent': ['Accountant for monthly bookkeeping', 'Lawyer to review land contract', 'Logo and brand identity', 'Photographer for a product shoot', 'Translator EN–FR for 20 pages', 'Build a simple shop website'],
  services: ['Night guard for a new house', 'Weekly laundry pick-up', 'Garden maintenance every month', 'Fumigation for a restaurant', 'Same-day delivery of documents'],
  'travel-tourism': ['Gorilla trekking trip for 2', '3-day Akagera safari', 'Lake Kivu weekend for family', 'Airport transfer at 3 am'],
  'custom-solutions': ['Plan a company end-of-year party', 'Set up a 12-desk office', 'Custom branded uniforms', 'Build a kiosk for a market stall'],
}
const NEED_DESC = [
  'Looking for a reliable, verified Partner who can start soon. Please include materials and transport in your offer.',
  'I need this done properly and on time. Share your timeline and what is included in the price.',
  'Prefer someone who has done similar work before. Photos of previous work are welcome in the offer.',
  'Flexible on the exact date. Quality matters more than speed, but please confirm availability.',
]

export const STATUS_GROUP = {
  submitted: 'submitted', under_review: 'submitted',
  changes_requested: 'action_needed', offers_received: 'action_needed', awaiting_payment: 'action_needed', delivered: 'action_needed',
  published: 'matching', matching: 'matching',
  negotiating: 'in_progress', agreement_signed: 'in_progress', payment_verified: 'in_progress', in_service: 'in_progress',
  completed: 'done', closed: 'done', archived: 'done',
  rejected: 'problem', expired: 'problem', cancelled: 'problem', disputed: 'problem',
}
export const NEXT_STEP = {
  submitted: 'Wait for policy check', under_review: 'Under review — usually < 2 h', changes_requested: 'Edit and resubmit',
  published: 'Partners are being matched', matching: 'Partners are being matched', offers_received: 'Review offers',
  negotiating: 'Agree the price in chat', agreement_signed: 'Pay safely', awaiting_payment: 'Pay safely',
  payment_verified: 'Partner will start soon', in_service: 'Track progress', delivered: 'Confirm satisfaction',
  completed: 'Leave a review', closed: '—', archived: '—', rejected: 'See reason · Re-request', expired: 'Re-need or Re-request',
  cancelled: '—', disputed: 'Dispute in progress',
}
const NEED_STATUS_POOL = [
  'published', 'published', 'published', 'matching', 'matching', 'offers_received', 'offers_received', 'negotiating',
  'agreement_signed', 'awaiting_payment', 'payment_verified', 'in_service', 'in_service', 'delivered', 'completed', 'completed',
  'completed', 'closed', 'under_review', 'submitted', 'changes_requested', 'rejected', 'expired', 'cancelled', 'disputed', 'archived',
]
const PUBLIC_STATUSES = new Set(['published', 'matching', 'offers_received', 'negotiating'])
const budgetFor = (slug) => {
  const ranges = {
    'real-estate': [250000, 15000000], 'travel-tourism': [80000, 2500000], 'food-catering': [40000, 3500000],
    'custom-solutions': [150000, 6000000], automotive: [15000, 900000], electronics: [20000, 4500000],
    agriculture: [30000, 1500000], 'professional-talent': [50000, 2000000], health: [15000, 600000],
  }
  const [lo, hi] = ranges[slug] ?? [5000, 450000]
  const v = lo * Math.pow(hi / lo, Math.pow(rand(), 1.6))
  return roundTo(v, v > 1000000 ? 50000 : v > 100000 ? 5000 : 1000)
}
// No demo video ships with the mock; the voice note stands in so video playback and the pop-up player can be tried.
const DEMO_VIDEO = '/media/voice-note.wav'
const mediaFor = (slug, i) => {
  const r = rand()
  const photos = Array.from({ length: int(2, 4) }, (_, k) => ({ id: `m-${i}-${k}`, kind: 'image', url: '', seed: k, cat: slug }))
  if (r < 0.15) return [{ id: `m-${i}-a`, kind: 'audio', durationSec: 24, url: '/media/voice-note.wav' }, ...photos]
  if (r < 0.3) return [...photos, { id: `m-${i}-v`, kind: 'video', durationSec: 24, url: DEMO_VIDEO }]
  return photos
}
const recurrence = () =>
  pick([
    { frequency: 'weekly', days: ['Sat'], time: '09:00', cycles: 12 },
    { frequency: 'monthly', days: ['1'], time: '10:00', cycles: 6 },
    { frequency: 'daily', time: '12:30', cycles: 30 },
    { frequency: 'weekly', days: ['Mon', 'Thu'], time: '08:00', cycles: 8 },
  ])

export const NEEDS = []
for (let i = 0; i < 140; i++) {
  const cat = pick(CATEGORIES)
  // Aline owns ~38 needs so her "My Needs" table spans several pages
  const poster = i % 3 === 0 && i < 114 ? NEEDERS[0] : pick(NEEDERS.slice(1))
  let status = i < 10 ? pick(['published', 'matching', 'offers_received']) : pick(NEED_STATUS_POOL)
  const urgency = pick(['low', 'medium', 'medium', 'high', 'high', 'urgent'])
  const limit = 3
  const used = PUBLIC_STATUSES.has(status) ? int(0, 3) : status === 'submitted' || status === 'under_review' ? 0 : 3
  if (status === 'offers_received' && used === 0) status = 'matching'
  if (used >= limit && ['published', 'matching'].includes(status)) status = 'offers_received'
  const a = area()
  const createdAt = ago(i < 12 ? int(4, 240) * MIN : int(1, 120) * DAY + int(0, 23) * HOUR)
  const recurring = chance(0.22)
  const matched = sample(PARTNERS.filter((p) => p.categories.includes(cat.slug)), int(1, 3)).map((p) => p.id)
  if (chance(0.45)) matched.push('pt-cleanpro')
  NEEDS.push({
    id: `nd-${i + 1}`,
    code: `NS-26-${pad(8731 - i * 7, 5)}`,
    kind: 'need',
    title: pick(NEED_TITLES[cat.slug]),
    description: pick(NEED_DESC),
    category: cat.slug,
    categoryName: cat.name,
    subtype: pick(cat.subtypes),
    serviceArea: a,
    district: a.district,
    budget: { amount: budgetFor(cat.slug), currency: 'RWF' },
    negotiable: chance(0.6),
    urgency,
    quantity: chance(0.3) ? int(2, 20) : 1,
    recurrence: recurring ? recurrence() : undefined,
    recurring,
    frequency: recurring ? 'recurring' : 'one_time',
    status,
    statusGroup: STATUS_GROUP[status],
    nextStep: NEXT_STEP[status],
    visibility: chance(0.9) ? 'public' : 'private',
    anonymous: chance(0.15),
    poster: { id: poster.id, name: shortName(poster.name), avatarHue: poster.avatarHue },
    posterId: poster.id,
    media: mediaFor(cat.slug, i),
    offerSlots: { used, limit },
    offersCount: used,
    counts: { loves: int(0, 60), messages: int(0, 14), saves: int(0, 30), shares: int(0, 12) },
    createdAt,
    deadline: ahead(int(1, 30) * DAY),
    timeframe: pick(['Today', 'Within 3 days', 'This week', 'Within 2 weeks', 'Flexible']),
    matchedPartnerIds: [...new Set(matched)],
    assignedPartnerId: ['negotiating', 'agreement_signed', 'awaiting_payment', 'payment_verified', 'in_service', 'delivered', 'completed', 'closed', 'disputed'].includes(status) ? pick(matched) : undefined,
    language: pick(['en', 'rw', 'rw', 'fr']),
    priority: chance(0.08),
    rejectCount: int(0, 18),
    specs: {},
  })
}
// Guarantee the landing page has one voice-note need and one video need that are live
NEEDS[1].media = [{ id: 'm-voice', kind: 'audio', durationSec: 24, url: '/media/voice-note.wav' }, { id: 'm-voice-1', kind: 'image', url: '', seed: 1, cat: 'home-furniture' }, { id: 'm-voice-2', kind: 'image', url: '', seed: 2, cat: 'home-furniture' }]
NEEDS[1].title = 'Voice note: need a mason to fix front wall'
NEEDS[1].category = 'home-furniture'; NEEDS[1].categoryName = CAT['home-furniture'].name
NEEDS[3].media = [{ id: 'm-video', kind: 'video', durationSec: 24, url: DEMO_VIDEO }]
NEEDS[0].urgency = 'urgent'
NEEDS[0].title = 'Plumber to fix kitchen leak'
NEEDS[0].category = 'home-furniture'; NEEDS[0].categoryName = CAT['home-furniture'].name; NEEDS[0].subtype = 'Plumbing'
NEEDS[0].serviceArea = { district: 'Gasabo', sector: 'Kimihurura' }; NEEDS[0].district = 'Gasabo'
NEEDS[0].budget = { amount: 25000, currency: 'RWF' }; NEEDS[0].negotiable = true
NEEDS[0].poster = { id: 'u-aline', name: 'Aline M.', avatarHue: NEEDERS[0].avatarHue }; NEEDS[0].posterId = 'u-aline'
NEEDS[0].offerSlots = { used: 2, limit: 3 }; NEEDS[0].offersCount = 2; NEEDS[0].status = 'offers_received'
NEEDS[0].statusGroup = 'action_needed'; NEEDS[0].nextStep = NEXT_STEP.offers_received
NEEDS[0].createdAt = ago(18 * MIN); NEEDS[0].counts = { loves: 12, messages: 4, saves: 6, shares: 2 }
NEEDS[0].matchedPartnerIds = ['pt-cleanpro', 'pt-010', 'pt-inzu']
NEEDS[0].media = [0, 1, 2].map((k) => ({ id: `m-0-${k}`, kind: 'image', url: '', seed: k, cat: 'home-furniture' }))

// ---------------------------------------------------------------- bundles
const BUNDLE_TEMPLATES = [
  { title: 'Furnish my 2-bedroom flat', goal: 'Move in by the end of the month', category: 'home-furniture', items: [['Sofa', 650000], ['Bed', 380000, 2], ['Dining set', 520000], ['Curtains', 120000], ['Fridge', 690000], ['Deep clean', 45000]] },
  { title: 'Wedding in Kigali — 200 guests', goal: 'Saturday 14 November', category: 'custom-solutions', items: [['Catering', 3200000], ['Venue decoration', 900000], ['Photographer', 450000], ['Car hire', 300000], ['Bridal make-up', 180000], ['Sound system', 250000]] },
  { title: 'Office set-up for 12 staff', goal: 'Ready for opening in Kacyiru', category: 'custom-solutions', items: [['Desks & chairs', 2400000], ['Internet installation', 180000], ['Branding signage', 350000], ['Weekly cleaning', 60000, 1, true], ['Laptops', 6000000]] },
  { title: 'Farming season — 2 ha beans', goal: 'Season A planting', category: 'agriculture', items: [['Seeds', 220000], ['Fertiliser', 300000], ['Farm labour', 400000, 1, true], ['Harvest transport', 150000]] },
  { title: 'Monthly household supplies', goal: 'Delivered on the 1st', category: 'services', items: [['Groceries', 180000, 1, true], ['Laundry pick-up', 40000, 1, true], ['Gas refill', 28000, 1, true], ['Water delivery', 15000, 1, true]] },
  { title: 'Family Akagera holiday', goal: 'School holidays, 4 people', category: 'travel-tourism', items: [['Safari jeep & guide', 650000], ['Lodge 2 nights', 900000], ['Airport transfer', 60000], ['Packed lunches', 80000]] },
  { title: 'Renovate rental house before tenants', goal: 'Ready in 3 weeks', category: 'home-furniture', items: [['Painting', 450000], ['Plumbing repairs', 120000], ['Electrical check', 90000], ['Garden clean-up', 50000], ['Deep clean', 60000]] },
  { title: 'Company end-of-year party', goal: '80 staff, Friday evening', category: 'food-catering', items: [['Venue', 800000], ['Buffet', 1600000], ['DJ', 250000], ['Transport', 300000], ['Photographer', 200000]] },
]
export const BUNDLES = []
for (let i = 0; i < 40; i++) {
  const t = BUNDLE_TEMPLATES[i % BUNDLE_TEMPLATES.length]
  const poster = i % 4 === 0 ? NEEDERS[0] : pick(NEEDERS.slice(1))
  const status = i < 8 ? pick(['published', 'matching', 'offers_received', 'in_service']) : pick(NEED_STATUS_POOL)
  const served = ['completed', 'closed'].includes(status) ? t.items.length : ['in_service', 'payment_verified', 'delivered', 'agreement_signed'].includes(status) ? int(1, t.items.length - 1) : PUBLIC_STATUSES.has(status) ? int(0, 2) : 0
  const items = t.items.map(([label, amount, qty = 1, rec = false], k) => ({
    id: `bi-${i}-${k}`,
    title: label,
    quantity: qty,
    budget: { amount: roundTo(amount * (0.8 + rand() * 0.5), 5000), currency: 'RWF' },
    urgency: pick(['low', 'medium', 'high']),
    recurring: rec,
    status: k < served ? 'completed' : k === served && served > 0 ? 'in_service' : PUBLIC_STATUSES.has(status) ? 'matching' : status,
    offers: int(0, 3),
  }))
  const a = area()
  BUNDLES.push({
    id: `bd-${i + 1}`,
    code: `NB-26-${pad(4120 - i * 13, 5)}`,
    kind: 'bundle',
    title: i < BUNDLE_TEMPLATES.length ? t.title : `${t.title}${i % 3 === 0 ? '' : ` · ${a.sector}`}`,
    goal: t.goal,
    category: t.category,
    categoryName: CAT[t.category].name,
    items,
    itemCount: items.length,
    totalBudget: { amount: items.reduce((s, it) => s + it.budget.amount * it.quantity, 0), currency: 'RWF' },
    allowPartial: chance(0.7),
    progress: { served, total: items.length },
    mixedRecurring: items.some((it) => it.recurring) && items.some((it) => !it.recurring),
    recurringCount: items.filter((it) => it.recurring).length,
    frequency: items.every((it) => it.recurring) ? 'recurring' : items.some((it) => it.recurring) ? 'mixed' : 'one_time',
    status,
    statusGroup: STATUS_GROUP[status],
    nextStep: NEXT_STEP[status],
    serviceArea: a,
    district: a.district,
    urgency: pick(['medium', 'high', 'high', 'urgent']),
    poster: { id: poster.id, name: shortName(poster.name), avatarHue: poster.avatarHue },
    posterId: poster.id,
    anonymous: chance(0.1),
    visibility: 'public',
    offerSlots: { used: Math.min(3, int(0, 3)), limit: 3 },
    counts: { loves: int(0, 80), messages: int(0, 20), saves: int(0, 40), shares: int(0, 15) },
    blockedItems: chance(0.15) ? 1 : 0,
    createdAt: ago(i < 6 ? int(1, 20) * HOUR : int(1, 90) * DAY),
    matchedPartnerIds: chance(0.5) ? ['pt-cleanpro', 'pt-inzu'] : ['pt-akagera', 'pt-umuco'],
    media: [0, 1, 2].map((k) => ({ id: `bm-${i}-${k}`, kind: 'image', url: '', seed: k, cat: t.category })),
  })
}

// ---------------------------------------------------------------- deals
const DEAL_TITLES = {
  agriculture: [['Soil test + planting plan', 'service'], ['Hybrid maize seed pack 25 kg', 'product']],
  automotive: [['Full car service + free wash', 'service'], ['RAV4 hire with driver — per day', 'vehicle'], ['Airport transfer, any time', 'service'], ['Brake pads fitted', 'service']],
  beauty: [['Bridal glam package', 'service'], ['Home braiding — any style', 'service'], ['60-min deep tissue massage', 'service']],
  education: [['10 maths tutoring sessions', 'professional'], ['Kinyarwanda for beginners — 8 weeks', 'service'], ['Intro to Python bootcamp', 'service']],
  electronics: [['iPhone screen repair in 1 hour', 'service'], ['3 kW home solar kit installed', 'product'], ['Refurbished laptop + 1-year warranty', 'product']],
  'food-catering': [['Wedding buffet — per guest', 'service'], ['Office lunch plan — 20 staff', 'service'], ['Celebration cake 3 kg', 'product'], ['Brochette party for 50', 'service']],
  health: [['Home nurse — 12 h shift', 'professional'], ['Physio home visit', 'professional'], ['Full blood panel at home', 'service']],
  'home-furniture': [['Deep clean — 3-bedroom house', 'service'], ['Emergency plumber call-out', 'service'], ['Solid wood 3-seater sofa', 'product'], ['Interior painting per room', 'service'], ['Moving van + 4 helpers', 'service']],
  'real-estate': [['2-bed apartment, Kimihurura — monthly', 'property'], ['Serviced office desk — monthly', 'property'], ['Furnished studio, Kacyiru', 'property']],
  'professional-talent': [['Logo + brand kit', 'professional'], ['Monthly bookkeeping for SMEs', 'professional'], ['Product photo shoot — 20 images', 'professional'], ['Land contract review', 'professional']],
  services: [['Weekly laundry pick-up & fold', 'service'], ['Restaurant fumigation', 'service'], ['Garden care — monthly', 'service']],
  'travel-tourism': [['Gorilla trekking day trip', 'service'], ['Akagera safari — 2 days', 'bundle'], ['Lake Kivu weekend package', 'bundle']],
  'custom-solutions': [['Office set-up in 7 days', 'custom'], ['Corporate party — all inclusive', 'bundle'], ['Branded uniforms × 20', 'custom']],
}
const actionFor = (type) => (['service', 'vehicle', 'property', 'professional'].includes(type) ? (type === 'property' || type === 'professional' ? 'request' : 'book') : 'get')
export const DEALS = []
for (let i = 0; i < 80; i++) {
  const cat = CATEGORIES[i % CATEGORIES.length]
  const [title, type] = pick(DEAL_TITLES[cat.slug])
  const candidates = PARTNERS.filter((p) => p.categories.includes(cat.slug))
  const partner = i % 8 === 0 && cat.slug !== 'automotive' ? PT['pt-cleanpro'] : pick(candidates.length ? candidates : PARTNERS)
  const price = budgetFor(cat.slug)
  const discount = chance(0.65) ? pick([10, 15, 20, 25, 30]) : 0
  const status = i < 60 ? 'published' : pick(['pending', 'pending', 'draft', 'paused', 'rejected', 'expired'])
  DEALS.push({
    id: `dl-${i + 1}`,
    slug: `${slugify(title)}-${i + 1}`,
    kind: 'deal',
    title,
    type,
    category: cat.slug,
    categoryName: cat.name,
    partner: partnerSummary(partner),
    partnerId: partner.id,
    price: { amount: discount ? roundTo(price * (1 - discount / 100), 1000) : price, currency: 'RWF' },
    oldPrice: discount ? { amount: price, currency: 'RWF' } : undefined,
    discountPct: discount,
    endsAt: chance(0.6) ? ahead(int(2, 120) * HOUR) : undefined,
    rating: Math.round((3.9 + rand() * 1.1) * 10) / 10,
    reviewCount: int(3, 380),
    ratingBreakdown: [int(60, 75), int(12, 22), int(3, 10), int(0, 4), int(0, 3)],
    coverage: partner.areas,
    primaryAction: actionFor(type),
    status,
    featured: chance(0.2),
    bookedThisWeek: int(1, 48),
    views: int(120, 9000),
    saves: int(4, 400),
    bookings: int(0, 260),
    matchScore: int(55, 98),
    description: `${title} from ${partner.name}. Verified Partner, clear inclusions and escrow-protected payment. Book a date and we confirm within ${partner.responseTime.replace('< ', '')}.`,
    inclusions: ['Verified, trained staff', 'Materials and transport', 'Free re-visit within 7 days', 'Escrow-protected payment'],
    specs: [['Category', cat.name], ['Type', type[0].toUpperCase() + type.slice(1)], ['Duration', pick(['1 h', '2–3 h', 'Half day', '1 day', '2 days', 'Monthly'])], ['Languages', partner.languages.join(', ')]],
    customFields: [{ key: 'date', label: 'Preferred date', type: 'date' }, { key: 'notes', label: 'Anything we should know?', type: 'text' }],
    orderLimit: pick([null, 10, 20, 50]),
    media: [...[0, 1, 2].map((k) => ({ id: `dm-${i}-${k}`, kind: 'image', url: '', seed: k, cat: cat.slug })), ...(chance(0.3) ? [{ id: `dmv-${i}`, kind: 'video', url: DEMO_VIDEO, durationSec: 24 }] : [])],
    createdAt: ago(int(1, 200) * DAY),
  })
}

// ---------------------------------------------------------------- offers
const INCLUSIONS = ['Labour', 'Materials', 'Transport', 'Clean-up after work', '7-day guarantee', 'Free inspection', 'Weekend availability']
export const OFFERS = []
const offerTargets = [...NEEDS.filter((n) => n.offersCount > 0 || STATUS_GROUP[n.status] !== 'submitted'), ...BUNDLES.slice(0, 20)]
offerTargets.forEach((t, ti) => {
  const n = t.kind === 'bundle' ? int(1, 4) : Math.max(t.offersCount ?? 0, chance(0.5) ? 1 : 0)
  for (let k = 0; k < n; k++) {
    const partner = k === 0 && ti % 3 === 0 ? PT['pt-cleanpro'] : PT[t.matchedPartnerIds[k % t.matchedPartnerIds.length]] ?? pick(PARTNERS)
    const base = t.kind === 'bundle' ? t.totalBudget.amount : t.budget.amount
    const scope = t.kind === 'bundle' ? (k % 2 === 0 ? { kind: 'bundle', label: 'Whole Bundle' } : { kind: 'bundle_item', itemId: t.items[k % t.items.length].id, label: `Item: ${t.items[k % t.items.length].title}` }) : { kind: 'need', label: 'Whole Need' }
    const scopeBase = scope.kind === 'bundle_item' ? t.items[k % t.items.length].budget.amount : base
    const accepted = t.assignedPartnerId === partner.id
    OFFERS.push({
      id: `of-${OFFERS.length + 1}`,
      code: `OF-${pad(52000 + OFFERS.length, 6)}`,
      needCode: t.code,
      needTitle: t.title,
      targetKind: t.kind,
      neederId: t.posterId,
      neederName: t.poster.name,
      scope,
      partner: partnerSummary(partner),
      partnerId: partner.id,
      price: { amount: roundTo(scopeBase * (0.82 + rand() * 0.35), 1000), currency: 'RWF' },
      inclusions: sample(INCLUSIONS, int(2, 4)),
      timeline: pick(['Can start today', 'Within 24 h', '2–3 days', 'Next week', '5 working days']),
      validUntil: ahead(int(-2, 6) * DAY + int(1, 20) * HOUR),
      status: accepted ? 'accepted' : ['offers_received', 'matching', 'published'].includes(t.status) ? pick(['submitted', 'submitted', 'clarification', 'revised']) : pick(['rejected', 'expired', 'withdrawn', 'auto_closed', 'accepted']),
      distanceKm: Math.round(rand() * 140) / 10 + 0.4,
      note: 'We have done 40+ similar jobs this year. Price includes everything listed; no hidden fees.',
      createdAt: ago(int(1, 72) * HOUR),
    })
  }
})

// ---------------------------------------------------------------- bookings
export const BOOKINGS = Array.from({ length: 96 }, (_, i) => {
  const deal = DEALS[i % 60]
  const needer = i % 3 === 0 ? NEEDERS[0] : pick(NEEDERS)
  const qty = deal.type === 'product' ? int(1, 4) : 1
  const status = pick(['requested', 'confirmed', 'confirmed', 'scheduled', 'in_service', 'delivered', 'completed', 'completed', 'cancelled'])
  return {
    id: `bk-${i + 1}`,
    code: `BK-${pad(30200 + i, 6)}`,
    dealSlug: deal.slug,
    dealTitle: deal.title,
    dealType: deal.type,
    category: deal.category,
    partner: deal.partner,
    partnerId: deal.partnerId,
    neederId: needer.id,
    neederName: shortName(needer.name),
    quantity: qty,
    amount: { amount: deal.price.amount * qty, currency: 'RWF' },
    scheduledFor: ahead(int(-30, 30) * DAY),
    paymentState: status === 'requested' ? 'pending' : status === 'cancelled' ? 'refunded' : status === 'completed' ? 'released' : 'held',
    status,
    clientInputs: { notes: pick(['Gate code at reception', 'Please call on arrival via the app', 'Second floor, blue door', 'Bring extra ladder']), area: `${needer.sector}, ${needer.district}` },
    createdAt: ago(int(1, 90) * DAY),
  }
})

// ---------------------------------------------------------------- agreements
export const AGREEMENTS = Array.from({ length: 72 }, (_, i) => {
  const kind = pick(['need', 'need', 'bundle', 'deal'])
  const ref = kind === 'need' ? NEEDS[(i * 3) % NEEDS.length] : kind === 'bundle' ? BUNDLES[i % BUNDLES.length] : DEALS[i % 60]
  const needer = i % 3 === 0 ? NEEDERS[0] : pick(NEEDERS)
  const partner = i % 4 === 0 ? PT['pt-cleanpro'] : pick(PARTNERS)
  const price = ref.price?.amount ?? ref.budget?.amount ?? ref.totalBudget.amount
  const status = pick(['awaiting_signature', 'signed', 'signed', 'active', 'completed', 'completed', 'cancelled', 'draft'])
  return {
    id: `ag-${i + 1}`,
    code: `AG-${pad(7100 + i, 5)}`,
    kind,
    refCode: ref.code ?? ref.slug,
    title: ref.title,
    neederId: needer.id,
    neederName: needer.name,
    partnerId: partner.id,
    partnerName: partner.name,
    price: { amount: price, currency: 'RWF' },
    fee: { amount: Math.round(price * 0.15), currency: 'RWF' },
    status,
    version: int(1, 3),
    deadline: ahead(int(-10, 40) * DAY),
    recurring: chance(0.2),
    createdAt: ago(int(1, 120) * DAY),
    signedAt: ['signed', 'active', 'completed'].includes(status) ? ago(int(1, 60) * DAY) : undefined,
  }
})

// ---------------------------------------------------------------- payments (1,240)
export const PAYMENTS = Array.from({ length: 1240 }, (_, i) => {
  const needer = i % 9 === 0 ? NEEDERS[0] : pick(NEEDERS)
  const partner = i % 7 === 0 ? PT['pt-cleanpro'] : pick(PARTNERS)
  const ref = chance(0.5) ? NEEDS[i % NEEDS.length] : DEALS[i % DEALS.length]
  const amount = roundTo((ref.budget?.amount ?? ref.price.amount) * (0.8 + rand() * 0.4), 500)
  const state = pick(['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'verifying', 'failed', 'refunded'])
  const method = pick(['momo', 'momo', 'momo', 'airtel', 'airtel', 'card', 'proof'])
  const feePct = partner.level === 3 ? 0.12 : partner.level === 2 ? 0.15 : 0.18
  return {
    id: `py-${i + 1}`,
    ref: `PAY-${pad(880000 + i * 3, 7)}`,
    method,
    amount: { amount, currency: 'RWF' },
    fee: { amount: Math.round(amount * feePct), currency: 'RWF' },
    partnerShare: { amount: Math.round(amount * (1 - feePct)), currency: 'RWF' },
    payerId: needer.id,
    payerName: needer.name,
    partnerId: partner.id,
    partnerName: partner.name,
    refCode: ref.code ?? ref.slug,
    refTitle: ref.title,
    state,
    escrow: state === 'paid' ? pick(['held', 'held', 'released', 'released', 'released', 'partial']) : state === 'refunded' ? 'refunded' : 'none',
    proofReference: method === 'proof' ? `BK${int(100000, 999999)}` : undefined,
    proofBank: method === 'proof' ? pick(['Bank of Kigali', 'Equity Bank', 'I&M Bank', 'Cash at Needibi desk']) : undefined,
    proofFile: method === 'proof' ? `deposit-slip-${pad(i + 1, 4)}.jpg` : undefined,
    proofNote: method === 'proof' ? pick(['Deposited at the branch this morning.', 'Paid in cash at the desk, slip attached.', 'Transfer from my business account.', 'My brother deposited it for me.']) : undefined,
    proofUploadedBy: method === 'proof' ? pick(['needer', 'needer', 'agent']) : undefined,
    createdAt: ago(int(0, 365) * DAY + int(0, 23) * HOUR),
  }
})

// ---------------------------------------------------------------- partner work
export const JOBS = Array.from({ length: 64 }, (_, i) => {
  const ref = i % 2 ? NEEDS[(i * 5) % NEEDS.length] : BUNDLES[i % BUNDLES.length]
  const partner = i < 34 ? PT['pt-cleanpro'] : pick(PARTNERS)
  const stage = pick(['incoming', 'active', 'active', 'pending_quote', 'completed', 'completed'])
  const status = { incoming: 'scheduled', active: pick(['scheduled', 'in_service', 'delivered']), pending_quote: 'quote_pending', completed: 'completed' }[stage]
  return {
    id: `jb-${i + 1}`,
    code: `JB-${pad(4400 + i, 5)}`,
    refCode: ref.code,
    title: ref.title,
    kind: ref.kind,
    neederName: ref.poster.name,
    partnerId: partner.id,
    stage,
    status,
    amount: { amount: ref.budget?.amount ?? ref.totalBudget.amount, currency: 'RWF' },
    dueAt: ahead(int(-6, 20) * DAY),
    recurring: ref.recurring ?? ref.mixedRecurring,
    area: `${ref.serviceArea.sector}, ${ref.serviceArea.district}`,
    createdAt: ago(int(1, 50) * DAY),
  }
})

export const PAYOUTS = Array.from({ length: 84 }, (_, i) => {
  const partner = i < 30 ? PT['pt-cleanpro'] : pick(PARTNERS)
  const status = i < 3 ? 'scheduled' : pick(['paid', 'paid', 'paid', 'paid', 'processing', 'failed', 'scheduled'])
  return {
    id: `po-${i + 1}`,
    ref: `PO-${pad(61000 + i, 6)}`,
    partnerId: partner.id,
    partnerName: partner.name,
    amount: { amount: roundTo(int(80000, 2400000), 500), currency: 'RWF' },
    method: pick(['MTN MoMo · ••• 456', 'Airtel Money · ••• 213', 'Bank of Kigali · ••• 0091']),
    status,
    scheduledFor: status === 'scheduled' ? ahead(int(1, 14) * DAY) : ago(int(1, 360) * DAY),
    jobs: int(1, 18),
    invoice: `INV-${pad(9000 + i, 5)}`,
    createdAt: ago(int(1, 360) * DAY),
  }
})

// ---------------------------------------------------------------- reviews
const REVIEW_COMMENTS = [
  'Arrived on time, fixed everything and left the place clean. Will use again.',
  'Very professional. The price agreed in chat was exactly what I paid.',
  'Good work overall, small delay but they kept me informed through the app.',
  'Excellent service — my guests loved the food!',
  'Escrow gave me peace of mind. Released payment happily after the job.',
  'Polite team, quality materials. Highly recommend.',
  'Partial delivery on the first day, completed the rest the next morning.',
]
export const REVIEWS = Array.from({ length: 210 }, (_, i) => {
  const partner = i < 50 ? PT['pt-cleanpro'] : pick(PARTNERS)
  const author = i % 5 === 0 ? NEEDERS[0] : pick(NEEDERS)
  const rating = pick([5, 5, 5, 5, 4, 4, 4, 3, 2])
  const ref = chance(0.5) ? pick(NEEDS) : pick(DEALS)
  return {
    id: `rv-${i + 1}`,
    partnerId: partner.id,
    partnerName: partner.name,
    authorId: author.id,
    authorName: shortName(author.name),
    authorHue: author.avatarHue,
    district: author.district,
    rating,
    tags: sample(['On time', 'Great value', 'Professional', 'Clean work', 'Friendly', 'Good communication'], int(1, 3)),
    comment: pick(REVIEW_COMMENTS),
    refTitle: ref.title,
    kind: ref.kind,
    partial: chance(0.08),
    verified: true,
    reply: chance(0.35) ? 'Thank you for trusting us — see you next time!' : undefined,
    status: pick(['published', 'published', 'published', 'published', 'pending', 'flagged']),
    createdAt: ago(int(1, 300) * DAY),
  }
})

// ---------------------------------------------------------------- disputes & tickets
const ADMINS = ['Patrick K.', 'Josiane U.', 'Olivier M.', 'Sandrine I.']
export const DISPUTES = Array.from({ length: 32 }, (_, i) => {
  const ref = pick(NEEDS)
  const needer = i % 4 === 0 ? NEEDERS[0] : pick(NEEDERS)
  const partner = i % 5 === 0 ? PT['pt-cleanpro'] : pick(PARTNERS)
  return {
    id: `ds-${i + 1}`,
    code: `DS-${pad(1200 + i, 5)}`,
    refCode: ref.code,
    refTitle: ref.title,
    raisedById: needer.id,
    raisedBy: needer.name,
    partnerId: partner.id,
    against: partner.name,
    reason: pick(['Work not completed', 'Quality below agreement', 'Partner did not show up', 'Damaged item', 'Charged more than agreed']),
    desiredResolution: pick(['Full refund', 'Partial refund', 'Redo the work', 'Release payment']),
    amount: { amount: ref.budget.amount, currency: 'RWF' },
    status: pick(['open', 'under_review', 'awaiting_evidence', 'resolved', 'resolved', 'appealed']),
    assignedAdmin: pick(ADMINS),
    resolution: chance(0.4) ? pick(['Refund', 'Release', 'Partial']) : undefined,
    createdAt: ago(int(1, 90) * DAY),
  }
})

export const TICKETS = Array.from({ length: 86 }, (_, i) => {
  const requester = i % 4 === 0 ? NEEDERS[0] : i % 5 === 0 ? { id: 'p-cleanpro', name: 'Diane Uwase (CleanPro Rwanda)' } : pick(NEEDERS)
  const status = pick(['open', 'open', 'assigned', 'awaiting_user', 'escalated', 'resolved', 'closed'])
  return {
    id: `tk-${i + 1}`,
    code: `TK-${pad(20500 + i, 6)}`,
    subject: pick(['MoMo payment pending for 2 hours', 'Cannot upload my ID for verification', 'Partner has not replied', 'How do I change my service area?', 'Refund not received', 'Offer slot shows full but no offers', 'Wrong category on my Need', 'Update payout number']),
    category: pick(['Payments', 'Verification', 'Account', 'Offers', 'Disputes', 'Technical']),
    priority: pick(['low', 'normal', 'normal', 'high', 'urgent']),
    status,
    requesterId: requester.id,
    requesterName: requester.name,
    requesterRole: requester.id.startsWith('p-') ? 'partner' : 'needer',
    assignee: status === 'open' ? undefined : pick(ADMINS),
    linkedItem: chance(0.6) ? pick(NEEDS).code : undefined,
    slaDueAt: ahead(int(-8, 30) * HOUR),
    createdAt: ago(int(1, 60) * DAY),
    updatedAt: ago(int(0, 20) * HOUR),
  }
})

// ---------------------------------------------------------------- notifications
const NOTIF = [
  ['action', 'New offer on your Need', 'CleanPro Rwanda served “Plumber to fix kitchen leak” for RWF 24,000.', '/app/needer/needs/NS-26-08731', 'offers'],
  ['critical', 'Payment request', 'Approve RWF 450,000 on your phone to pay into escrow.', '/app/needer/payments', 'payments'],
  ['action', 'Partner asked for more information', 'Kigali Auto Care asked: “Is the car automatic?”', '/app/needer/messages', 'chat'],
  ['reminder', 'Recurring cleaning tomorrow', 'Weekly deep clean · Saturday 09:00', '/app/needer/tracking', 'recurring'],
  ['info', 'Your Need is live', 'NS-26-08724 passed the policy check and is visible to Partners.', '/app/needer/needs/NS-26-08724', 'needs'],
  ['info', 'New Deal from a Partner you follow', 'Inzu Furniture: Solid wood 3-seater sofa −20%', '/deals', 'following'],
  ['action', 'Confirm satisfaction', 'Umuco Catering marked your order as delivered.', '/app/needer/bookings', 'bookings'],
  ['critical', 'New sign-in on Android', 'If this wasn’t you, secure your account now.', '/app/needer/settings', 'security'],
]
// Only events that need attention, per role (spec 10.10)
const ROLE_NOTIF = {
  needer: NOTIF.concat([
    ['info', 'Your Need was approved', '“Paint living room and corridor” is live and matching verified Partners.', '/app/needer/needs', 'approvals'],
    ['action', 'Offer revised', 'CleanPro Rwanda lowered their offer to RWF 22,000.', '/app/needer/offers', 'offers'],
    ['info', 'Work in progress', 'Kigali Auto Care started “Fix brakes on Toyota RAV4”.', '/app/needer/tracking', 'fulfilment'],
    ['action', 'Rate your Partner', 'How did Umuco Catering do? Your review helps other Needers.', '/app/needer/reviews', 'reviews'],
    ['action', 'Dispute update', 'DS-01204: the Partner responded. Add evidence within 48 h.', '/app/needer/disputes', 'disputes'],
    ['action', 'Your Bundle needs changes', 'Please remove the phone number from “Office set-up for 12 staff”.', '/app/needer/bundles', 'needs'],
    ['reminder', 'Deal ending soon', 'Deep clean — 3-bedroom house ends in 6 h.', '/deals', 'deals'],
    ['action', 'No offers yet', '“Lawyer to review land contract” has been waiting 24 h. Try raising the budget or adding photos.', '/app/needer/needs', 'needs'],
  ]),
  partner: [
    ['info', 'Offer declined', 'The Needer chose another offer for “Deep clean 3-bedroom house”. Your slot is free.', '/app/partner/offers', 'offers'],
    ['info', 'New review', 'Aline M. rated you 5★ for “Weekly laundry pick-up”.', '/app/partner/reviews', 'reviews'],
    ['action', 'Deal needs changes', 'Remove the phone number from your Deal photos before approval.', '/app/partner/deals', 'deals'],
    ['info', 'Appeal decision', 'AP-0304: your appeal was upheld.', '/app/partner/appeals', 'appeals'],
    ['action', 'New request matches you', 'Plumber to fix kitchen leak · Kimihurura · RWF 25,000', '/needs/NS-26-08731', 'requests'],
    ['info', 'Offer accepted', 'Aline M. accepted your offer for “Weekly laundry pick-up”.', '/app/partner/offers', 'offers'],
    ['action', 'Clarification requested', 'Does the price include replacing the pipe?', '/app/partner/offers', 'offers'],
    ['info', 'An offer slot opened', '“Paint living room and corridor” has a free slot again.', '/app/partner/requests', 'requests'],
    ['reminder', 'Deadline tomorrow', 'Deep clean in Niboye is due tomorrow at 09:00.', '/app/partner/jobs', 'jobs'],
    ['info', 'Recurring schedule changed', 'Weekly cleaning moved from Saturday to Sunday.', '/app/partner/jobs', 'jobs'],
    ['info', 'Deal approved', '“Emergency plumber call-out” is now live.', '/app/partner/deals', 'deals'],
    ['critical', 'Dispute needs your response', 'DS-01204 · respond within 48 h.', '/app/partner/support', 'disputes'],
    ['info', 'Payout sent', 'RWF 486,500 sent to MTN MoMo ••• 456.', '/app/partner/payouts', 'payouts'],
    ['info', 'Verification approved', 'Your business documents were approved.', '/app/partner/verification', 'verification'],
  ],
  agent: [
    ['action', 'Case escalated', 'An admin asked you to help Jean P. add photos to his Need.', '/app/agent/cases', 'cases'],
    ['info', 'Provider sign-up complete', 'Ikaze Homes finished their ID check and is now verified.', '/app/agent/partners', 'partners'],
    ['action', 'New assigned case', 'Help Claudine U. post “Home nurse for elderly mother”.', '/app/agent/cases', 'cases'],
    ['reminder', 'Task due today', 'Help Ikaze Homes upload their ID photo.', '/app/agent/follow-ups', 'followups'],
    ['info', 'Referral activated', 'Jules N. completed their first transaction.', '/app/agent/referrals', 'referrals'],
    ['info', 'Reward earned', 'RWF 5,000 added to your pending rewards.', '/app/agent/referrals', 'referrals'],
  ],
  admin: [
    ['action', 'Partner rejected a request', 'CleanPro Rwanda rejected NS-26-08731 · “Outside my service area”.', '/admin/needs', 'matching'],
    ['action', 'New appeal', 'AP-0315 challenges the decision on DS-01211.', '/admin/appeals', 'appeals'],
    ['action', 'Deals awaiting approval', '5 Partner Deals are waiting for review.', '/admin/review-queue', 'reviews'],
    ['action', '7 Needs waiting for review', 'Oldest submitted 2 h ago.', '/admin/review-queue', 'reviews'],
    ['critical', 'High-priority request', 'Urgent: home nurse needed tonight in Kicukiro.', '/admin/needs', 'needs'],
    ['critical', 'Suspected fraud', '4 referrals from one device flagged.', '/admin/referrals', 'fraud'],
    ['action', '18 Partners awaiting verification', 'Including 3 high-risk applicants.', '/admin/verification', 'kyc'],
    ['reminder', 'Overdue fulfilment', '9 jobs are past their deadline.', '/admin/needs', 'fulfilment'],
    ['action', 'Rejection threshold reached', 'NS-26-08423 was rejected by 15 Partners.', '/admin/needs', 'matching'],
    ['action', 'Unresolved disputes', '6 disputes open for more than 48 h.', '/admin/disputes', 'disputes'],
    ['critical', 'SLA breach', '3 tickets and 2 chats breached their SLA.', '/admin/tickets', 'sla'],
  ],
}
export const NOTIFICATIONS = Object.entries(ROLE_NOTIF).flatMap(([role, list]) =>
  Array.from({ length: role === 'needer' ? 42 : 24 }, (_, i) => {
    const [priority, title, body, link, category] = list[i % list.length]
    return { id: `nt-${role}-${i + 1}`, role, userId: role === 'needer' ? 'u-aline' : role, priority, title, body, link, category, read: i > 5, createdAt: ago(i < 6 ? int(2, 300) * MIN : int(1, 40) * DAY) }
  }),
)

// ---------------------------------------------------------------- moderation
const MSG_BODIES = [
  ['Is the budget negotiable for weekend work?', []],
  ['We did a similar job in Remera last month, happy to help.', []],
  ['Call me on 0788 123 456 for a quick quote', ['contact_info']],
  ['email me at jean at gmail dot com', ['contact_info']],
  ['Best price guaranteed!!! Visit www.cheapfix.rw', ['contact_info', 'spam']],
  ['Does this include materials?', []],
  ['This is a scam, stupid people', ['abuse']],
  ['Is the budget negotiable for weekend work?', ['duplicate']],
  ['zero seven eight eight one two three four five', ['contact_info']],
  ['How many rooms exactly?', []],
]
export const MESSAGES = Array.from({ length: 160 }, (_, i) => {
  const [body, risks] = MSG_BODIES[i % MSG_BODIES.length]
  const target = i % 3 === 0 ? DEALS[i % DEALS.length] : i % 3 === 1 ? NEEDS[i % NEEDS.length] : BUNDLES[i % BUNDLES.length]
  const author = pick(NEEDERS)
  return {
    id: `ms-${i + 1}`,
    targetKind: target.kind,
    targetCode: target.code ?? target.slug,
    targetTitle: target.title,
    authorId: author.id,
    authorName: shortName(author.name),
    authorHue: author.avatarHue,
    body,
    risks,
    status: risks.length ? pick(['pending', 'pending', 'rejected']) : pick(['approved', 'approved', 'approved', 'pending']),
    rejectReason: undefined,
    createdAt: ago(int(5, 60 * 24 * 20) * MIN),
  }
})

export const REPORTS = Array.from({ length: 44 }, (_, i) => {
  const target = pick([...NEEDS.slice(0, 40), ...DEALS.slice(0, 30)])
  return {
    id: `rp-${i + 1}`,
    targetKind: target.kind,
    targetCode: target.code ?? target.slug,
    targetTitle: target.title,
    reason: pick(['Misleading price', 'Prohibited item', 'Contact details in media', 'Offensive content', 'Duplicate listing', 'Suspected fraud']),
    reporter: shortName(pick(NEEDERS).name),
    status: pick(['open', 'open', 'actioned', 'dismissed']),
    createdAt: ago(int(1, 40) * DAY),
  }
})

// ---------------------------------------------------------------- chats
const CHAT_SCRIPTS = [
  [['partner', 'Muraho Aline! I can fix the leak today. Is the pipe under the sink or in the wall?'], ['needer', 'Under the sink. It started this morning.'], ['partner', 'Thanks. I can come at 15:00. Price RWF 24,000 including parts.'], ['system', 'Price proposal: RWF 24,000'], ['needer', 'That works for me.']],
  [['partner', 'Hello! For the wedding catering, do you need vegetarian options?'], ['needer', 'Yes, about 20 guests.'], ['partner', 'Noted. I will update the offer with a vegetarian menu.']],
  [['admin', 'Hi, this is Needibi Support. We need one more photo of the damaged area to process your dispute.'], ['needer', 'Sure, uploading now.']],
]
export const CHATS = Array.from({ length: 14 }, (_, i) => {
  const ref = i === 0 ? NEEDS[0] : i % 2 ? pick(NEEDS) : pick(BUNDLES)
  const script = CHAT_SCRIPTS[i % CHAT_SCRIPTS.length]
  const partner = i === 0 ? PT['pt-cleanpro'] : pick(PARTNERS)
  const counterpartKind = script[0][0]
  return {
    id: `ch-${i + 1}`,
    refCode: ref.code,
    refTitle: ref.title,
    refKind: ref.kind,
    neederId: i % 2 === 0 ? 'u-aline' : pick(NEEDERS).id,
    neederName: i % 2 === 0 ? 'Aline M.' : shortName(pick(NEEDERS).name),
    partnerId: i < 8 ? 'pt-cleanpro' : partner.id,
    partnerName: i < 8 ? 'CleanPro Rwanda' : partner.name,
    openedBy: counterpartKind === 'admin' ? 'admin' : 'partner',
    status: i < 9 ? pick(['active', 'active', 'awaiting']) : 'closed',
    unread: i < 4 ? int(1, 3) : 0,
    budget: ref.budget ?? ref.totalBudget,
    proposal: { amount: roundTo((ref.budget?.amount ?? ref.totalBudget.amount) * 0.96, 1000), currency: 'RWF' },
    agreed: i % 3 === 0,
    contactsUnlocked: i % 4 === 0,
    messages: script.map(([from, body], k) => ({
      id: `cm-${i}-${k}`,
      from,
      body,
      at: ago((script.length - k) * 7 * MIN + i * HOUR),
      read: !(i < 4 && k === script.length - 1),
    })),
    updatedAt: ago(i * HOUR + 3 * MIN),
  }
})

// ---------------------------------------------------------------- admin people & ops
export const VERIFICATIONS = Array.from({ length: 54 }, (_, i) => {
  const isPartner = i % 3 !== 2
  const name = isPartner ? (PARTNERS[i % PARTNERS.length]?.name ?? `${pick(FIRST)} ${pick(LAST)}`) : `${pick(FIRST)} ${pick(LAST)}`
  return {
    id: `kyc-${i + 1}`,
    applicantName: name,
    kind: isPartner ? 'partner' : pick(['agent', 'needer']),
    docs: isPartner ? ['National ID', 'Selfie', 'RDB certificate'] : ['National ID', 'Selfie'],
    status: i < 18 ? 'pending' : pick(['approved', 'approved', 'rejected', 'info_requested']),
    risk: pick(['low', 'low', 'low', 'medium', 'high']),
    district: pick(DISTRICT_NAMES),
    submittedAt: ago(int(1, 30 * 24) * HOUR),
  }
})

export const AGENTS = Array.from({ length: 22 }, (_, i) => {
  const name = i === 0 ? 'Eric Niyonzima' : `${pick(FIRST)} ${pick(LAST)}`
  return {
    id: i === 0 ? 'u-eric' : `ag-u-${i}`,
    name,
    code: i === 0 ? 'AG-ERIC24' : `AG-${slugify(name).slice(0, 4).toUpperCase()}${int(10, 99)}`,
    district: pick(DISTRICT_NAMES),
    assistedNeeders: int(4, 120),
    onboardedPartners: int(0, 40),
    conversions: int(1, 60),
    commissionMonth: { amount: roundTo(int(15000, 420000), 500), currency: 'RWF' },
    status: pick(['active', 'active', 'active', 'suspended', 'pending']),
    joinedAt: ago(int(30, 500) * DAY),
  }
})

export const USERS = [
  ...NEEDERS.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, roles: u.id === 'u-eric' ? ['needer', 'agent'] : ['needer'], district: u.district, status: u.status, verified: u.verified, joinedAt: u.joinedAt, avatarHue: u.avatarHue })),
  ...PARTNERS.map((p) => ({ id: `owner-${p.id}`, name: `${p.owner} (${p.name})`, email: `hello@${p.handle}.rw`, phone: `+250 72${int(0, 9)} ${int(100, 999)} ${int(100, 999)}`, roles: ['partner'], district: p.district, status: p.status, verified: p.kycStatus === 'approved', joinedAt: p.memberSince, avatarHue: p.avatarHue })),
  ...AGENTS.slice(1).map((a) => ({ id: a.id, name: a.name, email: `${slugify(a.name)}@agents.needibi.com`, phone: `+250 73${int(0, 9)} ${int(100, 999)} ${int(100, 999)}`, roles: ['agent'], district: a.district, status: a.status, verified: true, joinedAt: a.joinedAt, avatarHue: int(0, 360) })),
]

export const REFERRALS = Array.from({ length: 124 }, (_, i) => {
  const agent = i < 44 ? AGENTS[0] : pick(AGENTS)
  const stage = pick(['signed_up', 'signed_up', 'verified', 'verified', 'first_transaction'])
  return {
    id: `rf-${i + 1}`,
    agentId: agent.id,
    agentName: agent.name,
    code: agent.code,
    referredName: `${pick(FIRST)} ${pick(LAST)[0]}.`,
    referredRole: pick(['needer', 'needer', 'partner']),
    stage,
    reward: { amount: stage === 'first_transaction' ? 5000 : stage === 'verified' ? 1500 : 0, currency: 'RWF' },
    rewardStatus: stage === 'first_transaction' ? pick(['earned', 'paid', 'paid']) : stage === 'verified' ? 'pending' : 'pending',
    fraudFlag: chance(0.05),
    createdAt: ago(int(1, 180) * DAY),
  }
})

export const COMMISSIONS = Array.from({ length: 48 }, (_, i) => {
  const agent = i < 12 ? AGENTS[0] : pick(AGENTS)
  const d = new Date(NOW)
  d.setMonth(d.getMonth() - (i % 12))
  return {
    id: `cm-${i + 1}`,
    agentId: agent.id,
    agentName: agent.name,
    month: d.toISOString().slice(0, 7),
    assisted: int(2, 30),
    onboarded: int(0, 8),
    conversions: int(0, 12),
    amount: { amount: roundTo(int(12000, 380000), 500), currency: 'RWF' },
    status: i % 12 === 0 ? 'pending' : pick(['paid', 'paid', 'approved']),
  }
})

export const FOLLOWUPS = Array.from({ length: 42 }, (_, i) => ({
  id: `fu-${i + 1}`,
  agentId: i < 30 ? 'u-eric' : pick(AGENTS).id,
  title: pick(['Call to confirm the request details', 'Help upload an ID photo', 'Check their first service listing', 'Remind them to confirm the work is done', 'Visit the market stall to sign them up', 'Record their consent to ask on their behalf']),
  linkedName: `${pick(FIRST)} ${pick(LAST)[0]}.`,
  kind: pick(['needer', 'partner']),
  priority: pick(['low', 'normal', 'high']),
  status: pick(['open', 'open', 'done', 'overdue']),
  dueAt: ahead(int(-5, 10) * DAY),
  createdAt: ago(int(1, 30) * DAY),
}))

export const CASES = Array.from({ length: 34 }, (_, i) => {
  const ref = i % 3 === 0 ? BUNDLES[i % BUNDLES.length] : i % 3 === 1 ? NEEDS[i] : BOOKINGS[i]
  return {
    id: `cs-${i + 1}`,
    agentId: i < 24 ? 'u-eric' : pick(AGENTS).id,
    kind: ref.kind ?? 'booking',
    refCode: ref.code,
    title: ref.title ?? ref.dealTitle,
    clientName: ref.poster?.name ?? ref.neederName,
    status: ref.status,
    assignedAt: ago(int(1, 20) * DAY),
  }
})

export const AGENT_NEEDERS = NEEDERS.slice(4, 30).map((u, i) => ({
  id: `an-${i + 1}`,
  agentId: 'u-eric',
  neederId: u.id,
  name: u.name,
  district: u.district,
  activeNeeds: int(0, 4),
  bookings: int(0, 6),
  consent: pick(['recorded', 'recorded', 'recorded', 'pending']),
  lastContact: ago(int(1, 20) * DAY),
}))

export const AGENT_PARTNERS = PARTNERS.slice(8, 26).map((p, i) => ({
  id: `ap-${i + 1}`,
  agentId: 'u-eric',
  partnerId: p.id,
  name: p.name,
  district: p.district,
  checklist: int(1, 5),
  checklistTotal: 5,
  kycStatus: p.kycStatus,
  firstDeal: chance(0.5),
  createdAt: ago(int(2, 90) * DAY),
}))

export const AUDIT_LOGS = Array.from({ length: 640 }, (_, i) => {
  const action = pick(['need.approve', 'need.reject', 'deal.approve', 'deal.feature', 'user.suspend', 'kyc.approve', 'escrow.release', 'escrow.refund', 'payout.batch', 'role.update', 'matching.mode_change', 'message.reject', 'dispute.resolve', 'settings.update', 'promo.create'])
  return {
    id: `al-${i + 1}`,
    actor: pick(ADMINS),
    actorRole: pick(['Super admin', 'Moderator', 'Finance', 'Support lead']),
    action,
    target: action.startsWith('need') ? pick(NEEDS).code : action.startsWith('deal') ? pick(DEALS).slug : action.startsWith('escrow') ? pick(PAYMENTS).ref : `${pick(FIRST)} ${pick(LAST)}`,
    severity: action.includes('escrow') || action.includes('role') || action.includes('suspend') ? 'high' : pick(['low', 'medium']),
    ip: `41.186.${int(0, 255)}.${int(0, 255)}`,
    createdAt: ago(i * 37 * MIN + int(0, 30) * MIN),
  }
})

export const ACTIVITY_LOGS = Array.from({ length: 520 }, (_, i) => {
  const who = pick([...NEEDERS.slice(0, 20).map((u) => [u.name, 'needer']), ...PARTNERS.slice(0, 12).map((p) => [p.name, 'partner'])])
  return {
    id: `ac-${i + 1}`,
    userId: i % 6 === 0 ? 'u-aline' : `u-${i}`,
    who: who[0],
    role: who[1],
    event: pick(['Signed in', 'Posted a Need', 'Served a Need', 'Accepted an offer', 'Paid into escrow', 'Confirmed satisfaction', 'Edited profile', 'Saved a Deal', 'Re-needed a Need', 'Opened chat']),
    device: pick(['Android · Chrome', 'iPhone · Safari', 'Windows · Edge', 'Android app']),
    createdAt: ago(i * 23 * MIN),
  }
})

export const PROMO_CODES = Array.from({ length: 26 }, (_, i) => ({
  id: `pc-${i + 1}`,
  code: pick(['KARIBU', 'UMUGANDA', 'WEEKEND', 'FIRSTNEED', 'KIGALI', 'BUNDLE']) + int(10, 99),
  type: pick(['percent', 'fixed']),
  value: pick([5, 10, 15, 2000, 5000]),
  uses: int(0, 900),
  limit: pick([100, 500, 1000, null]),
  validUntil: ahead(int(-20, 90) * DAY),
  status: pick(['active', 'active', 'paused', 'expired']),
  createdAt: ago(int(1, 200) * DAY),
}))

export const GUILDS = CATEGORIES.slice(0, 12).map((c, i) => ({
  id: `gd-${i + 1}`,
  name: `${c.name.split(' ')[0]} Guild`,
  category: c.slug,
  categoryName: c.name,
  members: int(6, 140),
  status: pick(['active', 'active', 'paused']),
  matchingPriority: pick(['normal', 'high']),
  createdAt: ago(int(30, 400) * DAY),
}))

export const APPEALS = Array.from({ length: 16 }, (_, i) => ({
  id: `ap-${i + 1}`,
  code: `AP-${pad(300 + i, 4)}`,
  disputeCode: DISPUTES[i].code,
  appellant: DISPUTES[i].raisedBy,
  reason: pick(['New evidence available', 'Resolution amount disputed', 'Partner response ignored']),
  status: pick(['open', 'under_review', 'upheld', 'overturned']),
  createdAt: ago(int(1, 40) * DAY),
}))

export const CONTRACT_TEMPLATES = [
  ['Need service agreement', 'need'], ['Bundle master agreement', 'bundle'], ['Deal booking terms', 'deal'],
  ['Recurring service schedule', 'recurring'], ['Partner agreement', 'partner'], ['Agent agreement', 'agent'],
  ['Property rental addendum', 'deal'], ['Vehicle hire terms', 'deal'], ['Event catering terms', 'bundle'], ['Professional services NDA', 'need'],
].map(([name, kind], i) => ({ id: `ct-${i + 1}`, name, kind, version: `v${int(1, 4)}.${int(0, 9)}`, status: pick(['published', 'published', 'draft']), updatedAt: ago(int(1, 120) * DAY), uses: int(0, 900) }))

export const STAFF_ROLES = [
  { id: 'super', name: 'Super admin', users: 2 },
  { id: 'moderator', name: 'Moderator', users: 6 },
  { id: 'finance', name: 'Finance', users: 3 },
  { id: 'support', name: 'Support', users: 9 },
  { id: 'matching', name: 'Matching ops', users: 4 },
]

// Category counts for tiles
CATEGORIES.forEach((c) => {
  c.liveNeeds = NEEDS.filter((n) => n.category === c.slug && PUBLIC_STATUSES.has(n.status)).length + int(12, 140)
  c.liveDeals = DEALS.filter((d) => d.category === c.slug && d.status === 'published').length + int(4, 60)
  c.status = 'active'
  c.specFields = specFieldsFor(c.slug).length
  c.id = `cat-${c.slug}`
})

export const PUBLIC_NEED_STATUSES = [...PUBLIC_STATUSES]

// Relevance score: popularity is only one small input (spec: never rank by popularity alone).
const URGENCY_W = { low: 0, medium: 10, high: 20, urgent: 30 }
const freshness = (iso) => Math.max(0, 40 - (NOW - new Date(iso).getTime()) / DAY)
;[...NEEDS, ...BUNDLES].forEach((n) => {
  n.score = Math.round(URGENCY_W[n.urgency] + freshness(n.createdAt) + (n.offerSlots.limit - n.offerSlots.used) * 8 + Math.min(10, (n.counts?.loves ?? 0) / 8))
})
DEALS.forEach((d) => {
  d.score = Math.round(d.rating * 12 + (d.partner.verified ? 15 : 0) + d.partner.level * 5 + d.discountPct / 2 + freshness(d.createdAt) / 2 + Math.min(8, d.bookedThisWeek / 6))
})

