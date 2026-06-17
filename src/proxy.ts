import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Demo mode: 没有真实 Supabase URL 时才启用
  const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('supabase.co')
  const isDemo = !hasSupabase || process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (isDemo) {
    const response = NextResponse.next({ request })
    response.cookies.set('demo-mode', 'true', { httpOnly: false, maxAge: 86400 })
    return response
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
