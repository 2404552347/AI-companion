/**
 * 简易内存限流器 — 防止 API 滥用
 *
 * 每个用户每个 endpoint 有独立的限流计数。
 * 生产环境建议使用 Upstash Redis 或 Vercel KV。
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// 每60秒清理过期条目
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 60000).unref()

interface RateLimitConfig {
  maxRequests: number   // 窗口内最大请求数
  windowMs: number      // 时间窗口（毫秒）
}

const DEFAULTS: Record<string, RateLimitConfig> = {
  'chat:send': { maxRequests: 30, windowMs: 60000 },     // 聊天: 30次/分钟
  'review:post': { maxRequests: 10, windowMs: 60000 },   // 复盘: 10次/分钟
  'activity:post': { maxRequests: 60, windowMs: 60000 }, // 活动上报: 60次/分钟
  'care-check': { maxRequests: 5, windowMs: 60000 },     // 关怀检查: 5次/分钟
  'default': { maxRequests: 60, windowMs: 60000 },
}

export function checkRateLimit(
  userId: string,
  endpoint: string
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = DEFAULTS[endpoint] || DEFAULTS['default']
  const key = `${userId}:${endpoint}`
  const now = Date.now()

  let entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + config.windowMs }
    store.set(key, entry)
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetAt - now) / 1000),
  }
}

/** Express/Next.js 风格的限流中间件辅助函数 */
export function rateLimitResponse(
  userId: string | null,
  endpoint: string
): Response | null {
  if (!userId) return null // 未认证用户由 auth 层处理

  const result = checkRateLimit(userId, endpoint)
  if (!result.allowed) {
    return Response.json(
      {
        error: {
          code: 'rate_limit_exceeded',
          message: `请求过于频繁，请 ${result.resetIn} 秒后再试`,
          retry_after: result.resetIn,
        },
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.resetIn),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return null
}
