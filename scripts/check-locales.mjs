// Verifies the UI locale files line up with the English key list.
// Run: node scripts/check-locales.mjs
import fs from 'node:fs'

const dir = 'src/locales'
const en = JSON.parse(fs.readFileSync(`${dir}/ui.en.json`, 'utf8'))
const keys = Object.keys(en)
let bad = 0

for (const lang of ['fr', 'rw', 'sw']) {
  const file = `${dir}/ui.${lang}.json`
  const t = JSON.parse(fs.readFileSync(file, 'utf8'))
  const missing = keys.filter((k) => !t[k] || !String(t[k]).trim())
  const extra = Object.keys(t).filter((k) => !(k in en))
  const same = keys.filter((k) => t[k] === k && /[a-z] [a-z]/.test(k))
  console.log(`${lang}: ${Object.keys(t).length}/${keys.length} translated, missing ${missing.length}, extra ${extra.length}, untouched ${same.length}`)
  if (missing.length) console.log(`  first missing: ${missing.slice(0, 5).map((s) => JSON.stringify(s)).join(', ')}`)
  if (extra.length) console.log(`  first extra: ${extra.slice(0, 5).map((s) => JSON.stringify(s)).join(', ')}`)
  bad += missing.length + extra.length
}

console.log(bad === 0 ? 'OK' : `${bad} problems`)
process.exit(bad === 0 ? 0 : 1)
