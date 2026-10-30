import { useEffect } from 'react'
import { useRouteError, Link } from 'react-router-dom'
import { ServerCrash } from 'lucide-react'

/** Router-level error boundary — keeps the brand even when a page crashes. */
export function RouteError() {
  const error = useRouteError()
  const chunk = /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(error?.message ?? '')
  // After a new deployment old page files no longer exist: reload once to pick up the new version.
  useEffect(() => {
    if (!chunk) return
    try {
      if (sessionStorage.getItem('ns-chunk-reload')) return
      sessionStorage.setItem('ns-chunk-reload', '1')
    } catch {
      return
    }
    window.location.reload()
  }, [chunk])
  useEffect(() => {
    if (!chunk) console.error('[Needibi] Page error:', error)
  }, [chunk, error])
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-danger-100 text-danger-fg">
        <ServerCrash size={40} aria-hidden="true" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-semibold text-text">{chunk ? 'A new version is available' : 'Something went wrong'}</h1>
      <p className="mt-2 max-w-md text-muted">{chunk ? 'Reload to get the latest Needibi Serve.' : 'Our team has been alerted. Your payments and data are safe.'}</p>
      <div className="mt-6 flex gap-3">
        <button type="button" onClick={() => window.location.reload()} className="h-11 rounded-[10px] bg-action px-5 font-bold text-on-action hover:bg-action-hover">
          Reload
        </button>
        <Link to="/" className="flex h-11 items-center rounded-[10px] border border-border-strong px-5 font-semibold text-text">
          Go home
        </Link>
      </div>
      {import.meta.env.DEV && error?.message && <pre className="mt-8 max-w-2xl overflow-auto rounded-card bg-surface-2 p-4 text-left text-xs text-muted">{error.message}</pre>}
    </div>
  )
}
