import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Demo mode: 仅在本地开发且无 Supabase 时启用
  const isDemo = !process.env.VERCEL && process.env.NODE_ENV !== 'production' &&
    (!process.env.NEXT_PUBLIC_SUPABASE_URL ||
     process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT_ID') ||
     process.env.NEXT_PUBLIC_DEMO_MODE === 'true')

  if (isDemo) {
    const response = NextResponse.next({ request })
    response.cookies.set('demo-mode', 'true', { httpOnly: false, maxAge: 86400 })
    return response
  }

  // 生产模式 — 清除可能残留的 demo cookie
  const response = await updateSession(request)
  response.cookies.set('demo-mode', '', { httpOnly: false, maxAge: 0 })
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
