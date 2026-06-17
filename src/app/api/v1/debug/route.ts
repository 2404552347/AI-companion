import { NextResponse } from 'next/server'
import { isDemoMode } from '@/lib/supabase/demo'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    demo_mode: isDemoMode(),
    env: {
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_url_prefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 50),
      has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      has_deepseek_key: !!process.env.DEEPSEEK_API_KEY,
      node_env: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
    },
  })
}
