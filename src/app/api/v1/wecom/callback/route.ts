/**
 * 企业微信回调接口
 *
 * GET  — 验证 URL（返回 echostr）
 * POST — 接收用户消息 → DeepSeek 生成回复 → 发送回企业微信
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getOpenAI, CHAT_MODEL } from '@/lib/openai/client'
import { retrieveRelevantMemories, extractAndStoreMemories } from '@/lib/memory/engine'
import { decryptMsg, encryptMsg, verifySignature, parseMessageXML } from '@/lib/wecom/crypto'
import { getAccessToken, sendTextMessage, isWeComConfigured } from '@/lib/wecom/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---- GET: URL 验证 ----
export async function GET(request: Request) {
  // 直接从原始 URL 字符串解析参数（完全避免 URLSearchParams 的 + → 空格问题）
  const rawUrl = request.url
  const queryStart = rawUrl.indexOf('?')
  const queryStr = queryStart >= 0 ? rawUrl.substring(queryStart + 1) : ''

  function getRaw(name: string): string | null {
    // 在 raw query string 中查找参数
    const pairs = queryStr.split('&')
    for (const pair of pairs) {
      if (!pair.startsWith(name + '=')) continue
      const rawValue = pair.substring(name.length + 1)
      // 只做百分号解码，+ 保持原样
      try {
        return decodeURIComponent(rawValue)
      } catch {
        return rawValue
      }
    }
    return null
  }

  const msgSignature = getRaw('msg_signature')
  const timestamp = getRaw('timestamp')
  const nonce = getRaw('nonce')
  const echostr = getRaw('echostr')

  if (!msgSignature || !timestamp || !nonce || !echostr) {
    return new NextResponse('missing params', { status: 400 })
  }

  const token = (process.env.WECOM_TOKEN ?? '').trim()
  const encodingAESKey = (process.env.WECOM_ENCODING_AES_KEY ?? '').trim()
  const corpId = (process.env.WECOM_CORP_ID ?? '').trim()

  if (!token || !encodingAESKey || !corpId) {
    return new NextResponse('wecom not configured', { status: 500 })
  }

  try {
    // 1. 验证签名
    if (!verifySignature(token, timestamp, nonce, echostr, msgSignature)) {
      console.error('WeCom signature verification failed')
      return new NextResponse('signature fail', { status: 403 })
    }

    // 2. 解密 echostr
    const decrypted = decryptMsg(echostr, encodingAESKey, corpId)
    console.log('WeCom URL verify success')
    return new NextResponse(decrypted)
  } catch (err) {
    console.error('WeCom URL verify error:', err)
    return new NextResponse('verify failed', { status: 403 })
  }
}

// ---- POST: 接收消息 ----
export async function POST(request: Request) {
  if (!isWeComConfigured()) {
    return new NextResponse('wecom not configured', { status: 500 })
  }

  const rawUrl = request.url
  const queryStart = rawUrl.indexOf('?')
  const queryStr = queryStart >= 0 ? rawUrl.substring(queryStart + 1) : ''
  const getRaw = (name: string) => {
    const pairs = queryStr.split('&')
    for (const pair of pairs) {
      if (!pair.startsWith(name + '=')) continue
      const rawValue = pair.substring(name.length + 1)
      try { return decodeURIComponent(rawValue) } catch { return rawValue }
    }
    return null
  }
  const msgSignature = getRaw('msg_signature')
  const timestamp = getRaw('timestamp')
  const nonce = getRaw('nonce')

  if (!msgSignature || !timestamp || !nonce) {
    return new NextResponse('missing params', { status: 400 })
  }

  let body: string
  try {
    body = await request.text()
  } catch {
    return new NextResponse('invalid body', { status: 400 })
  }

  const token = process.env.WECOM_TOKEN ?? ''
  const encodingAESKey = process.env.WECOM_ENCODING_AES_KEY ?? ''
  const corpId = process.env.WECOM_CORP_ID ?? ''

  // 提取加密体
  const encMatch = body.match(/<Encrypt><!\[CDATA\[(.*?)\]\]><\/Encrypt>/)
  if (!encMatch) {
    return new NextResponse('no encrypt', { status: 400 })
  }
  const encrypted = encMatch[1]

  // 验证签名
  if (!verifySignature(token, timestamp, nonce, encrypted, msgSignature)) {
    return new NextResponse('signature fail', { status: 403 })
  }

  // 解密
  let decrypted: string
  try {
    decrypted = decryptMsg(encrypted, encodingAESKey, corpId)
  } catch (err) {
    console.error('WeCom decrypt error:', err)
    return new NextResponse('decrypt fail', { status: 403 })
  }

  // 解析消息
  const parsed = parseMessageXML(decrypted)
  if (!parsed || parsed.msgType !== 'text' || !parsed.content) {
    // 非文本消息，忽略
    return new NextResponse('ok')
  }

  const wecomUserId = parsed.fromUserName
  const userMessage = parsed.content.trim()

  // ---- 处理消息 ----
  // 从 user_profiles 或 user_settings 查找关联的 Supabase 用户
  // 如果没有绑定，使用默认用户（本地追踪代理配置的 userId）
  let supabaseUser: { id: string } | null = null

  // 先尝试通过 wecom_user_id 查找
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: linkedProfiles } = await (await createServerSupabase())
    .from('user_profiles')
    .select('user_id')
    .eq('wecom_user_id' as any, wecomUserId)
    .limit(1)

  const linkedProfile = linkedProfiles?.[0] as { user_id: string } | undefined

  if (linkedProfile) {
    supabaseUser = { id: linkedProfile.user_id }
  } else {
    // Fallback: 查找默认用户（在 settings 中配置）
    const defaultUserId = process.env.WECOM_DEFAULT_USER_ID
    if (defaultUserId) {
      supabaseUser = { id: defaultUserId }

      // 自动绑定
      try {
        const bindSupabase = await createServerSupabase()
        await bindSupabase
          .from('user_profiles')
          .update({ wecom_user_id: wecomUserId } as any)
          .eq('user_id', defaultUserId)
      } catch { /* ignore bind error */ }
    }
  }

  if (!supabaseUser) {
    // 用户未绑定，返回提示
    const token = await getAccessToken()
    await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: wecomUserId,
          msgtype: 'text',
          agentid: parseInt(process.env.WECOM_AGENT_ID ?? '0', 10),
          text: { content: '🤗 你好！请先在 AI Companion 网页版注册并登录，然后告诉我你的账号名，我会帮你绑定。' },
        }),
      }
    )
    return new NextResponse('ok')
  }

  const userId = supabaseUser.id

  // ---- 生成 AI 回复 ----
  let replyText: string
  try {
    const supabase = await createServerSupabase()
    const openai = getOpenAI()

    // 用户档案
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    // 记忆检索
    const memoryContext = await retrieveRelevantMemories({
      supabase,
      userId,
      userMessage,
    })

    // 最近对话
    const { data: recentConvos } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(16)

    const historyMessages = (recentConvos ?? [])
      .reverse()
      .map((c) => ({ role: c.role as 'user' | 'assistant', content: c.content }))

    // 人格
    const { data: settingsRow } = await supabase
      .from('user_settings')
      .select('persona_id')
      .eq('user_id', userId)
      .single()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const personaId = (settingsRow as any)?.persona_id as string | undefined
    let personaPrompt: string | null = null
    if (personaId) {
      const { data: personaRow } = await supabase
        .from('personas')
        .select('system_prompt')
        .eq('id', personaId)
        .single()
      personaPrompt = (personaRow as any)?.system_prompt ?? null
    }

    const nickname = (profile as any)?.nickname ?? '朋友'
    let systemPrompt = `你是 AI Companion，一位温暖而真诚的AI成长伙伴。
- 称呼用户为「${nickname}」
- 语气温暖自然，使用中文口语
- 回复简洁（1-3句话），不说废话
- 像真正关心对方的朋友`

    if (personaPrompt) {
      systemPrompt = personaPrompt.replace('{nickname}', nickname)
    }

    if (memoryContext.systemContext) {
      systemPrompt += '\n' + memoryContext.systemContext
    }

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages.slice(-12),
        { role: 'user', content: userMessage },
      ],
      max_tokens: 600,
      temperature: 0.8,
    })

    replyText = completion.choices[0]?.message?.content ?? '嗯，我在呢 ❤️'

    // 存储对话
    await supabase.from('conversations').insert([
      { user_id: userId, role: 'user', content: userMessage, metadata: { source: 'wecom' } },
      { user_id: userId, role: 'assistant', content: replyText, metadata: { source: 'wecom' } },
    ])

    // 异步提取记忆
    extractAndStoreMemories({
      supabase,
      userId,
      userMessage,
      aiResponse: replyText,
      source: 'conversation',
    }).catch(() => {})
  } catch (err) {
    console.error('WeCom reply error:', err)
    replyText = '抱歉，我这边出了点问题，稍后再试 ❤️'
  }

  // 发送回复
  await sendTextMessage(wecomUserId, replyText)

  return new NextResponse('ok')
}
