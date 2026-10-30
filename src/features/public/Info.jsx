import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, Search, BadgeCheck, ShieldCheck, Lock, Gavel, Eye, Flag, Users, Wallet, Star, Check, QrCode, HeartHandshake, MapPin, Mail, Phone, Clock, Briefcase, BookOpen, LifeBuoy, FileText, ServerCrash, Construction, Compass, Send, Megaphone, RefreshCw, MessageCircle, MessagesSquare, ArrowUpRight, } from 'lucide-react'
import { cn } from '@/lib/cn'
import { toast } from '@/lib/store'
import { formatMoney } from '@/lib/format'
import { imgSrc } from '@/lib/images'
import { detectContacts, CONTACT_BLOCK_REASON } from '@/lib/contactFilter'
import { CATEGORIES } from '@/mocks/seed'
import { Reveal, Button, Card, Input, Textarea, Select, Field, Badge, EmptyState, Segmented, JourneyStepper, Alert } from '@/design-system'
import { PhoneInput } from '@/components/forms/inputs'
import { EscrowBanner } from '@/components/payments/Payments'
import { PaymentLogos, ContactSection } from '@/components/layout/Footer'
import { useCareers } from '@/lib/careers'
import { HowItWorksSection, FaqAccordion, FAQS, WhySection, ApprovalNote, EarnBanner, Counter, HillsArt, TrustRow } from './sections'


function HeroCard({ label, title, highlight, text, points }) {
  return (
    <div className="animate-fade-up lg:pl-8" style={{ animationDelay: '120ms' }}>
      <div className="public-hero-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--brand-yellow)]/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--brand-yellow)]"><span className="h-px w-6 bg-[var(--brand-yellow)]" aria-hidden="true" />{label}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30"><ShieldCheck size={19} className="text-white" /></span>
          </div>
          {title && <h2 className="mt-6 font-display text-[1.9rem] font-extrabold leading-[1.1] tracking-[-0.03em] text-white sm:text-[2.3rem]">{title}{highlight && <> <span className="text-[var(--brand-yellow)]">{highlight}</span></>}</h2>}
          {text && <p className="mt-4 max-w-md text-base leading-7 text-white/80">{text}</p>}
          <ul className={cn('divide-y divide-white/15 overflow-hidden rounded-2xl border border-white/20 bg-white/10', title ? 'mt-7' : 'mt-6')}>
            {points.map(([PointIcon, name, desc]) => (
              <li key={name} className="group flex items-center gap-4 p-4 transition duration-300 hover:bg-white/10">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-yellow)] text-primary-900 shadow-lg shadow-black/20 transition duration-300 group-hover:scale-105 group-hover:-rotate-3"><PointIcon size={22} strokeWidth={2.2} /></span>
                <span className="min-w-0"><strong className="block text-[17px] font-bold tracking-tight text-white">{name}</strong><span className="mt-0.5 block text-sm leading-5 text-white/75">{desc}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function PageHero({ eyebrow, title, highlight, subtitle, children, tone = 'navy', points, cardLabel = 'Why it matters', cardTitle, cardHighlight, cardText }) {
  if (tone === 'light') {
    return (
      <section className="border-b border-border bg-surface">
        <div className="container-page py-9 sm:py-12">
          {eyebrow && <p className="text-sm font-semibold text-action-fg">{eyebrow}</p>}
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-primary sm:text-5xl">{title}</h1>
          {subtitle && <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{subtitle}</p>}
          {children}
        </div>
      </section>
    )
  }
  return (
    <section className="public-gradient-hero">
      <div className={cn('container-page grid gap-8 py-9 sm:py-12 lg:items-center', points?.length > 0 && 'lg:grid-cols-[1.1fr_.9fr]')}>
        <div className="animate-fade-in">
          {eyebrow && <p className="text-sm font-semibold text-[var(--brand-yellow)]">{eyebrow}</p>}
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">{title}{highlight && <> <span className="text-[var(--brand-yellow)]">{highlight}</span></>}</h1>
          {subtitle && <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">{subtitle}</p>}
          {children}
          {points?.length > 0 && <TrustRow onDark className="mt-6" />}
        </div>
        {points?.length > 0 && <HeroCard label={cardLabel} title={cardTitle} highlight={cardHighlight} text={cardText} points={points} />}
      </div>
    </section>
  )
}

function HeroActions({ primary, secondary }) {
  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {primary && <Button to={primary[1]} variant="primary" size="lg" className="bg-white text-primary-900 hover:bg-action-100">{primary[0]} <ArrowRight size={17} /></Button>}
      {secondary && <Button to={secondary[1]} variant="outline-white" size="lg">{secondary[0]}</Button>}
    </div>
  )
}

function Prose({ children }) {
  return <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-text [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-primary [&_li]:ml-5 [&_li]:list-disc [&_p]:text-text">{children}</div>
}

/* ------------------------------------------------------------------ How it works */
const HIW_STEPS = [
  { title: 'Submit', icon: Send, needer: 'Describe what you need — text, photo, video or a voice note. Posting is free.', partner: 'Review requests that match your categories and service areas.' },
  { title: 'Validate', icon: ShieldCheck, needer: 'A quick policy check keeps the marketplace safe and your details private.', partner: 'Only approved, policy-checked requests reach you.' },
  { title: 'Match', icon: Users, needer: 'We find checked providers near you, best fit first.', partner: 'You are sent requests that fit your work, your area and how you are rated.' },
  { title: 'Respond', icon: MessagesSquare, needer: 'Compare up to 3 offers side by side — accept, decline or ask a question.', partner: 'Offer a clear price, what is included and how long it takes.' },
  { title: 'Do the work', icon: Construction, needer: 'Follow the work step by step, with photos and updates.', partner: 'Do the work and add photos as you go.' },
  { title: 'Pay', icon: Wallet, needer: 'Your money is held safely and released only when you confirm.', partner: 'You are paid as soon as the customer confirms.' },
  { title: 'Close', icon: FileText, needer: 'Rate the provider and keep a full record of the job.', partner: 'Build your reputation with real reviews.' },
]

const HIW_PATHS = [
  ['plumbing', 'Need', 'A single request', 'Text, photo, video or a voice note. One-time or recurring.', '/needs', 'bg-action-600'],
  ['office-setup', 'Bundle', 'Several Needs, one goal', 'Each item has its own budget and status — served whole or item by item.', '/bundles', 'bg-primary'],
  ['hero-market', 'Deal', 'A ready-made offer', 'From Needibi or a checked provider. Book it like a product.', '/deals', 'bg-trust-600'],
]

const HIW_WORDS = [
  ['Serve', 'A checked provider sends an offer or starts the work.', Briefcase],
  ['Repost', 'Post the same request again, after a quick confirmation.', RefreshCw],
  ['Re-request', 'Start a new request already filled in from an old one.', ArrowUpRight],
  ['Message', 'A public comment, which we read before anyone else can see it.', MessageCircle],
  ['Chat', 'A private conversation, only inside an agreed transaction.', MessagesSquare],
]

export function HowItWorks() {
  const [audience, setAudience] = useState('needer')
  const [active, setActive] = useState(0)
  const step = HIW_STEPS[active]
  const StepIcon = step.icon
  return (
    <>
      {/* ---------------------------------------------------------- hero */}
      <PageHero
        eyebrow="How it works"
        title={<>From “I need…” <br className="hidden sm:block" />to</>}
        highlight="done."
        subtitle="Describe what you need, compare offers and choose with confidence — your money is held safely until you are happy."
        cardLabel="A live Need"
        cardTitle="Plumber to fix"
        cardHighlight="kitchen leak."
        cardText="Kimihurura, Gasabo · RWF 25,000. 7 clear steps, up to 3 offers to compare, and 100% of your money held safely."
        points={[
          [ShieldCheck, 'Submitted & matched', 'Policy check passed · 3 verified Partners nearby'],
          [MessagesSquare, 'Offers received', '2 of 3 slots filled · CleanPro Rwanda offered RWF 24,000'],
          [Wallet, 'Choose & pay into escrow', 'Waiting for you — released only when you confirm'],
        ]}
      >
        <HeroActions primary={['Request a service — it’s free', '/app/needer/post']} secondary={['I want to serve', '/become-a-partner']} />
      </PageHero>

      <main className="space-y-16 py-12 sm:space-y-20 sm:py-16">
        {/* ---------------------------------------------------------- journey */}
        <Reveal as="section" className="container-page" aria-labelledby="journey-title">
          <div className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-action-fg">Your journey</p>
              <h2 id="journey-title" className="mt-2 font-display text-3xl font-extrabold tracking-tight text-text sm:text-4xl">Seven clear steps to done.</h2>
              <p className="mt-3 text-muted">From the first request to a closed, audited job — pick your side to see what happens.</p>
            </div>
            <Segmented label="View workflow" value={audience} onChange={(v) => { setAudience(v); setActive(0) }} options={[{ value: 'needer', label: 'I need something' }, { value: 'partner', label: 'I provide it' }]} />
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,.82fr)_minmax(0,1.18fr)] lg:items-start">
            <ol className="relative space-y-1.5" aria-label="Steps">
              <span className="absolute bottom-6 left-[27px] top-6 w-px bg-border" aria-hidden="true" />
              {HIW_STEPS.map((s, n) => {
                const Icon = s.icon
                const on = n === active
                const done = n < active
                return (
                  <li key={s.title}>
                    <button type="button" onClick={() => setActive(n)} aria-current={on ? 'step' : undefined} className={cn('relative flex w-full items-center gap-4 rounded-[20px] px-2 py-2.5 text-left transition-colors', PASTEL_TONES[n % 4], on ? 'bg-[var(--pastel-bg)]' : 'hover:bg-[var(--pastel-bg)]/60')}>
                      <span className={cn('relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors', on ? 'bg-[var(--pastel-dot)] text-white shadow-[0_0_0_5px_var(--pastel-halo)]' : done ? 'bg-[var(--pastel-dot)]/85 text-white ring-4 ring-bg' : 'bg-[var(--pastel-bg)] text-text/70 ring-4 ring-bg')}>
                        {done ? <Check size={17} strokeWidth={2.5} /> : <Icon size={17} />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-text/55">Step {String(n + 1).padStart(2, '0')}</span>
                        <span className={cn('block font-semibold', on ? 'text-text' : 'text-muted')}>{s.title}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>

            <div key={`${audience}-${active}`} className={cn('pastel-card animate-fade-up !p-6 sm:!p-8 lg:sticky lg:top-36', PASTEL_TONES[active % 4])}>
              <div className="flex items-start justify-between gap-4">
                <span className="pastel-icon !h-14 !w-14"><StepIcon size={25} strokeWidth={2.1} /></span>
                <span className="tabular text-5xl font-semibold tracking-tight text-text/15">{String(active + 1).padStart(2, '0')}</span>
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-text/60">Step {String(active + 1).padStart(2, '0')} of {HIW_STEPS.length} · {audience === 'needer' ? 'Customers' : 'Partners'}</p>
              <h3 className="mt-2 font-display text-3xl font-semibold tracking-tight text-text">{step.title}</h3>
              <p className="mt-3 text-lg leading-8 text-text/80">{step[audience]}</p>
              <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-text/10">
                <span className="block h-full rounded-full bg-[var(--pastel-dot)] transition-[width] duration-500" style={{ width: `${((active + 1) / HIW_STEPS.length) * 100}%` }} />
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" disabled={active === 0} onClick={() => setActive((a) => a - 1)}><ArrowLeft size={16} /> Previous</Button>
                {active < HIW_STEPS.length - 1 ? (
                  <Button variant="primary" onClick={() => setActive((a) => a + 1)}>Next step <ArrowRight size={16} /></Button>
                ) : (
                  <Button variant={audience === 'needer' ? 'gold' : 'primary'} to={audience === 'needer' ? '/app/needer/post' : '/become-a-partner'}>{audience === 'needer' ? 'Request a service' : 'Become a Partner'} <ArrowRight size={16} /></Button>
                )}
              </div>
            </div>
          </div>
        </Reveal>

        {/* ---------------------------------------------------------- three paths */}
        <Reveal as="section" className="container-page" aria-labelledby="types-title">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-action-fg">Choose your path</p>
            <h2 id="types-title" className="mt-2 font-display text-3xl font-extrabold tracking-tight text-text sm:text-4xl">Three ways to get served.</h2>
          </div>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {HIW_PATHS.map(([image, label, title, text, to, dot], n) => (
              <Reveal key={label} delay={n * 90}>
                <Link to={to} className={cn('pastel-card group flex h-full flex-col overflow-hidden !p-0', ['pastel-blue', 'pastel-yellow', 'pastel-green'][n % 3])}>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={imgSrc(image, 800)} alt="" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary shadow-card">
                      <span className={cn('h-2 w-2 rounded-full', dot)} /> {label}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="font-display text-xl font-semibold tracking-tight text-text">{title}</h3>
                    <p className="mt-2 flex-1 text-[15px] leading-7 text-text/80">{text}</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-text">Explore {label}s <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ---------------------------------------------------------- protection */}
        <Reveal as="section" className="border-y border-border bg-surface py-12 sm:py-16" aria-labelledby="trust-title">
          <div className="container-page grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-action-fg">Built-in protection</p>
              <h2 id="trust-title" className="mt-2 font-display text-3xl font-extrabold tracking-tight text-text sm:text-4xl">Fair from start to finish.</h2>
              <p className="mt-4 max-w-md leading-7 text-muted">Your payment is held safely by Needibi Serve and released only after you confirm you’re satisfied.</p>
              <Button to="/trust-safety" variant="outline" className="mt-6">See Trust & Safety <ArrowUpRight size={16} /></Button>
              <p className="mt-5 max-w-md text-xs leading-5 text-muted"><strong className="text-text">Approval ≠ guarantee.</strong> Needibi checks Partners and listings, but approval is not a guarantee of quality. Escrow, reviews and disputes protect you.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[[BadgeCheck, 'Verified Partners', 'KYC, ID, selfie and business checks before anyone can serve.'], [Wallet, 'Escrow-protected payment', 'Funds release only after your confirmation.'], [Lock, 'Moderated & private', 'Public Messages are moderated; contact details stay private.'], [Gavel, 'Disputes handled fairly', 'A named admin reviews evidence and can refund, release or split.']].map(([Icon, title, text], n) => (
                <Reveal key={title} delay={n * 80} className={cn('pastel-card h-full', ['pastel-blue', 'pastel-yellow', 'pastel-green', 'pastel-pink'][n])}>
                  <span className="pastel-icon"><Icon size={20} strokeWidth={2.2} /></span>
                  <p className="mt-5 text-lg font-semibold text-text">{title}</p>
                  <p className="mt-1 text-[15px] leading-7 text-text/80">{text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>

        {/* ---------------------------------------------------------- glossary + FAQ */}
        <section className="container-page grid gap-12 lg:grid-cols-2" aria-labelledby="words-title">
          <Reveal>
            <p className="text-sm font-semibold text-action-fg">The Needibi language</p>
            <h2 id="words-title" className="mt-2 font-display text-3xl font-extrabold tracking-tight text-text">Words we use.</h2>
            <dl className="mt-8 grid gap-3">
              {HIW_WORDS.map(([title, text, Icon], n) => (
                <div key={title} className={cn('pastel-card flex items-center gap-4 !rounded-[20px] !px-5 !py-4', ['pastel-blue', 'pastel-yellow', 'pastel-green', 'pastel-pink'][n % 4])}>
                  <span className="pastel-icon !h-10 !w-10 shrink-0 !shadow-[0_0_0_5px_var(--pastel-halo)]"><Icon size={17} strokeWidth={2.2} /></span>
                  <div>
                    <dt className="font-semibold text-text">{title}</dt>
                    <dd className="mt-0.5 text-sm leading-6 text-text/80">{text}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-sm font-semibold text-action-fg">Questions</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-text">Good to know.</h2>
            <div className="mt-8">
              <FaqAccordion items={FAQS.slice(0, 6)} />
            </div>
          </Reveal>
        </section>

        {/* ---------------------------------------------------------- CTA */}
        <Reveal as="section" className="container-page" aria-label="Get started">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-action-600 p-7 text-white shadow-modal sm:p-10 lg:flex-row lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to get your need served?</h2>
              <p className="mt-2 text-lg text-white/80">Post for free, compare verified offers and stay in control.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button to="/app/needer/post" size="lg" className="bg-white text-action-600 shadow-none hover:bg-white/90">Request a service <ArrowRight size={18} /></Button>
              <Button to="/deals" variant="outline-white" size="lg">Browse Deals</Button>
            </div>
          </div>
        </Reveal>
      </main>
    </>
  )
}

function _LegacyHowItWorks() {
  return (
    <>
      <PageHero eyebrow="How it works" title="From “I need…” to “Done, and paid fairly.”" subtitle="Needibi Serve is request-driven: you describe what you need, we find verified options, you choose — and escrow protects your money until you're satisfied.">
        <div className="mt-6 flex flex-wrap gap-3">
          <Button to="/app/needer/post" variant="gold" size="lg">Request a service — it's free</Button>
          <Button to="/become-a-partner" variant="outline-white" size="lg">I want to serve</Button>
        </div>
      </PageHero>
      <div className="container-page space-y-14 py-12">
        <HowItWorksSection />
        <section className="grid gap-4 md:grid-cols-3">
          {[
            ['Need', 'A single request — text, photo, video or a voice note. One-time or recurring.', 'need'],
            ['Bundle', 'Several Needs grouped for one goal. Each item has its own budget and status, served whole or item by item.', 'bundle'],
            ['Deal', 'A ready-made offer from Needibi or an approved Partner — book it like a product.', 'deal'],
          ].map(([t, d, k], i) => (
            <div key={t} className={cn('pastel-card flex h-full flex-col', PASTEL_TONES[i % 4])}>
              <Badge tone={k === 'deal' ? 'trust' : k === 'bundle' ? 'serve' : 'navy'} className="w-fit">{t.toUpperCase()}</Badge>
              <h2 className="mt-5 text-lg font-semibold text-text">{t}</h2>
              <p className="mt-2 flex-1 text-[15px] leading-7 text-text/80">{d}</p>
            </div>
          ))}
        </section>
        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold text-primary">Words we use</h2>
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ['Serve', 'A Partner submits an offer or starts the serving workflow.'],
              ['Repost', 'Put the same Need or Bundle back up as it is, after a confirmation step.'],
              ['Re-request', 'Open a new, editable request pre-filled from an existing one.'],
              ['Message', 'A public comment that is moderated before anyone else can see it.'],
              ['Chat', 'Private conversation inside an authorised transaction only.'],
            ].map(([k, v]) => (
              <div key={k} className="rounded-card border border-border bg-surface p-4">
                <dt className="font-bold text-text">{k}</dt>
                <dd className="mt-1 text-sm text-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
        <EscrowBanner />
        <WhySection />
      </div>
    </>
  )
}

const PASTEL_TONES = ['pastel-blue', 'pastel-yellow', 'pastel-green', 'pastel-pink']

/* ------------------------------------------------------------------ Become a Partner / Agent */
export function BecomePartner() {
  const [jobs, setJobs] = useState(12)
  const [avg, setAvg] = useState(60000)
  const earn = Math.round(jobs * avg * 0.85)
  return (
    <>
      <section className="public-gradient-hero">
        <div className="container-page relative grid gap-8 py-9 sm:py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="animate-fade-in">
            <p className="text-sm font-semibold text-[var(--brand-yellow)]">For businesses & professionals</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
              Get qualified Needs.<br /><span className="text-[var(--brand-yellow)]">Get paid from escrow.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">Serve real requests from people in your area, publish Deals, and grow a reputation built on verified reviews.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/auth/register?role=partner" variant="primary" size="lg" className="bg-brand-yellow text-[#0b1f3a] hover:bg-brand-yellow/90">Become a Partner <ArrowRight size={17} /></Button>
              <Button to="/manual" variant="outline-white" size="lg">Read the Partner guide</Button>
            </div>
            <TrustRow onDark className="mt-6" />
          </div>
          <HeroCard label="Why partners choose Needibi" title="More of the right work," highlight="with less risk." text="Needibi brings qualified requests, protected payments and a trusted profile together in one place." points={[[Users, 'Qualified requests', 'Matched to your categories and areas.'], [Wallet, 'Escrow-protected pay', 'Money is secured before work starts.'], [Star, 'Verified reputation', 'Reviews, levels and badges build trust.']]} />
        </div>
      </section>
      <div className="container-page space-y-10 py-9 sm:py-12">
        <section>
          <div className="mb-5 max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-primary">Everything you need to serve professionally</h2>
            <p className="mt-2 text-muted">Find work, deliver confidently and get paid safely.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              [Users, 'Qualified leads', 'Matched by category, area, availability and reliability.', 'pastel-blue'],
              [Wallet, 'Escrow payouts', 'Money is secured before you start. Paid out to MoMo or bank.', 'pastel-yellow'],
              [Star, 'Reputation', 'Verified reviews, levels and badges help you win more jobs.', 'pastel-green'],
              [Megaphone, 'Publish Deals', 'Sell ready-made offers, packages and bookings after approval.', 'pastel-pink'],
            ].map(([Icon, t, d, tone], i) => (
              <div key={t} className={cn('pastel-card animate-fade-up group flex h-full flex-col', tone)} style={{ animationDelay: `${i * 70}ms` }}>
                <span className="pastel-icon"><Icon size={20} strokeWidth={2.2} /></span>
                <h3 className="mt-6 text-lg font-semibold text-text">{t}</h3>
                <p className="mt-2 flex-1 text-[15px] leading-7 text-text/80">{d}</p>
                <Link to="/auth/register?role=partner" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-text transition-[gap] hover:gap-2.5">Get started <ArrowRight size={16} /></Link>
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="pastel-card pastel-blue">
            <span className="pastel-icon"><Wallet size={20} strokeWidth={2.2} /></span>
            <h2 className="mt-6 text-2xl font-semibold text-text">Earnings estimator</h2>
            <p className="mt-1 text-[15px] text-text/80">See what your monthly earnings could look like.</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-text/70">Example: RWF 450,000 job → you receive 85% (RWF 382,500). Rates vary by level and boosts.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label={`Jobs per month: ${jobs}`}>{(p) => <input {...p} type="range" min="1" max="60" value={jobs} onChange={(e) => setJobs(Number(e.target.value))} className="w-full accent-[var(--action-500)]" />}</Field>
              <Field label={`Average job: ${formatMoney(avg)}`}>{(p) => <input {...p} type="range" min="5000" max="500000" step="5000" value={avg} onChange={(e) => setAvg(Number(e.target.value))} className="w-full accent-[var(--action-500)]" />}</Field>
            </div>
            <div className="mt-5 rounded-2xl bg-white/65 p-5 dark:bg-white/5">
              <p className="text-sm font-semibold text-text/70">Estimated monthly earnings</p>
              <p className="tabular mt-1 text-3xl font-semibold tracking-tight text-text">{formatMoney(earn)}</p>
            </div>
          </div>
          <div id="deals" className="pastel-card pastel-green">
            <span className="pastel-icon"><BadgeCheck size={20} strokeWidth={2.2} /></span>
            <h2 className="mt-6 text-2xl font-semibold text-text">How to get started</h2>
            <p className="mt-1 text-[15px] text-text/80">Five simple steps to start serving.</p>
            <ol className="mt-4 space-y-2.5">
              {['Create your business profile and pick categories & areas', 'Verify: national ID, selfie and RDB/business documents', 'Sign the Partner agreement (type your full name)', 'Choose a plan — Starter is free', 'Serve your first Need or submit a Deal for approval'].map((s, i) => (
                <li key={s} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--pastel-dot)] text-xs font-semibold tracking-wide text-white shadow-[0_0_0_4px_var(--pastel-halo)]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pt-1 text-[15px] leading-6 text-text">{s}</span>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-white/65 p-4 text-sm text-text/80 dark:bg-white/5">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-text" />
              <span>Signing in with Google or Apple never skips Partner verification.</span>
            </div>
          </div>
        </section>
        <section className="rounded-3xl border border-border/80 bg-surface p-5 shadow-card sm:p-6">
          <div className="max-w-2xl"><h2 className="text-2xl font-extrabold text-text">How requests become paid jobs</h2><p className="mt-2 text-sm leading-6 text-muted">From the first request to payment and a verified review.</p></div>
          <JourneyStepper audience="partner" variant="pastel" className="mt-5" />
        </section>
      </div>
    </>
  )
}

export function BecomeAgent() {
  return (
    <>
      <section className="public-gradient-hero">
        <div className="container-page grid gap-8 py-9 sm:py-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="animate-fade-in">
            <p className="text-sm font-semibold text-[var(--brand-yellow)]">For community helpers</p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl">
              Help your community.<br /><span className="text-[var(--brand-yellow)]">Earn while you serve.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/80">Help neighbours post Needs, onboard local businesses and earn referral rewards through trusted community support.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button to="/auth/register?role=agent" variant="primary" size="lg" className="bg-white text-primary-900 hover:bg-action-100">Apply as an Agent <ArrowRight size={17} /></Button>
              <Button to="/manual" variant="outline-white" size="lg">Read the Agent guide</Button>
            </div>
            <TrustRow onDark className="mt-6" />
          </div>
          <HeroCard label="Why agents choose Needibi" title="Turn local trust into" highlight="real opportunity." text="You make the first step easier for people and businesses that need a helping hand." points={[[HeartHandshake, 'Support Needers', 'Post requests with consent, including voice-first help.'], [Briefcase, 'Help Partners', 'Onboard local businesses and guide their first Deal.'], [QrCode, 'Earn referrals', 'Receive rewards as referrals verify and complete work.']]} />
        </div>
      </section>
      <div className="container-page space-y-10 py-9 sm:py-12">
        <section>
          <div className="mb-5 max-w-2xl">
            <h2 className="font-display text-3xl font-extrabold tracking-tight text-primary">A simple role with a real impact</h2>
            <p className="mt-2 text-muted">Support people, help businesses get started and build a reliable community network.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
          {[
            [HeartHandshake, 'Needer Assistance', 'Post on behalf of people who need help — with their recorded consent.', 'pastel-blue'],
            [Briefcase, 'Partner Assistance', 'Register businesses, upload KYC together and help them publish their first Deal.', 'pastel-yellow'],
            [QrCode, 'Referral rewards', 'Share your code or QR. Earn when referrals sign up → get verified → complete a first transaction.', 'pastel-green'],
          ].map(([Icon, t, d, tone], i) => (
            <div key={t} className={cn('pastel-card animate-fade-up flex h-full flex-col', tone)} style={{ animationDelay: `${i * 70}ms` }}>
              <span className="pastel-icon"><Icon size={20} strokeWidth={2.2} /></span>
              <h3 className="mt-6 text-lg font-semibold text-text">{t}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-7 text-text/80">{d}</p>
              <Link to="/auth/register?role=agent" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-text transition-[gap] hover:gap-2.5">Get started <ArrowRight size={16} /></Link>
            </div>
          ))}
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="pastel-card pastel-pink">
            <span className="pastel-icon"><Wallet size={20} strokeWidth={2.2} /></span>
            <h2 className="mt-6 text-2xl font-semibold text-text">Reward example</h2>
            <p className="mt-2 text-[15px] leading-7 text-text/80">Earn as your referrals move from registration to trusted, completed work.</p>
            <ul className="mt-5 divide-y divide-text/10 text-sm">
              {[
                ['Referral verified', 1500],
                ['First completed transaction', 5000],
                ['Partner onboarded & first Deal approved', 10000],
              ].map(([label, amount]) => (
                <li key={label} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="text-text">{label}</span><span className="tabular font-semibold text-text">{formatMoney(amount)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="pastel-card pastel-blue">
            <span className="pastel-icon"><ShieldCheck size={20} strokeWidth={2.2} /></span>
            <h2 className="mt-6 text-2xl font-semibold text-text">A safe way to help</h2>
            <p className="mt-2 text-[15px] leading-7 text-text/80">Agents see only assigned cases. Consent, privacy and fraud safeguards apply to every referral.</p>
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-white/60 p-4 text-sm text-text/80 dark:bg-white/5">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-text" />
              <span>Needibi keeps the process clear so you can focus on people, not paperwork.</span>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Pricing */
export function Pricing() {
  const [cycle, setCycle] = useState('monthly')
  const plans = [
    ['Starter', 0, '18%', ['Serve up to 20 Needs / month', '1 active Deal', 'Standard matching', 'Escrow payouts']],
    ['Growth', 15000, '15%', ['Unlimited serving', '10 active Deals', 'Priority in matching ties', 'Deal stats', 'Guild membership']],
    ['Pro', 45000, '12%', ['Everything in Growth', 'Unlimited Deals', 'Featured placement eligibility', 'Team seats (5)', 'Dedicated support']],
  ]
  return (
    <>
      <PageHero tone="light" eyebrow="Pricing" title="Posting is free. Always." subtitle="Needers never pay to post. Partners pay a commission only when a job is paid — plus an optional plan for more reach." />
      <div className="container-page space-y-10 py-10">
        <div className="flex justify-center">
          <Segmented label="Billing cycle" value={cycle} onChange={setCycle} options={[{ value: 'monthly', label: 'Monthly' }, { value: 'yearly', label: 'Yearly · save 15%' }]} />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {plans.map(([name, price, fee, feats], i) => (
            <Card key={name} className={cn(i === 1 && 'border-action-500 ring-2 ring-action-500/30')}>
              {i === 1 && <Badge tone="serve" solid>Most popular</Badge>}
              <h2 className="mt-2 text-xl font-bold text-text">{name}</h2>
              <p className="tabular mt-2 text-3xl font-extrabold text-text">{price ? formatMoney(cycle === 'yearly' ? Math.round(price * 12 * 0.85) : price) : 'Free'}<span className="text-sm font-medium text-muted">{price ? (cycle === 'yearly' ? ' / year' : ' / month') : ''}</span></p>
              <p className="mt-1 text-sm text-muted">Platform fee {fee} per paid job</p>
              <ul className="mt-4 space-y-2 text-sm">{feats.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="text-trust-fg" /> {f}</li>)}</ul>
              <Button to="/auth/register?role=partner" variant={i === 1 ? 'primary' : 'outline'} block className="mt-6">Choose {name}</Button>
            </Card>
          ))}
        </div>
        <Card>
          <h2 className="font-bold text-text">Fee example</h2>
          <p className="mt-1 text-sm text-muted">RWF 450,000 job → Partner 85% (RWF 382,500) · Platform 15% (RWF 67,500). Optional Priority boost on a Need is shown before you publish. Promo codes apply at checkout.</p>
        </Card>
        <div className="flex justify-center"><PaymentLogos /></div>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Trust & Safety */
export function TrustSafety() {
  return (
    <>
      <PageHero eyebrow="Trust & Safety" title="Safety is" highlight="the product." subtitle="Verification, escrow, moderation, privacy and fair disputes — every action leaves an auditable trail." cardLabel="How we protect you" points={[[BadgeCheck, 'Checked providers', 'ID, selfie and business papers before anyone serves.'], [Wallet, 'Money held safely', 'Released only when you confirm the job is done.'], [Gavel, 'Fair disputes', 'A named admin reviews evidence from both sides.']]}><HeroActions primary={['Request a service', '/app/needer/post']} secondary={['Visit Help Centre', '/help']} /></PageHero>
      <div className="container-page space-y-12 py-12">
        <ApprovalNote />
        <section className="grid gap-4 md:grid-cols-3">
          {[
            [BadgeCheck, 'KYC verification', 'Partners verify national ID, a live selfie and business documents before serving.'],
            [ShieldCheck, 'Escrow payments', 'Money is held by Needibi Serve and released only when the Needer confirms satisfaction.'],
            [Lock, 'Privacy by default', 'No phone, email or exact address on public pages. Contacts unlock at the agreed stage.'],
            [Eye, 'Moderated Messages', 'Public Messages are reviewed. Disguised contact details are detected and blocked.'],
            [Gavel, 'Fair disputes', 'A named admin reviews both sides. Resolution: refund, release or partial — with appeal.'],
            [Flag, 'Report anything', 'Use ⋯ → Report on any card. Our team reviews every report.'],
          ].map(([Icon, t, d], i) => (
            <div key={t} className={cn('pastel-card animate-fade-up flex h-full flex-col', PASTEL_TONES[i % 4])} style={{ animationDelay: `${i * 70}ms` }}>
              <span className="pastel-icon"><Icon size={20} strokeWidth={2.2} /></span>
              <h2 className="mt-6 text-lg font-semibold text-text">{t}</h2>
              <p className="mt-2 flex-1 text-[15px] leading-7 text-text/80">{d}</p>
            </div>
          ))}
        </section>
        <EscrowBanner />
        <Card>
          <h2 className="text-lg font-bold text-text">Safety tips</h2>
          <ul className="mt-3 space-y-2 text-sm text-text">
            <li className="flex gap-2"><Check size={16} className="text-trust-fg" /> Always pay through Needibi Serve — never send money outside the app.</li>
            <li className="flex gap-2"><Check size={16} className="text-trust-fg" /> Confirm satisfaction only when the work is done.</li>
            <li className="flex gap-2"><Check size={16} className="text-trust-fg" /> Keep conversations inside Chat so we can help in a dispute.</li>
          </ul>
        </Card>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Company */
export function About() {
  return (
    <>
      <PageHero eyebrow="About us" title="Built in Kigali to get" highlight="Rwanda's needs served." subtitle="NEEDIBI ONLINE SERVICES LTD runs a trusted, request-driven marketplace connecting people with verified Partners — with escrow and accountability at the core." cardLabel="What we stand for" points={[[HeartHandshake, 'People first', 'Simple, fair and respectful for customers and providers.'], [ShieldCheck, 'Trust by design', 'Checks, escrow and moderation on every job.'], [MapPin, 'Local at heart', 'Made in Kigali, for every district of Rwanda.']]}><HeroActions primary={['Become a Partner', '/become-a-partner']} secondary={['Contact us', '/contact']} /></PageHero>
      <div className="container-page grid gap-6 py-12 md:grid-cols-4">
        {[[12480, 'Needs served'], [1350, 'Verified Partners'], [30, 'Districts'], [212, 'Community Agents']].map(([n, l]) => (
          <Card key={l} className="text-center">
            <p className="font-display text-3xl font-extrabold text-primary"><Counter to={n} /></p>
            <p className="text-sm text-muted">{l}</p>
          </Card>
        ))}
      </div>
      <section className="container-page pb-12" aria-labelledby="pillars">
        <h2 id="pillars" className="mb-6 font-display text-3xl font-extrabold tracking-tight text-primary">Five pillars behind every decision</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            [Send, 'Smart requests', 'Describe exactly what you need — text, photo, video or voice.'],
            [Users, 'Reliable matching', 'Relevant requests reach suitable Partners, and every Needer gets responses.'],
            [ShieldCheck, 'Trust & transparency', 'Clear verification, pricing, agreements and dispute handling.'],
            [Compass, 'Fulfilment tracking', 'Every step from request to delivery is visible and accountable.'],
            [BookOpen, 'Operational analytics', 'Our team spots unanswered requests, unreliable Partners and bottlenecks early.'],
          ].map(([Icon, t, d], i) => (
            <div key={t} className={cn('pastel-card animate-fade-up flex h-full flex-col !p-5', PASTEL_TONES[i % 4])} style={{ animationDelay: `${i * 70}ms` }}>
              <span className="pastel-icon"><Icon size={20} strokeWidth={2.2} /></span>
              <h3 className="mt-6 text-lg font-semibold text-text">{t}</h3>
              <p className="mt-2 flex-1 text-[15px] leading-7 text-text/80">{d}</p>
            </div>
          ))}
        </div>
      </section>
      <div className="container-page pb-12">
        <Prose>
          <h2>Our promise</h2>
          <p>You describe what you need. We help find appropriate, verified options. You choose how to proceed — and your payment stays in escrow until you're satisfied.</p>
          <h2>What we value</h2>
          <ul>
            <li>Reliable fulfilment over hype</li>
            <li>Transparent offers and fees</li>
            <li>Moderation, privacy and accountability</li>
          </ul>
        </Prose>
      </div>
      <div className="container-page pb-12">
        <div className="overflow-hidden rounded-3xl bg-primary-900 pb-10 text-white"><ContactSection className="px-4 pt-10 sm:px-8" /></div>
      </div>
      <div className="container-page pb-6"><EarnBanner /></div>
    </>
  )
}

export { Contact } from './Contact'

export function Careers() {
  const roles = useCareers((s) => s.jobs).filter((j) => j.open)
  return (
    <>
      <PageHero eyebrow="Careers" title="Help us serve" highlight="millions of needs." subtitle="Join a small team building trusted commerce for Rwanda." cardLabel="Why work with us" points={[[Users, 'Small, close team', 'Your work reaches real people from day one.'], [Star, 'Grow fast', 'Own real problems and learn across the product.'], [MapPin, 'Kigali based', 'Hybrid roles with a home office in the city.']]}><HeroActions primary={['Contact our team', '/contact']} secondary={['About Needibi', '/about']} /></PageHero>
      <div className="container-page py-10">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-primary">Open roles <span className="ml-2 rounded-full bg-[var(--brand-yellow)] px-2.5 py-0.5 align-middle text-sm font-bold text-primary-900">{roles.length}</span></h2>
        {roles.length === 0 && <div className="mt-6"><EmptyState title="No open roles right now" description="Send your CV to info@needibi.com and we will keep it on file." /></div>}
        <ul className="mt-6 grid gap-4">
          {roles.map((j, ri) => (
            <li key={j.id} className={cn('pastel-card flex flex-wrap items-center gap-4', PASTEL_TONES[ri % 4])}>
              <span className="pastel-icon !mb-0"><Briefcase size={20} strokeWidth={2.2} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-semibold text-text">{j.title}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span className="rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-bold text-text">{j.team}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={14} /> {j.location}</span>
                  <span>· {j.type}</span>
                </div>
                {j.description && <p className="mt-2 text-[15px] leading-6 text-muted">{j.description}</p>}
              </div>
              <Button variant="primary" onClick={() => toast(`Thanks! Send your CV for “${j.title}” to info@needibi.com`)}>Apply <ArrowRight size={16} /></Button>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Help centre */
export const HELP_ARTICLES = [
  ['post-a-need', 'How to request a service', 'Customers', 'Tap “Request a service”, describe it with text, photos, a video or a voice note, choose your area and budget, then publish. Most requests go live in minutes after a quick check.'],
  ['bundles', 'Building a Bundle', 'Needers', 'Group several Needs into one goal. Each item has its own budget, urgency and recurrence. Allow partial serving if different Partners can handle different items.'],
  ['escrow', 'How escrow works', 'Payments', 'You pay into escrow with MTN MoMo, Airtel Money, card or a deposit proof. Needibi Serve holds the money and releases it after you confirm satisfaction.'],
  ['offers', 'Comparing and accepting offers', 'Needers', 'Each Need has up to 3 offer slots. Compare price, inclusions, timeline and validity. Accepting closes only incompatible offers in the same scope.'],
  ['serve', 'Serving a Need (Partners)', 'Partners', 'Open a matched request and tap Serve. Add price, inclusions, timeline, attachments and validity. Chat unlocks once the Needer confirms.'],
  ['verification', 'Partner verification (KYC)', 'Partners', 'Upload your national ID, a selfie and business documents. Most verifications complete within 24 hours.'],
  ['payouts', 'Payouts and fees', 'Partners', 'Payouts go to MoMo or bank on your schedule. Platform fees depend on your level and plan.'],
  ['disputes', 'Raising a dispute', 'Safety', 'From the Need or Booking, tap “Report a problem”. Add evidence and your desired resolution. A named admin will review it.'],
  ['messages-vs-chat', 'Messages vs Chat', 'Safety', 'Messages are public comments moderated before they appear. Chat is private and only opens inside an authorised transaction.'],
]
export function HelpCentre() {
  const [q, setQ] = useState('')
  const list = HELP_ARTICLES.filter((a) => (a[1] + a[3]).toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHero eyebrow="Help Centre" title="How can" highlight="we help?" subtitle="Search our guides, or browse the most common questions below." cardLabel="Other ways to get help" points={[[LifeBuoy, 'Support tickets', 'Linked to your Need, booking or payment.'], [BookOpen, 'User manual', 'Step-by-step guides for every role.'], [MessagesSquare, 'Fast replies', 'Our team usually answers within a few hours.']]}>
        <div className="mt-6 max-w-xl">
          <Input size="lg" leading={<Search size={18} />} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search help articles" aria-label="Search help articles" />
        </div>
      </PageHero>
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_320px]">
        <div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {list.map(([slug, title, cat, body]) => (
              <li key={slug}>
                <Link to={`/help/${slug}`} className="block h-full rounded-card border border-border bg-surface p-4 shadow-card hover:shadow-hover">
                  <Badge size="xs">{cat}</Badge>
                  <p className="mt-2 font-semibold text-text">{title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{body}</p>
                </Link>
              </li>
            ))}
          </ul>
          {!list.length && <EmptyState art="search" title="No articles found" action={<Button to="/app/needer/support" variant="primary">Ask support</Button>} />}
          <h2 className="mb-3 mt-10 font-display text-2xl font-extrabold text-primary">Frequently asked</h2>
          <FaqAccordion items={FAQS} />
        </div>
        <aside className="space-y-4">
          <Card>
            <p className="font-bold text-text">Still need help?</p>
            <p className="mt-1 text-sm text-muted">Open a ticket — it links to your Need, Booking or payment.</p>
            <Button to="/app/needer/support" variant="primary" block className="mt-4"><LifeBuoy size={16} /> New support ticket</Button>
          </Card>
          <Card>
            <p className="font-bold text-text">Guides</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link to="/manual" className="flex items-center gap-2 text-info-fg hover:underline"><BookOpen size={15} /> User manual</Link></li>
              <li><Link to="/faq" className="flex items-center gap-2 text-info-fg hover:underline"><FileText size={15} /> Full FAQ</Link></li>
              <li><Link to="/trust-safety" className="flex items-center gap-2 text-info-fg hover:underline"><ShieldCheck size={15} /> Trust & Safety</Link></li>
            </ul>
          </Card>
        </aside>
      </div>
    </>
  )
}

export function HelpArticle() {
  const { article } = useParams()
  const a = HELP_ARTICLES.find((x) => x[0] === article)
  const [helpful, setHelpful] = useState(null)
  if (!a) return <NotFound />
  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link to="/help" className="hover:text-text">Help Centre</Link> › {a[2]}</nav>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-primary">{a[1]}</h1>
      <div className="mt-6"><Prose><p>{a[3]}</p><p>Need more? Our support team is available 24/7 in English, Kinyarwanda, French and Swahili.</p></Prose></div>
      <div className="mt-8 flex items-center gap-3 text-sm" aria-live="polite">
        {helpful == null ? (
          <>
            Was this helpful?
            <Button size="sm" variant="outline" onClick={() => setHelpful(true)}>Yes</Button>
            <Button size="sm" variant="outline" onClick={() => setHelpful(false)}>No</Button>
          </>
        ) : (
          <span className="text-muted">Thanks for the feedback!</span>
        )}
      </div>
    </div>
  )
}

const FAQ_GROUPS = [['posting', 'Posting a request'], ['payments', 'Payments and refunds'], ['partners', 'For partners'], ['messages', 'Messages and chat'], ['account', 'Your account'], ['safety', 'Safety and disputes']]

export function FaqPage() {
  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">Frequently asked questions</h1>
      <p className="mt-2 text-muted">{FAQS.length} answers about posting, payments, partners, messages, your account and safety.</p>
      {FAQ_GROUPS.map(([cat, label]) => (
        <section key={cat} className="mt-10" aria-label={label}>
          <h2 className="mb-3 flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-text"><span className="h-2 w-2 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />{label}</h2>
          <FaqAccordion items={FAQS.filter((f) => f[2] === cat)} />
        </section>
      ))}
    </div>
  )
}

export function ManualPage() {
  const sections = [
    ['Customers', ['Create an account and confirm your phone', 'Request a service or build a Bundle', 'Compare offers and accept one', 'Sign the agreement', 'Pay — we hold the money safely', 'Follow progress and confirm you are happy', 'Review the provider']],
    ['Partners', ['Complete KYC verification', 'Sign the Partner agreement and pick a plan', 'Serve matched requests', 'Chat after confirmation and agree the price', 'Deliver with evidence', 'Get paid from escrow', 'Publish Deals']],
    ['Agents', ['Post on behalf of Needers with recorded consent', 'Onboard Partners and upload KYC together', 'Share your referral code and QR', 'Track follow-ups and commissions']],
  ]
  return (
    <div>
      <PageHero eyebrow="User manual" title="A clear guide to" highlight="using Needibi Serve." subtitle="Follow the steps for your role, from your first request or verification to a completed, reviewed job." cardLabel="Guides for every role" points={[[Send, 'Customers', 'Request, compare, pay safely and review.'], [Briefcase, 'Partners', 'Get checked, serve requests and get paid.'], [Users, 'Agents', 'Help people post and onboard partners.']]}><HeroActions primary={['Read the FAQ', '/faq']} secondary={['Help Centre', '/help']} /></PageHero>
      <div className="container-page py-9 sm:py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {sections.map(([role, steps], si) => (
            <div key={role} className={cn('pastel-card', PASTEL_TONES[si % 4])}>
            <h2 className="text-lg font-semibold text-text">For {role}</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {steps.map((s, i) => (
                <li key={s} className="flex gap-2"><span className="tabular font-bold text-action-fg">{i + 1}.</span> {s}</li>
              ))}
            </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const LEGAL = {
  terms: ['Terms of Service', ['Using Needibi Serve', 'You must be 18+ and provide accurate information. Posting is free. Payments are processed into escrow and released on confirmation.'], ['Content', 'Only approved content is public. Contact details are not allowed in public Messages or media.'], ['Disputes', 'Disputes are reviewed by Needibi staff. Resolutions may be refund, release or partial, and may be appealed once.']],
  privacy: ['Privacy Policy', ['What we collect', 'Account details, ID documents for providers, payment records and device information for security.'], ['Who sees what', 'Public pages never show phone, email or exact address. Contacts are shared only at the agreed transaction stage.'], ['Your rights', 'Download your data, correct it or delete your account (30-day grace period) from Settings.']],
  cookies: ['Cookie Policy', ['Essential cookies', 'Keep you signed in and protect against fraud.'], ['Preferences', 'Remember your language, theme and area.'], ['Analytics', 'Optional, anonymised usage statistics to improve the product.']],
  'partner-agreement': ['Partner Agreement', ['Verification', 'Partners must pass and maintain KYC verification.'], ['Fees', 'Platform fees are deducted from escrow payouts according to level and plan.'], ['Conduct', 'Partners must deliver as agreed, keep communication on-platform and respect privacy rules.']],
}
export function LegalPage() {
  const { doc } = useParams()
  const d = LEGAL[doc]
  if (!d) return <NotFound />
  const [title, ...secs] = d
  return (
    <div>
      <PageHero eyebrow="Legal" title={title} subtitle="The policies that explain how Needibi Serve protects people, payments and information." cardLabel="Our commitments" points={[[Lock, 'Private by default', 'Contact details stay hidden until you agree.'], [Wallet, 'Protected payments', 'Money is held until the job is done.'], [FileText, 'Clear terms', 'Plain-language policies you can always read.']]}><HeroActions primary={['Contact us', '/contact']} /></PageHero>
      <div className="container-page grid gap-8 py-9 sm:py-12 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Legal" className="h-fit rounded-2xl border border-border bg-surface p-2 text-sm shadow-card">
          {Object.entries(LEGAL).map(([k, v]) => (
            <Link key={k} to={`/legal/${k}`} className={cn('block rounded-lg px-3 py-2.5', k === doc ? 'bg-action-soft font-semibold text-text' : 'text-muted hover:bg-surface-2')}>{v[0]}</Link>
          ))}
        </nav>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
          <p className="text-sm text-muted">Last updated 1 October 2026 · NEEDIBI ONLINE SERVICES LTD</p>
          <div className="mt-5"><Prose>{secs.map(([h, p]) => (<div key={h}><h2>{h}</h2><p>{p}</p></div>))}</Prose></div>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ Public quick request */
export function PublicRequest() {
  const [form, setForm] = useState({ name: '', phone: '', category: 'home-furniture', details: '' })
  const [done, setDone] = useState(false)
  const contact = detectContacts(form.details)
  return (
    <div>
      <PageHero eyebrow="Quick request" title="Tell us" highlight="what you need." subtitle="No account yet? Send a few details and a Needibi Agent will call you to help post it." cardLabel="What happens next" points={[[Send, 'Send your details', 'A few lines about the job and your area.'], [Users, 'An Agent calls you', 'They help you post the request properly.'], [ShieldCheck, 'Get checked offers', 'Up to 3 offers, with your money held safely.']]} />
      <div className="container-page max-w-2xl py-9 sm:py-12">
      <Card className="rounded-2xl border-border/80 p-5 shadow-card sm:p-7">
        {done ? (
          <EmptyState title="Request received" description="An Agent will call you within 30 minutes (7:00–22:00). Your reference: QR-88214." action={<Button to="/auth/register" variant="primary">Create a free account</Button>} />
        ) : (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!contact.blocked) setDone(true) }}>
            <Field label="Your name">{(p) => <Input {...p} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
            <Field label="Phone (private — only our Agent sees it)">{(p) => <PhoneInput {...p} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />}</Field>
            <Field label="Category">{(p) => <Select {...p} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</Select>}</Field>
            <Field label="What do you need?" error={contact.blocked ? CONTACT_BLOCK_REASON : undefined}>{(p) => <Textarea {...p} rows={4} required value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />}</Field>
            <Button type="submit" variant="primary" size="lg" block disabled={contact.blocked}><Send size={18} /> Send request</Button>
          </form>
        )}
      </Card>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ System pages */
function SystemPage({ icon: Icon, code, title, body, children }) {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-100 text-primary"><Icon size={40} /></span>
      {code && <p className="mt-6 font-display text-6xl font-extrabold text-action-fg">{code}</p>}
      <h1 className="mt-2 font-display text-2xl font-extrabold text-text sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-md text-muted">{body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  )
}

export function NotFound() {
  return (
    <SystemPage icon={Compass} code="404" title="We couldn't find that page" body="The link may be old, or the item was closed. Try searching — or request a service and let providers come to you.">
      <Button to="/" variant="outline">Go home</Button>
      <Button to="/app/needer/post" variant="gold">Request a service</Button>
    </SystemPage>
  )
}
export function ServerError() {
  return (
    <SystemPage icon={ServerCrash} code="500" title="Something went wrong on our side" body="Our team has been alerted. Your payments and data are safe. Please try again in a moment.">
      <Button variant="primary" onClick={() => window.location.reload()}>Try again</Button>
      <Button to="/help" variant="outline">Help Centre</Button>
    </SystemPage>
  )
}
export function Maintenance() {
  return (
    <SystemPage icon={Construction} title="We're improving Needibi Serve" body="Scheduled maintenance until 03:00 (Kigali time). Escrow and payouts are not affected.">
      <Button to="/" variant="outline">Check again</Button>
    </SystemPage>
  )
}
