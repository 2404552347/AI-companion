/**
 * 企业微信 API 客户端
 *
 * - 获取 access_token
 * - 发送消息给指定用户
 * - 主动消息推送
 */

let cachedToken: { token: string; expiresAt: number } | null = null

interface WeComConfig {
  corpId: string
  agentId: string
  secret: string
  token: string
  encodingAESKey: string
}

function getConfig(): WeComConfig {
  return {
    corpId: process.env.WECOM_CORP_ID ?? '',
    agentId: process.env.WECOM_AGENT_ID ?? '',
    secret: process.env.WECOM_SECRET ?? '',
    token: process.env.WECOM_TOKEN ?? '',
    encodingAESKey: process.env.WECOM_ENCODING_AES_KEY ?? '',
  }
}

export function isWeComConfigured(): boolean {
  const cfg = getConfig()
  return !!(cfg.corpId && cfg.agentId && cfg.secret)
}

/** 获取 access_token（带缓存） */
export async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token
  }

  const { corpId, secret } = getConfig()

  const res = await fetch(
    `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpId}&corpsecret=${secret}`
  )

  if (!res.ok) {
    throw new Error(`WeCom token request failed: ${res.status}`)
  }

  const data = await res.json()
  if (data.errcode !== 0) {
    throw new Error(`WeCom token error: ${data.errmsg} (${data.errcode})`)
  }

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000, // 提前 5 分钟过期
  }

  return cachedToken.token
}

/** 发送文本消息给企业微信用户 */
export async function sendTextMessage(
  userId: string,
  content: string
): Promise<boolean> {
  try {
    const { agentId } = getConfig()
    const token = await getAccessToken()

    const res = await fetch(
      `https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          touser: userId,
          msgtype: 'text',
          agentid: parseInt(agentId, 10),
          text: { content },
        }),
      }
    )

    const data = await res.json()
    if (data.errcode !== 0) {
      console.error('WeCom send error:', data)
      return false
    }
    return true
  } catch (err) {
    console.error('WeCom send exception:', err)
    return false
  }
}

/** 清除 token 缓存（用于测试） */
export function clearTokenCache(): void {
  cachedToken = null
}
