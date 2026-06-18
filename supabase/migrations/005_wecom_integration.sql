-- 005_wecom_integration.sql
-- 企业微信集成 — 用户绑定

-- 给 user_profiles 添加企业微信用户 ID
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS wecom_user_id VARCHAR(128);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_wecom_user_id
  ON user_profiles(wecom_user_id) WHERE wecom_user_id IS NOT NULL;

COMMENT ON COLUMN user_profiles.wecom_user_id IS '企业微信 UserID，用于消息推送和账号绑定';
