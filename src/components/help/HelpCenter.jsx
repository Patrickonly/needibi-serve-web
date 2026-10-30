import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { create } from 'zustand'
import { Search, LifeBuoy, MessageSquareText } from 'lucide-react'
import { useSession } from '@/lib/hooks'
import { Drawer, Input, Button, EmptyState } from '@/design-system'
import { FAQS, FaqAccordion } from '@/features/public/sections'

export const useHelp = create((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}))

const TOPICS = [
  ['All', ''],
  ['Posting', 'posting'],
  ['Payments', 'payments'],
  ['Partners', 'partners'],
  ['Messages', 'messages'],
  ['Account', 'account'],
  ['Safety', 'safety'],
]

/** Searchable FAQ shown inside the app, so help never sends people out to the website. */
export function HelpCenter() {
  const open = useHelp((s) => s.open)
  const hide = useHelp((s) => s.hide)
  const { user, role } = useSession()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState('')
  const needle = q.trim().toLowerCase()
  const items = FAQS.filter(([question, answer, cat]) => (!topic || cat === topic) && (!needle || needle.split(/\s+/).every((w) => `${question} ${answer}`.toLowerCase().includes(w))))
  const contact = () => {
    hide()
    navigate(user && role !== 'admin' ? `/app/${role}/support` : '/contact')
  }

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => !o && hide()}
      title="Help & FAQ"
      description="Quick answers without leaving the app"
      width="max-w-md"
      footer={
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-[#0b1f3a]"><MessageSquareText size={18} /></span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-text">Still need help?</p>
            <p className="text-muted">Our team replies within a few hours.</p>
          </div>
          <Button variant="primary" size="sm" onClick={contact}><LifeBuoy size={15} /> Contact support</Button>
        </div>
      }
    >
      <div className="space-y-4 p-5">
        <Input leading={<Search size={16} />} placeholder="Search questions…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search questions" />
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {TOPICS.map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={topic === value}
              onClick={() => setTopic(value)}
              className={topic === value ? 'h-8 shrink-0 rounded-full bg-brand-yellow px-3.5 text-sm font-bold text-[#0b1f3a]' : 'h-8 shrink-0 rounded-full border border-brand-yellow/60 bg-surface px-3.5 text-sm font-medium text-text hover:bg-brand-yellow-soft'}
            >
              {label}
            </button>
          ))}
        </div>
        {items.length ? (
          <FaqAccordion items={items} />
        ) : (
          <EmptyState compact title="No matching questions" description="Try other words, or contact support below." />
        )}
      </div>
    </Drawer>
  )
}
