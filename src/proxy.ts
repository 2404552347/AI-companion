import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function proxy(request: NextRequest) {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (isDemo) {
    const response = NextResponse.next({ request })
    response.cookies.set('demo-mode', 'true', { httpOnly: false, maxAge: 86400 })
    return response
  }

  try {
    return await updateSession(request)
  } catch (err) {
    console.error('Proxy error:', err)
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
