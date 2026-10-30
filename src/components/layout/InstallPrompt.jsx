import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/design-system'
import { readStorage, writeStorage } from '@/lib/storage'
import { toast } from '@/lib/store'

const DISMISSED_KEY = 'ns-install-dismissed'
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

// Captured at module load: the browser fires this once, often before the popup mounts.
let deferredPrompt = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
  })
}

export function InstallPrompt() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone
    if (standalone || Date.now() - readStorage(DISMISSED_KEY, 0) < SNOOZE_MS) return
    const timer = setTimeout(() => setOpen(true), 4000)
    const onInstalled = () => { setOpen(false); writeStorage(DISMISSED_KEY, Date.now()) }
    window.addEventListener('appinstalled', onInstalled)
    return () => { clearTimeout(timer); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') dismiss() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function dismiss() {
    setOpen(false)
    writeStorage(DISMISSED_KEY, Date.now())
  }

  async function install() {
    if (deferredPrompt) {
      const prompt = deferredPrompt
      deferredPrompt = null
      prompt.prompt()
      const { outcome } = await prompt.userChoice
      dismiss()
      if (outcome === 'accepted') toast('Installing Needibi Serve')
      return
    }
    dismiss()
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    toast(ios ? 'Tap Share, then “Add to Home Screen” to install Needibi Serve' : 'Open your browser menu and choose “Install app” or “Add to Home screen”')
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-labelledby="install-title"
      aria-describedby="install-desc"
      className="fixed inset-x-3 bottom-[5.5rem] z-[70] animate-slide-up sm:left-auto sm:right-24 sm:w-[410px] lg:bottom-6"
    >
      <div className="relative flex gap-4 rounded-2xl border border-border bg-surface p-5 pr-11 shadow-[0_22px_48px_-18px_rgb(16_24_40/0.4)]">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-info-100 text-info-fg">
          <Download size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p id="install-title" className="font-display text-lg font-bold text-text">Install Needibi Serve App</p>
          <p id="install-desc" className="mt-1 text-sm leading-relaxed text-muted">
            Get the app for faster access, alerts when offers arrive, and a better experience on your phone.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary" onClick={install}>Install</Button>
            <Button variant="outline" onClick={dismiss}>Not now</Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close install prompt"
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-text"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
