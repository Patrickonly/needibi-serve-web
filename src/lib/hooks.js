import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth, useGate, toast, ROLE_LABEL } from './store'

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Re-renders every `ms` — used by countdowns. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function useMediaQuery(query) {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const on = () => setMatch(m.matches)
    on()
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [query])
  return match
}

export function useInView(options) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), options)
    io.observe(el)
    return () => io.disconnect()
  }, [options])
  return [ref, inView]
}

export function useSession() {
  const user = useAuth((s) => s.user)
  const role = useAuth((s) => s.activeRole)
  return { user, role, isGuest: !user }
}

/**
 * Wrap any gated action. Guests get the sign-in modal (and return to this exact item);
 * signed-in users with the wrong active role get a hint to switch.
 */
export function useGatedAction() {
  const { user, role } = useSession()
  const show = useGate((s) => s.show)
  const switchRole = useAuth((s) => s.switchRole)
  return useCallback(
    (fn, { roles, reason = 'Sign in to continue' } = {}) =>
      (...args) => {
        if (!user) {
          show(reason)
          return
        }
        if (roles && !roles.includes(role)) {
          const usable = roles.find((r) => user.roles.includes(r))
          if (usable) {
            toast(`Switch to your ${ROLE_LABEL[usable]} account to do this`, {
              tone: 'info',
              action: { label: 'Switch', onClick: () => switchRole(usable) },
            })
          } else {
            toast(`Only ${roles.map((r) => ROLE_LABEL[r]).join(' or ')} accounts can do this`, { tone: 'info' })
          }
          return
        }
        return fn(...args)
      },
    [user, role, show, switchRole],
  )
}

export function useCopy() {
  return useCallback(async (text, label = 'Link copied') => {
    try {
      await navigator.clipboard.writeText(text)
      toast(label)
    } catch {
      toast('Could not copy — long-press the link to copy it', { tone: 'info' })
    }
  }, [])
}

/** Native share sheet with copy-link fallback. */
export function useShare() {
  const copy = useCopy()
  return useCallback(
    async ({ title, path }) => {
      const url = new URL(path, window.location.origin).toString()
      if (navigator.share) {
        try {
          await navigator.share({ title, url })
          return
        } catch {
          /* cancelled */
        }
      }
      copy(url)
    },
    [copy],
  )
}

export function downloadCSV(filename, rows) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
