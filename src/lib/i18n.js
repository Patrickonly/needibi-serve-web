import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/locales/en.json'
import rw from '@/locales/rw.json'
import fr from '@/locales/fr.json'
import sw from '@/locales/sw.json'
import { readStorage } from './storage'

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN', flag: 'gb' },
  { code: 'rw', label: 'Kinyarwanda', short: 'RW', flag: 'rw' },
  { code: 'fr', label: 'Français', short: 'FR', flag: 'fr' },
  { code: 'sw', label: 'Kiswahili', short: 'SW', flag: 'tz' },
]

const initial = readStorage('ns-ui')?.state?.language ?? 'en'

i18n.use(initReactI18next).init({
  resources: { en: { t: en }, rw: { t: rw }, fr: { t: fr }, sw: { t: sw } },
  lng: initial,
  fallbackLng: 'en',
  defaultNS: 't',
  interpolation: { escapeValue: false },
})

document.documentElement.setAttribute('lang', initial)
i18n.on('languageChanged', (lng) => document.documentElement.setAttribute('lang', lng))

export default i18n
