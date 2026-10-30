// Extracts user-visible English strings from the JSX source so the locale tables can cover them.
// Run: node scripts/extract-strings.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = 'src'
const SKIP_DIRS = new Set(['locales', 'mocks'])
const ATTRS = ['placeholder', 'aria-label', 'title', 'label', 'alt', 'sub', 'summary', 'hint', 'empty', 'description', 'kicker', 'cta']

function* walkDirs(dir) {
  yield dir
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory() && !SKIP_DIRS.has(f.name)) yield* walkDirs(path.join(dir, f.name))
  }
}

const files = []
for (const dir of walkDirs(ROOT)) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.isFile() && /\.jsx?$/.test(f.name) && !f.name.endsWith('.test.js')) files.push(path.join(dir, f.name))
  }
}

// Anything that smells like source code rather than copy shown to a person.
const CODE = [
  /[={}()[\]`$;|\\<>@#]/,
  /=>|\?\.|\.\.\./,
  /[a-zA-Z]\.[a-zA-Z]/,
  /\b(const|let|return|null|undefined|typeof|props|className|length|includes|slice|map|filter|data|status|href|true|false)\b/,
  /^[a-z][a-zA-Z0-9]*$/,
  /^(https?:|\/|#)/,
]

const found = new Set()
const add = (s) => {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length < 2 || t.length > 180) return
  if (!/^[A-Za-z0-9“'"]/.test(t)) return
  if (!/[A-Za-z]{2}/.test(t)) return
  if (CODE.some((re) => re.test(t))) return
  if (!/[A-Z]/.test(t) && !/ /.test(t)) return
  found.add(t)
}

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  for (const m of src.matchAll(/>([^<>{}\n][^<>{}]*)</g)) add(m[1])
  const attrRe = new RegExp(`\\b(${ATTRS.join('|')})="([^"]+)"`, 'g')
  for (const m of src.matchAll(attrRe)) add(m[2])
  for (const m of src.matchAll(/'([^'\\\n]{3,180})'/g)) {
    const t = m[1]
    if (/^[A-Z]/.test(t) && /[a-z]/.test(t) && /[ .?!]/.test(t)) add(t)
  }
}

const out = [...found].sort((a, b) => a.localeCompare(b))
fs.writeFileSync('scripts/strings.json', JSON.stringify(out, null, 1))
console.log('files', files.length, 'strings', out.length)
