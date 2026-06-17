/**
 * Memory Engine v2 — 长期记忆系统
 *
 * 优化:
 * - 打分排序检索（重要性 + 新鲜度 + 关键词匹配）
 * - 智能去重（归一化内容比较）
 * - 上下文裁剪（最多 5 条，~500 字符）
 * - 合并查询减少 DB 调用
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getOpenAI, FAST_MODEL } from '@/lib/openai/client'
import type { Database } from '@/types/supabase'
import type { Memory, MemoryCategory, MemorySource } from '@/types'
import type { EmotionDataPoint } from '@/lib/emotion/analyzer'

type Supabase = SupabaseClient<Database>

// ============================================================
// Memory Writer — 从对话中提取记忆
// ============================================================

interface ExtractParams {
  supabase: Supabase
  userId: string
  userMessage: string
  aiResponse: string
  source: MemorySource
  sourceRef?: string
}

const EXTRACTION_PROMPT = `你是一个记忆提取系统。从对话中提取值得长期记住的关键信息。

只提取对成长陪伴有意义的记忆：
- goal: 用户提到的新目标或目标变化
- habit: 习惯变化
- emotion: 重要的情绪表达
- event: 重要事件
- preference: 偏好/喜好
- fact: 个人信息

每条记忆用中文表述为完整陈述句。没有值得记的内容则返回空数组。

返回 JSON: {"memories": [{"category": "goal", "content": "...", "importance": 4}]}

importance: 5=核心目标/人生愿望, 4=习惯/长期偏好, 3=事件/情绪, 2=日常偏好, 1=琐碎`

export async function extractAndStoreMemories({
  supabase, userId, userMessage, aiResponse, source, sourceRef,
}: ExtractParams): Promise<Memory[]> {
  try {
    const openai = getOpenAI()
    const completion = await openai.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: `用户: ${userMessage}\nAI: ${aiResponse}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.3,
    })

    const result = JSON.parse(completion.choices[0]?.message?.content ?? '{"memories":[]}')
    const extracted: Array<{ category: MemoryCategory; content: string; importance: number }> =
      result.memories ?? []

    if (extracted.length === 0) return []

    const stored: Memory[] = []
    for (const mem of extracted) {
      // 归一化去重：比较前 50 个字符
      const normalized = mem.content.slice(0, 50).replace(/\s+/g, '')
      const { data: existing } = await supabase
        .from('memories')
        .select('id, importance')
        .eq('user_id', userId)
        .eq('category', mem.category)
        .eq('is_active', true)
        .limit(5)

      const similar = existing?.find((e) => {
        const existingNorm = (e as unknown as { content?: string }).content?.slice(0, 50).replace(/\s+/g, '') ?? ''
        return similarity(normalized, existingNorm) > 0.7
      })

      if (similar) {
        // 更新已有记忆，提升重要性
        await supabase
          .from('memories')
          .update({
            importance: Math.min((similar.importance ?? mem.importance) + 1, 5),
            updated_at: new Date().toISOString(),
            last_accessed: new Date().toISOString(),
          })
          .eq('id', similar.id)
        continue
      }

      const { data: newMem } = await supabase
        .from('memories')
        .insert({
          user_id: userId, category: mem.category, content: mem.content,
          source, source_ref: sourceRef ?? null, importance: mem.importance,
        })
        .select()
        .single()

      if (newMem) {
        stored.push(newMem as Memory)
      }
    }
    return stored
  } catch (err) {
    console.error('Memory extraction failed:', err)
    return []
  }
}

// ============================================================
// Memory Reader — 打分检索
// ============================================================

interface RetrieveParams {
  supabase: Supabase
  userId: string
  userMessage: string
  limit?: number
  maxChars?: number   // 上下文最大字符数
}

export interface MemoryContext {
  systemContext: string
  memories: Memory[]
}

// ============================================================
// Memory Reader — 打分检索（关键词 + 重要性 + 新鲜度）
// 注：DeepSeek 无 embedding API，使用关键词打分替代向量搜索
// ============================================================

export async function retrieveRelevantMemories({
  supabase, userId, userMessage, limit = 20, maxChars = 600,
}: RetrieveParams): Promise<MemoryContext> {
  try {
    // 关键词搜索
    const { data: candidates } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('importance', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (!candidates || candidates.length === 0) {
      return { systemContext: '', memories: [] }
    }

    const memories = candidates as Memory[]

    // 提取关键词
    const keywords = extractKeywords(userMessage)

    // 打分排序
    const scored = memories.map((m) => {
      let score = (m.importance || 1) * 20        // 重要性权重 0-100
      score += recencyScore(m.updated_at || m.created_at) * 15  // 新鲜度 0-15
      score += keywordScore(m.content, keywords) * 25           // 关键词匹配 0-25
      return { memory: m, score }
    })

    scored.sort((a, b) => b.score - a.score)

    // 上下文裁剪：取 top 结果，控制总长度
    const selected: Memory[] = []
    let totalChars = 0
    for (const { memory } of scored) {
      const chars = memory.content.length
      if (totalChars + chars > maxChars && selected.length >= 3) break
      if (selected.length >= 6) break
      selected.push(memory)
      totalChars += chars
    }

    // 更新访问计数
    const now = new Date().toISOString()
    await Promise.all(
      selected.map((m) =>
        supabase
          .from('memories')
          .update({ last_accessed: now, access_count: m.access_count + 1 })
          .eq('id', m.id)
      )
    )

    // 格式化上下文
    const systemContext = formatContext(selected)

    return { systemContext, memories: selected }
  } catch (err) {
    console.error('Memory retrieval failed:', err)
    return { systemContext: '', memories: [] }
  }
}

// ============================================================
// 辅助函数
// ============================================================

/** 简单 Jaccard 相似度 */
function similarity(a: string, b: string): number {
  if (a === b) return 1
  if (!a || !b) return 0
  const setA = new Set(a.split(''))
  const setB = new Set(b.split(''))
  let intersection = 0
  for (const c of setA) { if (setB.has(c)) intersection++ }
  const union = setA.size + setB.size - intersection
  return union === 0 ? 0 : intersection / union
}

/** 提取中文+英文关键词（2字以上） */
function extractKeywords(text: string): string[] {
  const cleaned = text.replace(/[，,。.!！?？\s]+/g, ' ').trim()
  const words = cleaned.split(' ').filter((w) => w.length >= 2)
  // 中文按2-gram切分
  const bigrams: string[] = []
  for (const word of words) {
    if (/[一-鿿]/.test(word) && word.length >= 3) {
      for (let i = 0; i < word.length - 1; i++) {
        bigrams.push(word.slice(i, i + 2))
      }
    }
  }
  return [...new Set([...words, ...bigrams])].slice(0, 10)
}

/** 新鲜度分数：今天创建=1，7天前=0.5，30天前=0.1 */
function recencyScore(dateStr: string): number {
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)
  if (days <= 1) return 1
  if (days <= 7) return 1 - (days - 1) * 0.08
  if (days <= 30) return 0.5 - (days - 7) * 0.02
  return Math.max(0.05, 0.2 - days * 0.002)
}

/** 关键词匹配得分 */
function keywordScore(content: string, keywords: string[]): number {
  if (keywords.length === 0) return 0
  const lower = content.toLowerCase()
  let matches = 0
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) matches++
  }
  return matches / keywords.length
}

/** 格式化记忆为 System Prompt 注入文本 */
function formatContext(memories: Memory[]): string {
  if (memories.length === 0) return ''

  const categoryLabels: Record<string, string> = {
    goal: '🎯', habit: '🔄', emotion: '💭', event: '📌', preference: '❤️', fact: '📋',
  }

  let ctx = '\n## 关于用户的关键记忆\n'
  for (const m of memories) {
    const icon = categoryLabels[m.category] ?? '•'
    ctx += `${icon} ${m.content}\n`
  }
  return ctx
}
