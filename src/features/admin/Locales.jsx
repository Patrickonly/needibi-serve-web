import { useState } from 'react'
import { Plus, Trash, Globe2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import i18n from '@/lib/i18n'
import { toast, useUI } from '@/lib/store'
import { countryFlag } from '@/lib/countries'
import { useLocales, flagSrc, TRANSLATED } from '@/lib/locales'
import { Button, Card, CardTitle, Field, Input, Switch } from '@/design-system'
import { PageHeader } from '@/components/layout/AppShell'

const LANG_COVERAGE = { en: 100, rw: 94, fr: 88, sw: 81 }

export function LanguagesManager() {
  const { languages, addLanguage, toggleLanguage, removeLanguage } = useLocales()
  const current = useUI((s) => s.language)
  const setLanguage = useUI((s) => s.setLanguage)
  const [form, setForm] = useState({ label: '', code: '', flag: '' })
  const [error, setError] = useState('')

  const fallbackToEnglish = (code) => {
    if (current !== code) return
    setLanguage('en')
    i18n.changeLanguage('en')
  }
  const submit = (e) => {
    e.preventDefault()
    const label = form.label.trim()
    const code = form.code.trim().toLowerCase()
    const flag = form.flag.trim().toLowerCase()
    if (!label) return setError('Enter the language name, e.g. Luganda.')
    if (!/^[a-z]{2,3}$/.test(code)) return setError('The language code must be 2 or 3 letters, e.g. lg.')
    if (languages.some((l) => l.code === code)) return setError(`${code.toUpperCase()} is already in the list.`)
    if (!/^[a-z]{2}$/.test(flag)) return setError('The flag is a 2-letter country code, e.g. ug.')
    addLanguage({ code, label, short: code.toUpperCase(), flag })
    setForm({ label: '', code: '', flag: '' })
    setError('')
    toast(`${label} added`, { description: 'Text without a translation shows in English until one is uploaded.' })
  }
  const toggle = (l) => {
    if (l.enabled !== false) fallbackToEnglish(l.code)
    toggleLanguage(l.code)
  }
  const remove = (l) => {
    fallbackToEnglish(l.code)
    removeLanguage(l.code)
    toast(`${l.label} removed`)
  }

  return (
    <Card>
      <CardTitle sub="Add, remove, and enable languages available in the header and account settings. English is the default and is always on.">Manage languages</CardTitle>
      <ul className="divide-y divide-border rounded-card border border-border">
        {languages.map((l) => {
          const translated = TRANSLATED.includes(l.code)
          const on = l.enabled !== false
          return (
            <li key={l.code} className="flex items-center gap-3 px-4 py-3">
              <img src={flagSrc(l.flag)} alt="" className="h-5 w-7 shrink-0 rounded-sm object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-text">{l.label} <span className="text-xs font-medium text-muted">{l.code.toUpperCase()}</span></span>
                <span className="text-xs text-muted">{translated ? `${LANG_COVERAGE[l.code] ?? 100}% translated` : 'Shows English until translated'}{!on && ' · hidden from visitors'}</span>
              </span>
              {translated && (
                <span className="hidden h-2 w-24 overflow-hidden rounded-full bg-grey-100 sm:block" aria-hidden="true"><span className="block h-full bg-trust-600" style={{ width: `${LANG_COVERAGE[l.code] ?? 100}%` }} /></span>
              )}
              <Switch checked={on} onChange={() => toggle(l)} disabled={l.code === 'en'} label={`${l.label} enabled`} className="[&_label]:sr-only" />
              {l.code === 'en' ? (
                <span className="w-8" aria-hidden="true" />
              ) : (
                <Button variant="ghost" size="icon-sm" aria-label={`Remove ${l.label}`} title="Remove" onClick={() => remove(l)}><Trash size={16} /></Button>
              )}
            </li>
          )
        })}
      </ul>
      <form onSubmit={submit} noValidate className="mt-5 grid gap-3 sm:grid-cols-[1.4fr_.7fr_.8fr_auto] sm:items-end">
        <Field label="Language name">{(p) => <Input {...p} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Luganda" />}</Field>
        <Field label="Code">{(p) => <Input {...p} value={form.code} maxLength={3} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="lg" />}</Field>
        <Field label="Flag (country code)">{(p) => <Input {...p} value={form.flag} maxLength={2} onChange={(e) => setForm({ ...form, flag: e.target.value })} placeholder="ug" />}</Field>
        <Button type="submit" variant="primary"><Plus size={16} /> Add language</Button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-danger-fg">{error}</p>}
    </Card>
  )
}

export function CountriesManager() {
  const { countries, addCountry, removeCountry } = useLocales()
  const enabledCountries = useUI((s) => s.enabledCountries)
  const setEnabledCountries = useUI((s) => s.setEnabledCountries)
  const [form, setForm] = useState({ name: '', code: '' })
  const [error, setError] = useState('')

  const toggleDeals = (code) => setEnabledCountries(enabledCountries.includes(code) ? enabledCountries.filter((c) => c !== code) : [...enabledCountries, code])
  const submit = (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const code = form.code.trim().toUpperCase()
    if (!name) return setError('Enter the country name, e.g. Zambia.')
    if (!/^[A-Z]{2}$/.test(code)) return setError('The country code must be the 2-letter ISO code, e.g. ZM.')
    if (countries.some((c) => c.code === code)) return setError(`${code} is already in the list.`)
    addCountry({ code, name, flag: code.toLowerCase() })
    setForm({ name: '', code: '' })
    setError('')
    toast(`${name} added`, { description: 'Turn on Deals for it when you are ready to serve it.' })
  }
  const remove = (country) => {
    removeCountry(country.code)
    setEnabledCountries(enabledCountries.filter((c) => c !== country.code))
    toast(`${country.name} removed`)
  }

  return (
    <Card>
      <CardTitle sub="Add or remove supported countries and switch Deals on or off by market. Rwanda is the home market and cannot be removed.">Manage countries</CardTitle>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => {
          const active = enabledCountries.includes(country.code)
          return (
            <div key={country.code} className={cn('flex items-center gap-3 rounded-card border p-3 transition', active ? 'border-action-500 bg-action-soft' : 'border-border')}>
              <img src={countryFlag(country.code)} alt="" className="h-5 w-7 shrink-0 rounded-sm object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-text">{country.name}</span>
                <span className="text-xs text-muted">{country.code} · {active ? 'Deals on' : 'Deals off'}</span>
              </span>
              <Switch checked={active} onChange={() => toggleDeals(country.code)} label={`Deals in ${country.name}`} className="[&_label]:sr-only" />
              {country.code !== 'RW' && <Button variant="ghost" size="icon-sm" aria-label={`Remove ${country.name}`} title="Remove" onClick={() => remove(country)}><Trash size={16} /></Button>}
            </div>
          )
        })}
      </div>
      <form onSubmit={submit} noValidate className="mt-5 grid gap-3 sm:grid-cols-[1.6fr_.7fr_auto] sm:items-end">
        <Field label="Country name">{(p) => <Input {...p} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Zambia" />}</Field>
        <Field label="ISO code">{(p) => <Input {...p} value={form.code} maxLength={2} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ZM" />}</Field>
        <Button type="submit" variant="primary"><Plus size={16} /> Add country</Button>
      </form>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-danger-fg">{error}</p>}
      <p className="mt-4 flex items-center gap-2 text-xs text-muted"><Globe2 size={14} /> A visitor outside the countries with Deals on will not see Deals until their country is switched on here.</p>
    </Card>
  )
}

export function LocalesPage() {
  return (
    <>
      <PageHeader title="Languages & countries" subtitle="Choose which languages visitors can use and which countries Needibi serves." />
      <div className="space-y-6">
        <LanguagesManager />
        <CountriesManager />
      </div>
    </>
  )
}
