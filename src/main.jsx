import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/work-sans'
import '@fontsource-variable/plus-jakarta-sans'




import './index.css'
import './lib/i18n'
import App from './app/App.jsx'
import { startAutoTranslate } from './lib/autoTranslate'

async function enableMocks() {
  // The mock API runs in every build until a real backend is connected.
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
  // The browser may evict the service worker while the tab sits idle, after which every /api call
  // returns the HTML shell. api.js calls this to bring it back, and retries succeed instead of
  // showing "Something went wrong" to someone who only left the tab open.
  let reviving = null
  window.__NEEDIBI_REVIVE_MOCKS__ = () => {
    // start() on a worker MSW thinks is running is a no-op that only logs a warning, so stop it first.
    reviving ??= Promise.resolve()
      .then(() => { worker.stop() })
      .then(() => worker.start({ onUnhandledRequest: 'bypass', quiet: true }))
      .finally(() => { reviving = null })
    return reviving
  }
  const reviveIfIdle = () => {
    if (document.visibilityState === 'visible' && !navigator.serviceWorker?.controller) window.__NEEDIBI_REVIVE_MOCKS__()
  }
  document.addEventListener('visibilitychange', reviveIfIdle)
  window.addEventListener('online', reviveIfIdle)
  // A hard refresh (Ctrl+Shift+R) or a fresh install leaves the page without its service worker,
  // and every /api call would quietly come back empty. Wait for it, and reload once if it never arrives.
  const sw = navigator.serviceWorker
  if (sw && !sw.controller) {
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, 2000)
      sw.addEventListener('controllerchange', () => { clearTimeout(timer); resolve() }, { once: true })
    })
  }
  try {
    if (sw && !sw.controller && !sessionStorage.getItem('ns-sw-reload')) {
      sessionStorage.setItem('ns-sw-reload', '1')
      window.location.reload()
      return new Promise(() => {})
    }
    sessionStorage.removeItem('ns-sw-reload')
    sessionStorage.removeItem('ns-chunk-reload')
  } catch {
    /* storage blocked: carry on, requests will retry */
  }
}

const started = performance.now()

function hideSplash() {
  const el = document.getElementById('splash')
  if (!el || getComputedStyle(el).display === 'none') return el?.remove()
  const wait = Math.max(0, 10_000 - (performance.now() - started))
  setTimeout(() => {
    el.classList.add('hide')
    setTimeout(() => el.remove(), 300)
  }, wait)
}

// Unexpected errors are logged instead of failing silently (a real backend would also report them).
// The mock service worker throws benign errors when the browser updates it or the dev server is
// stopped with the tab open ("Failed to update a ServiceWorker", "Failed to fetch" in passthrough);
// these are not app failures, so they are swallowed instead of logged as unhandled errors.
window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason?.message ?? e.reason ?? '')
  if (/ServiceWorker|Failed to fetch/i.test(msg)) {
    e.preventDefault()
    return
  }
  console.error('[Needibi] Unhandled error:', e.reason)
})
window.addEventListener('error', (e) => console.error('[Needibi] Runtime error:', e.error ?? e.message))

function render() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
  hideSplash()
  startAutoTranslate()
}

// Start the app even if the mock API can't (no HTTPS, private browsing, old browser):
// lists then show a clear error with Retry instead of the page staying blank.
enableMocks()
  .catch((err) => {
    console.error('[Needibi] The demo data service could not start:', err)
    window.__NEEDIBI_MOCKS_FAILED__ = true
  })
  .finally(render)
