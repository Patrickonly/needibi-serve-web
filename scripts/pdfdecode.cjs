const fs = require('fs')
let t = fs.readFileSync('raw.txt', 'latin1')
let out = ''
for (const ch of t) {
  if (ch === '\n') continue
  const n = ch.charCodeAt(0) + 29
  if (n === 32 || ch === '\u0003') out += ' '
  else if (n >= 33 && n < 127) out += String.fromCharCode(n)
  else out += ' '
}
out = out.replace(/ {2,}/g, ' ').trim()
fs.writeFileSync('improvements.txt', out)
console.log('LEN', out.length)
console.log(out.slice(0, 2500))
