import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { safeStorage } from '@/lib/storage'

// Stable pseudo-random per key, so seeded threads look the same across reloads.
const seed = (str, salt = 0) => [...String(str)].reduce((h, c) => (h * 31 + c.charCodeAt(0) + salt) % 100000, 7)

const SEED_AUTHORS = [
  { name: 'Aline Mukamana', hue: 18 },
  { name: 'Eric Niyonzima', hue: 210 },
  { name: 'Diane Uwase', hue: 150 },
  { name: 'Jean Bosco', hue: 90 },
  { name: 'Claudine I.', hue: 320 },
  { name: 'Patrick K.', hue: 260 },
]
const SEED_TEXTS = [
  'Is this still available this week?',
  'Great value — booked something similar last month and it was perfect.',
  'Do you cover Kicukiro as well?',
  'How long does it usually take?',
  'Can the price include transport?',
  'Replied to your DM 🙌',
  'This provider is very professional, highly recommend.',
  'What time slots are open on weekends?',
]

/** Build a small, deterministic seeded thread so cards never open an empty panel. */
export function seedThread(key) {
  const n = seed(key, 3) % 4 // 0..3 top-level comments
  const now = Date.now()
  const out = []
  for (let i = 0; i < n; i++) {
    const a = SEED_AUTHORS[seed(key, i + 1) % SEED_AUTHORS.length]
    const hasReply = seed(key, i + 20) % 3 === 0
    out.push({
      id: `seed-${key}-${i}`,
      author: a.name,
      hue: a.hue,
      text: SEED_TEXTS[seed(key, i + 7) % SEED_TEXTS.length],
      image: null,
      createdAt: new Date(now - (i + 1) * 3600_000 * (1 + (seed(key, i) % 40))).toISOString(),
      likes: seed(key, i + 11) % 48,
      seedLiked: false,
      replies: hasReply
        ? [{
            id: `seed-${key}-${i}-r`,
            author: SEED_AUTHORS[seed(key, i + 30) % SEED_AUTHORS.length].name,
            hue: SEED_AUTHORS[seed(key, i + 30) % SEED_AUTHORS.length].hue,
            text: SEED_TEXTS[seed(key, i + 15) % SEED_TEXTS.length],
            image: null,
            createdAt: new Date(now - (i + 1) * 1800_000).toISOString(),
            likes: seed(key, i + 40) % 12,
            seedLiked: false,
            replies: [],
          }]
        : [],
    })
  }
  return out
}

export const useComments = create(
  persist(
    (set, get) => ({
      threads: {}, // key -> comment[]
      liked: {}, // commentId -> true
      saved: {}, // commentId -> true

      /** Returns the thread for a key, seeding it on first access. */
      thread(key) {
        const existing = get().threads[key]
        if (existing) return existing
        const seeded = seedThread(key)
        set((s) => ({ threads: { ...s.threads, [key]: seeded } }))
        return seeded
      },

      add(key, { text, image, author, hue }, parentId = null) {
        const comment = {
          id: `c-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
          author,
          hue,
          text,
          image: image ?? null,
          createdAt: new Date().toISOString(),
          likes: 0,
          seedLiked: false,
          replies: [],
          mine: true,
        }
        set((s) => {
          const current = s.threads[key] ?? seedThread(key)
          let next
          if (parentId) {
            next = current.map((c) =>
              c.id === parentId ? { ...c, replies: [...c.replies, comment] } : c,
            )
          } else {
            next = [comment, ...current]
          }
          return { threads: { ...s.threads, [key]: next } }
        })
        return comment
      },

      toggleLike(id) {
        set((s) => {
          const liked = { ...s.liked }
          if (liked[id]) delete liked[id]
          else liked[id] = true
          return { liked }
        })
      },

      toggleSave(id) {
        set((s) => {
          const saved = { ...s.saved }
          if (saved[id]) delete saved[id]
          else saved[id] = true
          return { saved }
        })
      },

      remove(key, id) {
        set((s) => {
          const current = s.threads[key]
          if (!current) return {}
          const next = current
            .filter((c) => c.id !== id)
            .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) }))
          return { threads: { ...s.threads, [key]: next } }
        })
      },
    }),
    { name: 'ns-comments', storage: createJSONStorage(() => safeStorage) },
  ),
)

/** Total count (top-level + replies) for a key, without forcing a seed write. */
export function commentCount(threads, liked, key) {
  const t = threads[key] ?? seedThread(key)
  return t.reduce((n, c) => n + 1 + c.replies.length, 0)
}
