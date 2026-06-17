-- ============================================================
-- Migration 002: 活动追踪系统
-- 记录用户的实际行为数据，让 AI 真正了解用户
-- ============================================================

-- 用户活动日志
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type VARCHAR(50) NOT NULL,  -- 'app_usage', 'idle', 'active', 'screen_time', 'window_focus'
  app_name      VARCHAR(200),          -- 应用名称 (e.g., 'VS Code', 'Chrome', 'Terminal')
  app_bundle    VARCHAR(200),          -- Bundle ID (e.g., 'com.microsoft.VSCode')
  window_title  TEXT,                  -- 窗口标题
  url           TEXT,                  -- 如果浏览器，记录 URL（可选）
  duration_sec  INTEGER,              -- 持续时间（秒）
  activity_score INTEGER,             -- 活跃度 0-100 (键盘/鼠标活动)
  is_productive BOOLEAN,              -- 是否属于生产力活动
  category      VARCHAR(50),          -- 'coding', 'browsing', 'communication', 'entertainment', 'learning', 'other'
  started_at    TIMESTAMPTZ NOT NULL, -- 开始时间
  ended_at      TIMESTAMPTZ,          -- 结束时间
  metadata      JSONB DEFAULT '{}',   -- 额外数据
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user_time ON activity_logs(user_id, started_at DESC);
CREATE INDEX idx_activity_logs_type ON activity_logs(user_id, activity_type, started_at DESC);
CREATE INDEX idx_activity_logs_app ON activity_logs(user_id, app_name, started_at DESC);

-- 每日活动摘要（AI 快速了解用户今天做了什么）
CREATE TABLE IF NOT EXISTS public.daily_activity_summaries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date              DATE NOT NULL,
  total_active_min  INTEGER DEFAULT 0,      -- 总活跃时间（分钟）
  total_idle_min    INTEGER DEFAULT 0,      -- 总空闲时间
  productive_min    INTEGER DEFAULT 0,      -- 生产力时间
  entertainment_min INTEGER DEFAULT 0,      -- 娱乐时间
  top_apps          JSONB DEFAULT '[]',     -- [{app_name, duration_min, category}]
  activity_curve    JSONB DEFAULT '[]',     -- [{hour, score}] 24小时活跃曲线
  current_status    VARCHAR(50),            -- 'working', 'idle', 'away', 'gaming', 'learning', 'unknown'
  last_active_at    TIMESTAMPTZ,
  summary_text      TEXT,                   -- AI 生成的今日摘要
  created_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summaries_user_date ON daily_activity_summaries(user_id, date DESC);

-- 用户可配置哪些应用属于"生产力"
CREATE TABLE IF NOT EXISTS public.app_categories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  app_name      VARCHAR(200) NOT NULL,
  app_bundle    VARCHAR(200),
  category      VARCHAR(50) NOT NULL,  -- 'productive', 'neutral', 'distracting', 'learning'
  icon_emoji    VARCHAR(10),
  created_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, app_name)
);

-- RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own activity_logs" ON public.activity_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity_logs" ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own daily_activity_summaries" ON public.daily_activity_summaries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own daily_activity_summaries" ON public.daily_activity_summaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own daily_activity_summaries" ON public.daily_activity_summaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own app_categories" ON public.app_categories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own app_categories" ON public.app_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own app_categories" ON public.app_categories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own app_categories" ON public.app_categories
  FOR DELETE USING (auth.uid() = user_id);

-- 种子数据：常见应用分类（在用户注册时通过应用层插入）
