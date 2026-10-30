// One-off: generate the demo voice-note WAV used by the mock data, so the
// inline player and the floating dock can be exercised without a CDN.
const fs = require('fs')
const path = require('path')

const rate = 16000
const seconds = 24
const frames = rate * seconds
const data = Buffer.alloc(frames * 2)

// A gentle spoken-cadence hum: syllable bursts with pauses, so the waveform and
// the seek bar have something recognisable to move against.
for (let i = 0; i < frames; i++) {
  const t = i / rate
  const syllable = Math.floor(t * 3.2) % 7
  const inWord = syllable < 5
  const env = inWord ? Math.pow(Math.sin(Math.PI * ((t * 3.2) % 1)), 1.6) : 0
  const f0 = 150 + 32 * Math.sin(t * 1.7) + 8 * syllable
  const sample =
    0.55 * Math.sin(2 * Math.PI * f0 * t) +
    0.25 * Math.sin(2 * Math.PI * f0 * 2 * t) +
    0.12 * Math.sin(2 * Math.PI * f0 * 3 * t)
  const v = Math.max(-1, Math.min(1, sample * env * 0.42))
  data.writeInt16LE(Math.round(v * 32767), i * 2)
}

const header = Buffer.alloc(44)
header.write('RIFF', 0)
header.writeUInt32LE(36 + data.length, 4)
header.write('WAVE', 8)
header.write('fmt ', 12)
header.writeUInt32LE(16, 16)
header.writeUInt16LE(1, 20)
header.writeUInt16LE(1, 22)
header.writeUInt32LE(rate, 24)
header.writeUInt32LE(rate * 2, 28)
header.writeUInt16LE(2, 32)
header.writeUInt16LE(16, 34)
header.write('data', 36)
header.writeUInt32LE(data.length, 40)

const out = path.join('public', 'media', 'voice-note.wav')
fs.mkdirSync(path.dirname(out), { recursive: true })
fs.writeFileSync(out, Buffer.concat([header, data]))
console.log('wrote', out, (fs.statSync(out).size / 1024).toFixed(0) + 'kB')
