import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from '@/components/settings/settings-client'
import { isDemoMode, DEMO_DATA } from '@/lib/supabase/demo'
import type { Persona, UserProfile, UserSettings } from '@/types'

export default async function SettingsPage() {
  if (isDemoMode()) {
    return (
      <SettingsClient
        profile={DEMO_DATA.profile}
        settings={null}
        personas={DEMO_DATA.personas}
        activePersona={DEMO_DATA.personas[0]}
      />
    )
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
  const { data: settings } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single()
  const { data: personas } = await supabase.from('personas').select('*').order('created_at', { ascending: true })

  const activePersona = (personas ?? []).find((p) => p.id === settings?.persona_id) as Persona | undefined

  return (
    <SettingsClient
      profile={profile as UserProfile | null}
      settings={settings as UserSettings | null}
      personas={(personas as Persona[]) ?? []}
      activePersona={activePersona ?? null}
    />
  )
}
