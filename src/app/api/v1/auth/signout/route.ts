import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  const response = NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))

  // 清除所有 Supabase 认证 cookie，防止中间件误判已登录
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.includes('sb-')) {
      response.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
    }
  })

  return response
}
