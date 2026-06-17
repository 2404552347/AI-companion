/**
 * POST /api/v1/chat/send
 *
 * 发送消息给 AI，SSE 流式返回。
 * 每次调用自动: 检索记忆 → 构建上下文 → 调用 OpenAI → 提取新记忆 → 存储对话
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getOpenAI, CHAT_MODEL } from '@/lib/openai/client'
import { retrieveRelevantMemories, extractAndStoreMemories } from '@/lib/memory/engine'
import { rateLimitResponse } from '@/lib/rate-limit'
import { analyzeEmotion } from '@/lib/emotion/analyzer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: { code: 'unauthorized', message: '请先登录' } }, { status: 401 })
  }

  // Rate limit
  const rateLimit = rateLimitResponse(user.id, 'chat:send')
  if (rateLimit) return rateLimit

  // Parse request
  let body: { message: string; mood?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: { code: 'invalid_request', message: '请求格式错误' } }, { status: 400 })
  }

  const { message } = body
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: { code: 'invalid_request', message: '消息不能为空' } }, { status: 400 })
  }

  // Create SSE stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      try {
        // 1. Load user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // 2. Retrieve relevant memories
        const memoryContext = await retrieveRelevantMemories({
          supabase,
          userId: user.id,
          userMessage: message,
        })

        // 3. Load recent conversation history
        const { data: recentConvos } = await supabase
          .from('conversations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20)

        const historyMessages = (recentConvos ?? [])
          .reverse()
          .map((c) => ({
            role: c.role as 'user' | 'assistant',
            content: c.content,
          }))

        // 4. Load persona
        const { data: settings } = await supabase
          .from('user_settings')
          .select('persona_id')
          .eq('user_id', user.id)
          .single()

        let systemPrompt = buildDefaultSystemPrompt(profile)
        if (settings?.persona_id) {
          const { data: persona } = await supabase
            .from('personas')
            .select('system_prompt')
            .eq('id', settings.persona_id)
            .single()
          if (persona?.system_prompt) {
            systemPrompt = persona.system_prompt
          }
        }

        // 5. Inject user profile and memories into system prompt
        systemPrompt = systemPrompt
          .replace('{nickname}', profile?.nickname ?? '用户')
          .replace('{age}', String(profile?.age ?? '未知'))
          .replace('{interests}', profile?.interests?.join('、') ?? '未设定')

        if (memoryContext.systemContext) {
          systemPrompt += '\n' + memoryContext.systemContext
        }

        // 5.5 Inject today's activity context
        const todayStr = new Date().toISOString().split('T')[0]
        const activityResult = await supabase
          .from('daily_activity_summaries')
          .select('*')
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .single()

        const activitySummary = activityResult.data as Record<string, unknown> | null
        if (activitySummary) {
          const topApps = (activitySummary.top_apps as Array<{app_name: string; duration_min: number}>) ?? []
          const appList = topApps.slice(0, 5).map((a) => `${a.app_name}(${a.duration_min}分钟)`).join('、')

          systemPrompt += '\n\n## 用户今日活动数据\n'
            + '- 当前状态: ' + (activitySummary.current_status ?? '未知') + '\n'
            + '- 生产力时间: ' + (activitySummary.productive_min ?? 0) + '分钟\n'
            + '- 空闲时间: ' + (activitySummary.total_idle_min ?? 0) + '分钟\n'
            + '- 娱乐时间: ' + (activitySummary.entertainment_min ?? 0) + '分钟\n'
            + '- 常用应用: ' + (appList || '暂无数据') + '\n'
            + (activitySummary.last_active_at ? '- 最近活跃: ' + new Date(activitySummary.last_active_at as string).toLocaleTimeString('zh-CN') : '')
            + '\n\n你可以自然地引用这些数据。例如：\n'
            + '- 如果用户在工作很久后找你聊天，可以说"你已经在 VS Code 里呆了2小时了，休息一下吧"\n'
            + '- 如果用户有较多娱乐时间，可以温和地关心\n'
            + '- 不要生硬地报数据，而是在对话中自然提及'
        }

        // 6. Call OpenAI with streaming
        const openai = getOpenAI()
        const startTime = Date.now()

        const completion = await openai.chat.completions.create({
          model: CHAT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...historyMessages.slice(-16), // Last 16 messages (8 turns)
            { role: 'user', content: message },
          ],
          stream: true,
          max_tokens: 1000,
          temperature: 0.8,
        })

        // 7. Stream response token by token
        let fullResponse = ''
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            fullResponse += delta
            send('message', { delta })
          }
        }

        const latencyMs = Date.now() - startTime

        // 8. Store user message
        const { data: userMsg } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            role: 'user',
            content: message,
            metadata: { mood: body.mood },
          })
          .select('id')
          .single()

        // 9. Store AI response
        const { data: aiMsg } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            role: 'assistant',
            content: fullResponse,
            metadata: {
              tokens_used: fullResponse.length,
              model: CHAT_MODEL,
              latency_ms: latencyMs,
              cited_memories: memoryContext.memories.map((m) => m.id),
            },
          })
          .select('id')
          .single()

        // 10. Analyze emotion from user message (async, non-blocking)
        const todayEmotion = new Date().toISOString().split('T')[0]
        analyzeEmotion(message).then(async (emotionResult) => {
          if (emotionResult) {
            await supabase.from('emotion_logs').insert({
              user_id: user.id,
              emotion: emotionResult.primary,
              score: emotionResult.score,
              keywords: emotionResult.keywords,
              source: 'chat',
              source_ref: userMsg?.id ?? null,
              date: todayEmotion,
            } as any)
          }
        }).catch(() => {})

        // 11. Extract and store new memories (async, don't block)
        const newMemories = await extractAndStoreMemories({
          supabase,
          userId: user.id,
          userMessage: message,
          aiResponse: fullResponse,
          source: 'conversation',
          sourceRef: aiMsg?.id,
        })

        if (newMemories.length > 0) {
          // Link extracted memories to the conversation
          if (aiMsg?.id) {
            await supabase
              .from('conversations')
              .update({
                extracted_memories: newMemories.map((m) => m.id),
              })
              .eq('id', aiMsg.id)
          }

          send('memory_extracted', { memories: newMemories })
        }

        // 11. Signal completion
        send('done', {
          conversation_id: aiMsg?.id,
          tokens_used: fullResponse.length,
          latency_ms: latencyMs,
        })
      } catch (err) {
        console.error('Chat stream error:', err)
        send('error', {
          code: 'internal_error',
          message: 'AI 回复生成失败，请稍后重试',
        })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

function buildDefaultSystemPrompt(profile: Record<string, unknown> | null): string {
  const nickname = (profile as Record<string, string>)?.nickname ?? '用户'
  const longTermVision = (profile as Record<string, string>)?.long_term_vision ?? ''
  const interests = ((profile as Record<string, string[]>)?.interests ?? []).join('、')

  return `你是一位温暖而真诚的AI成长伙伴。

## 关于用户
- 昵称: ${nickname}
- 长期愿景: ${longTermVision || '未设定'}
- 兴趣爱好: ${interests || '未设定'}

## 你的风格
1. 称呼用户为「${nickname}」，语气温暖但不煽情
2. 看到进步时，具体地表扬
3. 看到困难时，先共情再建议
4. 自然地引用之前记住的关于用户的信息
5. 像一位真正关心对方的朋友，而不是答题机器
6. 回复简洁有用，不说废话
7. 使用中文口语风格

## 核心原则
- 你不是工具，你是伙伴
- 你的价值不是提供答案，而是提供陪伴和反馈
- 让用户感受到「有人在乎我是否出现」`
}
