import { AppNav } from '@/components/shared/app-nav'
import { AppMobileNav } from '@/components/shared/app-mobile-nav'
import { ErrorBoundary } from '@/components/shared/error-boundary'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <ErrorBoundary>
        <main className="flex-1 pb-20 md:pb-6">{children}</main>
      </ErrorBoundary>
      <AppMobileNav />
    </div>
  )
}
