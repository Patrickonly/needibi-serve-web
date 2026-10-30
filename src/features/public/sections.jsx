import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as Acc from '@radix-ui/react-accordion'
import { BadgeCheck, ShieldCheck, Clock, ChevronDown, Lock, Gavel, Handshake, Wallet, Star, Users, Coins, HeartHandshake, ArrowRight, Play, Smartphone, CirclePlay } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'
import { Button, JourneyStepper, Segmented, Dialog, Avatar, Rating, Badge, SectionHeader } from '@/design-system'

export function TrustRow({ onDark, className }) {
  const { t } = useTranslation()
  const items = [
    [BadgeCheck, t('trust.kyc'), 'bg-trust-100 text-trust-fg'],
    [ShieldCheck, t('trust.escrow'), 'bg-brand-yellow-soft text-brand-yellow-fg'],
    [Clock, t('trust.support'), 'bg-trust-100 text-trust-fg'],
  ]
  return (
    <ul className={cn('flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold', onDark ? 'text-white/90' : 'text-text', className)}>
      {items.map(([Icon, label, tone]) => (
        <li key={label} className="flex items-center gap-2">
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-full', onDark ? 'bg-white/15 text-[var(--brand-yellow)] ring-1 ring-white/25' : tone)}><Icon size={16} aria-hidden="true" /></span> {label}
        </li>
      ))}
    </ul>
  )
}

/** Animated counter that starts when scrolled into view. */
export function Counter({ to, decimals = 0, suffix = '' }) {
  const ref = useRef(null)
  const [v, setV] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      if (reduce) return setV(to)
      const t0 = performance.now()
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / 1200)
        setV(to * (1 - Math.pow(1 - p, 3)))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    io.observe(el)
    return () => io.disconnect()
  }, [to])
  return (
    <span ref={ref} className="tabular">
      {decimals ? v.toFixed(decimals) : formatNumber(Math.round(v))}
      {suffix}
    </span>
  )
}

export function HowItWorksSection({ heading = true }) {
  const [aud, setAud] = useState('needer')
  const [video, setVideo] = useState(false)
  return (
    <section aria-labelledby="hiw" className="rounded-modal border border-border bg-surface p-5 shadow-card sm:p-8">
      {heading && (
        <SectionHeader id="hiw" title="How it works" subtitle="Seven clear steps from request to a closed, audited job.">
          <Segmented
            label="Audience"
            value={aud}
            onChange={setAud}
            options={[
              { value: 'needer', label: 'For Needers' },
              { value: 'partner', label: 'For Partners' },
            ]}
          />
        </SectionHeader>
      )}
      <JourneyStepper audience={aud} className="mt-2" />
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="navy" onClick={() => setVideo(true)}>
          <CirclePlay size={18} /> Watch 60-sec video
        </Button>
        <Button to={aud === 'needer' ? '/how-it-works' : '/become-a-partner'} variant="ghost">
          Learn more <ArrowRight size={16} />
        </Button>
      </div>
      <Dialog open={video} onOpenChange={setVideo} title="Needibi Serve in 60 seconds" size="lg">
        <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-card bg-primary-900 text-white">
          <HillsArt className="absolute inset-x-0 bottom-0 h-1/2 w-full" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-action-500 text-white">
            <Play size={28} className="ml-1" fill="currentColor" />
          </span>
          <span className="absolute bottom-3 left-3 rounded bg-black/50 px-2 py-1 text-xs">Captions: EN · RW · FR · SW</span>
        </div>
        <p className="mt-3 text-sm text-muted">Describe what you need → we check it and find trusted providers → you choose an offer → pay safely → confirm and review.</p>
      </Dialog>
    </section>
  )
}

/** Rolling hills of Rwanda — decorative, brand palette. */
export function HillsArt({ className }) {
  return (
    <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0 220C160 150 300 170 460 210s300 40 460-20 330-80 520-20v130H0z" fill="var(--primary-700)" opacity=".7" />
      <path d="M0 260c200-60 380-50 560-10s360 30 540-10 260-30 340-10v90H0z" fill="var(--primary-500)" opacity=".45" />
      <path d="M0 290c240-30 480-30 720 0s480 20 720-10v40H0z" fill="var(--primary-700)" />
    </svg>
  )
}

export function WhySection() {
  const tiles = [
    [BadgeCheck, 'Checked providers', 'Every provider shows us their ID, a selfie and their business papers before they can work.'],
    [ShieldCheck, 'Safe payment', 'Your money is held safely and released only when you say you are happy.'],
    [Lock, 'Private and watched over', 'We read public messages. Phone numbers, emails and addresses never appear publicly.'],
    [Gavel, 'Disputes handled fairly', 'A named admin reviews evidence from both sides and resolves with refund, release or partial.'],
  ]
  return (
    <section aria-labelledby="why">
      <SectionHeader id="why" title="Why Needibi Serve" subtitle="Trust built into every step." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map(([Icon, title, body], i) => (
          <div key={title} className={cn('pastel-card flex h-full flex-col !p-6', ['pastel-blue', 'pastel-yellow', 'pastel-green', 'pastel-pink'][i % 4])}>
            <span className="pastel-icon"><Icon size={20} strokeWidth={2.2} /></span>
            <h3 className="mt-6 text-lg font-semibold text-text">{title}</h3>
            <p className="mt-2 flex-1 text-[15px] leading-7 text-text/80">{body}</p>
          </div>
        ))}
      </div>
      <ApprovalNote className="mt-4" />
    </section>
  )
}

export function ApprovalNote({ className }) {
  return (
    <p className={cn('rounded-card bg-info-100 px-4 py-3 text-sm text-info-fg', className)}>
      <strong>Approval ≠ guarantee.</strong> Needibi Serve checks Partners and listings, but approval is not a guarantee of quality. Escrow, reviews and disputes protect you.{' '}
      <Link to="/trust-safety" className="font-semibold underline">
        Trust & Safety
      </Link>
    </p>
  )
}

const TESTIMONIALS = [
  { name: 'Aline M.', district: 'Gasabo', service: 'Plumbing repair', rating: 5, hue: 18, text: 'Three offers in under an hour. I picked a verified plumber, paid into escrow and only released it once the leak was fixed.' },
  { name: 'Jean-Paul H.', district: 'Kicukiro', service: 'Wedding catering — Bundle', rating: 5, hue: 200, text: 'We put catering, décor and the photographer in one Bundle. Each item had its own Partner and we tracked everything in one place.' },
  { name: 'Grace U.', district: 'Musanze', service: 'Gorilla trekking trip', rating: 4, hue: 120, text: 'Booked a Deal from a Top Partner. Clear price, the agreement was signed in the app and support answered at midnight.' },
]
export function Testimonials() {
  const { t } = useTranslation()
  return (
    <section aria-labelledby="reviews">
      <SectionHeader id="reviews" title={t('home.reviews')} subtitle="Every review comes from a verified transaction." />
      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((r) => (
          <figure key={r.name} className="flex flex-col rounded-card border border-border bg-surface p-5 shadow-card">
            <Rating value={r.rating} />
            <blockquote className="mt-3 flex-1 text-[15px] text-text">“{r.text}”</blockquote>
            <figcaption className="mt-4 flex items-center gap-3">
              <Avatar name={r.name} hue={r.hue} size={40} />
              <span className="min-w-0 text-sm">
                <span className="block font-semibold text-text">{r.name}</span>
                <span className="block text-muted">
                  {r.service} · {r.district}
                </span>
              </span>
              <Badge tone="trust" iconName="BadgeCheck" size="xs" className="ml-auto">
                Verified transaction
              </Badge>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

export function EarnBanner() {
  return (
    <section aria-label="Earn with Needibi" className="grid gap-4 lg:grid-cols-2">
      <div className="relative overflow-hidden rounded-modal bg-primary-900 p-6 text-white sm:p-8">
        <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full border-[14px] border-action-500/40" aria-hidden="true" />
        <Badge tone="serve" solid>For businesses & pros</Badge>
        <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">Become a Partner</h2>
        <ul className="mt-4 space-y-2 text-white/85">
          <li className="flex items-center gap-2"><Users size={18} className="text-[var(--brand-yellow)]" /> Qualified leads matched to your skills and area</li>
          <li className="flex items-center gap-2"><Wallet size={18} className="text-[var(--brand-yellow)]" /> Guaranteed payouts from escrow</li>
          <li className="flex items-center gap-2"><Star size={18} className="text-[var(--brand-yellow)]" /> Reputation from verified reviews</li>
        </ul>
        <Button to="/become-a-partner" variant="primary" size="lg" className="mt-6">
          Start serving
        </Button>
      </div>
      <div className="relative overflow-hidden rounded-modal border border-border bg-surface p-6 shadow-card sm:p-8">
        <span className="absolute -bottom-12 -right-6 h-44 w-44 rounded-full bg-trust-100" aria-hidden="true" />
        <Badge tone="trust">For community helpers</Badge>
        <h2 className="mt-3 font-display text-2xl font-extrabold text-primary sm:text-3xl">Become an Agent</h2>
        <ul className="relative mt-4 space-y-2 text-text">
          <li className="flex items-center gap-2"><HeartHandshake size={18} className="text-trust-fg" /> Help neighbours post Needs and get served</li>
          <li className="flex items-center gap-2"><Handshake size={18} className="text-trust-fg" /> Onboard local businesses as Partners</li>
          <li className="flex items-center gap-2"><Coins size={18} className="text-trust-fg" /> Earn referral rewards and monthly commissions</li>
        </ul>
        <Button to="/become-an-agent" variant="navy" size="lg" className="relative mt-6">
          Join as an Agent
        </Button>
      </div>
    </section>
  )
}

/** Deterministic QR-style pattern (decorative; real QR comes from the store link). */
export function QrArt({ size = 112 }) {
  const n = 21
  const cells = []
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
      if (finder) {
        const fx = x % 14, fy = y % 14
        const ring = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4)
        if (ring) cells.push([x, y])
      } else if ((x * 7 + y * 13 + x * y) % 5 < 2) cells.push([x, y])
    }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} className="rounded-md bg-white p-1.5" role="img" aria-label="QR code to download the Needibi Serve app">
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="var(--primary-900)" />
      ))}
    </svg>
  )
}

export function AppDownload() {
  return (
    <section id="app" aria-labelledby="app-h" className="overflow-hidden rounded-modal bg-primary-900 text-white">
      <div className="grid items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto_auto]">
        <div>
          <h2 id="app-h" className="font-display text-2xl font-extrabold sm:text-3xl">
            Get the Needibi Serve app
          </h2>
          <p className="mt-2 max-w-md text-white/80">Request a service with a voice note, get offer alerts instantly and pay with MTN MoMo or Airtel Money in a tap.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {['App Store', 'Google Play'].map((s) => (
              <a key={s} href="#app" className="inline-flex h-12 items-center gap-2 rounded-lg border border-white/30 bg-black/40 px-4 font-bold hover:border-white">
                <Smartphone size={18} /> {s}
              </a>
            ))}
          </div>
        </div>
        <div className="hidden flex-col items-center gap-2 sm:flex">
          <QrArt />
          <span className="text-xs text-white/70">Scan to download</span>
        </div>
        <div className="mx-auto hidden h-64 w-36 rounded-[28px] border-[6px] border-primary-500 bg-bg p-2 shadow-modal lg:block" aria-hidden="true">
          <div className="h-full rounded-[18px] bg-surface p-2">
            <div className="h-3 w-12 rounded-full bg-primary-900" />
            <div className="mt-2 h-16 rounded-lg bg-action-100" />
            <div className="mt-2 h-2 w-3/4 rounded bg-grey-100" />
            <div className="mt-1 h-2 w-1/2 rounded bg-grey-100" />
            <div className="mt-2 h-7 rounded-md bg-action-500" />
            <div className="mt-2 h-16 rounded-lg bg-trust-100" />
          </div>
        </div>
      </div>
    </section>
  )
}

export const FAQS = [
  ['Is asking for a service really free?', 'Yes. Asking is always free, on your own or as a group of requests. You only pay when you accept an offer or book something — and we hold that money until the work is done.', 'posting'],
  ['How does holding my money protect me?', 'Needibi Serve keeps your payment. The provider is paid only after you say you are happy. If something goes wrong you can report a problem.', 'payments'],
  ['Who are the providers?', 'They are businesses and professionals who showed us their ID, a selfie and their business papers. Look for the ✓ Checked badge.', 'partners'],
  ['Why can’t I share my phone number in Messages?', 'We read public messages to keep you safe. Contact details appear in private Chat once you have agreed to work together.', 'messages'],
  ['What is the difference between asking again and editing a copy?', 'Asking again posts the same request straight away. Editing a copy opens a new request already filled in from the old one, so you can change it first.', 'posting'],
  ['Can a provider do only part of my group of requests?', 'Yes, if you allow it. Each item can get its own offers, and you can mix offers for the whole group with offers for single items.', 'posting'],
  ['What happens if I turn down every offer?', 'We look for new providers. Turning down an offer frees up that place so someone else can offer.', 'posting'],
  ['How do referral rewards work?', 'Agents earn rewards when someone they referred signs up, gets verified and completes a first transaction. Promo codes are separate admin discounts.', 'account'],
  ['Who can answer a request?', 'Only checked providers. If you try to answer one without a provider account, we ask you to get checked first: ID and selfie, business details, and the provider agreement. Most checks finish within 24 hours.', 'partners'],
  ['What do One-time and Repeating mean?', 'A one-time request happens once. A repeating one comes back on a schedule, such as weekly cleaning. A group of requests can mix both, and each repeat is tracked on its own. Use the Frequency filter to find either.', 'posting'],
  ['How do I rate a provider?', 'Once a job is finished, confirm you are happy and we will ask you to rate it. You can also open the provider’s profile and tap Rate. Only people with a finished job can leave a review.', 'safety'],
  ['What if something goes wrong with a job?', 'Report a problem from your dashboard. Add the item code, what happened and any photos or receipts. We keep hold of your money while someone from Needibi looks at both sides, usually within 48 hours.', 'safety'],
  ['Can I challenge a decision?', 'Yes. Go to Appeals and submit an appeal within 14 days of a dispute, moderation or account decision. A senior admin who was not involved reviews it, and the decision is final.', 'safety'],
  ['How do I get help from a person?', 'Open Support in your dashboard to create a ticket. Each ticket has an ID, a status you can follow, and replies from our team. Urgent safety issues are prioritised.', 'account'],
  ['Where are my saved items and past requests?', 'Saved holds everything you bookmarked. Past requests lists everything you asked for or booked, with buttons to ask again or book again.', 'account'],
  ['Why is my request waiting to be checked?', 'Anything new is checked before it goes public. If something needs changing, such as a phone number in a photo, we send you a message explaining what to fix.', 'posting'],
  ['Which notifications will I get?', 'Only things that need your attention: approvals, new or revised offers, progress on your jobs, reminders and security alerts. You can change preferences in Settings, but security and payment updates always stay on.', 'account'],
  ['Can I follow a provider?', 'Yes. Tap Follow on any card or provider profile. You will hear when they list something new. Following never gives anyone access to your private details.', 'account'],
  ['How do I post a request?', 'Tap Post a Need, pick a category and describe what you need with text, photos, a video or a voice note. Add your budget and area, then send it. It is checked and usually goes live within minutes.', 'posting'],
  ['Can I edit or cancel a request after posting?', 'Yes, until you accept an offer. Open it from My Needs and choose Edit or Cancel. Providers who already offered are told about the change.', 'posting'],
  ['How many offers will I get?', 'Up to 3 checked providers can offer on each request, so you can compare properly without being flooded with calls.', 'posting'],
  ['What is a Bundle?', 'A group of related requests with one goal, such as moving house or setting up an office. Each item keeps its own budget and status, and providers can offer on the whole Bundle or on single items.', 'posting'],
  ['What is a Deal?', 'A ready-made service or product at a fixed price, from Needibi or a checked provider. You book it straight away, with no request and no waiting for offers.', 'posting'],
  ['Which payment methods can I use?', 'MTN MoMo, Airtel Money, bank card and bank transfer. Every payment is held safely by Needibi first and only released when you confirm.', 'payments'],
  ['Do customers pay any fees?', 'Posting and comparing offers is free. Any service fee is shown clearly before you confirm a payment, so the total never surprises you.', 'payments'],
  ['How do refunds work?', 'If a cancellation or dispute is decided in your favour, the held money goes back to the method you paid with, usually within 3 to 5 working days.', 'payments'],
  ['Is my money safe if the provider does not show up?', 'Yes. Your money stays held until you confirm the job is done. If the provider does not deliver, report it and we refund you from the held amount.', 'payments'],
  ['How do I become a partner?', 'Create a partner account, upload your ID, a selfie and your business details, sign the Partner agreement and choose your categories and service areas. Most checks finish within 24 hours.', 'partners'],
  ['What does it cost to be a partner?', 'Joining is free. A small commission is taken only when a job is paid, and optional plans give your offers more reach.', 'partners'],
  ['When do partners get paid?', 'As soon as the customer confirms the job is done, the money is released and sent to your MoMo or bank account on your payout schedule.', 'partners'],
  ['How do I win more jobs as a partner?', 'Reply quickly, give a clear price and timeline, add photos of past work and keep your rating high. Levels and badges help your offers stand out.', 'partners'],
  ['Can partners publish their own Deals?', 'Yes. Create a Deal from your dashboard with a price, what is included and photos. It goes live after a quick check.', 'partners'],
  ['What is the difference between Messages and Chat?', 'Messages are public questions on a request, read by our team before they appear. Chat is private and opens only once an offer is accepted.', 'messages'],
  ['Why was my message not published?', 'Messages that contain phone numbers, emails, links or rude words are held back to keep everyone safe. Edit the message and send it again.', 'messages'],
  ['How do I change the language?', 'Use the language menu in the header or footer. Needibi Serve works in English, Kinyarwanda, French and Swahili.', 'account'],
  ['I forgot my password. What do I do?', 'On the sign-in page tap Forgot password. We send a code to your phone or email so you can set a new one.', 'account'],
  ['How do I delete my account?', 'Open Settings and choose Delete account, or contact support. Any open jobs and held payments must be settled first.', 'account'],
  ['How do I report a user or a listing?', 'Tap Report on any card, profile or message. Our team reviews reports quickly and you can follow the outcome in your notifications.', 'safety'],
  ['Is my personal information shared with providers?', 'No. Your phone number and exact address are only shared with the provider you choose, after you accept their offer.', 'safety'],
]

export function FaqAccordion({ items = FAQS.slice(0, 6) }) {
  return (
    <Acc.Root type="single" collapsible className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {items.map(([q, a]) => (
        <Acc.Item key={q} value={q}>
          <Acc.Header>
            <Acc.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-text hover:bg-surface-2">
              {q}
              <ChevronDown size={18} className="shrink-0 text-muted transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
            </Acc.Trigger>
          </Acc.Header>
          <Acc.Content className="px-5 pb-4 text-[15px] text-muted">{a}</Acc.Content>
        </Acc.Item>
      ))}
    </Acc.Root>
  )
}
