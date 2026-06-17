/**
 * Proactive Care Check API
 *
 * GET /api/v1/care-check — 主动检查用户状态并发送关怀通知
 *
 * 这个 endpoint 设计为由外部 Cron Job 定期调用:
 * - 每 30 分钟检查一次用户活动状态
 * - 检测异常模式（过长时间工作、过多娱乐、长时间离线）
 * - 生成 AI 关怀消息
 *
 * 在 Supabase 中配置 Edge Function Cron:
 *   select cron.schedule('care-check', '* / 30 * * * *', 'GET ...')
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getOpenAI, FAST_MODEL } from '@/lib/openai/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  // 简单的密钥保护（生产环境应使用更强的认证）
  if (secret !== process.env.CARE_CHECK_SECRET && process.env.CARE_CHECK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = await createServerSupabase()
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  // 获取所有活跃用户
  const { data: activeUsers } = await supabase
    .from('user_settings')
    .select('user_id, care_check_enabled, care_check_interval')
    .eq('care_check_enabled', true)

  if (!activeUsers || activeUsers.length === 0) {
    return NextResponse.json({ data: { checked: 0, notifications: 0 } })
  }

  let notificationsSent = 0
  const results: Array<{ userId: string; action: string; message: string }> = []

  for (const settings of activeUsers) {
    try {
      const userId = settings.user_id
      const checkIntervalHours = settings.care_check_interval ?? 48

      // 1. 检查最近活动
      const activityResult = await supabase
        .from('daily_activity_summaries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single()
      const activitySummary = activityResult.data as Record<string, unknown> | null

      // 2. 检查最近对话时间
      const { data: lastConversation } = await supabase
        .from('conversations')
        .select('created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // 3. 检查最近复盘
      const { data: lastReview } = await supabase
        .from('daily_logs')
        .select('log_date')
        .eq('user_id', userId)
        .order('log_date', { ascending: false })
        .limit(1)
        .single()

      // 4. 检查最近的通知（避免重复发送）
      const { data: recentNotification } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('user_id', userId)
        .eq('type', 'care_check')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      const lastNotifTime = recentNotification
        ? new Date(recentNotification.created_at).getTime()
        : 0
      const hoursSinceLastNotif = (now.getTime() - lastNotifTime) / (1000 * 60 * 60)

      // 不要过于频繁发送通知（至少间隔 checkIntervalHours）
      if (hoursSinceLastNotif < checkIntervalHours) {
        continue
      }

      // --- 检测各种触发条件 ---

      let shouldNotify = false
      let careType = ''
      let careContext = ''

      // 条件 A: 长时间未互动
      if (lastConversation) {
        const hoursSinceChat = (now.getTime() - new Date(lastConversation.created_at).getTime()) / (1000 * 60 * 60)
        if (hoursSinceChat >= checkIntervalHours) {
          shouldNotify = true
          careType = '离线关怀'
          careContext = `用户已经 ${Math.round(hoursSinceChat)} 小时没有互动`
        }
      } else {
        // 从未互动过
        shouldNotify = true
        careType = '初次关怀'
        careContext = '用户注册后还未开始对话'
      }

      // 条件 B: 连续未复盘
      if (!shouldNotify && lastReview) {
        const daysSinceReview = Math.floor((now.getTime() - new Date(lastReview.log_date).getTime()) / (1000 * 60 * 60 * 24))
        if (daysSinceReview >= 2) {
          shouldNotify = true
          careType = '复盘提醒'
          careContext = `用户已经 ${daysSinceReview} 天没有复盘`
        }
      }

      // 条件 C: 活动数据异常（过多娱乐时间）
      if (!shouldNotify && activitySummary) {
        if ((activitySummary.entertainment_min as number) > 180) {
          shouldNotify = true
          careType = '活动关注'
          careContext = '用户今天娱乐时间超过3小时: ' + (activitySummary.entertainment_min as number) + '分钟'
        }
      }

      // 条件 D: 工作时间过长，需要休息
      if (!shouldNotify && activitySummary && (activitySummary.current_status as string) === 'working') {
        if ((activitySummary.productive_min as number) > 300 && (activitySummary.total_idle_min as number) < 30) {
          shouldNotify = true
          careType = '休息提醒'
          careContext = '用户已连续工作' + (activitySummary.productive_min as number) + '分钟，几乎无休息'
        }
      }

      // --- 发送通知 ---
      if (shouldNotify) {
        // 获取用户档案
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('nickname')
          .eq('user_id', userId)
          .single()

        const nickname = profile?.nickname ?? '朋友'

        // 用 AI 生成关怀消息
        let title = ''
        let body = ''

        try {
          const openai = getOpenAI()
          const response = await openai.chat.completions.create({
            model: FAST_MODEL,
            messages: [
              {
                role: 'system',
                content: `你是一个温暖的 AI 成长伙伴。用户名叫「${nickname}」。你需要根据上下文生成一条简短的主动关怀消息。

规则:
1. 15-40字之间
2. 不要用"系统提醒"、"通知"等冷冰冰的词汇
3. 像一个朋友在关心对方
4. 自然、温暖、口语化
5. 返回 JSON 格式: {"title": "简短标题", "body": "关怀消息正文"}`,
              },
              {
                role: 'user',
                content: `关怀类型: ${careType}\n上下文: ${careContext}\n当前时间: ${now.toLocaleString('zh-CN')}`,
              },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 150,
            temperature: 0.8,
          })

          const result = JSON.parse(response.choices[0]?.message?.content ?? '{}')
          title = result.title ?? `${nickname}，在吗？`
          body = result.body ?? `已经有一阵子没见到你了，今天过得怎么样？`
        } catch {
          // Fallback messages
          if (careType === '离线关怀') {
            title = `${nickname}，好久不见`
            body = `已经有一阵子没见到你了，今天过得怎么样？无论发生什么，我都在这里。`
          } else if (careType === '复盘提醒') {
            title = '今天还没复盘哦'
            body = `${nickname}，你坚持复盘的习惯很棒。今天要不要花2分钟记录一下？`
          } else if (careType === '休息提醒') {
            title = '该休息一下了'
            body = `${nickname}，你已经专注了很长时间。起来走走，喝杯水吧 ☕`
          } else if (careType === '活动关注') {
            title = '今天过得怎么样？'
            body = `${nickname}，我今天注意到你花了不少时间在娱乐上。偶尔放松没关系，但如果需要调整，我随时陪你。`
          } else {
            title = `嗨，${nickname}`
            body = '今天想和我聊聊吗？'
          }
        }

        // 插入通知
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'care_check',
          title,
          body,
          action_url: '/chat',
          delivered_via: 'in_app',
        })

        notificationsSent++
        results.push({ userId, action: careType, message: body })
      }
    } catch (err) {
      console.error(`Care check error for user ${settings.user_id}:`, err)
    }
  }

  return NextResponse.json({
    data: {
      checked: activeUsers.length,
      notifications_sent: notificationsSent,
      details: results,
    },
  })
}
