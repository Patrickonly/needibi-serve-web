// One-off: extract text from a PDF using only node's zlib (no deps).
const fs = require('fs')
const zlib = require('zlib')

const buf = fs.readFileSync(process.argv[2])
const out = []
let i = 0
let streams = 0
let inflated = 0
while (true) {
  const s = buf.indexOf('stream', i)
  if (s === -1) break
  let b = s + 6
  if (buf[b] === 13) b++
  if (buf[b] === 10) b++
  const e = buf.indexOf('endstream', b)
  if (e === -1) break
  i = e + 9
  streams++
  let data = buf.subarray(b, e)
  try {
    data = zlib.inflateSync(data)
  } catch {
    try {
      data = zlib.inflateRawSync(data.subarray(0))
    } catch {
      continue
    }
  }
  inflated++
  const txt = data.toString('latin1')
  if (!/TJ|Tj/.test(txt)) continue
  const parts = []
  const re = /\(((?:\\.|[^\\()])*)\)|<([0-9A-Fa-f\s]+)>\s*Tj|\bTJ\b|\bTd\b|\bTD\b|\bT\*/g
  let m
  while ((m = re.exec(txt))) {
    if (m[1] !== undefined) parts.push(m[1].replace(/\\([()\\])/g, '$1').replace(/\\[0-7]{3}/g, ' '))
    else if (m[2] !== undefined) {
      const hex = m[2].replace(/\s+/g, '')
      let s2 = ''
      for (let k = 0; k + 3 < hex.length + 1; k += 4) s2 += String.fromCharCode(parseInt(hex.substr(k, 4), 16))
      parts.push(s2)
    } else if (m[0] !== 'TJ') parts.push('\n')
  }
  out.push(parts.join(''))
}
console.error('streams', streams, 'inflated', inflated)
console.log(out.join('\n').replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n'))
