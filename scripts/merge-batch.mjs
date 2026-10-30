// Merges a batch of translations for all three languages at once.
// stdin: { "fr": { "English": "French" }, "rw": {...}, "sw": {...} }
// Keys absent from ui.en.json are rejected so typos cannot create dead entries.
// Run: node scripts/merge-batch.mjs < batch.json
import fs from 'node:fs'

const batch = JSON.parse(fs.readFileSync(0, 'utf8'))
const en = JSON.parse(fs.readFileSync('src/locales/ui.en.json', 'utf8'))
const enKeys = Object.keys(en)

for (const lang of ['fr', 'rw', 'sw']) {
  if (!batch[lang]) continue
  const file = `src/locales/ui.${lang}.json`
  const current = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
  const unknown = []
  let added = 0
  for (const [k, v] of Object.entries(batch[lang])) {
    if (!(k in en)) { unknown.push(k); continue }
    if (!String(v).trim()) continue
    if (!(k in current)) added++
    current[k] = v
  }
  const ordered = {}
  for (const k of enKeys) if (k in current) ordered[k] = current[k]
  fs.writeFileSync(file, JSON.stringify(ordered, null, 1) + '\n')
  console.log(`${lang}: +${added}, ${Object.keys(ordered).length}/${enKeys.length}`)
  if (unknown.length) console.log(`  rejected ${unknown.length}: ${unknown.slice(0, 5).map((s) => JSON.stringify(s)).join(', ')}`)
}
