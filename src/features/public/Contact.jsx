import { useState } from 'react'
import { Mail, Phone, MapPin, Headset, Clock, Building2, Send, LifeBuoy, CheckCircle2, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button, Input, Textarea, Select, Field } from '@/design-system'
import { PhoneInput } from '@/components/forms/inputs'

const CHANNELS = [
  { icon: Mail, label: 'Email us', value: 'info@needibi.com', href: 'mailto:info@needibi.com', note: '24/7 Support', noteIcon: Headset },
  { icon: Phone, label: 'Call us', value: '+250 788 813 062', href: 'tel:+250788813062', note: 'Mon – Sun, 24/7', noteIcon: Clock },
  { icon: MapPin, label: 'Visit us', value: 'KG 7 Ave, Kigali, Rwanda', href: 'https://maps.google.com/?q=KG+7+Ave+Kigali+Rwanda', note: 'Headquarters', noteIcon: Building2, external: true },
]

const SUBJECTS = [
  'General question',
  'Help with a request or booking',
  'Payments and refunds',
  'Becoming a provider',
  'Partnerships',
  'Press',
  'Report a safety issue',
]

const EMPTY = { name: '', email: '', subject: '', message: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ICON_TILE = 'grid shrink-0 place-items-center rounded-2xl bg-primary-700 text-white'

function validate(v) {
  const e = {}
  if (!v.name.trim()) e.name = 'Enter your full name'
  if (!v.email.trim()) e.email = 'Enter your email address'
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email, like name@example.com'
  if (!v.subject) e.subject = 'Choose a subject'
  if (v.message.trim().length < 10) e.message = 'Tell us a little more (at least 10 characters)'
  return e
}

export function Contact() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const update = (key) => (e) => {
    const value = e.target.value
    setValues((s) => ({ ...s, [key]: value }))
    if (errors[key]) setErrors(({ [key]: _, ...rest }) => rest)
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const form = e.currentTarget
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => form.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    setStatus('sending')
    setTimeout(() => setStatus('sent'), 700)
  }

  const reset = () => { setValues(EMPTY); setErrors({}); setStatus('idle') }

  return (
    <>
      <section className="public-gradient-hero text-white">
        <div className="container-page py-14 text-center sm:py-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#0b1f3a]">
            <MessageCircle size={14} aria-hidden="true" /> Contact
          </span>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight sm:text-6xl">Talk to our <span className="text-brand-yellow">team</span></h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/85 sm:text-xl">Questions, feedback, or support — reach us any time, 24/7.</p>
        </div>
      </section>

      <div className="container-page grid items-start gap-6 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-10">
        <div className="space-y-4">
          <ul className="space-y-4">
            {CHANNELS.map(({ icon: Icon, label, value, href, note, noteIcon: NoteIcon, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="group flex items-center gap-5 rounded-2xl border border-border border-l-4 border-l-brand-yellow bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-500 sm:p-6"
                >
                  <span className={cn(ICON_TILE, 'size-14')}><Icon size={22} aria-hidden="true" /></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
                    <span className="mt-1 block truncate text-lg font-semibold text-text group-hover:text-action-fg">{value}</span>
                    <span className="mt-1 flex items-center gap-1.5 text-sm text-action-fg"><NoteIcon size={14} aria-hidden="true" /> {note}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <div className="rounded-2xl border border-brand-yellow/60 bg-brand-yellow-soft p-5 sm:p-6">
            <p className="font-bold text-brand-yellow-fg">Already have a request or booking?</p>
            <p className="mt-1 text-sm text-text/80">A support ticket is the fastest way to get help. It links straight to your request, booking or payment.</p>
            <Button to="/app/needer/support" variant="gold" className="mt-4"><LifeBuoy size={16} /> Open a support ticket</Button>
          </div>
        </div>

        <div className="rounded-3xl border border-border border-t-4 border-t-brand-yellow bg-surface p-6 shadow-card sm:p-10">
          {status === 'sent' ? (
            <div className="py-6 text-center" role="status">
              <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-trust-600 text-white"><CheckCircle2 size={28} aria-hidden="true" /></span>
              <h2 className="mt-5 font-display text-2xl font-extrabold text-text">Message sent</h2>
              <p className="mx-auto mt-2 max-w-sm text-muted">
                Thanks, {values.name.trim().split(/\s+/)[0]}. We'll reply to <span className="font-semibold text-text">{values.email.trim()}</span> within 24 hours. Your reference is TK-020611.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button variant="primary" onClick={reset}>Send another message</Button>
                <Button variant="outline" to="/">Back to home</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center">
                <span className={cn(ICON_TILE, 'mx-auto size-16')}><Send size={26} aria-hidden="true" /></span>
                <h2 className="mt-5 font-display text-2xl font-extrabold text-text sm:text-3xl">Send us a message</h2>
                <p className="mt-2 text-muted">We'll get back to you within 24 hours</p>
              </div>
              <form noValidate onSubmit={onSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" error={errors.name}>{(p) => <Input {...p} size="lg" value={values.name} onChange={update('name')} placeholder="Aline Mukamana" autoComplete="name" />}</Field>
                <Field label="Email address" error={errors.email}>{(p) => <Input {...p} size="lg" type="email" value={values.email} onChange={update('email')} placeholder="aline@example.rw" autoComplete="email" />}</Field>
                <Field label="Phone number" optional>{(p) => <PhoneInput {...p} name="phone" />}</Field>
                <Field label="Subject" error={errors.subject}>
                  {(p) => (
                    <Select {...p} value={values.subject} onChange={update('subject')}>
                      <option value="" disabled>Select a subject</option>
                      {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Message" error={errors.message} className="sm:col-span-2">
                  {(p) => <Textarea {...p} rows={5} value={values.message} onChange={update('message')} placeholder="How can we help?" />}
                </Field>
                <Button type="submit" variant="primary" size="lg" block className="sm:col-span-2" disabled={status === 'sending'}>
                  <Send size={17} /> {status === 'sending' ? 'Sending…' : 'Send message'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
