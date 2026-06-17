import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingClient } from '@/components/onboarding/onboarding-client'
import { isDemoMode, DEMO_DATA } from '@/lib/supabase/demo'

export default async function OnboardingPage() {
  if (isDemoMode()) {
    return <OnboardingClient personas={DEMO_DATA.personas} userId="demo-user-001" />
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: existingProfile } = await supabase
    .from('user_profiles').select('id').eq('user_id', user.id).single()
  if (existingProfile) redirect('/')

  const { data: personas } = await supabase
    .from('personas').select('*').order('created_at', { ascending: true })

  return <OnboardingClient personas={personas ?? []} userId={user.id} />
}

