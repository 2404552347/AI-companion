/**
 * Dashboard 骨架屏 — 页面加载时显示
 */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:py-10 animate-pulse">
      {/* Greeting skeleton */}
      <section className="space-y-2">
        <div className="h-4 w-24 rounded bg-muted" />
        <div className="h-8 w-64 rounded bg-muted" />
        <div className="h-4 w-40 rounded bg-muted" />
      </section>

      {/* Quick actions skeleton */}
      <section className="grid grid-cols-2 gap-3">
        <div className="h-16 rounded-xl bg-muted" />
        <div className="h-16 rounded-xl bg-muted" />
      </section>

      {/* Activity skeleton */}
      <section className="space-y-3">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
        </div>
        <div className="h-24 rounded-xl bg-muted" />
      </section>

      {/* Memory skeleton */}
      <section className="space-y-3">
        <div className="h-5 w-28 rounded bg-muted" />
        <div className="h-14 rounded-xl bg-muted" />
        <div className="h-14 rounded-xl bg-muted" />
      </section>
    </div>
  )
}
