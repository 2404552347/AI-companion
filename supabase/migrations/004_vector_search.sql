-- Migration 004: 向量语义搜索 (pgvector)
-- 需要先启用 pgvector 扩展: Supabase Dashboard > Extensions > pgvector

CREATE EXTENSION IF NOT EXISTS vector;

-- 记忆向量表（与 memories 表 1:1 关联）
CREATE TABLE IF NOT EXISTS public.memory_embeddings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id     UUID REFERENCES public.memories(id) ON DELETE CASCADE UNIQUE NOT NULL,
  embedding     vector(1536),  -- OpenAI text-embedding-3-small 维度
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memory_embeddings_vector ON memory_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

ALTER TABLE public.memory_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own embeddings" ON public.memory_embeddings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memories
      WHERE memories.id = memory_embeddings.memory_id
      AND memories.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own embeddings" ON public.memory_embeddings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memories
      WHERE memories.id = memory_embeddings.memory_id
      AND memories.user_id = auth.uid()
    )
  );

-- 向量相似度搜索函数
CREATE OR REPLACE FUNCTION search_memories_by_vector(
  query_embedding vector(1536),
  p_user_id uuid,
  match_limit int DEFAULT 5,
  match_threshold float DEFAULT 0.5
)
RETURNS TABLE(
  memory_id uuid,
  category text,
  content text,
  importance int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id AS memory_id,
    m.category,
    m.content,
    m.importance,
    1 - (me.embedding <=> query_embedding) AS similarity
  FROM memory_embeddings me
  JOIN memories m ON m.id = me.memory_id
  WHERE m.user_id = p_user_id
    AND m.is_active = true
    AND 1 - (me.embedding <=> query_embedding) > match_threshold
  ORDER BY me.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;
