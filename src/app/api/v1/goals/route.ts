import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'unauthorized', message: '请先登录' } }, { status: 401 })
  }

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ data: goals ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'unauthorized', message: '请先登录' } }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, category, target_date, parent_id } = body

  if (!title || !category) {
    return NextResponse.json({ error: { code: 'invalid_request', message: '标题和类别不能为空' } }, { status: 400 })
  }

  const { data: goal, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title,
      description: description ?? null,
      category,
      target_date: target_date ?? null,
      parent_id: parent_id ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: { code: 'database_error', message: error.message } }, { status: 500 })
  }

  return NextResponse.json({ data: goal }, { status: 201 })
}
