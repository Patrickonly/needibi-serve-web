import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '@/lib/storage'
import { LANGUAGES } from '@/lib/i18n'
import { COUNTRIES, COUNTRY_BY_CODE } from '@/lib/countries'

// Languages with bundled translations; any other language an admin adds falls back to English.
export const TRANSLATED = ['en', 'rw', 'fr', 'sw']
const LOCAL_FLAGS = ['gb', 'rw', 'fr', 'tz']

export function flagSrc(flag) {
  const f = String(flag ?? '').toLowerCase()
  return LOCAL_FLAGS.includes(f) ? `/flags/${f}.svg` : `https://flagcdn.com/w40/${f}.png`
}

const DEFAULT_LANGUAGES = LANGUAGES.map((l) => ({ ...l, enabled: true }))

/** Admin-managed language and country lists. English and Rwanda are the defaults and cannot be removed. */
export const useLocales = create(
  persist(
    (set) => ({
      languages: DEFAULT_LANGUAGES,
      countries: COUNTRIES,
      addLanguage: (lang) => set((s) => (s.languages.some((l) => l.code === lang.code) ? s : { languages: [...s.languages, { ...lang, enabled: true }] })),
      toggleLanguage: (code) => set((s) => ({ languages: s.languages.map((l) => (l.code === code && code !== 'en' ? { ...l, enabled: !l.enabled } : l)) })),
      removeLanguage: (code) => set((s) => ({ languages: s.languages.filter((l) => l.code === 'en' || l.code !== code) })),
      addCountry: (country) => set((s) => {
        if (s.countries.some((c) => c.code === country.code)) return s
        // countryName() reads this map, so admin-added markets show their name across the app.
        COUNTRY_BY_CODE[country.code] = country
        return { countries: [...s.countries, country] }
      }),
      removeCountry: (code) => set((s) => ({ countries: s.countries.filter((c) => c.code === 'RW' || c.code !== code) })),
    }),
    {
      name: 'needibi-locales',
      storage: createJSONStorage(() => safeStorage),
      onRehydrateStorage: () => (state) => state?.countries?.forEach((c) => { COUNTRY_BY_CODE[c.code] ??= c }),
    },
  ),
)
