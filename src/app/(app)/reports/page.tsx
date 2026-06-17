import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ReportsClient } from '@/components/reports/reports-client'
import { isDemoMode } from '@/lib/supabase/demo'
import type { WeeklyReport } from '@/types'

export default async function ReportsPage() {
  if (isDemoMode()) return <ReportsClient reports={[]} />

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: reports } = await supabase
    .from('weekly_reports').select('*').eq('user_id', user.id)
    .order('week_start', { ascending: false }).limit(12)

  return <ReportsClient reports={(reports as WeeklyReport[]) ?? []} />
}
