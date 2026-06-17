import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'unauthorized', message: '请先登录' } }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  // Verify ownership
  const { data: existing } = await supabase
    .from('goals')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: { code: 'not_found', message: '目标不存在' } }, { status: 404 })
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: { code: 'database_error', message: error.message } }, { status: 500 })
  }

  return NextResponse.json({ data: goal })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'unauthorized', message: '请先登录' } }, { status: 401 })
  }

  const { id } = await params

  // Verify ownership
  const { data: existing } = await supabase
    .from('goals')
    .select('user_id')
    .eq('id', id)
    .single()

  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: { code: 'not_found', message: '目标不存在' } }, { status: 404 })
  }

  await supabase.from('goals').delete().eq('id', id)

  return NextResponse.json({ data: { success: true } })
}
