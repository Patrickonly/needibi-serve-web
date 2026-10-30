import { Suspense } from 'react'
import { Outlet, ScrollRestoration } from 'react-router-dom'
import { Toaster, OfflineBanner, Skeleton } from '@/design-system'
import { SignInModal } from '@/components/auth/SignInModal'
import { ActionHost } from '@/components/cards/ActionHost'
import { HelpCenter } from '@/components/help/HelpCenter'
import { PublicHeader } from './PublicHeader'
import { Footer } from './Footer'
import { BottomTabBar } from './BottomTabBar'
import { PermissionPrompt } from './PermissionPrompt'
import { FloatingActions } from './FloatingActions'
import { InstallPrompt } from './InstallPrompt'
import { AssistBanner } from './AppShell'

function PublicSkeleton() {
  return (
    <div className="container-page space-y-6 py-8" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-10 w-72" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-card" />
        ))}
      </div>
    </div>
  )
}

export function PublicLayout() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-md focus:bg-action-500 focus:px-4 focus:py-2 focus:font-bold focus:text-white">
        Skip to content
      </a>
      <OfflineBanner />
      <PublicHeader />
      <AssistBanner />
      <main id="main" className="min-h-[60vh]">
        <Suspense fallback={<PublicSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <BottomTabBar />
      <FloatingActions />
      <SignInModal />
      <ActionHost />
      <HelpCenter />
      <PermissionPrompt />
      <InstallPrompt />
      <Toaster />
      <ScrollRestoration />
    </>
  )
}

/** Minimal chrome for auth screens. */
export function AuthLayout() {
  return (
    <>
      <OfflineBanner />
      <Suspense fallback={<PublicSkeleton />}>
        <Outlet />
      </Suspense>
      <Toaster />
      <ScrollRestoration />
    </>
  )
}
