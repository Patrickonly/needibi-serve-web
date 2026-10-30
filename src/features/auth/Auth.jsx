import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  Eye, EyeOff, Mail, Lock, ShieldCheck, Wallet, BadgeCheck, ChevronLeft, User, Briefcase, HeartHandshake,
  CircleCheck, CircleX, Circle, Check, ArrowLeft, ArrowRight, IdCard, Camera, Building, Signature, Award,
  MessageSquareText, LogIn, UserPlus, KeyRound, MailCheck, Phone, LayoutGrid, AtSign, Star, MapPin, Truck, Users, Headset,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useAuth, DEMO_ACCOUNTS, ROLE_HOME, ROLE_LABEL, toast } from '@/lib/store'
import { useDebounced } from '@/lib/hooks'
import { CATEGORIES, DISTRICTS } from '@/mocks/seed'
import { LogoMark, Button, Input, Field, Checkbox, RadioCards, Segmented, Alert, Avatar, Badge, Select, LifecycleStepper } from '@/design-system'
import { PhoneInput, FileUploader } from '@/components/forms/inputs'

/* ------------------------------------------------------------------ Frame */
const PANEL_TITLE = {
  needer: 'Get your needs served.',
  partner: 'Grow with real demand.',
}

// Trust icons placed around the brand mark: four on the outer ring, four on the inner ring.
const ORBIT_OUTER = [
  [ShieldCheck, 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2', 'bg-white text-action-600', '0s'],
  [Wallet, 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2', 'bg-[var(--brand-yellow)] text-primary-900', '1.2s'],
  [BadgeCheck, 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', 'bg-white text-trust-600', '2.4s'],
  [MessageSquareText, 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2', 'bg-white text-action-600', '3.6s'],
]
const ORBIT_INNER = [
  [Star, { top: '27%', left: '27%' }],
  [MapPin, { top: '27%', left: '73%' }],
  [Truck, { top: '73%', left: '73%' }],
  [Users, { top: '73%', left: '27%' }],
]

/** Flat brand illustration: Needibi mark at the centre, trust icons orbiting on two rings. */
function AuthIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[400px]" aria-hidden="true">
      <span className="absolute inset-0 rounded-full border border-white/20" />
      <span className="absolute inset-[18%] animate-[spin_70s_linear_infinite] rounded-full border-2 border-dashed border-white/25" />
      <span className="absolute inset-[33%] rounded-full bg-white/10" />

      <span className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[30px] bg-white shadow-modal">
        <LogoMark size={70} />
      </span>

      {ORBIT_OUTER.map(([OrbitIcon, pos, tone, delay]) => (
        <span key={pos} className={cn('absolute', pos)}>
          <span className={cn('flex h-16 w-16 animate-float items-center justify-center rounded-2xl shadow-hover', tone)} style={{ animationDelay: delay }}>
            <OrbitIcon size={28} strokeWidth={1.8} />
          </span>
        </span>
      ))}
      {ORBIT_INNER.map(([OrbitIcon, style]) => (
        <span key={style.top + style.left} className="absolute flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm" style={style}>
          <OrbitIcon size={19} />
        </span>
      ))}

      <div className="absolute -left-[14%] -bottom-[3%] flex animate-float items-center gap-2.5 rounded-2xl bg-white px-3.5 py-2.5 text-left shadow-modal" style={{ animationDelay: '0.6s' }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-trust-100 text-trust-700"><Wallet size={17} /></span>
        <span>
          <span className="block text-xs font-bold text-primary-900">Escrow secured</span>
          <span className="block text-[11px] text-[#5b6577]">RWF 25,000 held safely</span>
        </span>
      </div>
      <div className="absolute -right-[14%] -top-[3%] flex animate-float items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-modal" style={{ animationDelay: '1.8s' }}>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-action-100 text-action-600"><BadgeCheck size={17} /></span>
        <span>
          <span className="block text-xs font-bold text-primary-900">Verified Partner</span>
          <span className="flex items-center gap-0.5 text-[11px] text-[#5b6577]"><Star size={11} className="fill-warn-500 text-warn-500" /> 4.9 · 230 reviews</span>
        </span>
      </div>
    </div>
  )
}

function BrandPanel({ title }) {
  return (
    <aside className="hidden overflow-hidden bg-action-600 px-10 text-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:items-center lg:justify-center xl:px-16">
      <h2 className="mb-14 max-w-md text-center font-display text-[34px] font-semibold leading-[1.15] tracking-tight xl:text-[40px]">{title}</h2>
      <AuthIllustration />
      <ul className="mt-16 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-white/85">
        {[[ShieldCheck, 'Checked providers'], [Wallet, 'Money held safely'], [Lock, 'Your details stay private']].map(([PointIcon, label]) => (
          <li key={label} className="flex items-center gap-2"><PointIcon size={16} className="text-[var(--brand-yellow)]" /> {label}</li>
        ))}
      </ul>
    </aside>
  )
}

function AuthFrame({ title, subtitle, icon: Icon, children, wide, aside = true, panel = 'needer', panelTitle }) {
  return (
    <div className={cn('min-h-dvh bg-surface text-text', aside && 'lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]')}>
      {aside && <BrandPanel title={panelTitle ?? PANEL_TITLE[panel] ?? PANEL_TITLE.needer} />}
      <section className="auth-scroll flex min-h-dvh flex-col px-5 sm:px-8">
        <div className={cn('mx-auto flex w-full flex-1 flex-col py-6 lg:py-8', wide ? 'max-w-3xl' : 'max-w-[440px]')}>
          <header className="flex items-center justify-between gap-4">
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-text">
              <ChevronLeft size={18} /> Back to home
            </Link>
            <Link to="/" className="flex items-center gap-3" aria-label="Needibi Serve home">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface shadow-hover">
                <LogoMark size={30} />
              </span>
              <span className="hidden leading-tight xs:block">
                <span className="block font-display text-base font-extrabold text-text">Needibi Serve</span>
                <span className="block text-xs text-muted">Get your needs served</span>
              </span>
            </Link>
          </header>

          <main id="main" className="auth-form flex flex-1 flex-col justify-start pb-6 pt-8 animate-fade-in sm:justify-center sm:py-6 lg:py-8">
            <div className="mb-6">
              {Icon && (
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-action-100 text-action-fg ring-4 ring-action-100/50">
                  <Icon size={21} strokeWidth={1.9} />
                </span>
              )}
              <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight text-text sm:text-[28px]">{title}</h1>
              {subtitle && <p className="mt-2 max-w-md text-[15px] leading-6 text-muted">{subtitle}</p>}
            </div>
            {children}
          </main>

          <footer className="flex justify-center gap-5 text-xs text-muted">
            <Link to="/legal/terms" className="hover:text-text">Terms</Link>
            <Link to="/legal/privacy" className="hover:text-text">Privacy</Link>
            <Link to="/help" className="hover:text-text">Help</Link>
          </footer>
        </div>
      </section>
    </div>
  )
}

/* ------------------------------------------------------------------ Shared parts */
/** Google / Apple sign-in. Social sign-up never skips Partner verification. */
function SocialSignIn({ label = 'or continue with' }) {
  const soon = (provider) => () => toast(`${provider} sign-in is mocked in this build — sign in with email or phone`, { tone: 'info' })
  return (
    <div className="mt-5">
      <div className="relative mb-4 text-center text-xs font-medium text-muted">
        <span className="relative z-[1] bg-surface px-3">{label}</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" aria-hidden="true" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" onClick={soon('Google')}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 01-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z" /><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0012 22z" /><path fill="#FBBC05" d="M6.4 14a6 6 0 010-3.9V7.5H3.1a10 10 0 000 9z" /><path fill="#EA4335" d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 003.1 7.5L6.4 10C7.2 7.8 9.4 6 12 6z" /></svg>
          Google
        </Button>
        <Button variant="outline" size="lg" onClick={soon('Apple')}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.8a4.9 4.9 0 00-4.1 2.5c-1.8 3-.5 7.5 1.3 10 .8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8 2.2-1.2 3-2.4a10 10 0 001.4-2.8 4.3 4.3 0 01-2.5-4.2zM14 5.2a4.3 4.3 0 001-3.2 4.4 4.4 0 00-2.9 1.5 4.1 4.1 0 00-1 3.1A3.7 3.7 0 0014 5.2z" /></svg>
          Apple
        </Button>
      </div>
    </div>
  )
}

function PasswordInput({ value, onChange, autoComplete = 'current-password', ...props }) {
  const [show, setShow] = useState(false)
  return (
    <Input
      {...props}
      type={show ? 'text' : 'password'}
      autoComplete={autoComplete}
      value={value}
      onChange={onChange}
      leading={<Lock size={17} />}
      trailing={
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="rounded p-1.5 text-muted hover:text-text">
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      }
    />
  )
}

const PW_RULES = [
  ['8+ characters', (p) => p.length >= 8],
  ['Upper & lower case', (p) => /[A-Z]/.test(p) && /[a-z]/.test(p)],
  ['A number', (p) => /\d/.test(p)],
  ['A symbol or 12+ characters', (p) => /[^\w]/.test(p) || p.length >= 12],
]
const passwordScore = (p) => PW_RULES.filter(([, test]) => test(p)).length
const STRENGTH = [
  ['Too weak', 'bg-danger-600', 'text-danger-fg'],
  ['Weak', 'bg-danger-600', 'text-danger-fg'],
  ['Fair', 'bg-warn-500', 'text-warn-fg'],
  ['Good', 'bg-action-500', 'text-action-fg'],
  ['Strong', 'bg-trust-600', 'text-trust-fg'],
]

function PasswordStrength({ value }) {
  const score = passwordScore(value)
  const [label, bar, text] = STRENGTH[score]
  return (
    <div className="mt-2.5" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1.5" role="meter" aria-label="Password strength" aria-valuemin={0} aria-valuemax={4} aria-valuenow={score} aria-valuetext={label}>
          {PW_RULES.map((_, i) => <span key={i} className={cn('h-1.5 rounded-full transition-colors', value && i < score ? bar : 'bg-grey-100')} />)}
        </div>
        {value && <span className={cn('w-16 text-right text-xs font-semibold', text)}>{label}</span>}
      </div>
      {value && score < PW_RULES.length && <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {PW_RULES.map(([rule, test]) => {
          const ok = test(value)
          return (
            <li key={rule} className={cn('flex items-center gap-1.5', ok ? 'text-trust-fg' : 'text-muted')}>
              {ok ? <CircleCheck size={14} /> : <Circle size={14} />} {rule}
            </li>
          )
        })}
      </ul>}
    </div>
  )
}

function StepProgress({ steps, current }) {
  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center justify-between text-xs font-semibold">
        <span className="uppercase tracking-wider text-action-fg">Step {current + 1} of {steps.length}</span>
        <span className="text-muted">{steps[current]}</span>
      </div>
      <ol className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }} aria-label="Progress">
        {steps.map((s, i) => (
          <li key={s} aria-current={i === current ? 'step' : undefined}>
            <span className={cn('block h-1.5 rounded-full transition-colors', i < current ? 'bg-trust-600' : i === current ? 'bg-action-500' : 'bg-grey-100')} />
            <span className="sr-only">{s}{i < current ? ' (done)' : ''}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function BackLink({ to = '/auth/login', children = 'Back to sign in' }) {
  return (
    <Link to={to} className="mt-8 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted hover:text-text">
      <ArrowLeft size={15} /> {children}
    </Link>
  )
}

// Every workspace maps to a seeded persona so its dashboards have data; the typed identity is layered on top.
const ROLE_PERSONA = { needer: 'u-aline', partner: 'p-cleanpro', agent: 'u-eric', admin: 'u-admin' }

function accountFor(role, identifier = '') {
  const base = DEMO_ACCOUNTS.find((a) => a.id === ROLE_PERSONA[role])
  const id = identifier.trim()
  const isEmail = id.includes('@')
  const words = (isEmail ? id.split('@')[0] : id).replace(/[._-]+/g, ' ').replace(/[^a-z ]/gi, '').trim()
  const name = words ? words.replace(/\b\w/g, (c) => c.toUpperCase()) : base.name
  return { ...base, name, firstName: name.split(' ')[0], email: isEmail ? id : base.email }
}

const withReturn = (path, returnTo) => (returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path)

/* ------------------------------------------------------------------ Login */
export function Login() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const returnTo = sp.get('returnTo') ?? ''
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [missing, setMissing] = useState({})
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const empty = { identifier: !identifier.trim(), password: !password }
    setMissing(empty)
    if (empty.identifier || empty.password) return
    setLoading(true)
    setError(null)
    try {
      await api.post('/api/auth/login', { identifier, password })
      navigate(withReturn('/auth/choose-role', returnTo), { state: { identifier } })
    } catch (err) {
      setError(err.body?.message ?? err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthFrame
      icon={LogIn}
      title="Welcome back"
      subtitle="Sign in to see your requests, offers and bookings."
      panelTitle="Welcome back to Needibi Serve."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && <Alert tone="warn" title={error} />}
        <Field label="Email or phone number" error={missing.identifier ? 'Enter your email or phone number' : undefined}>
          {(p) => <Input {...p} leading={<Mail size={17} />} placeholder="you@example.rw or 078 123 4567" autoComplete="username" value={identifier} onChange={(e) => { setIdentifier(e.target.value); setMissing((m) => ({ ...m, identifier: false })) }} autoFocus />}
        </Field>
        <Field label="Password" error={missing.password ? 'Enter your password' : undefined}>
          {(p) => <PasswordInput {...p} placeholder="Enter your password" value={password} onChange={(e) => { setPassword(e.target.value); setMissing((m) => ({ ...m, password: false })) }} />}
        </Field>
        <Button type="submit" variant="primary" size="lg" block loading={loading} className="!mt-5">
          Sign in <ArrowRight size={18} />
        </Button>
      </form>
      <SocialSignIn />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-sm">
        <Link to="/auth/forgot" className="font-semibold text-action-fg hover:underline">Forgot password?</Link>
        <p className="text-muted">
          Don't have an account? <Link to={returnTo ? `/auth/choose-role?mode=signup&returnTo=${encodeURIComponent(returnTo)}` : '/auth/choose-role?mode=signup'} className="font-semibold text-action-fg hover:underline">Sign up</Link>
        </p>
      </div>
    </AuthFrame>
  )
}

/* ------------------------------------------------------------------ OTP */
export function Otp() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sp] = useSearchParams()
  const login = useAuth((s) => s.login)
  const account = location.state?.account
  const [digits, setDigits] = useState(Array(6).fill(''))
  const [error, setError] = useState('')
  const [expires, setExpires] = useState(() => Date.now() + 180_000)
  const [resendAt, setResendAt] = useState(() => Date.now() + 30_000)
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(false)
  const refs = useRef([])
  const verifying = useRef(false)
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, Math.ceil((expires - now) / 1000))
  const resendLeft = Math.max(0, Math.ceil((resendAt - now) / 1000))

  const verify = async (code) => {
    if (verifying.current) return
    verifying.current = true
    setLoading(true)
    try {
      await api.post('/api/auth/otp', { code })
      if (!account) return navigate(withReturn('/auth/choose-role', sp.get('returnTo')), { replace: true })
      login(account)
      toast(`Welcome to Needibi Serve, ${account.firstName}`)
      navigate(sp.get('returnTo') || ROLE_HOME[account.roles[0]], { replace: true })
    } catch (e) {
      verifying.current = false
      setError(e.message)
      setDigits(Array(6).fill(''))
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }
  const setDigit = (i, v) => {
    const clean = v.replace(/\D/g, '')
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split('')
      const filled = [...next, ...Array(6 - next.length).fill('')]
      setDigits(filled)
      if (next.length === 6) verify(next.join(''))
      return
    }
    const next = [...digits]
    next[i] = clean
    setDigits(next)
    setError('')
    if (clean && i < 5) refs.current[i + 1]?.focus()
    if (next.every(Boolean)) verify(next.join(''))
  }
  const masked = account?.phone ? `+250 ${account.phone.slice(0, 2)}• ••• ${account.phone.slice(-3)}` : 'your phone'

  return (
    <AuthFrame icon={MessageSquareText} title="Check your phone" subtitle={<>We sent a 6-digit code to <span className="font-semibold text-text">{masked}</span>. Enter it below to continue.</>}>
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-text">Verification code</legend>
        <div className="flex items-center gap-2 sm:gap-2.5">
          {digits.map((d, i) => (
            <Fragment key={i}>
              {i === 3 && <span className="h-0.5 w-3 shrink-0 rounded bg-border-strong" aria-hidden="true" />}
              <input
                ref={(el) => (refs.current[i] = el)}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()}
                onFocus={(e) => e.target.select()}
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${i + 1}`}
                aria-invalid={!!error || undefined}
                autoFocus={i === 0}
                className={cn(
                  'tabular h-14 w-full min-w-0 rounded-lg border bg-surface text-center text-2xl font-bold text-text transition-colors focus-visible:border-action-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-action-500/20 aria-[invalid=true]:border-danger-600',
                  d ? 'border-action-500' : 'border-border-strong',
                )}
              />
            </Fragment>
          ))}
        </div>
      </fieldset>
      <div className="mt-3 flex min-h-6 items-center justify-between gap-3 text-sm" aria-live="polite">
        {error ? (
          <p className="font-medium text-danger-fg">{error}</p>
        ) : (
          <p className="text-muted">{left > 0 ? <>Expires in <span className="tabular font-semibold text-text">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span></> : 'Code expired'}</p>
        )}
        {resendLeft > 0 ? (
          <span className="text-muted">Resend in <span className="tabular font-semibold">{resendLeft}s</span></span>
        ) : (
          <button type="button" className="font-semibold text-action-fg hover:underline" onClick={() => { setResendAt(Date.now() + 30_000); setExpires(Date.now() + 180_000); toast('New code sent') }}>Resend code</button>
        )}
      </div>
      <Button variant="primary" size="lg" block className="mt-6" loading={loading} disabled={!digits.every(Boolean) || left === 0} onClick={() => verify(digits.join(''))}>
        Verify and continue
      </Button>
      <BackLink>Wrong number? Back to sign in</BackLink>
    </AuthFrame>
  )
}

/* ------------------------------------------------------------------ Register wizard */
const ACCOUNT_ROLE_OPTIONS = [
  { value: 'needer', icon: User, title: 'Customer', description: 'Post a need or book a service', tone: 'bg-action-100 text-action-fg' },
  { value: 'partner', icon: Briefcase, title: 'Partner', description: 'Offer trusted services', tone: 'bg-trust-100 text-trust-fg' },
  { value: 'agent', icon: Headset, title: 'Agent', description: 'Help customers get served', tone: 'bg-info-100 text-info-fg' },
]

const ROLE_OPTIONS = [
  { value: 'needer', icon: User, title: 'Customer', description: 'Post a need or book a service', tone: 'bg-action-100 text-action-fg' },
  { value: 'partner', icon: Briefcase, title: 'Partner', description: 'Offer trusted services', tone: 'bg-trust-100 text-trust-fg' },
  { value: 'agent', icon: Headset, title: 'Agent', description: 'Help customers get served', tone: 'bg-info-100 text-info-fg' },
  { value: 'admin', icon: ShieldCheck, title: 'Admin', description: 'Manage the Needibi network', tone: 'bg-brand-yellow-soft text-brand-yellow-fg' },
]

function RolePicker({ value, onChange, accountType = false, workspace = false }) {
  const options = accountType ? ACCOUNT_ROLE_OPTIONS : ROLE_OPTIONS
  return (
    <div role="radiogroup" aria-label={accountType ? 'Account type' : 'Role'} className={cn('role-picker', accountType && 'role-picker-account', workspace && 'role-picker-workspace')}>
      {options.map(({ value: v, icon: Icon, title, description, tone }) => {
        const active = value === v
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              'role-picker-card group relative flex min-h-[226px] w-full flex-col items-start rounded-[22px] border p-6 text-left transition-all',
              active ? 'role-picker-card-active' : 'border-border bg-surface hover:border-action-300 hover:bg-action-soft/35',
            )}
          >
            <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors', active ? 'bg-white/20 text-white' : tone ?? 'bg-action-100 text-action-fg')}>
              <Icon size={20} />
            </span>
            <span className={cn('min-w-0', accountType ? 'mt-5' : 'mt-auto')}>
              <span className={cn('block text-[20px] font-bold tracking-[-0.025em]', active ? 'text-white' : 'text-primary-900')}>{title}</span>
              <span className={cn('mt-1 block', accountType ? 'text-[14px] leading-snug' : 'text-[16px]', active ? 'text-white/80' : 'text-muted')}>{description}</span>
            </span>
            <span className={cn('absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors', active ? 'border-white bg-white text-action-600' : 'border-border-strong')}>
              {active && <Check size={15} strokeWidth={3.5} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SummaryRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <Icon size={16} className="shrink-0 text-muted" />
      <span className="w-24 shrink-0 text-sm text-muted">{label}</span>
      <span className="min-w-0 truncate text-sm font-semibold text-text">{children}</span>
    </div>
  )
}

const REGISTER_DRAFT = 'needibi-register-draft'
const readDraft = () => {
  try { return JSON.parse(sessionStorage.getItem(REGISTER_DRAFT) ?? 'null') } catch { return null }
}
const hasTyped = (fields) => ['name', 'username', 'phone', 'email', 'business', 'code'].some((k) => String(fields?.[k] ?? '').trim())

export function Register() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const [draft] = useState(() => (sp.get('role') ? null : readDraft()))
  const [step, setStep] = useState(sp.get('role') ? 1 : draft?.step ?? 0)
  const [role, setRole] = useState(sp.get('role') ?? draft?.role ?? 'needer')
  const [f, setF] = useState({ name: '', username: '', phone: '', email: '', password: '', business: '', category: 'home-furniture', district: 'Gasabo', code: '', terms: false, ...draft?.f })
  const [tried, setTried] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showCode, setShowCode] = useState(() => Boolean(draft?.f?.code))
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v?.target ? v.target.value : v }))
  const isNeeder = role === 'needer'
  const needsUsername = !isNeeder
  const uname = useDebounced(f.username, 400)
  const [avail, setAvail] = useState(null)
  useEffect(() => {
    if (!needsUsername || uname.length < 3) return setAvail(null)
    api.get('/api/auth/username', { u: uname }).then(setAvail)
  }, [uname, needsUsername])
  useEffect(() => {
    // The password is deliberately left out of the saved draft.
    const { password: _pw, ...rest } = f
    try {
      if (hasTyped(rest)) sessionStorage.setItem(REGISTER_DRAFT, JSON.stringify({ step, role, f: rest }))
      else sessionStorage.removeItem(REGISTER_DRAFT)
    } catch { /* storage unavailable */ }
  }, [f, step, role])

  const score = passwordScore(f.password)
  const errors = {
    name: f.name.trim().length < 3 ? 'Enter your full name (at least 3 letters).' : null,
    business: role === 'partner' && !f.business.trim() ? 'Enter your business name.' : null,
    username: !needsUsername ? null : f.username.length < 3 ? 'Choose a username of at least 3 characters.' : avail && !avail.available ? `That username is taken. Try “${avail.suggestion}”.` : !avail ? 'Checking your username…' : null,
    phone: f.phone.length !== 9 ? 'Enter your 9-digit phone number, e.g. 788 123 456.' : null,
    email: f.email && !/^\S+@\S+\.\S+$/.test(f.email) ? "That email doesn't look right. Check for typos." : null,
    password: score < 2 ? 'Your password is too weak. Meet at least 2 of the rules below.' : null,
    terms: isNeeder && !f.terms ? 'Please accept the Terms of Service to continue.' : null,
  }
  const missing = Object.values(errors).filter(Boolean)
  const show = (k) => (tried ? errors[k] ?? undefined : undefined)

  const steps = isNeeder ? ['Account type', 'Your details'] : ['Account type', 'Your details', 'Review']
  const titles = [
    ['Create your account', 'Free to join. Choose how you will use Needibi Serve.'],
    [isNeeder ? 'Tell us about you' : 'Your business details', role === 'partner' ? 'Your business details help us match you with the right Needs.' : 'We only use your phone to verify you. It is never shown publicly.'],
    ['Review and confirm', "Check your details, then we'll text you a code to verify your phone."],
  ]
  const returnTo = sp.get('returnTo')

  const create = () => {
    if (creating) return
    setCreating(true)
    const account = { id: `u-new-${Date.now()}`, name: f.name, firstName: f.name.split(' ')[0], email: f.email, phone: f.phone, roles: [role], district: f.district, sector: DISTRICTS[f.district][0], verified: false, avatarHue: 30, ...(role === 'partner' ? { partnerId: 'pt-cleanpro', partnerName: f.business } : {}), ...(role === 'agent' ? { agentCode: `AG-${f.name.slice(0, 4).toUpperCase()}26` } : {}) }
    setTimeout(() => {
      try { sessionStorage.removeItem(REGISTER_DRAFT) } catch { /* storage unavailable */ }
      navigate(`/auth/otp?returnTo=${encodeURIComponent(role === 'partner' ? '/auth/partner-onboarding' : returnTo ?? ROLE_HOME[role])}`, { state: { account } })
    }, 500)
  }

  const submitDetails = (e) => {
    e.preventDefault()
    if (missing.length) {
      setTried(true)
      e.currentTarget.querySelector('[aria-invalid="true"]')?.focus()
      return
    }
    if (isNeeder) create()
    else setStep(2)
  }

  const termsLabel = <>I agree to the <Link to="/legal/terms" className="text-action-fg underline">Terms of Service</Link> and <Link to="/legal/privacy" className="text-action-fg underline">Privacy Policy</Link></>

  return (
    <AuthFrame
      icon={UserPlus}
      title={titles[step][0]}
      subtitle={titles[step][1]}
      panel={role === 'partner' ? 'partner' : 'needer'}
    >
      <StepProgress steps={steps} current={step} />

      {hasTyped(draft?.f) && step > 0 && (
        <p className="mb-5 rounded-lg bg-info-100 px-3 py-2 text-sm text-info-fg">Welcome back. We kept what you had typed, except your password.</p>
      )}

      {step === 0 && (
        <>
          <RolePicker value={role} onChange={setRole} accountType />
          <p className="mt-4 text-sm text-muted">
            {role === 'partner'
              ? 'Partners verify their ID before serving Needs or receiving payments. You can set up your profile straight away.'
              : role === 'agent'
                ? 'Agents help people post Needs and register Partners, and earn a reward for each one.'
                : 'Needers post what they need and book Deals. No verification needed to get started.'}
          </p>
          <Button variant="primary" size="lg" block className="mt-6" onClick={() => setStep(1)}>
            Join as {role === 'agent' ? 'an' : 'a'} {ACCOUNT_ROLE_OPTIONS.find((o) => o.value === role)?.title ?? ROLE_LABEL[role]} <ArrowRight size={18} />
          </Button>
        </>
      )}

      {step === 1 && (
        <form className="space-y-4" noValidate onSubmit={submitDetails}>
          <Field label="Full name" error={show('name')}>{(p) => <Input {...p} autoComplete="name" placeholder="e.g. Aline Mukamana" value={f.name} onChange={set('name')} />}</Field>
          {role === 'partner' && <Field label="Business name" error={show('business')}>{(p) => <Input {...p} autoComplete="organization" leading={<Building size={17} />} placeholder="e.g. CleanPro Kigali" value={f.business} onChange={set('business')} />}</Field>}
          {needsUsername && (
            <Field label="Username" error={avail && !avail.available ? errors.username : show('username')} hint={avail?.available ? 'Nice — that username is available.' : 'At least 3 characters, shown on your public profile.'}>
              {(p) => (
                <Input
                  {...p}
                  leading={<AtSign size={17} />}
                  placeholder="yourname"
                  value={f.username}
                  onChange={(e) => set('username')(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                  trailing={avail && (avail.available ? <CircleCheck size={18} className="mr-1 text-trust-fg" aria-label="Available" /> : <CircleX size={18} className="mr-1 text-danger-fg" aria-label="Taken" />)}
                />
              )}
            </Field>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone number" error={show('phone')}>{(p) => <PhoneInput {...p} value={f.phone} onChange={set('phone')} />}</Field>
            <Field label="Email" optional error={show('email')}>{(p) => <Input {...p} type="email" autoComplete="email" placeholder="you@example.rw" value={f.email} onChange={set('email')} />}</Field>
          </div>
          <Field label="Password" error={show('password')}>
            {(p) => (
              <div>
                <PasswordInput {...p} autoComplete="new-password" placeholder="Create a password" value={f.password} onChange={set('password')} />
                <PasswordStrength value={f.password} />
              </div>
            )}
          </Field>
          {!isNeeder && (
            <div className="grid gap-4 sm:grid-cols-2">
              {role === 'partner' && (
                <Field label="Main category">{(p) => <Select {...p} value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</Select>}</Field>
              )}
              <Field label="District">{(p) => <Select {...p} value={f.district} onChange={set('district')}>{Object.keys(DISTRICTS).map((d) => <option key={d}>{d}</option>)}</Select>}</Field>
            </div>
          )}
          {showCode ? (
            <Field label="Referral or promo code" optional>{(p) => <Input {...p} autoFocus={!f.code} value={f.code} onChange={(e) => set('code')(e.target.value.toUpperCase())} placeholder="e.g. AG-ERIC24 or KARIBU10" />}</Field>
          ) : (
            <button type="button" onClick={() => setShowCode(true)} className="text-sm font-semibold text-action-fg hover:underline">+ Add a referral or promo code</button>
          )}
          {isNeeder && (
            <div>
              <Checkbox checked={f.terms} onChange={set('terms')} label={termsLabel} aria-invalid={show('terms') ? true : undefined} />
              {show('terms') && <p className="mt-1.5 text-sm font-medium text-danger-fg" role="alert">{errors.terms}</p>}
            </div>
          )}
          {tried && missing.length > 0 && (
            <Alert tone="danger" title={`Please fix ${missing.length === 1 ? 'one thing' : `${missing.length} things`} to continue`}>
              <ul className="list-disc pl-4">{missing.map((m) => <li key={m}>{m}</li>)}</ul>
            </Alert>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="outline" size="lg" onClick={() => setStep(0)} aria-label="Back" disabled={creating}><ArrowLeft size={18} /></Button>
            <Button type="submit" variant="primary" size="lg" block disabled={creating} aria-busy={creating || undefined}>
              {isNeeder ? (creating ? 'Creating account…' : 'Create account') : <>Continue <ArrowRight size={18} /></>}
            </Button>
          </div>
          {isNeeder && <p className="text-center text-xs text-muted">Next: we text you a 6-digit code, then you can post your first Need.</p>}
        </form>
      )}

      {step === 2 && !isNeeder && (
        <div className="space-y-5">
          <div className="rounded-xl border border-border">
            <div className="flex items-center gap-3 border-b border-border p-4">
              <Avatar name={f.name} hue={30} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-text">{f.name}</p>
                <p className="truncate text-sm text-muted">@{f.username}</p>
              </div>
              <Badge tone="serve">{ROLE_LABEL[role]}</Badge>
            </div>
            <div className="divide-y divide-border px-4">
              {role === 'partner' && <SummaryRow icon={Building} label="Business">{f.business}</SummaryRow>}
              <SummaryRow icon={Phone} label="Phone">+250 {f.phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}</SummaryRow>
              {f.email && <SummaryRow icon={Mail} label="Email">{f.email}</SummaryRow>}
              <SummaryRow icon={LayoutGrid} label="District">{f.district}</SummaryRow>
              {f.code && <SummaryRow icon={Award} label="Code"><span className="text-trust-fg">{f.code} applied</span></SummaryRow>}
            </div>
          </div>
          {role === 'partner' && (
            <Alert tone="info" title="What happens next">
              After your phone code: business info, categories and areas, ID + selfie, the Partner agreement and a plan. Until your ID is verified (usually within 24 h) you can set up your profile and Deals, but you can't serve Needs or receive payments.
            </Alert>
          )}
          <div>
            <Checkbox checked={f.terms} onChange={set('terms')} label={termsLabel} />
            {tried && !f.terms && <p className="mt-1.5 text-sm font-medium text-danger-fg" role="alert">Please accept the Terms of Service to continue.</p>}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" size="lg" onClick={() => setStep(1)} aria-label="Back" disabled={creating}><ArrowLeft size={18} /></Button>
            <Button variant="primary" size="lg" block disabled={creating} aria-busy={creating || undefined} onClick={() => (f.terms ? create() : setTried(true))}>
              {creating ? 'Creating account…' : 'Create account'}
            </Button>
          </div>
        </div>
      )}

      <p className="mt-8 border-t border-border pt-7 text-center text-sm text-muted">
        Already have an account? <Link to={withReturn('/auth/login', returnTo)} className="font-semibold text-action-fg hover:underline">Sign in</Link>
      </p>
    </AuthFrame>
  )
}

/* ------------------------------------------------------------------ Forgot / reset */
export function Forgot() {
  const [sent, setSent] = useState(false)
  const [method, setMethod] = useState('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const ready = method === 'phone' ? phone.length === 9 : /\S+@\S+\.\S+/.test(email)
  const target = method === 'phone' ? `+250 ${phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}` : email

  if (sent) {
    return (
      <AuthFrame icon={MailCheck} title="Check your messages" subtitle={<>If an account exists for <span className="font-semibold text-text">{target}</span>, a reset link is on its way. It expires in 30 minutes.</>}>
        <Button to="/auth/reset" variant="primary" size="lg" block>Set a new password <ArrowRight size={18} /></Button>
        <p className="mt-5 text-center text-sm text-muted">
          Didn't receive it?{' '}
          <button type="button" className="font-semibold text-action-fg hover:underline" onClick={() => toast('Reset link sent again')}>Resend</button>
          {' '}or{' '}
          <button type="button" className="font-semibold text-action-fg hover:underline" onClick={() => setSent(false)}>try another {method === 'phone' ? 'number' : 'email'}</button>
        </p>
        <BackLink />
      </AuthFrame>
    )
  }

  return (
    <AuthFrame icon={KeyRound} title="Forgot your password?" subtitle="No problem. Tell us where to send a secure reset link.">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setSent(true) }}>
        <Segmented
          label="Reset method"
          value={method}
          onChange={setMethod}
          className="flex w-full [&>button]:flex-1 [&>button]:justify-center"
          options={[{ value: 'phone', label: 'Phone', icon: <Phone size={15} /> }, { value: 'email', label: 'Email', icon: <Mail size={15} /> }]}
        />
        {method === 'phone' ? (
          <Field label="Phone number" hint="We'll text you a reset link.">{(p) => <PhoneInput {...p} value={phone} onChange={setPhone} />}</Field>
        ) : (
          <Field label="Email address" hint="We'll email you a reset link.">{(p) => <Input {...p} type="email" autoComplete="email" leading={<Mail size={17} />} placeholder="you@example.rw" value={email} onChange={(e) => setEmail(e.target.value)} />}</Field>
        )}
        <Button type="submit" variant="primary" size="lg" block disabled={!ready}>Send reset link</Button>
      </form>
      <BackLink />
    </AuthFrame>
  )
}

export function Reset() {
  const navigate = useNavigate()
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')
  const score = passwordScore(p1)
  const match = p2 && p1 === p2
  return (
    <AuthFrame icon={Lock} title="Set a new password" subtitle="Choose a strong password you don't use anywhere else.">
      <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); toast('Password updated — please sign in'); navigate('/auth/login') }}>
        <Field label="New password">
          {(p) => (
            <div>
              <PasswordInput {...p} autoComplete="new-password" placeholder="Create a password" value={p1} onChange={(e) => setP1(e.target.value)} />
              <PasswordStrength value={p1} />
            </div>
          )}
        </Field>
        <Field label="Confirm password" error={p2 && !match ? "Passwords don't match" : undefined} hint={match ? 'Passwords match.' : undefined}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" placeholder="Repeat your password" value={p2} onChange={(e) => setP2(e.target.value)} />}
        </Field>
        <Button type="submit" variant="primary" size="lg" block disabled={score < 2 || !match}>Update password</Button>
      </form>
      <BackLink />
    </AuthFrame>
  )
}

/* ------------------------------------------------------------------ Choose role */
export function ChooseRole() {
  const navigate = useNavigate()
  const location = useLocation()
  const [sp] = useSearchParams()
  const login = useAuth((s) => s.login)
  const user = useAuth((s) => s.user)
  const identifier = location.state?.identifier ?? user?.email ?? ''
  const signupMode = sp.get('mode') === 'signup'
  const [role, setRole] = useState('needer')

  const go = () => {
    if (signupMode) {
      const signupRole = ['partner', 'agent'].includes(role) ? role : 'needer'
      navigate(`/auth/register?role=${signupRole}${sp.get('returnTo') ? `&returnTo=${encodeURIComponent(sp.get('returnTo'))}` : ''}`)
      return
    }
    const account = accountFor(role, identifier)
    login(account, role)
    toast(`Welcome, ${account.firstName}`)
    navigate(sp.get('returnTo') || ROLE_HOME[role], { replace: true })
  }

  return (
    <AuthFrame icon={LayoutGrid} title={signupMode ? 'Choose your role' : 'Welcome!'} subtitle={signupMode ? 'Select how you will use Needibi Serve, then create your account.' : 'Please fill in the details to get started.'} wide aside={false}>
      {identifier && (
        <div className="mb-5 flex items-center gap-3 rounded-xl bg-surface-2 p-3">
          <Avatar name={accountFor('needer', identifier).name} hue={20} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">Signed in as</p>
            <p className="truncate text-sm font-semibold text-text">{identifier}</p>
          </div>
          <Link to="/auth/login" className="text-sm font-semibold text-action-fg hover:underline">Change</Link>
        </div>
      )}
      <RolePicker value={role} onChange={setRole} accountType={signupMode} workspace={!signupMode} />
      <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4 text-sm">
        <CircleCheck size={18} className="mt-0.5 shrink-0 text-trust-fg" />
        <p className="text-muted"><span className="font-semibold text-text">Demo data is ready.</span> Choose any role to preview its workspace with realistic requests, offers, messages and activity.</p>
      </div>
      <Button variant="primary" size="lg" block className="role-picker-cta mt-6" onClick={go}>
        {signupMode ? 'Sign up' : 'Continue'} as {['agent', 'admin'].includes(role) ? 'an' : 'a'} {(signupMode && ACCOUNT_ROLE_OPTIONS.find((o) => o.value === role)?.title) || ROLE_LABEL[role]} <ArrowRight size={18} />
      </Button>
    </AuthFrame>
  )
}

/* ------------------------------------------------------------------ Partner onboarding & KYC */
export function PartnerOnboarding() {
  const navigate = useNavigate()
  const login = useAuth((s) => s.login)
  const user = useAuth((s) => s.user)
  const [step, setStep] = useState(0)
  const [cats, setCats] = useState(['home-furniture'])
  const [areas, setAreas] = useState(['Gasabo'])
  const [idFiles, setIdFiles] = useState([])
  const [selfie, setSelfie] = useState([])
  const [docs, setDocs] = useState([])
  const [sig, setSig] = useState('')
  const [plan, setPlan] = useState('Starter')
  const steps = ['Business', 'Categories & areas', 'KYC', 'Agreement', 'Plan']
  const name = user?.name ?? 'Diane Uwase'
  const next = () => setStep((s) => s + 1)
  const toggle = (list, setList, v) => setList(list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <AuthFrame icon={Building} panel="partner" title="Set up your Partner account" subtitle="Verified Partners get matched to real Needs. This takes about 5 minutes." wide>
      <LifecycleStepper steps={steps} current={step} className="mb-8" />
      {step === 0 && (
        <div className="space-y-5">
          <Field label="Business name">{(p) => <Input {...p} defaultValue={user?.partnerName ?? ''} />}</Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business type">{(p) => <Select {...p}><option>Company (Ltd)</option><option>Sole proprietor</option><option>Cooperative</option><option>Freelancer</option></Select>}</Field>
            <Field label="TIN / RDB number" optional>{(p) => <Input {...p} inputMode="numeric" />}</Field>
          </div>
          <Field label="Short description" hint="Shown on your public profile. No phone numbers or links.">{(p) => <Input {...p} placeholder="e.g. Professional cleaning teams across Kigali" />}</Field>
          <Button variant="primary" size="lg" onClick={next}>Continue <ArrowRight size={16} /></Button>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <p className="mb-2 font-semibold text-text">Categories you serve</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c.slug} type="button" aria-pressed={cats.includes(c.slug)} onClick={() => toggle(cats, setCats, c.slug)} className={cn('rounded-full border px-3 py-1.5 text-sm font-medium', cats.includes(c.slug) ? 'border-primary-900 bg-primary-900 text-white dark:bg-primary dark:text-primary-900' : 'border-border-strong text-text')}>{c.name}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 font-semibold text-text">Districts you cover</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(DISTRICTS).map((d) => (
                <button key={d} type="button" aria-pressed={areas.includes(d)} onClick={() => toggle(areas, setAreas, d)} className={cn('rounded-full border px-3 py-1.5 text-sm font-medium', areas.includes(d) ? 'border-trust-600 bg-trust-100 text-trust-fg' : 'border-border-strong text-text')}>{d}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3"><Button variant="outline" size="lg" onClick={() => setStep(0)}>Back</Button><Button variant="primary" size="lg" disabled={!cats.length || !areas.length} onClick={next}>Continue</Button></div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-5">
          <Alert tone="info" title="Why we verify">KYC keeps Needers safe and lets you show the ✓ Verified badge. Documents are never shown publicly.</Alert>
          <div>
            <p className="mb-2 flex items-center gap-2 font-semibold text-text"><IdCard size={18} /> National ID (front & back)</p>
            <FileUploader files={idFiles} onChange={setIdFiles} compact label="Upload ID photos" hint="JPG or PNG, up to 5 MB" accept="image/*" />
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 font-semibold text-text"><Camera size={18} /> Live selfie</p>
            <FileUploader files={selfie} onChange={setSelfie} compact multiple={false} label="Take or upload a selfie" hint="Face clearly visible, no hat or glasses" accept="image/*" />
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 font-semibold text-text"><Building size={18} /> Business documents <span className="font-normal text-muted">(optional for freelancers)</span></p>
            <FileUploader files={docs} onChange={setDocs} compact label="RDB certificate, licences" hint="PDF or image, up to 10 MB" accept="image/*,application/pdf" />
          </div>
          <div className="flex gap-3"><Button variant="outline" size="lg" onClick={() => setStep(1)}>Back</Button><Button variant="primary" size="lg" disabled={!idFiles.length || !selfie.length} onClick={next}>Submit for verification</Button></div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-5">
          <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-surface-2 p-5 text-sm leading-6 text-text">
            <p className="font-bold">Needibi Serve Partner Agreement · v3.2</p>
            <p className="mt-2">1. You will keep your KYC information accurate and up to date.</p>
            <p className="mt-2">2. You will deliver as agreed in each structured Agreement and upload evidence on delivery.</p>
            <p className="mt-2">3. Payments are collected into escrow; platform fees are deducted per your level and plan.</p>
            <p className="mt-2">4. You will keep all communication on-platform until contact details are unlocked.</p>
            <p className="mt-2">5. Disputes are reviewed by Needibi staff and may result in refund, release or partial release.</p>
          </div>
          <Field label="Type your full name to sign" hint={`Must match: ${name}`}>{(p) => <Input {...p} value={sig} onChange={(e) => setSig(e.target.value)} className="font-display text-lg italic" />}</Field>
          <div className="flex gap-3"><Button variant="outline" size="lg" onClick={() => setStep(2)}>Back</Button><Button variant="primary" size="lg" disabled={sig.trim().toLowerCase() !== name.toLowerCase()} onClick={next}><Signature size={16} /> Sign agreement</Button></div>
        </div>
      )}
      {step === 4 && (
        <div className="space-y-5">
          <RadioCards
            value={plan}
            onChange={setPlan}
            columns={3}
            options={[
              { value: 'Starter', label: 'Starter · Free', description: '18% fee · 1 Deal', icon: <Award size={18} /> },
              { value: 'Growth', label: 'Growth · RWF 15,000/mo', description: '15% fee · 10 Deals', icon: <Award size={18} /> },
              { value: 'Pro', label: 'Pro · RWF 45,000/mo', description: '12% fee · unlimited', icon: <Award size={18} /> },
            ]}
          />
          <Alert tone="trust" title="Verification submitted">Most checks complete within 24 hours. You can explore your dashboard now; Serve unlocks when you're verified.</Alert>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              const base = DEMO_ACCOUNTS.find((a) => a.id === 'p-cleanpro')
              login({ ...base, ...(user ?? {}), roles: [...new Set(['partner', ...(user?.roles ?? [])])], partnerId: user?.partnerId ?? 'pt-cleanpro' }, 'partner')
              toast(`Welcome to Needibi Serve · ${plan} plan`)
              navigate('/app/partner/home')
            }}
          >
            <Check size={16} /> Finish and go to dashboard
          </Button>
        </div>
      )}
    </AuthFrame>
  )
}
