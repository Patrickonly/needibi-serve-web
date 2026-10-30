// Builds src/locales/ui.en.json: the full key list the ui.<lang>.json files must cover.
// Run: node scripts/extract-strings.mjs && node scripts/missing-strings.mjs && node scripts/build-ui-keys.mjs
import fs from 'node:fs'

const missing = JSON.parse(fs.readFileSync('scripts/missing.json', 'utf8'))
const en = Object.fromEntries(missing.map((s) => [s, s]))
fs.writeFileSync('src/locales/ui.en.json', JSON.stringify(en, null, 1) + '\n')

for (const lang of ['fr', 'rw', 'sw']) {
  const file = `src/locales/ui.${lang}.json`
  if (!fs.existsSync(file)) fs.writeFileSync(file, '{}\n')
}
console.log('ui.en.json keys', missing.length)
