import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatClient } from '@/components/chat/chat-client'
import { isDemoMode, DEMO_DATA } from '@/lib/supabase/demo'
import type { Conversation, Persona } from '@/types'

export default async function ChatPage() {
  if (isDemoMode()) {
    return (
      <ChatClient
        initialMessages={[]}
        persona={DEMO_DATA.personas[0]}
        userProfile={{ nickname: DEMO_DATA.user.nickname } as { nickname: string }}
      />
    )
  }

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conversations } = await supabase
    .from('conversations').select('*').eq('user_id', user.id)
    .order('created_at', { ascending: true }).limit(30)

  const { data: settings } = await supabase
    .from('user_settings').select('persona_id').eq('user_id', user.id).single()

  let persona: Persona | null = null
  if (settings?.persona_id) {
    const { data: p } = await supabase.from('personas').select('*').eq('id', settings.persona_id).single()
    persona = p as Persona | null
  }

  const { data: profile } = await supabase
    .from('user_profiles').select('nickname').eq('user_id', user.id).single()

  return (
    <ChatClient
      initialMessages={(conversations ?? []) as Conversation[]}
      persona={persona}
      userProfile={profile as { nickname: string } | null}
    />
  )
}
