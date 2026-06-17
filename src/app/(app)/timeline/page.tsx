import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TimelineClient } from '@/components/timeline/timeline-client'
import { isDemoMode, DEMO_DATA } from '@/lib/supabase/demo'
import type { GrowthEvent } from '@/types'

export default async function TimelinePage() {
  if (isDemoMode()) return <TimelineClient events={DEMO_DATA.events} />

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: events } = await supabase
    .from('growth_events').select('*').eq('user_id', user.id)
    .order('date', { ascending: false }).limit(50)

  return <TimelineClient events={(events as GrowthEvent[]) ?? []} />
}
