/**
 * Emotion Analyzer — 对话情绪分析
 *
 * 在每条用户消息后轻量分析情绪状态。
 * 用于: Dashboard 情绪趋势、Timeline 情绪标注、主动关怀触发
 */

import { getOpenAI, FAST_MODEL } from '@/lib/openai/client'

export interface EmotionResult {
  primary: string      // 'happy' | 'neutral' | 'anxious' | 'sad' | 'motivated' | 'frustrated' | 'tired' | 'proud'
  score: number        // 0-100 情绪强度
  keywords: string[]   // 触发词
  suggestion: string   // 给 AI 的回复建议（如何回应这种情绪）
}

const EMOTION_PROMPT = `分析以下用户消息的情绪状态。返回 JSON:
{
  "primary": "happy|neutral|anxious|sad|motivated|frustrated|tired|proud",
  "score": 0-100,
  "keywords": ["触发词"],
  "suggestion": "10字以内的回应建议"
}`

export async function analyzeEmotion(message: string): Promise<EmotionResult | null> {
  if (!message || message.length < 3) return null

  try {
    const openai = getOpenAI()
    const response = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        { role: 'system', content: EMOTION_PROMPT },
        { role: 'user', content: message.slice(0, 300) },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 100,
      temperature: 0.3,
    })

    const result = JSON.parse(response.choices[0]?.message?.content ?? '{}')
    if (!result.primary) return null

    return {
      primary: result.primary,
      score: Math.min(100, Math.max(0, result.score ?? 50)),
      keywords: result.keywords ?? [],
      suggestion: result.suggestion ?? '',
    }
  } catch {
    return null
  }
}

// 情绪到 emoji 的映射
export const EMOTION_EMOJI: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  anxious: '😰',
  sad: '😢',
  motivated: '💪',
  frustrated: '😤',
  tired: '😴',
  proud: '🎉',
}

// 情绪到中文标签
export const EMOTION_LABELS: Record<string, string> = {
  happy: '开心',
  neutral: '平静',
  anxious: '焦虑',
  sad: '难过',
  motivated: '有动力',
  frustrated: '沮丧',
  tired: '疲惫',
  proud: '自豪',
}

// 情绪趋势点（用于图表）
export interface EmotionDataPoint {
  date: string
  emotion: string
  score: number
}
