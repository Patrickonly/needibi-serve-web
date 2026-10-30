import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, Clock, Globe, PhoneCall } from 'lucide-react'
import { Logo } from '@/design-system'
import { LanguageMenu } from './HeaderMenus'

const COLUMNS = [
  ['Get to know us', [['About', '/about'], ['How it works', '/how-it-works'], ['Trust & Safety', '/trust-safety'], ['Careers', '/careers'], ['Blog', '/help']]],
  ['Earn with Needibi', [['Become a Partner', '/become-a-partner'], ['Become an agent', '/become-an-agent'], ['List your services', '/become-a-partner#deals'], ['Partner guide', '/manual']]],
  ['Let us help', [['Contact us', '/contact'], ['Help Centre', '/help'], ['FAQ', '/faq'], ['User manual', '/manual'], ['Support ticket', '/app/needer/support'], ['Disputes', '/app/needer/disputes']]],
  ['Legal', [['Terms', '/legal/terms'], ['Privacy', '/legal/privacy'], ['Cookies', '/legal/cookies'], ['Partner Agreement', '/legal/partner-agreement']]],
]

const CONTACTS = [
  [Mail, 'Email', 'info@needibi.com', 'mailto:info@needibi.com'],
  [Phone, 'Phone', '+250 788 813 062', 'tel:+250788813062'],
  [MapPin, 'Location', 'Kigali, Rwanda'],
  [Clock, 'Hours', 'Mon - Sun, 24/7 Support'],
]

// Simple monochrome brand glyphs (lucide no longer ships brand icons)
const SOCIAL = [
  ['Facebook', 'M14 8h2V5h-2.5C11 5 10 6.6 10 9v2H8v3h2v7h3v-7h2.4l.6-3h-3V9.3c0-.8.3-1.3 1-1.3z'],
  ['Instagram', 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 5a4 4 0 100 8 4 4 0 000-8zm5.5-1.5a1 1 0 100 2 1 1 0 000-2z'],
  ['X', 'M4 4h4.6l3.7 5.1L16.7 4H20l-6.1 7 6.5 9h-4.6l-4-5.6L6.8 20H3.5l6.6-7.6z'],
  ['LinkedIn', 'M5 9h3v11H5zM6.5 4a1.8 1.8 0 110 3.6 1.8 1.8 0 010-3.6zM10 9h2.9v1.5c.4-.8 1.5-1.7 3.1-1.7 3.2 0 3.9 2 3.9 4.7V20h-3v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9V20h-3z'],
  ['YouTube', 'M21.6 7.2a2.5 2.5 0 00-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 002.4 7.2 26 26 0 002 12a26 26 0 00.4 4.8 2.5 2.5 0 001.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 001.8-1.8A26 26 0 0022 12a26 26 0 00-.4-4.8zM10 15V9l5.2 3z'],
]

/** App Store / Google Play badge with a "Soon" tag until the apps launch. */
export function StoreBadge({ store, soon = true }) {
  const apple = store === 'App Store'
  return (
    <a href="#app" className="relative inline-flex h-14 w-[188px] items-center gap-3 rounded-xl border border-white/15 bg-black px-4 text-white transition hover:border-white/40" aria-label={`${apple ? 'Download on the App Store' : 'Get it on Google Play'}${soon ? ' — coming soon' : ''}`}>
      {apple ? (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.5 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9s-2-.9-3.3-.8a4.9 4.9 0 00-4.1 2.5c-1.8 3-.5 7.5 1.3 10 .8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8 2.2-1.2 3-2.4a10 10 0 001.4-2.8 4.3 4.3 0 01-2.5-4.2zM14 5.2a4.3 4.3 0 001-3.2 4.4 4.4 0 00-2.9 1.5 4.1 4.1 0 00-1 3.1A3.7 3.7 0 0014 5.2z" /></svg>
      ) : (
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#00D7FE" d="M3.7 2.5 13.3 12l-9.6 9.5c-.4-.2-.6-.6-.6-1.1V3.6c0-.5.2-.9.6-1.1z" />
          <path fill="#FFCE00" d="M16.6 15.3 13.3 12l3.3-3.3 3.8 2.2c1 .6 1 1.6 0 2.2z" />
          <path fill="#00F076" d="M3.7 2.5c.4-.2.9-.2 1.4.1l11.5 6.1-3.3 3.3z" />
          <path fill="#F63448" d="M13.3 12l3.3 3.3-11.5 6.1c-.5.3-1 .3-1.4.1z" />
        </svg>
      )}
      <span className="text-left leading-tight">
        <span className="block text-[11px] text-white/75">{apple ? 'Download on the' : 'Get it on'}</span>
        <span className="block text-base font-semibold">{store}</span>
      </span>
      {soon && <span className="absolute -right-2 -top-2.5 rounded-full bg-action-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-card">Soon</span>}
    </a>
  )
}

export function PaymentLogos({ className = '' }) {
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`} aria-label="Accepted payment methods">
      {[
        ['MTN MoMo', ''],
        ['Airtel Money', ''],
        ['VISA', 'italic'],
        ['Mastercard', ''],
      ].map(([l, c]) => (
        <li key={l} className={`rounded-md bg-surface px-2.5 py-1.5 text-xs font-extrabold tracking-tight text-text ring-1 ring-border ${c}`}>
          {l}
        </li>
      ))}
    </ul>
  )
}

export function ContactSection({ className = 'container-page pt-12 sm:pt-14' }) {
  return (
      <section aria-labelledby="footer-contact" className={className}>
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-yellow)]/40 bg-[var(--brand-yellow)]/10 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-yellow)]"><PhoneCall size={13} /> We are here</p>
          <h2 id="footer-contact" className="mt-4 font-display text-3xl font-extrabold tracking-[-0.02em] sm:text-4xl">Contact <span className="text-[var(--brand-yellow)]">Us</span></h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-white/70">Get in touch with our team. We are here to help, day and night.</p>
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CONTACTS.map(([ContactIcon, label, value, href]) => (
            <li key={label} className="group relative flex flex-col items-start overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-[var(--brand-yellow)]/60 hover:bg-white/[0.07]">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-yellow)] text-primary-900 ring-8 ring-[var(--brand-yellow)]/15 transition group-hover:-rotate-6"><ContactIcon size={24} strokeWidth={2.2} /></span>
              <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.14em] text-white/50">{label}</h3>
              {href ? <a href={href} className="mt-1.5 break-all font-display text-lg font-bold text-white transition hover:text-[var(--brand-yellow)]">{value}</a> : <p className="mt-1.5 font-display text-lg font-bold text-white">{value}</p>}
            </li>
          ))}
        </ul>
      </section>
  )
}


export function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-[#0e1730] text-white">
      <div className="h-1.5 bg-[var(--brand-yellow)]" aria-hidden="true" />

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1.1fr_1.6fr]">
        <div>
          <Logo onDark />
          <p className="mt-5 max-w-sm text-[15px] leading-7 text-white/70">Ask for what you need, compare trusted offers and follow every job from your phone.</p>
          <div className="mt-8 flex flex-wrap items-start gap-3">
            <StoreBadge store="App Store" />
            <StoreBadge store="Google Play" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {COLUMNS.map(([title, links]) => (
            <nav key={title} aria-label={title} className="min-w-0">
              <h2 className="font-display text-base font-extrabold tracking-tight text-white">{title}</h2>
              <span className="mt-2 block h-[3px] w-8 rounded-full bg-[var(--brand-yellow)]" aria-hidden="true" />
              <ul className="mt-5 space-y-1">
                {links.map(([l, to]) => (
                  <li key={l}>
                    <Link to={to} className="group -mx-1 inline-flex min-h-9 items-center gap-1.5 rounded px-1 text-[15px] text-white/70 transition hover:text-white">
                      <span className="h-px w-0 bg-[var(--brand-yellow)] transition-all duration-200 group-hover:w-3" aria-hidden="true" />
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <ContactSection className="container-page pb-14" />

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 pb-24 md:pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-white/60">
            <p>© {new Date().getFullYear()} <span className="font-semibold text-white/85">NEEDIBI SERVE</span> — All rights reserved.</p>
            <p className="mt-0.5 text-xs">Powered by NEEDIBI ONLINE SERVICES LTD</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageMenu />
            <span className="flex items-center gap-1.5 rounded-md px-2 text-sm font-bold"><Globe size={16} /> Rwanda</span>
            <ul className="flex gap-2" aria-label="Social media">
              {SOCIAL.map(([name, d]) => (
                <li key={name}>
                  <a href="#social" aria-label={name} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-[var(--brand-yellow)] hover:bg-[var(--brand-yellow)] hover:text-primary-900">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={d} /></svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}
