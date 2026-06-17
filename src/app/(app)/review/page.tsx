import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReviewClient } from '@/components/review/review-client'
import { isDemoMode, DEMO_DATA } from '@/lib/supabase/demo'
import type { DailyLog } from '@/types'

export default async function ReviewPage() {
  if (isDemoMode()) {
    return <ReviewClient initialLog={DEMO_DATA.todayLog} today={new Date().toISOString().split('T')[0]} />
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]
  const { data: todayLog } = await supabase
    .from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).single()

  return <ReviewClient initialLog={todayLog as DailyLog | null} today={today} />
}
