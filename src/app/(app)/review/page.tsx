import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReviewClient } from '@/components/review/review-client'
import { isDemoMode, DEMO_DATA } from '@/lib/supabase/demo'
import { getDateStringInTimeZone } from '@/lib/date'
import type { DailyLog } from '@/types'

export default async function ReviewPage() {
  if (isDemoMode()) {
    const today = getDateStringInTimeZone(new Date(), DEMO_DATA.profile.timezone)
    return <ReviewClient initialLog={DEMO_DATA.todayLog} today={today} />
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('user_profiles').select('timezone').eq('user_id', user.id).single()
  const today = getDateStringInTimeZone(new Date(), profile?.timezone)
  const { data: todayLog } = await supabase
    .from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', today).single()

  return <ReviewClient initialLog={todayLog as DailyLog | null} today={today} />
}
