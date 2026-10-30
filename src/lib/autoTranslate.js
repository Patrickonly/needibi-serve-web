import i18n from './i18n'
import { translatePhrase } from './phrases'

// Pages and components that do not call useTx still follow the chosen language: this walks the
// document and swaps any text we have a translation for, remembering the English original.
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt']
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'])
const texts = new WeakMap()
const attrs = new WeakMap()

const lang = () => i18n.resolvedLanguage ?? i18n.language ?? 'en'

function convert(orig, lng) {
  const core = orig.trim()
  if (!core || lng.startsWith('en')) return orig
  const out = translatePhrase(lng, core)
  return out === core ? orig : orig.replace(core, out)
}

function doText(node, lng) {
  const rec = texts.get(node)
  const orig = rec && node.data === rec.out ? rec.orig : node.data
  const out = convert(orig, lng)
  texts.set(node, { orig, out })
  if (node.data !== out) node.data = out
}

function doAttrs(el, lng) {
  let rec = attrs.get(el)
  for (const name of ATTRS) {
    const cur = el.getAttribute(name)
    if (cur == null) continue
    const prev = rec?.[name]
    const orig = prev && cur === prev.out ? prev.orig : cur
    const out = convert(orig, lng)
    rec ??= {}
    rec[name] = { orig, out }
    if (cur !== out) el.setAttribute(name, out)
  }
  if (rec) attrs.set(el, rec)
}

function walk(root, lng) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.nodeType === 1 && (SKIP.has(n.tagName) || n.closest?.('[data-no-translate]')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  })
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    if (n.nodeType === 3) doText(n, lng)
    else doAttrs(n, lng)
  }
}

export function startAutoTranslate() {
  let queued = false
  const run = () => {
    queued = false
    if (document.body) walk(document.body, lang())
  }
  const schedule = () => {
    if (queued) return
    queued = true
    requestAnimationFrame(run)
  }
  new MutationObserver(schedule).observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS,
  })
  i18n.on('languageChanged', schedule)
  schedule()
}
