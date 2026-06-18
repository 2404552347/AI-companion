/**
 * GET /api/v1/companion/proactive
 *
 * AI 主动消息端点。前端轮询此接口，AI 根据用户的活动数据、
 * 时间、最近对话等上下文，自主决定是否主动发送消息。
 *
 * 冷却时间: 15 分钟（避免频繁打扰）
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getOpenAI, CHAT_MODEL } from '@/lib/openai/client'
import { retrieveRelevantMemories } from '@/lib/memory/engine'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOLDOWN_MIN = 15 // 主动消息最小间隔

export async function GET(_request: Request) {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ message: null, reason: 'unauthorized' })
  }

  // ---- 1. 冷却检查 ----
  const cooldownAgo = new Date(Date.now() - COOLDOWN_MIN * 60 * 1000).toISOString()

  const { data: recentProactive } = await supabase
    .from('conversations')
    .select('id, created_at')
    .eq('user_id', user.id)
    .eq('role', 'assistant')
    .contains('metadata', { proactive: true })
    .gte('created_at', cooldownAgo)
    .order('created_at', { ascending: false })
    .limit(1)

  if (recentProactive && recentProactive.length > 0) {
    return NextResponse.json({ message: null, reason: 'cooldown' })
  }

  // ---- 2. 收集上下文 ----

  // 用户档案
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // 今日活动摘要
  const todayStr = new Date().toISOString().split('T')[0]
  const { data: activity } = await supabase
    .from('daily_activity_summaries')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', todayStr)
    .single()

  // 最近对话（最近 10 条）
  const { data: recentConvos } = await supabase
    .from('conversations')
    .select('role, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // 最后交互时间
  const lastUserMsg = recentConvos?.find((c) => c.role === 'user')
  const lastInteractionAt = lastUserMsg?.created_at ?? null
  const minutesSinceLastInteraction = lastInteractionAt
    ? Math.round((Date.now() - new Date(lastInteractionAt).getTime()) / 60000)
    : 999

  // 如果没有交互且没有活动数据，不需要主动消息
  if (minutesSinceLastInteraction > 480 && !activity) {
    return NextResponse.json({ message: null, reason: 'no_recent_activity' })
  }

  // 相关记忆
  const memoryContext = await retrieveRelevantMemories({
    supabase,
    userId: user.id,
    userMessage: `当前时间: ${new Date().toLocaleString('zh-CN')}。用户最近${minutesSinceLastInteraction}分钟前最后一次发消息。`,
    maxChars: 400,
  })

  // ---- 3. 人格 ----
  const { data: settings } = await supabase
    .from('user_settings')
    .select('persona_id')
    .eq('user_id', user.id)
    .single()

  const { data: persona } = settings?.persona_id
    ? await supabase
        .from('personas')
        .select('display_name, avatar_emoji, system_prompt')
        .eq('id', settings.persona_id)
        .single()
    : { data: null }

  // ---- 4. 构建决策 Prompt ----
  const nickname = (profile as any)?.nickname ?? '朋友'
  const now = new Date()
  const hour = now.getHours()
  const timeOfDay = hour < 6 ? '深夜' : hour < 9 ? '早晨' : hour < 12 ? '上午' : hour < 14 ? '中午' : hour < 18 ? '下午' : hour < 22 ? '晚上' : '深夜'

  let activityContext = ''
  if (activity) {
    const a = activity as any
    const topApps = (a.top_apps ?? []).slice(0, 3).map((x: any) => x.app_name).join('、')
    activityContext = [
      `状态: ${a.current_status ?? '未知'}`,
      `活跃: ${a.total_active_min ?? 0}分钟`,
      `空闲: ${a.total_idle_min ?? 0}分钟`,
      `生产力: ${a.productive_min ?? 0}分钟`,
      topApps ? `常用应用: ${topApps}` : '',
    ].filter(Boolean).join(' | ')
  }

  const recentChatContext = (recentConvos ?? [])
    .reverse()
    .slice(-6)
    .map((c) => `${c.role === 'user' ? '用户' : 'AI'}: ${(c.content ?? '').slice(0, 60)}`)
    .join('\n')

  const decisionPrompt = `你是一个体贴的AI成长伙伴，名叫"${persona?.display_name ?? 'AI 伙伴'}"。

## 当前情况
- 时间: ${now.toLocaleString('zh-CN')}（${timeOfDay}）
- 用户: ${nickname}
- 距离用户上次发消息: ${minutesSinceLastInteraction}分钟
${activityContext ? `- 今日活动: ${activityContext}` : '- 今日活动: 暂无数据'}
${memoryContext.systemContext ? `\n## 关于用户的记忆\n${memoryContext.systemContext}` : ''}

## 最近对话
${recentChatContext || '（暂无对话）'}

## 决定是否主动发消息

你需要判断「现在是否应该主动给用户发一条消息」。只在以下情况考虑主动发消息：

1. 用户刚结束一段工作/学习（从活动数据看状态变化），可以关心一下
2. 用户空闲很久后刚回到电脑前
3. 到了特定的时间点（早上刚起来、深夜还在工作等）可以简短问候
4. 用户很久没和你聊天了（>1小时），但仍在活跃使用设备

**不要**主动发消息的情况：
- 用户刚刚聊过天（<10分钟前）
- 没什么特别的事情发生
- 纯粹为了刷存在感

返回 JSON：
- 如果决定发消息: {"should_send": true, "message": "你的消息内容（中文，1-3句话，自然温暖）"}
- 如果不发: {"should_send": false, "reason": "简短原因"}

注意：消息要自然、不煽情、不说"我注意到你的数据"这种机械的话。用口语化中文。`

  try {
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: decisionPrompt },
        { role: 'user', content: '请根据当前情况判断是否主动发消息。' },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
      temperature: 0.7,
    })

    const result = JSON.parse(completion.choices[0]?.message?.content ?? '{"should_send":false,"reason":"parse error"}')

    if (!result.should_send || !result.message) {
      return NextResponse.json({ message: null, reason: result.reason ?? 'ai_skip' })
    }

    // ---- 5. 存储主动消息 ----
    const { data: stored } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        role: 'assistant',
        content: result.message,
        metadata: {
          proactive: true,
          model: CHAT_MODEL,
          trigger_reason: result.reason ?? null,
        },
      })
      .select('id, created_at')
      .single()

    // ---- 6. 通过企业微信发送（如果已配置） ----
    try {
      const { isWeComConfigured, sendTextMessage } = await import('@/lib/wecom/client')
      if (isWeComConfigured()) {
        // 查找用户的微信 UserID
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('wecom_user_id')
          .eq('user_id', user.id)
          .single()

        const wecomUserId = ((profile as any)?.wecom_user_id) ?? ''
        if (wecomUserId) {
          const sent = await sendTextMessage(wecomUserId, result.message)
          if (!sent) console.warn('WeCom proactive send failed')
        }
      }
    } catch (err) {
      console.warn('WeCom proactive error:', err)
    }

    return NextResponse.json({
      message: {
        id: stored?.id ?? `proactive-${Date.now()}`,
        content: result.message,
        created_at: stored?.created_at ?? new Date().toISOString(),
        proactive: true,
      },
    })
  } catch (err) {
    console.error('Proactive message error:', err)
    return NextResponse.json({ message: null, reason: 'error' })
  }
}
