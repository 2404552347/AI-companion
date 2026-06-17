import { Suspense } from 'react'
import { createServerSupabase } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/shared/dashboard-client'
import { DashboardSkeleton } from '@/components/shared/dashboard-skeleton'
import { redirect } from 'next/navigation'
import { isDemoMode, DEMO_DATA } from '@/lib/supabase/demo'
import type { DashboardData, UserProfile, DailyLog, Memory, Notification, GrowthEvent, Goal, DailyActivitySummary } from '@/types'
import type { EmotionDataPoint } from '@/lib/emotion/analyzer'

export default async function DashboardPage() {
  // Demo mode: return pre-built data
  if (isDemoMode()) {
    return (
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardClient
          data={{
            user_profile: DEMO_DATA.profile,
            streak: DEMO_DATA.user.streak,
            today_mood: DEMO_DATA.todayLog.mood_score,
            today_log: DEMO_DATA.todayLog,
            recent_memories: DEMO_DATA.memories,
            care_message: DEMO_DATA.notification,
            recent_events: DEMO_DATA.events,
            active_goals: DEMO_DATA.goals,
            activity: DEMO_DATA.activity,
          }}
          emotionData={DEMO_DATA.emotions}
        />
      </Suspense>
    )
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const todayStr = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const [
    profileResult, recentLogsResult, todayLogResult, memoriesResult,
    careMsgResult, eventsResult, goalsResult, activityResult, emotionResult,
  ] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
    supabase.from('daily_logs').select('log_date').eq('user_id', user.id).order('log_date', { ascending: false }).limit(30),
    supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', todayStr).single(),
    supabase.from('memories').select('*').eq('user_id', user.id).eq('is_active', true).order('importance', { ascending: false }).limit(5),
    supabase.from('notifications').select('*').eq('user_id', user.id).eq('is_read', false).eq('type', 'care_check').order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('growth_events').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(3),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(5),
    supabase.from('daily_activity_summaries').select('*').eq('user_id', user.id).eq('date', todayStr).single(),
    supabase.from('emotion_logs').select('*').eq('user_id', user.id).gte('date', sevenDaysAgo).order('date', { ascending: false }).limit(50),
  ])

  const profile = profileResult.data
  if (!profile) redirect('/onboarding')

  let streak = 0
  const recentLogs = recentLogsResult.data
  if (recentLogs && recentLogs.length > 0) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today); checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]
      if (recentLogs.some((log) => log.log_date === dateStr)) streak++
      else if (i > 0) break
    }
  }

  const emotionData: EmotionDataPoint[] = ((emotionResult.data ?? []) as unknown as Array<Record<string, unknown>>).map((e) => ({
    date: e.date as string, emotion: e.emotion as string, score: e.score as number,
  }))

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardClient
        data={{
          user_profile: profile as UserProfile,
          streak,
          today_mood: todayLogResult.data?.mood_score ?? null,
          today_log: (todayLogResult.data as DailyLog) ?? null,
          recent_memories: (memoriesResult.data as Memory[]) ?? [],
          care_message: (careMsgResult.data as Notification) ?? null,
          recent_events: (eventsResult.data as GrowthEvent[]) ?? [],
          active_goals: (goalsResult.data as Goal[]) ?? [],
          activity: activityResult.data as DailyActivitySummary | null,
        }}
        emotionData={emotionData}
      />
    </Suspense>
  )
}

