import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  return NextResponse.json({
    demo_mode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
    env: {
      has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_url_sample: String(process.env.NEXT_PUBLIC_SUPABASE_URL).slice(0, 60),
      has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      has_deepseek_key: !!process.env.DEEPSEEK_API_KEY,
      node_env: process.env.NODE_ENV,
      vercel_env: process.env.VERCEL || 'not set',
    },
  })
}
