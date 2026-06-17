-- ============================================================
-- AI Companion — 数据库 Schema
-- Migration 001: 核心表结构
-- ============================================================

-- 启用 pgcrypto 扩展 (用于 gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. user_profiles（用户档案）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nickname      VARCHAR(50) NOT NULL,
  age           INTEGER,
  avatar_url    TEXT,
  bio           TEXT,
  long_term_vision TEXT,
  interests     TEXT[],
  life_wish     TEXT,
  occupation    VARCHAR(100),
  timezone      VARCHAR(50) DEFAULT 'Asia/Shanghai',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================================
-- 2. memories（长期记忆）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.memories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category      VARCHAR(50) NOT NULL,
  content       TEXT NOT NULL,
  source        VARCHAR(50),
  source_ref    UUID,
  importance    INTEGER DEFAULT 1,
  last_accessed TIMESTAMPTZ,
  access_count  INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_category ON memories(user_id, category);
CREATE INDEX idx_memories_importance ON memories(user_id, importance DESC);
CREATE INDEX idx_memories_content ON memories USING gin(to_tsvector('simple', content));

-- ============================================================
-- 3. daily_logs（每日复盘）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date      DATE NOT NULL,
  completed     TEXT[],
  failed        TEXT[],
  growth        TEXT[],
  tomorrow_plan TEXT[],
  mood_score    INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),
  mood_note     TEXT,
  ai_feedback   TEXT,
  ai_encouragement TEXT,
  ai_analysis   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, log_date)
);

CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);

-- ============================================================
-- 4. goals（目标系统）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id     UUID REFERENCES goals(id) ON DELETE CASCADE,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  category      VARCHAR(50) NOT NULL,
  status        VARCHAR(20) DEFAULT 'active',
  progress      INTEGER DEFAULT 0,
  target_date   DATE,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_category ON goals(user_id, category);
CREATE INDEX idx_goals_status ON goals(user_id, status);

-- ============================================================
-- 5. conversations（对话记录）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role          VARCHAR(20) NOT NULL,
  content       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',
  extracted_memories UUID[],
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id, created_at DESC);

-- ============================================================
-- 6. growth_events（成长事件）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.growth_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type    VARCHAR(50) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  emotion_tag   VARCHAR(20),
  related_log_id   UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
  related_goal_id  UUID REFERENCES goals(id) ON DELETE SET NULL,
  date          DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_growth_events_user_date ON growth_events(user_id, date DESC);
CREATE INDEX idx_growth_events_type ON growth_events(user_id, event_type);

-- ============================================================
-- 7. notifications（通知）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type          VARCHAR(50) NOT NULL,
  title         VARCHAR(200) NOT NULL,
  body          TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT false,
  action_url    TEXT,
  delivered_via VARCHAR(20) DEFAULT 'in_app',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);

-- ============================================================
-- 8. personas（AI 人格定义）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(50) UNIQUE NOT NULL,
  display_name  VARCHAR(50) NOT NULL,
  description   TEXT NOT NULL,
  tone          VARCHAR(50),
  system_prompt TEXT NOT NULL,
  avatar_emoji  VARCHAR(10),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. user_settings（用户设置）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  persona_id          UUID REFERENCES personas(id) ON DELETE SET NULL,
  care_check_enabled  BOOLEAN DEFAULT true,
  care_check_interval INTEGER DEFAULT 48,
  email_notify_enabled BOOLEAN DEFAULT true,
  weekly_report_day   INTEGER DEFAULT 7,
  language            VARCHAR(10) DEFAULT 'zh-CN',
  theme               VARCHAR(20) DEFAULT 'system',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. weekly_reports（周报）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start    DATE NOT NULL,
  week_end      DATE NOT NULL,
  summary       TEXT,
  achievements  TEXT[],
  challenges    TEXT[],
  growth_highlights TEXT[],
  completion_rate INTEGER,
  streak_days   INTEGER DEFAULT 0,
  mood_avg      NUMERIC(3,1),
  ai_suggestions TEXT,
  share_card_url TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_reports_user ON weekly_reports(user_id, week_start DESC);

-- ============================================================
-- RLS (Row Level Security) 策略
-- ============================================================

-- 启用 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

-- 用户只能读写自己的数据
CREATE POLICY "Users can read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own memories" ON public.memories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memories" ON public.memories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memories" ON public.memories
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own daily_logs" ON public.daily_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily_logs" ON public.daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily_logs" ON public.daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own goals" ON public.goals
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own growth_events" ON public.growth_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own growth_events" ON public.growth_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- personas 对所有认证用户只读
CREATE POLICY "Authenticated users can read personas" ON public.personas
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can read own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own weekly_reports" ON public.weekly_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weekly_reports" ON public.weekly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 触发器：自动更新 updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_memories_updated_at BEFORE UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
