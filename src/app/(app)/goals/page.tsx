import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GoalsClient } from '@/components/goals/goals-client'
import { isDemoMode, DEMO_DATA } from '@/lib/supabase/demo'
import type { Goal } from '@/types'

export default async function GoalsPage() {
  if (isDemoMode()) return <GoalsClient initialGoals={DEMO_DATA.goals} />

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: goals } = await supabase
    .from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

  return <GoalsClient initialGoals={(goals as Goal[]) ?? []} />
}
