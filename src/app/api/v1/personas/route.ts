import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'unauthorized' } }, { status: 401 })

  const { data } = await supabase.from('personas').select('*').order('created_at', { ascending: true })
  return NextResponse.json({ data: data ?? [] })
}
