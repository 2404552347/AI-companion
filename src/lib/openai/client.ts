import OpenAI from 'openai'

let aiInstance: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!aiInstance) {
    aiInstance = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    })
  }
  return aiInstance
}

/** DeepSeek Chat — 通用模型，用于对话和轻量任务 */
export const FAST_MODEL = 'deepseek-chat'

/** DeepSeek Chat — 主对话 */
export const CHAT_MODEL = 'deepseek-chat'
