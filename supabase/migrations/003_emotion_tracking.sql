-- Migration 003: 情绪追踪

CREATE TABLE IF NOT EXISTS public.emotion_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emotion       VARCHAR(30) NOT NULL,
  score         INTEGER DEFAULT 50,
  keywords      TEXT[],
  source        VARCHAR(30) DEFAULT 'chat',   -- 'chat', 'review', 'manual'
  source_ref    UUID,                          -- conversation_id or daily_log_id
  date          DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emotion_logs_user_date ON emotion_logs(user_id, date DESC);
CREATE INDEX idx_emotion_logs_emotion ON emotion_logs(user_id, emotion, date DESC);

ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own emotion_logs" ON public.emotion_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emotion_logs" ON public.emotion_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
