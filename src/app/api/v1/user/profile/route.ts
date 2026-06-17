import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'unauthorized' } }, { status: 401 })

  const { data } = await supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
  return NextResponse.json({ data })
}

export async function PUT(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'unauthorized' } }, { status: 401 })

  const body = await request.json()
  const allowed = ['nickname', 'age', 'bio', 'occupation', 'interests', 'life_wish', 'long_term_vision']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('user_profiles')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(updates as any)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: { code: 'database_error', message: error.message } }, { status: 500 })
  }

  // Also update nickname in auth metadata
  if (body.nickname) {
    await supabase.auth.updateUser({ data: { nickname: body.nickname } })
  }

  return NextResponse.json({ data })
}
