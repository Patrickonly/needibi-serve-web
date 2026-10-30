// Reports which extracted UI strings have no translation yet, and writes scripts/missing.json.
// Run: node scripts/missing-strings.mjs
import fs from 'node:fs'

const strings = JSON.parse(fs.readFileSync('scripts/strings.json', 'utf8'))
const phrases = fs.readFileSync('src/locales/phrases.js', 'utf8')
const known = new Set(JSON.parse(phrases.match(/export const PHRASES_EN = (\[[\s\S]*?\])\s*\r?\n/)[1]))

const lib = fs.readFileSync('src/lib/phrases.js', 'utf8')
for (const m of lib.matchAll(/'((?:[^'\\]|\\.)*)':/g)) known.add(m[1].replace(/\\'/g, "'"))

// Leftovers from the regex scrape that are not translatable copy.
const NOISE = [
  /^\d/,
  /^[A-Za-z]+:$/,
  /·/,
  /^[A-Z]{2,}$/,
  /^[A-Z][a-z]+ [A-Z]\.$/, // person names: "Aline M."
  /^(MTN|Airtel|Needibi|WhatsApp|App Store|Google Play|Android app|iOS app|Blog|Instagram|Facebook|X|TikTok)/,
  /^(Kigali|Huye|Musanze|Rubavu|Nyagatare|Kimihurura|Kagarama|Gasabo|Kicukiro|Nyarugenge|Rwanda|Tanzania|France)/,
  /^[A-Z][a-z]+ (Events|Ltd|Limited|Group|Co|Studio|Services)$/,
  /^(Aline|Patrick|Sandrine|Ange|Jean-Paul|Eric|Claudine|Diane|Emmanuel|Olivier|Josiane)\b/,
  /^v\d/,
]

const missing = strings.filter((s) => !known.has(s) && !NOISE.some((re) => re.test(s)))
fs.writeFileSync('scripts/missing.json', JSON.stringify(missing, null, 1))
console.log('extracted', strings.length, 'known', known.size, 'missing', missing.length)
