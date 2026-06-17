import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'unauthorized' } }, { status: 401 })

  const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).single()
  return NextResponse.json({ data })
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'unauthorized' } }, { status: 401 })

  const body = await request.json()

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, ...body, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })

  if (error) {
    return NextResponse.json({ error: { code: 'database_error', message: error.message } }, { status: 500 })
  }

  return NextResponse.json({ data: { success: true } })
}
