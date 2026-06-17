/**
 * Activity Tracking API
 *
 * POST /api/v1/activity — 接收本地追踪代理发来的活动数据
 * GET  /api/v1/activity?date=YYYY-MM-DD — 获取指定日期的活动摘要
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST: 接收本地代理发来的活动数据
// 支持两种认证方式:
//   - 用户 JWT (浏览器)
//   - Service Role Key + user_id (本地追踪代理)
export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const body = await request.json()
  const { activities, device_info, user_id: explicitUserId } = body

  let userId: string | null = null

  // 方式1: 用户 JWT
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    userId = user.id
  }

  // 方式2: Service Role Key (本地追踪代理)
  if (!userId && explicitUserId) {
    const authHeader = request.headers.get('authorization') ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (token === process.env.SUPABASE_SERVICE_ROLE_KEY) {
      userId = explicitUserId
    }
  }

  if (!userId) {
    return NextResponse.json({ error: { code: 'unauthorized', message: '请先登录' } }, { status: 401 })
  }

  if (!activities || !Array.isArray(activities) || activities.length === 0) {
    return NextResponse.json({ error: { code: 'invalid_request', message: 'activities 数组不能为空' } }, { status: 400 })
  }

  // 批量插入活动日志
  const logs = activities.map((a: Record<string, unknown>) => ({
    user_id: userId,
    activity_type: String(a.activity_type ?? 'app_usage'),
    app_name: a.app_name ? String(a.app_name) : null,
    app_bundle: a.app_bundle ? String(a.app_bundle) : null,
    window_title: a.window_title ? String(a.window_title) : null,
    url: a.url ? String(a.url) : null,
    duration_sec: typeof a.duration_sec === 'number' ? a.duration_sec : null,
    activity_score: typeof a.activity_score === 'number' ? a.activity_score : null,
    is_productive: a.is_productive === true || a.is_productive === false ? a.is_productive : null,
    category: a.category ? String(a.category) : null,
    started_at: String(a.started_at),
    ended_at: a.ended_at ? String(a.ended_at) : null,
    metadata: (a.metadata as Record<string, unknown>) ?? {},
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase.from('activity_logs').insert(logs as any)
  if (error) {
    console.error('Activity insert error:', error)
    return NextResponse.json({ error: { code: 'database_error', message: error.message } }, { status: 500 })
  }

  // 更新或创建今日摘要
  const today = new Date().toISOString().split('T')[0]
  await updateDailySummary(supabase, userId, today)

  return NextResponse.json({ data: { received: activities.length } })
}

// GET: 获取今日活动摘要
export async function GET(request: Request) {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'unauthorized', message: '请先登录' } }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  // 获取今日摘要
  const summaryResult = await supabase
    .from('daily_activity_summaries')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', date)
    .single()

  // 获取最近活动
  const activityResult = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('started_at', `${date}T00:00:00`)
    .lte('started_at', `${date}T23:59:59`)
    .order('started_at', { ascending: false })
    .limit(50)

  const summary = summaryResult.data as Record<string, unknown> | null

  return NextResponse.json({
    data: {
      summary,
      recent_activity: (activityResult.data ?? []) as unknown[],
      app_summary: (summary?.top_apps as unknown[]) ?? [],
    },
  })
}

// 更新每日摘要
async function updateDailySummary(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
  date: string
) {
  try {
    // 聚合今日活动数据
    const { data: todayLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', `${date}T00:00:00`)
      .lte('started_at', `${date}T23:59:59`)

    const logs = todayLogs as unknown as Array<Record<string, unknown>>
    if (!logs || logs.length === 0) return

    // 计算统计数据
    let totalActiveMin = 0
    let totalIdleMin = 0
    let productiveMin = 0
    let entertainmentMin = 0
    const appMap: Record<string, { duration: number; category: string }> = {}
    const hourScores: Record<number, number[]> = {}

    for (const log of logs) {
      const dur = ((log.duration_sec as number) ?? 0) / 60
      const hour = new Date(log.started_at as string).getHours()

      if (!hourScores[hour]) hourScores[hour] = []
      hourScores[hour].push((log.activity_score as number) ?? 50)

      if ((log.activity_type as string) === 'idle') {
        totalIdleMin += dur
      } else {
        totalActiveMin += dur
      }

      if (log.is_productive as boolean) productiveMin += dur
      if ((log.category as string) === 'entertainment') entertainmentMin += dur

      const appName = log.app_name as string | null
      if (appName) {
        if (!appMap[appName]) {
          appMap[appName] = { duration: 0, category: (log.category as string) ?? 'other' }
        }
        appMap[appName].duration += dur
      }
    }

    // Top apps
    const topApps = Object.entries(appMap)
      .sort(([, a], [, b]) => b.duration - a.duration)
      .slice(0, 10)
      .map(([app_name, data]) => ({
        app_name,
        duration_min: Math.round(data.duration),
        category: data.category,
      }))

    // 24小时活跃曲线
    const activityCurve = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      score: hourScores[hour]
        ? Math.round(hourScores[hour].reduce((a, b) => a + b, 0) / hourScores[hour].length)
        : 0,
    }))

    // 判断当前状态
    const lastLog = logs[0]
    let currentStatus = 'unknown'
    if ((lastLog.activity_type as string) === 'idle') currentStatus = 'idle'
    else if ((lastLog.category as string) === 'entertainment') currentStatus = 'entertainment'
    else if (lastLog.is_productive as boolean) currentStatus = 'working'
    else currentStatus = 'active'

    // Upsert 摘要
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('daily_activity_summaries') as any).upsert(
      {
        user_id: userId,
        date,
        total_active_min: Math.round(totalActiveMin),
        total_idle_min: Math.round(totalIdleMin),
        productive_min: Math.round(productiveMin),
        entertainment_min: Math.round(entertainmentMin),
        top_apps: topApps,
        activity_curve: activityCurve,
        current_status: currentStatus,
        last_active_at: lastLog.started_at as string,
      },
      { onConflict: 'user_id,date' }
    )
  } catch (err) {
    console.error('Update daily summary error:', err)
  }
}
