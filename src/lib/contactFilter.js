// Detects contact details in public Messages, including disguised variants
// ("zero seven eight…", "name at gmail dot com"). Used live in the composer
// and again by the mock moderation endpoint.

const NUMBER_WORDS = {
  zero: '0', oh: '0', one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9',
  // Kinyarwanda
  zeru: '0', rimwe: '1', kabiri: '2', gatatu: '3', kane: '4', gatanu: '5',
  gatandatu: '6', karindwi: '7', umunani: '8', icyenda: '9',
  // French
  'zéro': '0', un: '1', deux: '2', trois: '3', quatre: '4', cinq: '5', sept: '7', huit: '8', neuf: '9',
}

function wordsToDigits(text) {
  return text
    .toLowerCase()
    .split(/[\s,.\-_/]+/)
    .map((w) => NUMBER_WORDS[w] ?? w)
    .join(' ')
}

const PATTERNS = [
  { kind: 'phone', test: (t) => /(\+?\d[\s.\-()]*){9,}/.test(t) },
  { kind: 'phone', test: (t) => /(\d\s*){9,}/.test(wordsToDigits(t)) },
  { kind: 'email', test: (t) => /[\w.+-]+@[\w-]+\.[\w.]+/i.test(t) },
  {
    kind: 'email',
    test: (t) => /\b[\w.]+\s*(\(|\[)?\s*(at|@)\s*(\)|\])?\s*(gmail|yahoo|outlook|hotmail|icloud|proton\w*|[\w-]+)\s*(\(|\[)?\s*(dot|\.)\s*(\)|\])?\s*(com|rw|org|net|co)\b/i.test(t),
  },
  { kind: 'url', test: (t) => /(https?:\/\/|www\.)\S+/i.test(t) || /\b[\w-]+\.(com|rw|org|net|io|co|me|ly)\b/i.test(t) },
  { kind: 'url', test: (t) => /\b[\w-]+\s+dot\s+(com|rw|org|net)\b/i.test(t) },
  { kind: 'social', test: (t) => /(^|\s)@[a-z0-9_.]{3,}/i.test(t) },
  { kind: 'social', test: (t) => /\b(whatsapp|telegram|insta(gram)?|facebook|fb|tiktok|snap(chat)?|signal)\b.{0,12}(me|number|handle|dm|inbox|on)\b/i.test(t) },
  { kind: 'social', test: (t) => /\b(wa\.me|t\.me)\b/i.test(t) },
]

/** @returns {{ blocked: boolean, kinds: string[] }} */
export function detectContacts(text = '') {
  const kinds = [...new Set(PATTERNS.filter((p) => p.test(text)).map((p) => p.kind))]
  return { blocked: kinds.length > 0, kinds }
}

export const CONTACT_BLOCK_REASON = "For your safety, contact details can't be shared here."
