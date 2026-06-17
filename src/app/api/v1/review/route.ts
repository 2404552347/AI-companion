/**
 * POST /api/v1/review — 创建或更新每日复盘，并生成 AI 反馈
 * GET  /api/v1/review?date=YYYY-MM-DD — 获取指定日期的复盘
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getOpenAI, FAST_MODEL } from '@/lib/openai/client'
import { extractAndStoreMemories } from '@/lib/memory/engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

  const { data: log } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('log_date', date)
    .single()

  return NextResponse.json({ data: log })
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
  const {
    date,
    mood_score,
    mood_note,
    completed,
    failed,
    growth,
    tomorrow_plan,
  } = body

  if (!date) {
    return NextResponse.json({ error: { code: 'invalid_request', message: '日期不能为空' } }, { status: 400 })
  }

  // Generate AI feedback
  let ai_feedback: string | null = null
  let ai_encouragement: string | null = null
  let ai_analysis: string | null = null

  try {
    const openai = getOpenAI()

    // Feedback: specific and encouraging
    const feedbackResponse = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        {
          role: 'system',
          content: `你是用户的AI成长伙伴。用户刚刚完成了今天的复盘。请生成一段30-50字的反馈和鼓励。
你的回复应该:
1. 具体提到用户今天完成的事情
2. 真诚地肯定成长
3. 对于失败的部分，温柔但不要忽视
4. 用温暖的口语化中文，不要翻译腔

返回 JSON 格式:
{
  "feedback": "对今天完成事情的点评(30-50字)",
  "encouragement": "针对失败或不足的鼓励(20-40字)",
  "analysis": "简短的成长分析建议(30-50字)"
}`,
        },
        {
          role: 'user',
          content: `今日复盘:
心情: ${mood_score ?? '未记录'}/5 ${mood_note ? `(${mood_note})` : ''}
完成: ${completed?.join('、') || '无'}
失败: ${failed?.join('、') || '无'}
成长: ${growth?.join('、') || '无'}
明日计划: ${tomorrow_plan?.join('、') || '无'}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.7,
    })

    const feedbackResult = JSON.parse(
      feedbackResponse.choices[0]?.message?.content ?? '{}'
    )
    ai_feedback = feedbackResult.feedback ?? null
    ai_encouragement = feedbackResult.encouragement ?? null
    ai_analysis = feedbackResult.analysis ?? null
  } catch (err) {
    console.error('AI feedback generation failed:', err)
    // Non-critical — proceed without AI feedback
  }

  // Upsert daily log
  const { data: log, error } = await supabase
    .from('daily_logs')
    .upsert(
      {
        user_id: user.id,
        log_date: date,
        completed: completed ?? [],
        failed: failed ?? [],
        growth: growth ?? [],
        tomorrow_plan: tomorrow_plan ?? [],
        mood_score: mood_score ?? null,
        mood_note: mood_note ?? null,
        ai_feedback,
        ai_encouragement,
        ai_analysis,
      },
      {
        onConflict: 'user_id,log_date',
      }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: { code: 'database_error', message: '保存失败: ' + error.message } },
      { status: 500 }
    )
  }

  // Create growth event if this is a new log
  if (completed && completed.length > 0) {
    await supabase.from('growth_events').upsert(
      {
        user_id: user.id,
        event_type: 'achievement',
        title: `完成了今日复盘`,
        description: `完成事项: ${completed.slice(0, 3).join('、')}`,
        emotion_tag: mood_score && mood_score >= 4 ? 'happy' : 'neutral',
        related_log_id: log?.id,
        date,
      },
      { onConflict: 'user_id,date,event_type' }
    )
  }

  // Extract memories from review
  const reviewSummary = [
    completed?.join('、') ? `完成: ${completed.join('、')}` : '',
    failed?.join('、') ? `未完成: ${failed.join('、')}` : '',
    growth?.join('、') ? `成长: ${growth.join('、')}` : '',
    mood_note ? `心情: ${mood_note}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  if (reviewSummary) {
    await extractAndStoreMemories({
      supabase,
      userId: user.id,
      userMessage: reviewSummary,
      aiResponse: [ai_feedback, ai_encouragement, ai_analysis].filter(Boolean).join('\n'),
      source: 'review',
      sourceRef: log?.id,
    })
  }

  return NextResponse.json({
    data: {
      ...log,
      ai_feedback,
      ai_encouragement,
      ai_analysis,
    },
  })
}
