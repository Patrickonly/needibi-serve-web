import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Send, Paperclip, Mic, Check, CheckCheck, ArrowLeft, Flag, Siren, ShieldAlert, Lock, LockOpen, Ellipsis, Tag, CircleCheck, X, Info, MessagesSquare, Users, Plus, Timer } from 'lucide-react'
import { cn } from '@/lib/cn'
import { api } from '@/lib/api'
import { useSession } from '@/lib/hooks'
import { toast } from '@/lib/store'
import { detectContacts, CONTACT_BLOCK_REASON } from '@/lib/contactFilter'
import { formatMoney, formatTime, timeAgo } from '@/lib/format'
import { Avatar, Badge, Button, IconButton, Segmented, EmptyState, Skeleton, Menu, MenuTrigger, MenuContent, MenuItem, Dialog, Field, Card, StatusBadge, KindLabel, Checkbox, Select, AvatarStack } from '@/design-system'
import { MoneyInput } from '@/components/forms/inputs'
import { PageHeader } from '@/components/layout/AppShell'
import { EscrowBanner } from '@/components/payments/Payments'
import { PARTNERS } from '@/mocks/seed'

const SLA_MIN = 30
/** Admin SLA: a thread with unread messages older than SLA_MIN minutes is breached. */
const slaState = (c) => {
  if (c.status === 'closed' || !c.unread) return null
  const mins = (Date.now() - new Date(c.updatedAt).getTime()) / 60000
  return mins > SLA_MIN ? 'breached' : `${Math.max(1, Math.round(SLA_MIN - mins))} min left`
}

/** Admins can group several Partners with the Needer around one Bundle. */
function NewGroupChat({ open, onOpenChange, onCreate }) {
  const { data } = useQuery({ queryKey: ['bundles', 'group-chat'], queryFn: () => api.list('bundles', { status: 'offers_received,negotiating,in_service,matching', pageSize: 30 }), enabled: open })
  const [code, setCode] = useState('')
  const [members, setMembers] = useState({})
  const bundle = data?.data.find((b) => b.code === code)
  const picked = PARTNERS.filter((p) => members[p.id])
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New group chat"
      description="Bring the Needer and several Partners together around one Bundle."
      footer={
        <>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" disabled={!bundle || picked.length < 2} onClick={() => { onCreate(bundle, picked); setCode(''); setMembers({}) }}>
            <Users size={16} /> Create group · {picked.length + 1} members
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Bundle">{(p) => <Select {...p} value={code} onChange={(e) => setCode(e.target.value)}><option value="">Choose a Bundle…</option>{data?.data.map((b) => <option key={b.code} value={b.code}>{b.title} · {b.code}</option>)}</Select>}</Field>
        <div>
          <p className="mb-2 text-sm font-semibold text-text">Add Partners (at least 2)</p>
          <ul className="max-h-60 space-y-1 overflow-y-auto rounded-card border border-border p-2">
            {PARTNERS.filter((p) => p.status === 'active').slice(0, 14).map((p) => (
              <li key={p.id}><Checkbox checked={!!members[p.id]} onChange={(v) => setMembers((m) => ({ ...m, [p.id]: v }))} label={p.name} description={p.areas.join(', ')} className="rounded-md p-2 hover:bg-surface-2" /></li>
            ))}
          </ul>
        </div>
      </div>
    </Dialog>
  )
}

const meKey = (role) => (role === 'partner' ? 'partner' : role === 'admin' ? 'admin' : 'needer')

/** Pinned Price panel: budget, proposal and fee breakdown; the agreed price syncs to the card. */
function PinnedPricePanel({ chat, role, onAgree, onCounter, onDecline }) {
  const [counter, setCounter] = useState(false)
  const [amount, setAmount] = useState(chat.proposal.amount)
  const fee = Math.round(chat.proposal.amount * 0.15)
  return (
    <div className="border-b border-border bg-surface-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="flex items-center gap-1.5 font-bold text-text"><Tag size={15} className="text-action-fg" /> Price</span>
        <span className="text-muted">Budget <span className="tabular font-semibold text-text">{formatMoney(chat.budget)}</span></span>
        <span className="text-muted">Proposal <span className="tabular font-extrabold text-text">{formatMoney(chat.proposal)}</span></span>
        <span className="text-xs text-muted">Partner {formatMoney(chat.proposal.amount - fee)} · fee {formatMoney(fee)}</span>
        {chat.agreed ? (
          <Badge tone="trust" iconName="CircleCheck" className="ml-auto">Agreed · synced to card</Badge>
        ) : chat.status !== 'closed' ? (
          <div className="ml-auto flex gap-1.5">
            {role === 'needer' && <Button size="xs" variant="primary" onClick={onAgree}><CircleCheck size={13} /> Confirm & update card</Button>}
            <Button size="xs" variant="outline" onClick={() => setCounter(true)}>Counter-offer</Button>
            <Button size="xs" variant="ghost" onClick={onDecline}><X size={13} /> Decline</Button>
          </div>
        ) : null}
      </div>
      <Dialog open={counter} onOpenChange={setCounter} title="Counter-offer" size="sm" footer={<><Button variant="ghost" onClick={() => setCounter(false)}>Cancel</Button><Button variant="primary" onClick={() => { onCounter(amount); setCounter(false) }}>Send counter-offer</Button></>}>
        <Field label="Your price">{(p) => <MoneyInput {...p} value={amount} onChange={setAmount} size="lg" />}</Field>
      </Dialog>
    </div>
  )
}

function Bubble({ m, mine }) {
  if (m.from === 'system') {
    return (
      <li className="flex justify-center">
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary">{m.body}</span>
      </li>
    )
  }
  return (
    <li className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[78%] rounded-2xl px-3.5 py-2 text-[15px] shadow-card', mine ? 'rounded-br-md bg-primary-900 text-white dark:bg-primary dark:text-primary-900' : 'rounded-bl-md bg-surface text-text')}>
        {m.from === 'admin' && !mine && <p className="mb-0.5 text-xs font-bold text-action-fg">Needibi Support</p>}
        <p className="whitespace-pre-wrap break-words">{m.body}</p>
        <p className={cn('mt-0.5 flex items-center justify-end gap-1 text-[11px]', mine ? 'text-white/70 dark:text-primary-900/70' : 'text-muted')}>
          {formatTime(m.at)}
          {mine && (m.read ? <CheckCheck size={14} aria-label="Read" className="text-action-300 dark:text-primary-900" /> : <Check size={14} aria-label="Sent" />)}
        </p>
      </div>
    </li>
  )
}

export function ChatInbox({ role }) {
  const { user } = useSession()
  const [sp, setSp] = useSearchParams()
  const me = meKey(role)
  const ref = sp.get('ref')
  const [filter, setFilter] = useState('active')
  const [active, setActive] = useState(null)
  const [threads, setThreads] = useState({})
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(false)
  const [mobilePane, setMobilePane] = useState('list')
  const [grouping, setGrouping] = useState(false)
  const listEnd = useRef(null)

  const params = role === 'partner' ? { partnerId: user.partnerId } : role === 'admin' ? {} : { neederId: user.id }
  const { data, isLoading } = useQuery({ queryKey: ['chats', role], queryFn: () => api.list('chats', { ...params, pageSize: 50, sort: '-updatedAt' }) })

  useEffect(() => {
    if (!data) return
    setThreads((t) => {
      const next = { ...t }
      data.data.forEach((c) => (next[c.id] ??= c))
      // a Partner or Admin may open a chat from a request card (?ref=…). Needers never start chats.
      if (ref && role !== 'needer' && !data.data.some((c) => c.refCode === ref) && !next[`new-${ref}`]) {
        next[`new-${ref}`] = { id: `new-${ref}`, refCode: ref, refTitle: `Request ${ref}`, refKind: ref.startsWith('NB') ? 'bundle' : 'need', neederName: sp.get('needer') ?? 'Needer', partnerName: user.partnerName ?? 'Needibi Support', openedBy: me, status: 'active', unread: 0, budget: { amount: 25000 }, proposal: { amount: 24000 }, agreed: false, contactsUnlocked: false, messages: [{ id: 'sys', from: 'system', body: `Chat opened by ${role === 'admin' ? 'Needibi Support' : user.partnerName}`, at: new Date().toISOString() }], updatedAt: new Date().toISOString() }
      }
      return next
    })
  }, [data, ref, role, me, user])

  const list = useMemo(() => Object.values(threads).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)), [threads])
  const filtered = list.filter((c) => (filter === 'active' ? c.status === 'active' : filter === 'awaiting' ? c.status === 'awaiting' : c.status === 'closed'))
  const chat = threads[active] ?? (ref ? list.find((c) => c.refCode === ref) : null) ?? null

  useEffect(() => {
    if (!active && ref) {
      const c = list.find((x) => x.refCode === ref)
      if (c) {
        setActive(c.id)
        setMobilePane('thread')
      }
    }
  }, [list, ref, active])
  useEffect(() => listEnd.current?.scrollIntoView({ block: 'end' }), [chat?.messages.length, typing])

  const patch = (id, fn) => setThreads((t) => ({ ...t, [id]: { ...t[id], ...fn(t[id]), updatedAt: new Date().toISOString() } }))
  const contact = detectContacts(draft)
  const blocked = contact.blocked && !chat?.contactsUnlocked
  const readOnly = chat?.status === 'closed'

  const send = () => {
    if (!draft.trim() || blocked || !chat) return
    const msg = { id: `m-${Date.now()}`, from: me, body: draft.trim(), at: new Date().toISOString(), read: false }
    patch(chat.id, (c) => ({ messages: [...c.messages, msg] }))
    setDraft('')
    // simulated counterpart: typing indicator, read ticks, reply
    setTimeout(() => setTyping(true), 600)
    setTimeout(() => {
      setTyping(false)
      patch(chat.id, (c) => ({ messages: [...c.messages.map((m) => ({ ...m, read: true })), { id: `r-${Date.now()}`, from: me === 'needer' ? 'partner' : 'needer', body: me === 'needer' ? 'Noted, thank you! I’ll update you as soon as I’m on my way.' : 'Murakoze — that works for me.', at: new Date().toISOString(), read: true }] }))
    }, 2400)
  }

  const counterpart = (c) => (c.group ? c.groupName : me === 'partner' ? c.neederName : me === 'admin' ? (c.openedBy === 'admin' ? `${c.neederName} · Needibi Support` : `${c.neederName} · ${c.partnerName}`) : c.openedBy === 'admin' ? 'Needibi Support' : c.partnerName)

  return (
    <>
      <PageHeader
        title={role === 'admin' ? 'Support inbox' : 'Messages'}
        subtitle={role === 'needer' ? 'Private Chats opened by Partners or Needibi. You can reply any time.' : role === 'partner' ? 'Private Chats inside authorised transactions. You only see Needers whose approved requests you serve.' : 'Private Chats inside authorised transactions.'}
        actions={role === 'admin' && <Button variant="primary" onClick={() => setGrouping(true)}><Plus size={16} /> New group chat</Button>}
      />
      {role === 'admin' && (
        <dl className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Open chats', list.filter((c) => c.status !== 'closed').length],
            ['Awaiting staff reply', list.filter((c) => c.unread > 0).length],
            ['SLA breaches', list.filter((c) => slaState(c) === 'breached').length],
            ['Avg first response', '12 min'],
          ].map(([k, v]) => (
            <div key={k} className={cn('rounded-card border bg-surface p-3', k === 'SLA breaches' && v > 0 ? 'border-danger-600/40' : 'border-border')}>
              <dt className="text-xs font-semibold text-muted">{k}</dt>
              <dd className={cn('tabular text-xl font-extrabold', k === 'SLA breaches' && v > 0 ? 'text-danger-fg' : 'text-text')}>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <NewGroupChat
        open={grouping}
        onOpenChange={setGrouping}
        onCreate={(bundle, partners) => {
          const id = `grp-${Date.now()}`
          setThreads((t) => ({ ...t, [id]: { id, group: true, groupName: `${bundle.title} · group`, members: [{ id: bundle.posterId, name: bundle.poster.name }, ...partners.map((p) => ({ id: p.id, name: p.name, avatarHue: p.avatarHue }))], refCode: bundle.code, refTitle: bundle.title, refKind: 'bundle', neederName: bundle.poster.name, partnerName: partners.map((p) => p.name).join(', '), openedBy: 'admin', status: 'active', unread: 0, budget: bundle.totalBudget, proposal: bundle.totalBudget, agreed: false, contactsUnlocked: false, messages: [{ id: 'sys', from: 'system', body: `Group created by Needibi Support · ${partners.length + 1} members`, at: new Date().toISOString() }], updatedAt: new Date().toISOString() } }))
          setActive(id)
          setMobilePane('thread')
          setGrouping(false)
          toast('Group chat created', { description: 'Members are notified.' })
        }}
      />
      <div className="grid h-[calc(100dvh-220px)] min-h-[520px] overflow-hidden rounded-card border border-border bg-surface shadow-card md:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_300px]">
        {/* list */}
        <aside className={cn('flex min-h-0 flex-col border-r border-border', mobilePane !== 'list' && 'hidden md:flex')} aria-label="Conversations">
          <div className="border-b border-border p-3">
            <Segmented size="sm" label="Filter chats" value={filter} onChange={setFilter} className="w-full" options={[{ value: 'active', label: 'Active' }, { value: 'awaiting', label: 'Awaiting reply' }, { value: 'closed', label: 'Closed' }]} />
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto">
            {isLoading && Array.from({ length: 5 }, (_, i) => <li key={i} className="p-3"><Skeleton className="h-12" /></li>)}
            {filtered.map((c) => {
              const last = c.messages.at(-1)
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => { setActive(c.id); setMobilePane('thread'); patch(c.id, () => ({ unread: 0 })); setSp(c.refCode ? { ref: c.refCode } : {}, { replace: true }) }} className={cn('flex w-full gap-3 border-b border-border px-3 py-3 text-left hover:bg-surface-2', chat?.id === c.id && 'bg-action-soft/50')}>
                    <span className="relative">
                      <Avatar name={counterpart(c)} hue={c.id.length * 40} size={40} />
                      {c.status === 'active' && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-trust-600 ring-2 ring-surface" aria-label="Online" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-text">{counterpart(c)}</span><span className="shrink-0 text-[11px] text-muted">{timeAgo(c.updatedAt)}</span></span>
                      <span className="flex items-center gap-1.5 truncate text-xs text-muted">
                        {c.group && <Badge tone="navy" size="xs" icon={<Users size={11} />}>{c.members.length}</Badge>}
                        <span className="truncate">{c.refTitle}</span>
                      </span>
                      {role === 'admin' && slaState(c) && (
                        <Badge tone={slaState(c) === 'breached' ? 'danger' : 'warn'} size="xs" icon={<Timer size={11} />} className="mt-1">SLA {slaState(c)}</Badge>
                      )}
                      <span className="flex items-center justify-between gap-2"><span className="truncate text-xs text-text/80">{last?.body}</span>{c.unread > 0 && <span className="rounded-full bg-action-500 px-1.5 text-[11px] font-bold text-white">{c.unread}</span>}</span>
                    </span>
                  </button>
                </li>
              )
            })}
            {!isLoading && !filtered.length && (
              <li><EmptyState compact title={filter === 'closed' ? 'No closed chats' : 'No chats yet'} description={role === 'needer' ? 'Partners open a Chat once they’re confirmed to serve your request. You can’t start chats yourself — this keeps you safe from spam.' : 'Open a Chat from a request card once it’s confirmed.'} /></li>
            )}
          </ul>
        </aside>

        {/* thread */}
        <section className={cn('flex min-h-0 flex-col', mobilePane !== 'thread' && 'hidden md:flex')} aria-label="Conversation">
          {chat ? (
            <>
              <header className="flex items-center gap-3 border-b border-border px-3 py-2.5">
                <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Back to chats" onClick={() => setMobilePane('list')}><ArrowLeft size={18} /></Button>
                {chat.group ? <AvatarStack people={chat.members} size={30} /> : <Avatar name={counterpart(chat)} hue={chat.id.length * 40} size={36} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text">{counterpart(chat)}</p>
                  <p className="truncate text-xs text-muted">{typing ? <span className="font-semibold text-trust-fg">typing…</span> : chat.status === 'active' ? 'Online' : 'Last seen recently'} · {chat.refCode}</p>
                </div>
                <Button variant="ghost" size="sm" className="xl:hidden" onClick={() => setMobilePane('context')}><Info size={16} /> Details</Button>
                <Menu>
                  <MenuTrigger asChild><IconButton label="Chat actions"><Ellipsis size={18} /></IconButton></MenuTrigger>
                  <MenuContent>
                    <MenuItem icon={<Flag />} onSelect={() => toast('Reported to Trust & Safety')}>Report</MenuItem>
                    <MenuItem icon={<Siren />} onSelect={() => toast('Escalated to a Needibi admin', { tone: 'info' })}>Escalate to Needibi</MenuItem>
                    {role !== 'needer' && <MenuItem icon={<LockOpen />} onSelect={() => { patch(chat.id, (c) => ({ contactsUnlocked: true, messages: [...c.messages, { id: `s-${Date.now()}`, from: 'system', body: 'Contact details unlocked — agreement signed', at: new Date().toISOString() }] })) }}>Unlock contacts (agreement signed)</MenuItem>}
                  </MenuContent>
                </Menu>
              </header>
              <PinnedPricePanel
                chat={chat}
                role={me}
                onAgree={() => { patch(chat.id, (c) => ({ agreed: true, messages: [...c.messages, { id: `s-${Date.now()}`, from: 'system', body: `Price agreed: ${formatMoney(c.proposal)} · card updated`, at: new Date().toISOString() }] })); toast('Price confirmed and synced to your Need') }}
                onCounter={(amount) => patch(chat.id, (c) => ({ proposal: { amount, currency: 'RWF' }, messages: [...c.messages, { id: `s-${Date.now()}`, from: 'system', body: `Counter-offer: ${formatMoney(amount)}`, at: new Date().toISOString() }] }))}
                onDecline={() => patch(chat.id, (c) => ({ messages: [...c.messages, { id: `s-${Date.now()}`, from: 'system', body: 'Price proposal declined', at: new Date().toISOString() }] }))}
              />
              {chat.contactsUnlocked ? (
                <p className="flex items-center gap-2 bg-trust-100 px-4 py-1.5 text-xs font-semibold text-trust-fg"><LockOpen size={13} /> Contact details unlocked</p>
              ) : (
                <p className="flex items-center gap-2 bg-surface-2 px-4 py-1.5 text-xs text-muted"><Lock size={13} /> Contact details stay hidden until the agreement is signed.</p>
              )}
              <ol className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-bg px-4 py-4" aria-live="polite" aria-label="Messages">
                {chat.messages.map((m) => <Bubble key={m.id} m={m} mine={m.from === me} />)}
                {typing && (
                  <li className="flex"><span className="flex gap-1 rounded-2xl bg-surface px-4 py-3 shadow-card" aria-label="Typing">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${i * 120}ms` }} />)}</span></li>
                )}
                <li ref={listEnd} />
              </ol>
              {readOnly ? (
                <p className="border-t border-border px-4 py-3 text-center text-sm text-muted"><Lock size={14} className="inline" /> This job is complete — the chat is read-only.</p>
              ) : (
                <form className="border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); send() }}>
                  {blocked && <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-danger-fg" role="alert"><ShieldAlert size={15} /> {CONTACT_BLOCK_REASON} They unlock after the agreement is signed.</p>}
                  <div className="flex items-end gap-2">
                    <div className="flex min-w-0 flex-1 items-end gap-1 rounded-2xl border border-border-strong bg-surface px-2 py-1.5 focus-within:border-action-500">
                      <IconButton label="Attach file" onClick={() => toast('Attachment added (demo)')}><Paperclip size={18} /></IconButton>
                      <IconButton label="Record voice message" onClick={() => toast('Voice message recorded (demo)')}><Mic size={18} /></IconButton>
                      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} rows={1} aria-label="Message" placeholder="Write a message…" className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-1.5 py-1.5 text-[15px] leading-snug text-text outline-none placeholder:text-muted" aria-invalid={blocked || undefined} />
                    </div>
                    <Button type="submit" variant="primary" size="icon" aria-label="Send" disabled={!draft.trim() || blocked}><Send size={18} /></Button>
                  </div>
                </form>
              )}
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6"><EmptyState title="Select a conversation" description="Chats are private and only exist inside an authorised transaction." art="box" /></div>
          )}
        </section>

        {/* context */}
        <aside className={cn('min-h-0 overflow-y-auto border-l border-border p-4', mobilePane === 'context' ? 'block md:col-span-1' : 'hidden xl:block')} aria-label="Chat context">
          {chat && (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" className="xl:hidden" onClick={() => setMobilePane('thread')}><ArrowLeft size={16} /> Back to chat</Button>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Linked request</p>
                <Card className="p-3 shadow-none">
                  <KindLabel kind={chat.refKind} />
                  <p className="mt-1.5 font-semibold text-text">{chat.refTitle}</p>
                  <p className="text-xs text-muted">{chat.refCode}</p>
                  <Button variant="outline" size="xs" className="mt-2" to={role === 'needer' ? `/app/needer/${chat.refKind === 'bundle' ? 'bundles' : 'needs'}/${chat.refCode}` : `/${chat.refKind === 'bundle' ? 'bundles' : 'needs'}/${chat.refCode}`}>Open</Button>
                </Card>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Offer</p>
                <Card className="space-y-1 p-3 text-sm shadow-none">
                  <p className="flex justify-between"><span className="text-muted">Proposal</span><span className="tabular font-bold">{formatMoney(chat.proposal)}</span></p>
                  <StatusBadge status={chat.agreed ? 'accepted' : 'submitted'} size="xs" />
                </Card>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Agreement</p>
                <Card className="p-3 text-sm shadow-none">
                  <StatusBadge status={chat.agreed ? 'awaiting_signature' : 'draft'} size="xs" />
                  <Link to={`/app/${role === 'admin' ? 'needer' : role}/agreements`} className="mt-2 block text-sm font-semibold text-info-fg hover:underline">View agreement</Link>
                </Card>
              </div>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Payment</p>
                <EscrowBanner compact />
              </div>
              <p className="flex items-start gap-2 text-xs text-muted"><MessagesSquare size={14} className="mt-0.5 shrink-0" /> Public Messages are never linked to private Chat.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
