import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { PHRASES_EN, PHRASES } from '@/locales/phrases'
import { MORE } from '@/locales/morePhrases'
import uiFr from '@/locales/ui.fr.json'
import uiRw from '@/locales/ui.rw.json'
import uiSw from '@/locales/ui.sw.json'

const UI = { fr: uiFr, rw: uiRw, sw: uiSw }

const INDEX = new Map(PHRASES_EN.map((p, i) => [p, i]))

// Labels added after the main phrase table was generated.
const EXTRA = {
  fr: { Status: 'Statut', Marketplace: 'Marché', 'Search menu or marketplace…': 'Rechercher dans le menu ou le marché…', 'Jump to': 'Aller à', Results: 'Résultats', 'All systems operational': 'Tous les systèmes fonctionnent', Terms: 'Conditions', 'Browse Deals': 'Parcourir les offres', 'Needs board': 'Tableau des besoins' },
  rw: { Status: 'Uko bihagaze', Marketplace: 'Isoko', 'Search menu or marketplace…': 'Shakisha muri menu cyangwa ku isoko…', 'Jump to': 'Jya kuri', Results: 'Ibisubizo', 'All systems operational': 'Byose birakora neza', Terms: 'Amabwiriza', 'Browse Deals': 'Reba poromosiyo', 'Needs board': "Urutonde rw'ibikenewe" },
  sw: { Status: 'Hali', Marketplace: 'Soko', 'Search menu or marketplace…': 'Tafuta kwenye menyu au soko…', 'Jump to': 'Nenda kwa', Results: 'Matokeo', 'All systems operational': 'Mifumo yote inafanya kazi', Terms: 'Masharti', 'Browse Deals': 'Vinjari ofa', 'Needs board': 'Ubao wa mahitaji' },
}

/** Translate a known English UI phrase; unknown text is returned unchanged. */
export function translatePhrase(lang, text) {
  if (typeof text !== 'string' || !lang || lang.startsWith('en')) return text
  const key = text.trim()
  const code = lang.slice(0, 2)
  if (UI[code]?.[key]) return UI[code][key]
  if (EXTRA[code]?.[key]) return EXTRA[code][key]
  if (MORE[code]?.[key]) return MORE[code][key]
  const i = INDEX.get(key)
  return i == null ? text : PHRASES[code]?.[i] ?? text
}

/** `tx('My Needs')` → the label in the current language. */
export function useTx() {
  const { i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? i18n.language
  return useCallback((text) => translatePhrase(lang, text), [lang])
}

/** Same as useTx, but also translates plain-text pieces inside mixed children like `<Icon /> Save`. */
export function useTxNode() {
  const tx = useTx()
  return useCallback((node) => (Array.isArray(node) ? node.map((n) => (typeof n === 'string' ? tx(n) : n)) : typeof node === 'string' ? tx(node) : node), [tx])
}
