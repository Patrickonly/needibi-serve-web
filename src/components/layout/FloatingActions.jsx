import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/cn'

// Needibi Serve support line (same number as the footer).
const WHATSAPP_URL = `https://wa.me/250788813062?text=${encodeURIComponent('Hello Needibi Serve, I need help with…')}`

function WhatsAppGlyph({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.8 11.9 11.9 0 004.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.2z" />
    </svg>
  )
}

/**
 * Bottom-right stack on public pages: WhatsApp support (always) and Back to top
 * (appears after scrolling, with a ring that fills as you read down the page).
 */
export function FloatingActions() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [])
  const showTop = progress > 0.08
  const r = 22
  const c = 2 * Math.PI * r

  return (
    <div data-floating-actions className="fixed bottom-20 right-3 z-40 flex flex-col items-end gap-2 md:bottom-6 md:right-3 [&_a]:h-12 [&_button]:h-10 [&_button]:w-10">
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
        title="Back to top"
        tabIndex={showTop ? 0 : -1}
        className={cn(
          'group relative flex h-12 w-12 items-center justify-center rounded-full bg-surface text-text shadow-modal ring-1 ring-border transition-all duration-300 hover:-translate-y-0.5 hover:text-action-fg',
          showTop ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none translate-y-3 scale-90 opacity-0',
        )}
      >
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" />
          <circle cx="24" cy="24" r={r} fill="none" stroke="var(--action-600)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - progress)} className="transition-[stroke-dashoffset] duration-150" />
        </svg>
        <ArrowUp size={19} className="relative transition-transform group-hover:-translate-y-0.5" />
      </button>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Needibi Serve on WhatsApp"
        className="group relative isolate flex h-14 items-center gap-0 rounded-full bg-[#25D366] pl-[14px] pr-[14px] text-white shadow-modal transition-all duration-300 hover:gap-2.5 hover:pr-5"
      >
        <span className="absolute left-0 top-0 -z-10 h-14 w-14 animate-ping rounded-full bg-[#25D366]/40 [animation-duration:2.6s]" aria-hidden="true" />
        <WhatsAppGlyph />
        <span className="max-w-0 whitespace-nowrap text-sm font-bold opacity-0 transition-all duration-300 group-hover:max-w-[10rem] group-hover:opacity-100">Chat with us</span>
      </a>
    </div>
  )
}
