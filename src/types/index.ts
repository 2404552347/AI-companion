// ============================================================
// AI Companion — TypeScript 类型定义
// ============================================================

// ----- 用户档案 -----
export interface UserProfile {
  id: string
  user_id: string
  nickname: string
  age: number | null
  avatar_url: string | null
  bio: string | null
  long_term_vision: string | null
  interests: string[] | null
  life_wish: string | null
  occupation: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface UserProfileUpdate {
  nickname?: string
  age?: number | null
  avatar_url?: string | null
  bio?: string | null
  long_term_vision?: string | null
  interests?: string[]
  life_wish?: string | null
  occupation?: string | null
  timezone?: string
}

// ----- 记忆 -----
export type MemoryCategory = 'goal' | 'habit' | 'emotion' | 'event' | 'preference' | 'fact'
export type MemorySource = 'conversation' | 'review' | 'onboarding' | 'manual'

export interface Memory {
  id: string
  user_id: string
  category: MemoryCategory
  content: string
  source: MemorySource
  source_ref: string | null
  importance: number
  last_accessed: string | null
  access_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MemoryCreate {
  category: MemoryCategory
  content: string
  source: MemorySource
  source_ref?: string
  importance?: number
}

// ----- 每日复盘 -----
export interface DailyLog {
  id: string
  user_id: string
  log_date: string
  completed: string[] | null
  failed: string[] | null
  growth: string[] | null
  tomorrow_plan: string[] | null
  mood_score: number | null
  mood_note: string | null
  ai_feedback: string | null
  ai_encouragement: string | null
  ai_analysis: string | null
  created_at: string
  updated_at: string
}

export interface DailyLogCreate {
  date: string
  mood_score?: number
  mood_note?: string
  completed?: string[]
  failed?: string[]
  growth?: string[]
  tomorrow_plan?: string[]
}

// ----- 目标 -----
export type GoalCategory = 'long_term' | 'learning' | 'work' | 'life' | 'habit'
export type GoalStatus = 'active' | 'completed' | 'paused' | 'abandoned'

export interface Goal {
  id: string
  user_id: string
  parent_id: string | null
  title: string
  description: string | null
  category: GoalCategory
  status: GoalStatus
  progress: number
  target_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface GoalCreate {
  parent_id?: string | null
  title: string
  description?: string
  category: GoalCategory
  target_date?: string
}

export interface GoalUpdate {
  title?: string
  description?: string
  category?: GoalCategory
  status?: GoalStatus
  progress?: number
  target_date?: string | null
}

// ----- 对话 -----
export interface Conversation {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  metadata: ConversationMetadata
  extracted_memories: string[] | null
  created_at: string
}

export interface ConversationMetadata {
  tokens_used?: number
  model?: string
  latency_ms?: number
  cited_memories?: string[]
}

// ----- 成长事件 -----
export type GrowthEventType =
  | 'milestone'
  | 'achievement'
  | 'habit_streak'
  | 'emotion_peak'
  | 'goal_progress'
  | 'learning'
export type EmotionTag = 'happy' | 'proud' | 'struggling' | 'neutral' | 'excited'

export interface GrowthEvent {
  id: string
  user_id: string
  event_type: GrowthEventType
  title: string
  description: string | null
  emotion_tag: EmotionTag | null
  related_log_id: string | null
  related_goal_id: string | null
  date: string
  created_at: string
}

// ----- 通知 -----
export type NotificationType = 'care_check' | 'streak_alert' | 'weekly_report' | 'goal_reminder' | 'system'
export type DeliveryMethod = 'in_app' | 'email' | 'push'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  action_url: string | null
  delivered_via: DeliveryMethod
  created_at: string
}

// ----- AI 人格 -----
export interface Persona {
  id: string
  name: string
  display_name: string
  description: string
  tone: string | null
  system_prompt: string
  avatar_emoji: string
  created_at: string
}

// ----- 用户设置 -----
export interface UserSettings {
  id: string
  user_id: string
  persona_id: string | null
  care_check_enabled: boolean
  care_check_interval: number
  email_notify_enabled: boolean
  weekly_report_day: number
  language: string
  theme: 'light' | 'dark' | 'system'
  created_at: string
  updated_at: string
}

export interface UserSettingsUpdate {
  persona_id?: string | null
  care_check_enabled?: boolean
  care_check_interval?: number
  email_notify_enabled?: boolean
  weekly_report_day?: number
  language?: string
  theme?: 'light' | 'dark' | 'system'
}

// ----- 周报 -----
export interface WeeklyReport {
  id: string
  user_id: string
  week_start: string
  week_end: string
  summary: string | null
  achievements: string[] | null
  challenges: string[] | null
  growth_highlights: string[] | null
  completion_rate: number | null
  streak_days: number
  mood_avg: number | null
  ai_suggestions: string | null
  share_card_url: string | null
  created_at: string
}

// ----- API 请求/响应 -----
export interface ChatRequest {
  message: string
  mood?: number
  conversation_id?: string
}

export interface ChatSSEEvent {
  type: 'delta' | 'memory_extracted' | 'done' | 'error'
  data: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  has_more: boolean
}

export interface APIError {
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

// ----- 活动追踪 -----
export type ActivityType = 'app_usage' | 'idle' | 'active' | 'screen_time' | 'window_focus'
export type ActivityCategory = 'coding' | 'browsing' | 'communication' | 'entertainment' | 'learning' | 'other' | 'idle'

export interface ActivityLog {
  id: string
  user_id: string
  activity_type: ActivityType
  app_name: string | null
  app_bundle: string | null
  window_title: string | null
  url: string | null
  duration_sec: number | null
  activity_score: number | null
  is_productive: boolean | null
  category: ActivityCategory | null
  started_at: string
  ended_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface DailyActivitySummary {
  id: string
  user_id: string
  date: string
  total_active_min: number
  total_idle_min: number
  productive_min: number
  entertainment_min: number
  top_apps: Array<{ app_name: string; duration_min: number; category: string }>
  activity_curve: Array<{ hour: number; score: number }>
  current_status: string | null
  last_active_at: string | null
  summary_text: string | null
  created_at: string
}

export interface ActivityData {
  summary: DailyActivitySummary | null
  recent_activity: ActivityLog[]
  app_summary: Record<string, unknown>
}

// ----- Dashboard 数据 -----
export interface DashboardData {
  user_profile: UserProfile
  streak: number
  today_mood: number | null
  today_log: DailyLog | null
  recent_memories: Memory[]
  care_message: Notification | null
  recent_events: GrowthEvent[]
  active_goals: Goal[]
  activity: DailyActivitySummary | null
}
