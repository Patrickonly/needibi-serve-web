import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, Send, Hourglass, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession, useGatedAction } from '@/lib/hooks'
import { toast } from '@/lib/store'
import { detectContacts, CONTACT_BLOCK_REASON } from '@/lib/contactFilter'
import { Avatar, Button, Badge, Skeleton } from '@/design-system'

const KIND_LABEL = { need: 'need', bundle: 'bundle', deal: 'deal' }
const QUICK = ['😍', '👍', '🙏', '🔥', '😊', '🤔', '👏', '💯']

function shortName(user) {
  const [first, last] = String(user?.name || user?.firstName || 'Member').trim().split(/\s+/)
  return last ? `${first} ${last[0]}.` : first
}

function shortAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return `${Math.floor(s / 604800)}w`
}

/**
 * Moderated public Messages, laid out like the card comment sheet. Contact details are blocked live
 * (incl. disguised variants); new messages show "Pending review" to the sender until approved.
 * Never linked to private chat.
 */
export function PublicMessages({ target, kind, title }) {
  const sectionRef = useRef(null)
  const inputRef = useRef(null)
  const composerRef = useRef(null)
  useEffect(() => {
    if (window.location.hash === '#messages') sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])
  // On phones the WhatsApp button and the bottom tab bar are fixed over this composer, so hide them while it is in use.
  useEffect(() => {
    const el = composerRef.current
    const root = document.documentElement
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(([entry]) => root.classList.toggle('composer-in-view', entry.isIntersecting))
    io.observe(el)
    return () => { io.disconnect(); root.classList.remove('composer-in-view', 'composer-focus') }
  }, [])
  const { user, isGuest } = useSession()
  const gate = useGatedAction()
  const qc = useQueryClient()
  const [body, setBody] = useState('')
  const [serverError, setServerError] = useState('')
  const check = detectContacts(body)
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['public-messages', target, user?.id], queryFn: () => api.get('/api/public-messages', { target, me: user?.id }) })

  const send = useMutation({
    mutationFn: () => api.post('/api/public-messages', { targetCode: target, targetKind: kind, targetTitle: title, body, authorId: user.id, authorName: shortName(user), authorHue: user.avatarHue }),
    onSuccess: () => {
      setBody('')
      setServerError('')
      qc.invalidateQueries({ queryKey: ['public-messages', target] })
      toast('Message sent for review', { description: 'It becomes public once a moderator approves it.' })
    },
    onError: (e) => setServerError(e.message),
  })

  const canSend = !!body.trim() && !check.blocked
  const submit = gate(() => { if (canSend) send.mutate() }, { reason: 'Sign in to leave a message' })
  const insert = gate((e) => { setBody((b) => (b + e).slice(0, 600)); requestAnimationFrame(() => inputRef.current?.focus()) }, { reason: 'Sign in to leave a message' })
  const rows = data?.data ?? []
  const approved = rows.filter((r) => r.status === 'approved').length
  const error = serverError || (check.blocked ? CONTACT_BLOCK_REASON : '')

  return (
    <section ref={sectionRef} id="messages" aria-labelledby="messages-h" className="scroll-mt-36 overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="relative px-12 py-3.5 text-center">
        <h2 id="messages-h" className="text-[15px] font-bold text-text">
          <span className="tabular">{approved}</span> {approved === 1 ? 'message' : 'messages'}
        </h2>
      </div>

      <ul className="max-h-[28rem] space-y-5 overflow-y-auto overscroll-contain px-4 pb-4 pt-1">
        {isLoading &&
          Array.from({ length: 3 }, (_, i) => (
            <li key={i} className="flex gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-3 w-24" /><Skeleton className="h-4 w-3/4" /></div>
            </li>
          ))}
        {isError && (
          <li className="py-8 text-center text-sm text-danger-fg">
            Could not load messages. <button type="button" className="font-semibold underline" onClick={() => refetch()}>Try again</button>
          </li>
        )}
        {!isLoading && !isError && rows.length === 0 && (
          <li className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-yellow-soft text-brand-yellow-fg"><MessageCircle size={24} /></span>
            <p className="text-base font-bold text-text">No messages yet</p>
            <p className="max-w-[18rem] text-sm text-muted">Be the first to ask about this {KIND_LABEL[kind]}.</p>
          </li>
        )}
        {rows.map((m) => (
          <li key={m.id} className={cn('flex gap-3', m.status !== 'approved' && 'opacity-90')}>
            <Avatar name={m.authorName} hue={m.authorHue} size={36} />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
                {m.authorName}
                {m.status === 'pending' && <Badge tone="grey" icon={<Hourglass size={11} />} size="xs">Pending review</Badge>}
                {m.status === 'rejected' && <Badge tone="danger" iconName="Ban" size="xs">Not approved</Badge>}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-snug text-text">{m.body}</p>
              <div className="mt-1 flex items-center gap-4 text-[13px] text-muted">
                <span>{shortAgo(m.createdAt)}</span>
                {m.status === 'rejected' && (
                  <>
                    <span className="text-danger-fg">{m.rejectReason ?? 'Contains contact details'}</span>
                    <button type="button" className="font-semibold text-text hover:underline" onClick={() => { setBody(m.body); inputRef.current?.focus() }}>Edit and resubmit</button>
                  </>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div ref={composerRef} className="scroll-mb-24 space-y-2.5 border-t border-border bg-surface px-4 py-3">
        <div className="flex justify-between" aria-label="Quick emoji">
          {QUICK.map((e) => (
            <button key={e} type="button" onClick={() => insert(e)} aria-label={`Add ${e}`} className="grid h-9 w-9 place-items-center rounded-full text-[24px] leading-none transition hover:scale-110 active:scale-95">{e}</button>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <Avatar name={user?.name || 'Guest'} hue={user?.avatarHue ?? 0} size={34} anonymous={isGuest} />
          <div className={cn('flex min-w-0 flex-1 items-center gap-1 rounded-full bg-surface-2 py-0.5 pl-4 pr-1 ring-1 ring-transparent transition focus-within:ring-border-strong', error && 'ring-danger-600')}>
            <textarea
              ref={inputRef}
              id={`msg-${target}`}
              rows={1}
              value={body}
              maxLength={600}
              onChange={(e) => { setBody(e.target.value); setServerError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
              onFocus={(e) => { document.documentElement.classList.add('composer-focus'); const t = e.currentTarget; if (window.matchMedia('(max-width: 767px)').matches) setTimeout(() => t.scrollIntoView({ block: 'center', behavior: 'smooth' }), 300) }}
              onBlur={() => document.documentElement.classList.remove('composer-focus')}
              aria-label={`Message about this ${KIND_LABEL[kind]}`}
              aria-invalid={!!error || undefined}
              aria-describedby={`msg-${target}-help`}
              placeholder={isGuest ? 'Sign in to leave a message...' : 'Add a message...'}
              className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm leading-snug text-text outline-none placeholder:text-muted"
            />
            {body.length > 450 && <span className="tabular text-[11px] text-muted">{body.length}/600</span>}
            <Button variant="gold" size="icon-sm" className="rounded-full" aria-label="Send message" disabled={!canSend} loading={send.isPending} onClick={submit}>
              {!send.isPending && <Send size={15} />}
            </Button>
          </div>
        </div>
        <p id={`msg-${target}-help`} aria-live="polite" className={cn('pl-11 text-xs', error ? 'flex items-center gap-1.5 font-medium text-danger-fg' : 'text-muted')}>
          {error ? <><ShieldAlert size={13} /> {error}</> : 'No phone numbers, emails or links. Private chat opens once you agree with a provider.'}
        </p>
      </div>
    </section>
  )
}
