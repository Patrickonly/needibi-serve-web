// Merges a JSON batch of translations (on stdin) into src/locales/ui.<lang>.json.
// Keys not present in ui.en.json are rejected, so typos cannot create dead entries.
// Run: node scripts/merge-locale.mjs fr < batch.json
import fs from 'node:fs'

const lang = process.argv[2]
if (!['fr', 'rw', 'sw'].includes(lang)) throw new Error('usage: merge-locale.mjs <fr|rw|sw>')

const raw = fs.readFileSync(0, 'utf8')
const batch = JSON.parse(raw)
const en = JSON.parse(fs.readFileSync('src/locales/ui.en.json', 'utf8'))
const file = `src/locales/ui.${lang}.json`
const current = JSON.parse(fs.readFileSync(file, 'utf8'))

const unknown = []
let added = 0
for (const [k, v] of Object.entries(batch)) {
  if (!(k in en)) { unknown.push(k); continue }
  if (!String(v).trim()) continue
  if (!(k in current)) added++
  current[k] = v
}

const ordered = {}
for (const k of Object.keys(en)) if (k in current) ordered[k] = current[k]
fs.writeFileSync(file, JSON.stringify(ordered, null, 1) + '\n')

console.log(`${lang}: +${added} new, ${Object.keys(ordered).length}/${Object.keys(en).length} total`)
if (unknown.length) {
  console.log(`rejected ${unknown.length} unknown keys:`)
  for (const k of unknown.slice(0, 10)) console.log('  ' + JSON.stringify(k))
}
