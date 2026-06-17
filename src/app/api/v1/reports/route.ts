/**
 * Weekly Report API
 *
 * GET  /api/v1/reports — 获取历史周报列表
 * POST /api/v1/reports — 手动触发生成周报（也可由 Cron Job 自动调用）
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getOpenAI, CHAT_MODEL } from '@/lib/openai/client'
import { rateLimitResponse } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'unauthorized' } }, { status: 401 })

  const { data } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('user_id', user.id)
    .order('week_start', { ascending: false })
    .limit(12)

  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: { code: 'unauthorized' } }, { status: 401 })

  const rateLimit = rateLimitResponse(user.id, 'care-check')
  if (rateLimit) return rateLimit

  // 计算本周范围
  const now = new Date()
  const dayOfWeek = now.getDay() || 7 // Sunday = 7
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const weekStartStr = weekStart.toISOString().split('T')[0]
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  // 检查是否已生成
  const { data: existing } = await supabase
    .from('weekly_reports')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start', weekStartStr)
    .single()

  if (existing) {
    return NextResponse.json({ data: { message: '本周周报已存在', id: existing.id } })
  }

  // 聚合本周数据
  const [logsResult, eventsResult, goalsResult, activityResult] = await Promise.all([
    supabase.from('daily_logs').select('*').eq('user_id', user.id)
      .gte('log_date', weekStartStr).lte('log_date', weekEndStr).order('log_date', { ascending: true }),
    supabase.from('growth_events').select('*').eq('user_id', user.id)
      .gte('date', weekStartStr).lte('date', weekEndStr),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active'),
    supabase.from('daily_activity_summaries').select('*').eq('user_id', user.id)
      .gte('date', weekStartStr).lte('date', weekEndStr),
  ])

  const logs = (logsResult.data ?? []) as unknown as Array<Record<string, unknown>>
  const events = (eventsResult.data ?? []) as unknown as Array<Record<string, unknown>>
  const goals = (goalsResult.data ?? []) as unknown as Array<Record<string, unknown>>
  const activities = (activityResult.data ?? []) as unknown as Array<Record<string, unknown>>

  // 统计数据
  const completedDays = logs.length
  const totalCompleted = logs.reduce((sum, l) => sum + ((l.completed as string[])?.length ?? 0), 0)
  const totalFailed = logs.reduce((sum, l) => sum + ((l.failed as string[])?.length ?? 0), 0)
  const completionRate = totalCompleted + totalFailed > 0
    ? Math.round((totalCompleted / (totalCompleted + totalFailed)) * 100)
    : 0
  const moodScores = logs.filter((l) => l.mood_score != null).map((l) => l.mood_score as number)
  const moodAvg = moodScores.length > 0
    ? Math.round((moodScores.reduce((a, b) => a + b, 0) / moodScores.length) * 10) / 10
    : null

  // 收集成就
  const achievements: string[] = []
  for (const l of logs) {
    const completed = (l.completed as string[]) ?? []
    for (const c of completed) achievements.push(c)
  }
  for (const e of events) {
    if ((e.event_type as string) === 'achievement' || (e.event_type as string) === 'milestone') {
      achievements.push(e.title as string)
    }
  }

  const challenges = logs
    .flatMap((l) => (l.failed as string[]) ?? [])
    .slice(0, 10)

  const growthHighlights = events
    .filter((e) => (e.event_type as string) !== 'emotion_peak')
    .map((e) => e.title as string)
    .slice(0, 5)

  // 计算平均生产力
  const totalProdMin = activities.reduce((s, a) => s + ((a.productive_min as number) ?? 0), 0)
  const totalEntMin = activities.reduce((s, a) => s + ((a.entertainment_min as number) ?? 0), 0)

  // AI 总结
  let summary = ''
  let suggestions = ''
  try {
    const profile = (await supabase.from('user_profiles').select('nickname').eq('user_id', user.id).single()).data
    const nickname = (profile as Record<string, string> | null)?.nickname ?? '用户'

    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [{
        role: 'system',
        content: `你是 AI 成长伙伴。根据用户本周数据生成周报总结和建议。返回 JSON:
{
  "summary": "50-80字的本周总结，温暖、具体、有洞察",
  "suggestions": "30-50字的下周建议"
}`,
      }, {
        role: 'user',
        content: `用户: ${nickname}
本周: ${weekStartStr} ~ ${weekEndStr}
复盘${completedDays}天 | 完成${totalCompleted}项 | 未完成${totalFailed}项 | 完成率${completionRate}%
${moodAvg ? '平均心情' + moodAvg + '/5' : ''}
成就: ${achievements.slice(0, 5).join('、')}
挑战: ${challenges.slice(0, 5).join('、')}
成长: ${growthHighlights.join('、')}
生产力${totalProdMin}分钟 | 娱乐${totalEntMin}分钟`,
      }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.7,
    })

    const result = JSON.parse(response.choices[0]?.message?.content ?? '{}')
    summary = result.summary ?? ''
    suggestions = result.suggestions ?? ''
  } catch (err) {
    console.error('Report AI generation failed:', err)
    summary = '本周你在成长的道路上又前进了一步。'
    suggestions = '继续保持节奏，关注那些让你感到充实的时刻。'
  }

  // 存储周报
  const { data: report } = await supabase
    .from('weekly_reports')
    .insert({
      user_id: user.id,
      week_start: weekStartStr,
      week_end: weekEndStr,
      summary,
      achievements: achievements.slice(0, 10),
      challenges: challenges.slice(0, 10),
      growth_highlights: growthHighlights,
      completion_rate: completionRate,
      streak_days: completedDays,
      mood_avg: moodAvg,
      ai_suggestions: suggestions,
    })
    .select()
    .single()

  // 发送通知
  if (report) {
    await supabase.from('notifications').insert({
      user_id: user.id,
      type: 'weekly_report',
      title: '📊 本周成长报告已生成',
      body: summary || '点击查看你的本周总结',
      action_url: `/reports/${(report as unknown as Record<string, string>).id}`,
      delivered_via: 'in_app',
    })
  }

  return NextResponse.json({ data: report })
}
