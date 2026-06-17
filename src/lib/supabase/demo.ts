/**
 * Demo 模式 — 无需 Supabase 即可体验 UI
 *
 * 设置 NEXT_PUBLIC_DEMO_MODE=true 启用
 * 所有数据存储在内存中，刷新后重置
 */

import type { UserProfile, Memory, DailyLog, Goal, GrowthEvent, Notification, Persona, DailyActivitySummary } from '@/types'
import type { EmotionDataPoint } from '@/lib/emotion/analyzer'

// Demo 用户
const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@ai-companion.app',
  nickname: '小明',
  age: 25,
  occupation: '程序员',
  interests: ['编程', '俄语', '摄影'],
  life_wish: '成为优秀的全栈工程师，去莫斯科工作和生活',
  long_term_vision: '5年后成为技术专家，自由地选择工作和生活地点',
  streak: 12,
  today_mood: 4,
}

// Demo 记忆
const DEMO_MEMORIES: Memory[] = [
  { id: 'm1', user_id: DEMO_USER.id, category: 'goal', content: '长期目标：申请莫斯科国立大学研究生', source: 'onboarding', source_ref: null, importance: 5, last_accessed: new Date().toISOString(), access_count: 23, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm2', user_id: DEMO_USER.id, category: 'habit', content: '每天学习俄语2小时', source: 'conversation', source_ref: null, importance: 4, last_accessed: new Date().toISOString(), access_count: 15, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm3', user_id: DEMO_USER.id, category: 'fact', content: '用户使用VS Code作为主要编辑器', source: 'conversation', source_ref: null, importance: 3, last_accessed: new Date().toISOString(), access_count: 8, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm4', user_id: DEMO_USER.id, category: 'emotion', content: '最近一周学习状态很好，感到充实', source: 'review', source_ref: null, importance: 3, last_accessed: new Date().toISOString(), access_count: 5, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'm5', user_id: DEMO_USER.id, category: 'preference', content: '喜欢在咖啡馆学习，觉得家里太安静', source: 'conversation', source_ref: null, importance: 3, last_accessed: new Date().toISOString(), access_count: 6, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

// Demo 活动摘要
const DEMO_ACTIVITY: DailyActivitySummary = {
  id: 'a1', user_id: DEMO_USER.id, date: new Date().toISOString().split('T')[0],
  total_active_min: 320, total_idle_min: 45, productive_min: 240, entertainment_min: 35,
  top_apps: [
    { app_name: 'VS Code', duration_min: 180, category: 'coding' },
    { app_name: 'Chrome', duration_min: 60, category: 'browsing' },
    { app_name: 'Terminal', duration_min: 40, category: 'coding' },
    { app_name: 'Spotify', duration_min: 25, category: 'entertainment' },
    { app_name: 'Notion', duration_min: 15, category: 'learning' },
  ],
  activity_curve: Array.from({ length: 24 }, (_, hour) => ({
    hour, score: hour >= 2 && hour <= 5 ? 10 :
      hour >= 6 && hour <= 8 ? 30 :
      hour >= 9 && hour <= 12 ? 80 :
      hour >= 13 && hour <= 14 ? 20 :
      hour >= 15 && hour <= 18 ? 70 :
      hour >= 19 && hour <= 21 ? 40 :
      hour >= 22 || hour <= 1 ? 5 : 15,
  })),
  current_status: 'working', last_active_at: new Date().toISOString(), summary_text: null, created_at: new Date().toISOString(),
}

// Demo 情绪数据
const DEMO_EMOTIONS: EmotionDataPoint[] = [
  { date: daysAgo(6), emotion: 'motivated', score: 80 },
  { date: daysAgo(6), emotion: 'happy', score: 70 },
  { date: daysAgo(5), emotion: 'neutral', score: 55 },
  { date: daysAgo(5), emotion: 'motivated', score: 75 },
  { date: daysAgo(4), emotion: 'frustrated', score: 45 },
  { date: daysAgo(4), emotion: 'tired', score: 40 },
  { date: daysAgo(3), emotion: 'motivated', score: 85 },
  { date: daysAgo(3), emotion: 'proud', score: 90 },
  { date: daysAgo(2), emotion: 'happy', score: 75 },
  { date: daysAgo(2), emotion: 'motivated', score: 70 },
  { date: daysAgo(1), emotion: 'neutral', score: 60 },
  { date: daysAgo(0), emotion: 'motivated', score: 80 },
  { date: daysAgo(0), emotion: 'happy', score: 85 },
]

function daysAgo(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// Demo 成长事件
const DEMO_EVENTS: GrowthEvent[] = [
  { id: 'e1', user_id: DEMO_USER.id, event_type: 'milestone', title: '俄语词汇量突破1500', description: '完成了A2级别的词汇积累', emotion_tag: 'proud', related_log_id: null, related_goal_id: null, date: daysAgo(2), created_at: new Date().toISOString() },
  { id: 'e2', user_id: DEMO_USER.id, event_type: 'achievement', title: '连续学习12天', description: '保持了12天的学习记录', emotion_tag: 'happy', related_log_id: null, related_goal_id: null, date: daysAgo(1), created_at: new Date().toISOString() },
  { id: 'e3', user_id: DEMO_USER.id, event_type: 'learning', title: '完成了Next.js项目重构', description: '学习并应用了App Router新特性', emotion_tag: 'proud', related_log_id: null, related_goal_id: null, date: daysAgo(0), created_at: new Date().toISOString() },
]

// Demo 目标
const DEMO_GOALS: Goal[] = [
  { id: 'g1', user_id: DEMO_USER.id, parent_id: null, title: '俄语达到B1水平', description: '能够日常对话和阅读短文', category: 'learning', status: 'active', progress: 65, target_date: '2026-12-31', completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'g2', user_id: DEMO_USER.id, parent_id: null, title: '申请莫斯科国立大学研究生', description: '计算机科学方向', category: 'long_term', status: 'active', progress: 30, target_date: '2027-06-01', completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'g3', user_id: DEMO_USER.id, parent_id: null, title: '每天跑步5公里', description: '保持身体健康', category: 'habit', status: 'active', progress: 80, target_date: null, completed_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

// Demo 通知
const DEMO_NOTIFICATION: Notification = {
  id: 'n1', user_id: DEMO_USER.id, type: 'care_check',
  title: '下午好，小明',
  body: '今天你在 VS Code 里呆了 3 小时了。学俄语还是写代码？记得起来活动一下 ☕',
  is_read: false, action_url: '/chat', delivered_via: 'in_app', created_at: new Date().toISOString(),
}

// 6 种人格
const DEMO_PERSONAS: Persona[] = [
  { id: 'p1', name: 'mentor', display_name: '导师型', description: '温暖而睿智的成长导师，给你方向和建议', tone: 'warm_wise', system_prompt: '', avatar_emoji: '🎓', created_at: new Date().toISOString() },
  { id: 'p2', name: 'friend', display_name: '朋友型', description: '平等轻松的伙伴，像老朋友一样聊天', tone: 'casual_friendly', system_prompt: '', avatar_emoji: '🤝', created_at: new Date().toISOString() },
  { id: 'p3', name: 'senior', display_name: '学姐型', description: '温柔但有要求的学姐，用经验引导你', tone: 'gentle_guiding', system_prompt: '', avatar_emoji: '🌸', created_at: new Date().toISOString() },
  { id: 'p4', name: 'comrade', display_name: '战友型', description: '并肩作战的伙伴，一起冲锋一起扛', tone: 'energetic_direct', system_prompt: '', avatar_emoji: '⚔️', created_at: new Date().toISOString() },
  { id: 'p5', name: 'gentle', display_name: '温柔型', description: '细腻温暖的陪伴者，永远站在你这边', tone: 'soft_caring', system_prompt: '', avatar_emoji: '💛', created_at: new Date().toISOString() },
  { id: 'p6', name: 'strict', display_name: '严格型', description: '高标准严要求，推动你突破舒适区', tone: 'strict_demanding', system_prompt: '', avatar_emoji: '🦾', created_at: new Date().toISOString() },
]

// Demo 每日日志
const DEMO_TODAY_LOG: DailyLog = {
  id: 'dl1', user_id: DEMO_USER.id, log_date: new Date().toISOString().split('T')[0],
  completed: ['完成俄语第12课', '跑步5公里', '写完了项目文档'],
  failed: ['没有按时睡觉', '手机刷太久'],
  growth: ['学会了嵌入式从句的用法', '发现早上的学习效率比晚上高'],
  tomorrow_plan: ['复习第12课', '开始第13课', '23点前睡觉'],
  mood_score: 4, mood_note: '今天状态不错，学习效率高',
  ai_feedback: '今天完成度很高！特别是俄语12课和项目文档，两件都是需要深度专注的事情。跑步也坚持了，很棒。',
  ai_encouragement: '没按时睡觉不是大问题。你已经连续坚持12天了，偶尔的晚睡不会打断你的节奏。重点是明天继续。',
  ai_analysis: '你这周的学习节奏比上周更稳定。俄语每天保持2小时的投入，词汇量增长明显。建议继续保持这个节奏，同时注意作息规律。',
  created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
}

export const DEMO_DATA = {
  user: DEMO_USER,
  profile: { ...DEMO_USER, id: 'profile-1', user_id: DEMO_USER.id, avatar_url: null, bio: '热爱技术和语言的程序员', timezone: 'Asia/Shanghai', created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as UserProfile,
  memories: DEMO_MEMORIES,
  todayLog: DEMO_TODAY_LOG,
  goals: DEMO_GOALS,
  events: DEMO_EVENTS,
  notification: DEMO_NOTIFICATION,
  personas: DEMO_PERSONAS,
  activity: DEMO_ACTIVITY,
  emotions: DEMO_EMOTIONS,
}

export function isDemoMode(): boolean {
  // 显式关闭
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'false') return false
  // 显式开启
  if (process.env.NEXT_PUBLIC_DEMO_MODE === 'true') return true
  // 没有 Supabase URL → demo
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return true
  // 占位符 URL → demo
  if (process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_PROJECT_ID')) return true
  // 有真实 Supabase → 正常模式
  return false
}
