// Prints the next N untranslated English keys, so a batch can be written for them.
// Run: node scripts/next-batch.mjs [count]
import fs from 'node:fs'

const count = Number(process.argv[2] ?? 100)
const en = Object.keys(JSON.parse(fs.readFileSync('src/locales/ui.en.json', 'utf8')))
const have = ['fr', 'rw', 'sw'].map((l) => {
  const f = `src/locales/ui.${l}.json`
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : {}
})

const todo = en.filter((k) => have.some((t) => !t[k]))
console.log(`remaining ${todo.length} of ${en.length}`)
console.log(JSON.stringify(todo.slice(0, count)))
