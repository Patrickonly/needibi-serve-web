import { useMemo, useRef, useState } from 'react'
import { Heart, Send, ImagePlus, X, ChevronDown, ChevronUp, AtSign, Smile, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatCompact } from '@/lib/format'
import { useSession, useGatedAction } from '@/lib/hooks'
import { toast } from '@/lib/store'
import { Drawer, Avatar, Button } from '@/design-system'
import { useCardActions } from './actionsStore'
import { useComments, seedThread } from './commentsStore'

const keyFor = (item) => (item ? String(item.code ?? item.slug ?? item.id) : '')
const QUICK = ['😍', '😂', '😳', '😊', '😁', '😘', '😮', '🤔', '😎']
const MORE = ['🙌', '👍', '❤️', '🔥', '👏', '🙏', '💯', '😅', '🥳', '😢', '😡', '🤝', '✅', '👀', '💪', '🎉']

function shortAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 604800) return `${Math.floor(s / 86400)}d`
  return `${Math.floor(s / 604800)}w`
}

function LikeColumn({ comment }) {
  const liked = useComments((s) => s.liked[comment.id])
  const toggleLike = useComments((s) => s.toggleLike)
  const gate = useGatedAction()
  const count = comment.likes + (liked ? 1 : 0)
  return (
    <button
      type="button"
      onClick={gate(() => toggleLike(comment.id), { reason: 'Sign in to like comments' })}
      aria-label={`Like, ${count} ${count === 1 ? 'like' : 'likes'}`}
      aria-pressed={!!liked}
      className={cn('flex w-10 shrink-0 flex-col items-center gap-0.5 pt-3 text-xs text-muted transition hover:text-danger-fg', liked && 'text-danger-fg')}
    >
      <Heart size={18} className={cn('transition-transform active:scale-125', liked && 'fill-danger-600 text-danger-600')} />
      <span className="tabular">{count > 0 ? formatCompact(count) : ''}</span>
    </button>
  )
}

function CommentRow({ item, comment, small, onReply }) {
  const saved = useComments((s) => s.saved[comment.id])
  const toggleSave = useComments((s) => s.toggleSave)
  const remove = useComments((s) => s.remove)
  const gate = useGatedAction()
  return (
    <div className="flex gap-3">
      <Avatar name={comment.author} hue={comment.hue} size={small ? 26 : 34} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-muted">
          {comment.author}
          {comment.mine && <span className="ml-1 text-action-fg">· You</span>}
        </p>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-snug text-text">{comment.text}</p>
        {comment.image && <img src={comment.image} alt="Photo attached to comment" className="mt-2 max-h-56 w-auto rounded-xl object-cover" />}
        <div className="mt-1 flex items-center gap-4 text-[13px] text-muted">
          <span>{shortAgo(comment.createdAt)}</span>
          <button type="button" onClick={() => onReply(comment)} className="font-semibold hover:text-text">Reply</button>
          <button
            type="button"
            aria-pressed={!!saved}
            onClick={gate(() => { toggleSave(comment.id); toast(saved ? 'Removed from saved' : 'Comment saved') }, { reason: 'Sign in to save comments' })}
            className={cn('hover:text-text', saved && 'font-semibold text-action-fg')}
          >
            {saved ? 'Saved' : 'Save'}
          </button>
          {comment.mine && (
            <button type="button" onClick={() => remove(keyFor(item), comment.id)} className="hover:text-danger-fg">Delete</button>
          )}
        </div>
      </div>
      <LikeColumn comment={comment} />
    </div>
  )
}

function Thread({ item, comment, onReply, expanded, onToggle }) {
  const replies = comment.replies ?? []
  return (
    <li>
      <CommentRow item={item} comment={comment} onReply={onReply} />
      {replies.length > 0 && (
        <div className="ml-[46px] mt-2">
          {expanded && (
            <ul className="mb-2 space-y-4 pt-1">
              {replies.map((r) => <li key={r.id}><CommentRow item={item} comment={r} small onReply={() => onReply(comment, r.author)} /></li>)}
            </ul>
          )}
          <button type="button" onClick={onToggle} aria-expanded={expanded} className="flex items-center gap-1 text-[13px] font-semibold text-muted hover:text-text">
            {expanded ? <>Hide <ChevronUp size={15} /></> : <>View {replies.length} {replies.length === 1 ? 'reply' : 'replies'} <ChevronDown size={15} /></>}
          </button>
        </div>
      )}
    </li>
  )
}

/** TikTok-style comments sheet: centered count, likes on the right, folded replies, emoji row above the input. */
export function CommentsPanel() {
  const item = useCardActions((s) => s.comments)
  const close = useCardActions((s) => s.close)
  const open = !!item
  const key = keyFor(item)

  const stored = useComments((s) => (key ? s.threads[key] : undefined))
  const thread = useMemo(() => stored ?? (key ? seedThread(key) : []), [stored, key])
  const likedMap = useComments((s) => s.liked)
  const add = useComments((s) => s.add)
  const { user, isGuest } = useSession()
  const gate = useGatedAction()

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [replyTo, setReplyTo] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [moreEmoji, setMoreEmoji] = useState(false)
  const fileRef = useRef(null)
  const inputRef = useRef(null)

  const total = useMemo(() => thread.reduce((n, c) => n + 1 + (c.replies?.length ?? 0), 0), [thread])
  const sorted = useMemo(() => {
    const score = (c) => c.likes + (likedMap[c.id] ? 1 : 0) + (c.replies?.length ?? 0) * 2
    return [...thread].sort((a, b) => Number(!!b.mine) - Number(!!a.mine) || score(b) - score(a))
  }, [thread, likedMap])

  const focusInput = () => requestAnimationFrame(() => inputRef.current?.focus())
  const reset = () => { setText(''); setImage(null); setReplyTo(null); setMoreEmoji(false) }

  const submit = gate(() => {
    const body = text.trim()
    if (!body && !image) return
    add(key, { text: body, image, author: user?.name || user?.firstName || 'You', hue: user?.avatarHue ?? 0 }, replyTo?.id ?? null)
    if (replyTo) setExpanded((x) => ({ ...x, [replyTo.id]: true }))
    reset()
  }, { reason: 'Sign in to join the conversation' })

  const insert = gate((s) => { setText((t) => t + s); focusInput() }, { reason: 'Sign in to join the conversation' })

  const reply = (comment, mention) => {
    setReplyTo(comment)
    if (mention) setText(`@${mention.split(' ')[0]} `)
    focusInput()
  }

  const pickImage = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { toast('Please choose an image', { tone: 'info' }); return }
    if (file.size > 4 * 1024 * 1024) { toast('That photo is over 4 MB. Try a smaller one.', { tone: 'info' }); return }
    const reader = new FileReader()
    reader.onload = () => setImage(String(reader.result))
    reader.readAsDataURL(file)
  }

  const emojiBtn = (e) => (
    <button key={e} type="button" onClick={() => insert(e)} aria-label={`Add ${e}`} className="grid h-9 w-9 place-items-center rounded-full text-[26px] leading-none transition hover:scale-110 active:scale-95">{e}</button>
  )

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => { if (!o) { close('comments'); reset(); setExpanded({}) } }}
      title={`${formatCompact(total)} ${total === 1 ? 'comment' : 'comments'}`}
      description={item?.title}
      width="max-w-md"
      sheet
      footer={
        <div className="space-y-2.5">
          <div className="flex justify-between" aria-label="Quick emoji">{QUICK.map(emojiBtn)}</div>
          {moreEmoji && <div className="grid grid-cols-8 justify-items-center gap-1 rounded-2xl bg-surface-2 p-2" aria-label="More emoji">{MORE.map(emojiBtn)}</div>}
          {replyTo && (
            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-1.5 text-xs text-muted">
              <span className="truncate">Replying to <span className="font-semibold text-text">{replyTo.author}</span></span>
              <button type="button" aria-label="Cancel reply" onClick={() => { setReplyTo(null); setText('') }} className="hover:text-text"><X size={14} /></button>
            </div>
          )}
          {image && (
            <div className="relative w-fit">
              <img src={image} alt="Photo to attach" className="max-h-24 rounded-xl object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => setImage(null)} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-primary-900 text-white shadow-card"><X size={13} /></button>
            </div>
          )}
          <div className="flex items-center gap-2.5">
            <Avatar name={user?.name || 'Guest'} hue={user?.avatarHue ?? 0} size={34} anonymous={isGuest} />
            <div className="flex min-w-0 flex-1 items-center gap-0.5 rounded-full bg-surface-2 py-0.5 pl-4 pr-1 ring-1 ring-transparent transition focus-within:ring-border-strong">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
                rows={1}
                maxLength={500}
                aria-label={replyTo ? `Reply to ${replyTo.author}` : 'Add comment'}
                placeholder={isGuest ? 'Sign in to comment...' : replyTo ? `Reply to ${replyTo.author}...` : 'Add comment...'}
                className="max-h-28 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm leading-snug text-text outline-none placeholder:text-muted"
              />
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={pickImage} />
              {text.trim() || image ? (
                <Button variant="primary" size="icon-sm" className="rounded-full" aria-label="Post comment" onClick={submit}><Send size={15} /></Button>
              ) : (
                <>
                  <Button variant="ghost" size="icon-sm" className="rounded-full text-text" aria-label="Mention someone" onClick={() => insert('@')}><AtSign size={19} /></Button>
                  <Button variant="ghost" size="icon-sm" className="rounded-full text-text" aria-label="More emoji" aria-pressed={moreEmoji} onClick={() => setMoreEmoji((v) => !v)}><Smile size={19} /></Button>
                  <Button variant="ghost" size="icon-sm" className="rounded-full text-text" aria-label="Add photo" onClick={gate(() => fileRef.current?.click(), { reason: 'Sign in to share a photo' })}><ImagePlus size={19} /></Button>
                </>
              )}
            </div>
          </div>
        </div>
      }
    >
      <div className="px-4 pb-4 pt-1">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted"><MessageCircle size={24} /></span>
            <p className="text-base font-bold text-text">No comments yet</p>
            <p className="max-w-[16rem] text-sm text-muted">Be the first to ask a question. Phone numbers and links stay hidden until a deal is agreed.</p>
          </div>
        ) : (
          <ul className="space-y-5">
            {sorted.map((c) => (
              <Thread key={c.id} item={item} comment={c} onReply={reply} expanded={!!expanded[c.id]} onToggle={() => setExpanded((x) => ({ ...x, [c.id]: !x[c.id] }))} />
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  )
}
