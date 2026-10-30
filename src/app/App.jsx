import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { TooltipProvider } from '@/design-system'
import { MediaDock } from '@/components/media/MediaPlayer'
import { router } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Coming back to a tab that sat idle (or a laptop that slept) should quietly refresh,
      // not leave the last list on screen or drop it for an error panel.
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // The browser can evict the mock service worker while the tab is idle, and a request made in
      // that gap comes back as HTML. Keep retrying through it instead of failing the query.
      retry: (count, err) => (err?.status === 503 || err?.status === 0 ? count < 8 : err?.status >= 400 && err?.status < 500 ? false : count < 3),
      retryDelay: (count) => Math.min(400 * 2 ** count, 5000),
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={250}>
        <RouterProvider router={router} />
        <MediaDock />
      </TooltipProvider>
    </QueryClientProvider>
  )
}
