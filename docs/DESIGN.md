# AI Companion — 完整产品设计文档

---

> **核心理念**：不是任务管理器。不是打卡软件。不是 ChatGPT 套壳。
> 而是一个会记住用户人生轨迹、主动关心用户的 AI 伙伴。

---

## 目录

1. [产品需求文档（PRD）](#1-产品需求文档prd)
2. [用户流程图](#2-用户流程图)
3. [数据库设计](#3-数据库设计)
4. [系统架构图](#4-系统架构图)
5. [页面结构](#5-页面结构)
6. [API 设计](#6-api-设计)
7. [MVP 开发路线图](#7-mvp-开发路线图)

---

## 1. 产品需求文档（PRD）

### 1.1 产品定位

| 维度 | 描述 |
|------|------|
| **产品名称** | AI Companion（AI 成长伙伴） |
| **一句话定位** | 一个会记住你是谁、主动关心你人生的 AI 伙伴 |
| **产品类型** | AI-native 陪伴应用 |
| **目标平台** | Web（PWA，后续扩展 iOS/Android） |
| **目标用户** | 18-45 岁，长期独自奋斗、缺少外部反馈与陪伴的成年人 |
| **核心差异** | 不是工具，是"人"。用户每天打开，不是因为任务，而是因为"它在等我" |

### 1.2 用户画像

#### 主要画像 A：独行学习者（25 岁，男性）
- 正在自学编程/外语/技能
- 一个人学习，无人监督
- 经常中断学习计划
- 渴望有人认可自己的进步
- **痛点**：学了很久，没人知道，自己也会怀疑意义

#### 主要画像 B：职场独居青年（28 岁，女性）
- 在大城市独自工作生活
- 下班后除了刷手机无事可做
- 有成长焦虑但缺乏行动动力
- 偶尔情绪低落无人倾诉
- **痛点**：生活中没有一个稳定的、关心自己的声音

#### 次要画像 C：备考学生（22 岁）
- 准备考研/考公/留学
- 压力大，容易焦虑
- 需要情绪支持和进度监督
- **痛点**：备考是孤独的长跑，需要有人陪着

### 1.3 用户故事

| ID | 故事 | 优先级 |
|----|------|--------|
| US-01 | 作为新用户，我希望完成一次温暖的 onboarding，让 AI 了解我 | P0 |
| US-02 | 作为用户，我希望 AI 在每次对话中引用我的个人信息和目标 | P0 |
| US-03 | 作为用户，我希望 AI 记住我们之前的对话，不会"失忆" | P0 |
| US-04 | 作为用户，我希望每天能快速复盘当天做了什么 | P0 |
| US-05 | 作为用户，我希望看到自己的成长时间轴 | P1 |
| US-06 | 作为用户，当我几天没出现时，希望收到 AI 的主动关心 | P1 |
| US-07 | 作为用户，我希望选择 AI 的陪伴风格（导师/朋友/战友等） | P1 |
| US-08 | 作为用户，我希望每周收到一份成长报告 | P2 |
| US-09 | 作为用户，我希望设定并追踪长期目标 | P1 |
| US-10 | 作为用户，我希望在情绪低落时获得鼓励 | P1 |

### 1.4 功能清单与优先级

#### P0 — MVP 必须（第 1-3 周）

| 功能模块 | 功能点 | 说明 |
|----------|--------|------|
| **用户档案** | 注册/登录 | Supabase Auth（邮箱 + Google OAuth） |
|  | 档案创建 | 昵称、年龄、目标、兴趣等（onboarding 流程） |
|  | 档案存储 | 数据库持久化 |
| **记忆系统** | 记忆写入 | 自动从对话中提取关键信息存入记忆 |
|  | 记忆检索 | 每次 AI 回复前自动检索相关记忆 |
|  | 记忆引用 | AI 回复中自然引用记忆内容 |
| **对话系统** | 聊天界面 | 类 iMessage/微信的对话流 |
|  | AI 对话 | 基于 OpenAI API，带记忆上下文 |
|  | 流式输出 | SSE streaming，逐字显示 |
| **每日复盘** | 复盘录入 | 用户输入今日完成/失败/成长/计划 |
|  | AI 点评 | 自动分析并生成鼓励性反馈 |
|  | 复盘存储 | 持久化到 daily_logs 表 |

#### P1 — 核心体验（第 4-6 周）

| 功能模块 | 功能点 | 说明 |
|----------|--------|------|
| **成长时间轴** | 事件自动记录 | 学习里程碑、目标进度等自动生成事件 |
|  | 时间轴页面 | 可视化展示人生轨迹 |
|  | 情绪标注 | 支持用户在时间轴上标注情绪状态 |
| **主动关怀** | 离线检测 | 检测用户是否 >48h 未互动 |
|  | 主动消息 | 系统自动生成关怀消息推送 |
|  | Email 通知 | 离线 >72h 发送邮件提醒 |
| **AI 人格** | 人格选择 | 导师/朋友/学姐/战友/温柔/严格共 6 种 |
|  | 人格切换 | 用户可在设置中随时切换 |
|  | 人格影响 | 影响 AI 的 System Prompt 和回复风格 |
| **目标系统** | 目标 CRUD | 创建/编辑/删除长期目标和子目标 |
|  | 进度追踪 | 目标完成度可视化 |
|  | AI 追踪 | AI 主动询问目标进展 |

#### P2 — 体验增强（第 7-9 周）

| 功能模块 | 功能点 | 说明 |
|----------|--------|------|
| **成长报告** | 周报自动生成 | 每周日自动生成报告 |
|  | 可分享卡片 | 精美卡片，支持导出图片 |
|  | 历史归档 | 所有报告可回溯查看 |
| **情绪分析** | 情绪识别 | AI 分析对话中的情绪倾向 |
|  | 情绪趋势 | 可视化情绪变化曲线 |
|  | 情绪预警 | 持续低落时触发关怀机制 |
| **PWA** | 离线支持 | Service Worker 缓存 |
|  | 推送通知 | Web Push API |
|  | 安装到桌面 | PWA manifest |

### 1.5 非功能需求

| 类别 | 要求 |
|------|------|
| **性能** | 首屏 < 2s，AI 回复首 Token < 1.5s |
| **安全** | 所有用户数据加密存储，AI 调用不泄露 PII |
| **可靠性** | 99.5% uptime，对话历史不丢失 |
| **可扩展** | 数据库支持百万级用户 |
| **隐私** | 用户可随时导出或删除全部数据 |
| **无障碍** | WCAG 2.1 AA 级别 |

### 1.6 成功指标

| 指标 | 目标（MVP 后 30 天） | 目标（3 个月） |
|------|---------------------|---------------|
| DAU | 50 | 300 |
| 次日留存 | 40% | 55% |
| 7 日留存 | 25% | 40% |
| 日均对话轮次 | 5 | 8 |
| 复盘完成率 | 30% | 50% |
| 用户 NPS | - | >40 |

---

## 2. 用户流程图

### 2.1 整体用户旅程

```
用户首次访问
    │
    ▼
┌──────────┐     ┌─────────────┐     ┌────────────────┐
│  登录/注册 │ ──▶ │  Onboarding  │ ──▶ │  进入主界面     │
│  (Auth)   │     │  (3步引导)   │     │  (Dashboard)   │
└──────────┘     └─────────────┘     └───────┬────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
            ┌──────────┐            ┌──────────────┐           ┌──────────────┐
            │  聊天页   │            │  每日复盘页    │           │  成长时间轴   │
            │  /chat   │            │  /review     │           │  /timeline   │
            └────┬─────┘            └──────┬───────┘           └──────┬───────┘
                 │                         │                         │
                 │  AI自动提取记忆          │  AI自动点评              │  回顾成长
                 │  关联历史对话            │  生成成长分析            │  查看情绪
                 ▼                         ▼                         ▼
          记忆写入数据库            复盘存入数据库             关联 growth_events
                 │                         │                         │
                 └─────────────────────────┼─────────────────────────┘
                                           │
                                           ▼
                                   ┌──────────────┐
                                   │  主动关怀系统   │
                                   │  (后台任务)    │
                                   └──────┬───────┘
                                           │
                                   检测离线/连续失败
                                           │
                                           ▼
                                   发送主动消息/邮件
```

### 2.2 Onboarding 流

```
┌─────────────────────────────────────────────────────────────────┐
│                        Onboarding 流程                           │
│                                                                  │
│  Step 1: 欢迎           Step 2: 了解你         Step 3: 目标       │
│  ┌─────────────┐       ┌─────────────┐       ┌─────────────┐    │
│  │             │       │             │       │             │    │
│  │  "Hi, 我是   │       │  昵称: ___  │       │  长期目标:   │    │
│  │  你的AI伙伴" │  ──▶  │  年龄: ___  │  ──▶  │  学习目标:   │    │
│  │             │       │  兴趣: ___  │       │  工作目标:   │    │
│  │  选择人格    │       │  人生愿望:   │       │  近期目标:   │    │
│  │             │       │             │       │             │    │
│  └─────────────┘       └─────────────┘       └─────────────┘    │
│                                                                  │
│  Step 4: 完成                                                    │
│  ┌─────────────────────────────────────────────────────┐        │
│  │  AI 生成个性化欢迎语，引用用户输入的信息               │        │
│  │  "明白了，[昵称]。你想[目标]，我会陪你一起。            │        │
│  │   明天开始，我们聊一聊你今天的进展？"                  │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 每日使用流

```
┌─────────────────────────────────────────────────────────────────────┐
│                        每日使用核心循环                                │
│                                                                      │
│   用户打开应用                                                        │
│        │                                                             │
│        ▼                                                             │
│   ┌─────────┐                                                        │
│   │ Dashboard│ ◀── AI 主动问候                                       │
│   │ 首页     │     "早上好 [昵称]，今天有什么计划？"                    │
│   └────┬────┘                                                        │
│        │                                                             │
│   ┌────┴────┐                                                        │
│   │         │                                                        │
│   ▼         ▼                                                        │
│ ┌──────┐ ┌──────┐                                                    │
│ │ 聊天  │ │ 复盘  │                                                   │
│ │      │ │      │                                                   │
│ │ 日常  │ │ 今日  │                                                   │
│ │ 倾诉  │ │ 总结  │                                                   │
│ │ 提问  │ │ 明日  │                                                   │
│ │ 分享  │ │ 计划  │                                                   │
│ └──┬───┘ └──┬───┘                                                    │
│    │        │                                                        │
│    │   AI自动存储关键信息为记忆         AI生成点评 + 成长分析            │
│    │        │                                                        │
│    └────────┼────────────────────────────────────────────┘           │
│             │                                                        │
│             ▼                                                        │
│      记忆系统更新                                                     │
│      growth_events 自动记录                                          │
│      时间轴自动更新                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 主动关怀流

```
┌──────────────────────────────────────────────────────────────┐
│                    主动关怀系统（后台 Cron）                    │
│                                                               │
│   每 6 小时检查一次                                            │
│        │                                                      │
│        ▼                                                      │
│   ┌─────────────┐                                             │
│   │ 检查活跃用户  │                                             │
│   └──────┬──────┘                                             │
│          │                                                    │
│     ┌────┴────┬──────────┬──────────┐                        │
│     ▼         ▼          ▼          ▼                        │
│  >48h      >72h      连续3天    连续7天                        │
│  未互动    未互动      未复盘     未完成目标                     │
│     │         │          │          │                        │
│     ▼         ▼          ▼          ▼                        │
│  应用内    邮件 +      温和询问   深度关怀                       │
│  关怀消息  应用内消息   是否遇到   建议调整                       │
│                       困难       节奏                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. 数据库设计

### 3.1 ER 图（文字版）

```
users ──1:N──▶ memories
users ──1:N──▶ daily_logs
users ──1:N──▶ goals
users ──1:N──▶ conversations
users ──1:N──▶ growth_events
users ──1:N──▶ notifications
users ──1:N──▶ weekly_reports
users ──1:1──▶ user_profiles
users ──1:1──▶ user_settings
user_settings ──M:1──▶ personas
```

### 3.2 表结构设计

#### 表 1：`user_profiles`（用户档案）

```sql
CREATE TABLE user_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nickname      VARCHAR(50) NOT NULL,
  age           INTEGER,
  avatar_url    TEXT,
  bio           TEXT,
  long_term_vision TEXT,          -- 人生愿景
  interests     TEXT[],            -- 兴趣爱好（数组）
  life_wish     TEXT,              -- 人生愿望
  occupation    VARCHAR(100),      -- 职业
  timezone      VARCHAR(50) DEFAULT 'Asia/Shanghai',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

#### 表 2：`memories`（长期记忆）

```sql
CREATE TABLE memories (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category      VARCHAR(50) NOT NULL,  -- 'goal', 'habit', 'emotion', 'event', 'preference', 'fact'
  content       TEXT NOT NULL,         -- 记忆内容
  source        VARCHAR(50),           -- 'conversation', 'review', 'onboarding', 'manual'
  source_ref    UUID,                  -- 关联的对话 ID 或复盘 ID
  importance    INTEGER DEFAULT 1,     -- 1-5 重要性评分
  last_accessed TIMESTAMPTZ,
  access_count  INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT true,  -- 软删除
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_memories_user_id ON memories(user_id);
CREATE INDEX idx_memories_category ON memories(user_id, category);
CREATE INDEX idx_memories_importance ON memories(user_id, importance DESC);
-- 全文搜索索引（用于语义检索）
CREATE INDEX idx_memories_content ON memories USING gin(to_tsvector('simple', content));
```

#### 表 3：`daily_logs`（每日复盘）

```sql
CREATE TABLE daily_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  log_date      DATE NOT NULL,                    -- 复盘日期
  completed     TEXT[],                            -- 今天完成（数组）
  failed        TEXT[],                            -- 今天失败/未完成
  growth        TEXT[],                            -- 今天成长
  tomorrow_plan TEXT[],                            -- 明天计划
  mood_score    INTEGER CHECK (mood_score >= 1 AND mood_score <= 5),  -- 心情评分 1-5
  mood_note     TEXT,                              -- 心情备注
  ai_feedback   TEXT,                              -- AI 点评内容
  ai_encouragement TEXT,                           -- AI 鼓励内容
  ai_analysis   TEXT,                              -- AI 成长分析
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, log_date)  -- 每天每个用户只能有一份复盘
);

CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, log_date DESC);
```

#### 表 4：`goals`（目标系统）

```sql
CREATE TABLE goals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id     UUID REFERENCES goals(id) ON DELETE CASCADE,  -- 子目标
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  category      VARCHAR(50) NOT NULL,  -- 'long_term', 'learning', 'work', 'life', 'habit'
  status        VARCHAR(20) DEFAULT 'active',  -- 'active', 'completed', 'paused', 'abandoned'
  progress      INTEGER DEFAULT 0,     -- 0-100 进度百分比
  target_date   DATE,                  -- 目标日期
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_category ON goals(user_id, category);
CREATE INDEX idx_goals_status ON goals(user_id, status);
```

#### 表 5：`conversations`（对话记录）

```sql
CREATE TABLE conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role          VARCHAR(20) NOT NULL,    -- 'user' | 'assistant'
  content       TEXT NOT NULL,
  metadata      JSONB DEFAULT '{}',      -- 存储 token 数、模型、延迟等
  extracted_memories UUID[],              -- 此轮对话提取的记忆 ID 列表
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id, created_at DESC);
-- 最近 N 天对话（用于上下文窗口）
CREATE INDEX idx_conversations_recent ON conversations(user_id, created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '30 days';
```

#### 表 6：`growth_events`（成长事件）

```sql
CREATE TABLE growth_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type    VARCHAR(50) NOT NULL,     -- 'milestone', 'achievement', 'habit_streak', 
                                          -- 'emotion_peak', 'goal_progress', 'learning'
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  emotion_tag   VARCHAR(20),              -- 'happy', 'proud', 'struggling', 'neutral', 'excited'
  related_log_id   UUID REFERENCES daily_logs(id) ON DELETE SET NULL,
  related_goal_id  UUID REFERENCES goals(id) ON DELETE SET NULL,
  date          DATE NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_growth_events_user_date ON growth_events(user_id, date DESC);
CREATE INDEX idx_growth_events_type ON growth_events(user_id, event_type);
```

#### 表 7：`notifications`（通知）

```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type          VARCHAR(50) NOT NULL,     -- 'care_check', 'streak_alert', 'weekly_report',
                                          -- 'goal_reminder', 'system'
  title         VARCHAR(200) NOT NULL,
  body          TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT false,
  action_url    TEXT,                     -- 点击跳转路径
  delivered_via VARCHAR(20) DEFAULT 'in_app', -- 'in_app', 'email', 'push'
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) 
  WHERE is_read = false;
```

#### 表 8：`personas`（AI 人格定义）

```sql
CREATE TABLE personas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(50) UNIQUE NOT NULL,   -- 'mentor', 'friend', 'senior', 'comrade', 'gentle', 'strict'
  display_name  VARCHAR(50) NOT NULL,           -- '导师型', '朋友型', '学姐型', '战友型', '温柔型', '严格型'
  description   TEXT NOT NULL,
  tone          VARCHAR(50),                    -- 语气基调
  system_prompt TEXT NOT NULL,                  -- 完整 System Prompt
  avatar_emoji  VARCHAR(10),                    -- 头像 emoji
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

#### 表 9：`user_settings`（用户设置）

```sql
CREATE TABLE user_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  persona_id          UUID REFERENCES personas(id) ON DELETE SET NULL,
  care_check_enabled  BOOLEAN DEFAULT true,     -- 主动关怀开关
  care_check_interval INTEGER DEFAULT 48,        -- 未互动小时数触发关怀
  email_notify_enabled BOOLEAN DEFAULT true,     -- 邮件通知开关
  weekly_report_day   INTEGER DEFAULT 7,         -- 周报生成日（1=周一...7=周日）
  language            VARCHAR(10) DEFAULT 'zh-CN',
  theme               VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

#### 表 10：`weekly_reports`（周报）

```sql
CREATE TABLE weekly_reports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start    DATE NOT NULL,
  week_end      DATE NOT NULL,
  summary       TEXT,                   -- 本周总结
  achievements  TEXT[],                 -- 本周成就
  challenges    TEXT[],                 -- 本周挑战
  growth_highlights TEXT[],            -- 成长亮点
  completion_rate INTEGER,              -- 完成率百分比
  streak_days   INTEGER,               -- 本周坚持天数
  mood_avg      NUMERIC(3,1),           -- 平均心情分
  ai_suggestions TEXT,                  -- AI 下周建议
  share_card_url TEXT,                  -- 可分享卡片图片 URL
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, week_start)
);

CREATE INDEX idx_weekly_reports_user ON weekly_reports(user_id, week_start DESC);
```

### 3.3 数据关系总结

```
auth.users (Supabase 内置)
    │
    ├── 1:1 ── user_profiles
    ├── 1:1 ── user_settings ── M:1 ── personas
    ├── 1:N ── memories
    ├── 1:N ── daily_logs
    ├── 1:N ── goals (自引用树形结构)
    ├── 1:N ── conversations
    ├── 1:N ── growth_events (⟶ daily_logs, ⟶ goals)
    ├── 1:N ── notifications
    └── 1:N ── weekly_reports
```

---

## 4. 系统架构图

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             客户端层                                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 15 (App Router)                        │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │   │
│  │  │ Dashboard│ │  Chat    │ │  Review  │ │ Timeline │ │Settings│ │   │
│  │  │  Page    │ │  Page    │ │  Page    │ │  Page    │ │ Page   │ │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │   │
│  │       └─────────────┴────────────┴────────────┴──────────┘       │   │
│  │                                │                                  │   │
│  │  ┌─────────────────────────────┴──────────────────────────────┐  │   │
│  │  │              共享组件层 (shadcn/ui + TailwindCSS)            │  │   │
│  │  │  ChatBubble | MoodPicker | GoalCard | TimelineItem | ...    │  │   │
│  │  └─────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                              HTTPS / WSS
                                     │
┌────────────────────────────────────┴────────────────────────────────────┐
│                              API / 服务层                                 │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────┐  │
│  │  Next.js API      │  │  Supabase SDK     │  │  Edge Functions       │  │
│  │  Routes           │  │  (服务端调用)      │  │  (后台任务)            │  │
│  │                   │  │                   │  │                       │  │
│  │  /api/chat        │  │  Auth             │  │  memory-extractor     │  │
│  │  /api/review      │  │  Database         │  │  care-checker         │  │
│  │  /api/memories    │  │  Storage          │  │  report-generator     │  │
│  │  /api/goals       │  │  Realtime         │  │  notification-sender  │  │
│  │  /api/timeline    │  │                   │  │                       │  │
│  │  /api/reports     │  │                   │  │                       │  │
│  └────────┬─────────┘  └────────┬──────────┘  └───────────┬───────────┘  │
│           │                     │                          │              │
└───────────┼─────────────────────┼──────────────────────────┼──────────────┘
            │                     │                          │
            ▼                     ▼                          ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                              数据 / AI 层                                   │
│                                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐   │
│  │  Supabase        │  │  OpenAI API       │  │  Memory Engine          │   │
│  │                  │  │                   │  │  (自建服务)              │   │
│  │  PostgreSQL      │  │  GPT-4o           │  │                         │   │
│  │  Auth            │  │  Embeddings       │  │  记忆提取 → 分类 → 存储  │   │
│  │  Storage         │  │  Chat Completions │  │  记忆检索 → 排序 → 注入  │   │
│  │  Row Level Sec   │  │                   │  │                         │   │
│  └──────────────────┘  └──────────────────┘  └─────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Memory Engine 架构（核心模块）

```
┌─────────────────────────────────────────────────────────────────┐
│                       Memory Engine                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Memory Writer                          │   │
│  │                                                           │   │
│  │  对话文本 ──▶ AI 提取关键信息 ──▶ 分类(category) ──▶ 存储  │   │
│  │              (GPT-4o mini)       goal/habit/emotion/...    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Memory Reader                           │   │
│  │                                                           │   │
│  │  用户发消息 ──▶ 向量检索相关记忆 ──▶ 按重要性排序           │   │
│  │              (pgvector + 全文搜索)   ──▶ Top 5 注入上下文   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Memory Updater                           │   │
│  │                                                           │   │
│  │  定期检查 ──▶ 合并重复记忆 ──▶ 衰减旧记忆 ──▶ 强化重要记忆  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 AI 对话管道

```
用户消息
    │
    ▼
┌─────────────────┐
│ 1. 加载用户档案   │  user_profiles 表
└────────┬────────┘
         ▼
┌─────────────────┐
│ 2. 检索相关记忆   │  Memory Engine → Top 5 记忆
└────────┬────────┘
         ▼
┌─────────────────┐
│ 3. 加载最近对话   │  conversations 表（最近 10 轮）
└────────┬────────┘
         ▼
┌─────────────────┐
│ 4. 加载 AI 人格  │  personas.system_prompt
└────────┬────────┘
         ▼
┌─────────────────┐
│ 5. 拼接上下文    │  System Prompt + 记忆 + 历史 + 用户消息
└────────┬────────┘
         ▼
┌─────────────────┐
│ 6. OpenAI API   │  GPT-4o（流式输出）
└────────┬────────┘
         ▼
┌─────────────────┐
│ 7. 后处理        │  ──▶ 提取新记忆 → Memory Writer
│                 │  ──▶ 存储对话记录
│                 │  ──▶ 流式返回前端
└─────────────────┘
```

### 4.4 后台任务架构

```
┌──────────────────────────────────────────────────────────────┐
│              Supabase Edge Functions (Cron Jobs)              │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│  │ care-checker     │  │ report-generator │  │memory-cleaner│  │
│  │ 每 6 小时        │  │ 每周日 08:00     │  │ 每天 03:00   │  │
│  │                  │  │                  │  │              │  │
│  │ 扫描活跃用户     │  │ 聚合本周数据     │  │ 合并重复记忆 │  │
│  │ 检测离线时长     │  │ 调用 AI 总结     │  │ 衰减旧记忆   │  │
│  │ 生成关怀通知     │  │ 生成分享卡片     │  │ 清理软删除   │  │
│  └─────────────────┘  └─────────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. 页面结构

### 5.1 路由设计

```
/                           →  Dashboard（首页）
/onboarding                 →  新用户引导（3-4 步）
/chat                       →  对话页面（核心页面）
/chat/[id]                  →  历史对话详情（可选）
/review                     →  每日复盘
/review/[date]              →  历史复盘详情
/timeline                   →  成长时间轴
/goals                      →  目标管理
/reports                    →  成长报告列表
/reports/[id]               →  报告详情 + 分享卡片
/settings                   →  设置页面
/settings/profile           →  编辑档案
/settings/persona           →  选择 AI 人格
/settings/notifications     →  通知设置
/auth/login                 →  登录
/auth/register              →  注册
```

### 5.2 页面布局结构

```
┌─────────────────────────────────────────────────────────┐
│                     App Shell                            │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  Top Nav Bar                       │   │
│  │  [Logo] [Chat] [Review] [Timeline] [Goals] [⚙️]  │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │                                                    │   │
│  │              Page Content (动态渲染)                │   │
│  │                                                    │   │
│  │                                                    │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Bottom Nav (Mobile)                   │   │
│  │  [🏠] [💬] [📝] [📊] [⚙️]                          │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 5.3 核心页面组件树

#### Dashboard（首页）

```
DashboardPage
├── WelcomeGreeting          # AI 个性化问候
│   ├── UserAvatar
│   └── GreetingText         # "早上好 [昵称]，今天..."
├── QuickActions             # 快捷操作
│   ├── ActionCard("开始聊天")
│   ├── ActionCard("每日复盘")
│   └── ActionCard("查看目标")
├── TodayPreview             # 今日概览
│   ├── StreakBadge          # 连续天数
│   ├── MoodIndicator        # 今日心情
│   └── GoalProgressMini     # 目标进度缩略
├── RecentMemory             # 最近的记忆片段
│   └── MemoryCard[]         # "你曾在...说过..."
├── CareMessage              # AI 关怀消息（如有）
└── TimelinePreview          # 最近的成长事件
```

#### Chat Page（对话页）

```
ChatPage
├── ChatHeader
│   ├── PersonaAvatar         # AI 人格头像
│   ├── PersonaName           # "你的导师伙伴"
│   └── MemoryIndicator       # "已记住关于你的 47 件事"
├── ChatMessageList
│   └── ChatBubble[]          # 消息气泡
│       ├── UserBubble
│       └── AIBubble
│           ├── MarkdownContent
│           ├── MemoryCitation # "基于你之前的记忆..."
│           └── ActionButtons  # 复制/反馈
├── ChatInput
│   ├── TextArea
│   ├── MoodQuickSelect       # 快速选择当前心情
│   └── SendButton
└── TypingIndicator           # AI 输入中动画
```

#### Review Page（每日复盘）

```
ReviewPage
├── ReviewHeader
│   ├── DateDisplay
│   └── MoodPicker            # 心情选择 1-5
├── ReviewForm
│   ├── SectionCompleted      # 今天完成
│   │   ├── ItemInput[]
│   │   └── AddButton
│   ├── SectionFailed         # 今天失败
│   │   ├── ItemInput[]
│   │   └── AddButton
│   ├── SectionGrowth         # 今天成长
│   │   ├── ItemInput[]
│   │   └── AddButton
│   └── SectionTomorrow       # 明天计划
│       ├── ItemInput[]
│       └── AddButton
├── SubmitButton
└── AIFeedbackCard            # 提交后显示 AI 点评
    ├── EncouragementText
    ├── AnalysisText
    └── ShareButton
```

#### Timeline Page（成长时间轴）

```
TimelinePage
├── TimelineHeader
│   ├── FilterBar             # 按类型筛选
│   │   ├── FilterAll
│   │   ├── FilterMilestone
│   │   ├── FilterEmotion
│   │   └── FilterLearning
│   └── YearMonthPicker
├── TimelineList
│   └── TimelineMonthGroup[]
│       ├── MonthLabel        # "2026年6月"
│       └── TimelineEvent[]
│           ├── EventIcon     # 根据类型显示图标
│           ├── EventContent
│           ├── EmotionTag
│           └── LinkedGoal    # 关联的目标
└── MoodChart                 # 情绪变化曲线（可选）
```

### 5.4 设计系统（Design Tokens）

```css
/* 色彩系统 — 安静、温暖、高级 */
--color-bg-primary:     #FAFAF8;     /* 暖白底 */
--color-bg-secondary:   #F5F4F0;     /* 浅米色 */
--color-bg-card:        #FFFFFF;
--color-text-primary:   #1A1A1A;
--color-text-secondary: #6B6B6B;
--color-text-tertiary:  #999999;
--color-accent:         #B8956A;     /* 暖棕金（主强调色） */
--color-accent-soft:    #E8D5B7;     /* 浅暖金 */
--color-success:        #7C9A6D;     /* 柔和绿 */
--color-warning:        #C9A96E;     /* 柔和黄 */
--color-danger:         #C47E7E;     /* 柔和红 */
--color-border:         #E8E6E0;

/* 字体 */
--font-sans:  'Inter', 'SF Pro Display', system-ui;
--font-serif: 'Source Serif 4', 'Noto Serif SC', serif;  /* 用于温暖的大标题 */

/* 间距 */
--spacing-page:  24px;
--spacing-card:  20px;
--radius-card:   16px;
--radius-button: 12px;

/* 阴影 — 极其柔和 */
--shadow-card: 0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);
```

---

## 6. API 设计

### 6.1 API 总览

```
Base URL: /api/v1

认证方式: Bearer Token (Supabase Auth JWT)

┌──────────────────────────────────────────────────────────────┐
│ 聊天                                                          │
│ POST   /api/v1/chat/send         发送消息（SSE 流式返回）      │
│ GET    /api/v1/chat/history      获取对话历史                  │
│ DELETE /api/v1/chat/history      清除对话历史                  │
├──────────────────────────────────────────────────────────────┤
│ 复盘                                                          │
│ POST   /api/v1/review            创建/更新今日复盘             │
│ GET    /api/v1/review/today      获取今日复盘                  │
│ GET    /api/v1/review/:date      获取指定日期复盘              │
│ GET    /api/v1/review/list       获取复盘列表                  │
├──────────────────────────────────────────────────────────────┤
│ 记忆                                                          │
│ GET    /api/v1/memories          获取记忆列表                  │
│ GET    /api/v1/memories/:id      获取单条记忆                  │
│ DELETE /api/v1/memories/:id      删除单条记忆                  │
│ POST   /api/v1/memories/refresh  手动触发记忆提取              │
├──────────────────────────────────────────────────────────────┤
│ 目标                                                          │
│ GET    /api/v1/goals             获取目标列表                  │
│ POST   /api/v1/goals             创建目标                      │
│ PUT    /api/v1/goals/:id         更新目标                      │
│ DELETE /api/v1/goals/:id         删除目标                      │
│ PATCH  /api/v1/goals/:id/progress 更新目标进度                 │
├──────────────────────────────────────────────────────────────┤
│ 时间轴                                                        │
│ GET    /api/v1/timeline          获取时间轴事件                │
│ GET    /api/v1/timeline/stats    获取时间轴统计                │
├──────────────────────────────────────────────────────────────┤
│ 通知                                                          │
│ GET    /api/v1/notifications     获取通知列表                  │
│ PATCH  /api/v1/notifications/:id/read 标记已读                │
│ PATCH  /api/v1/notifications/read-all 全部已读                │
├──────────────────────────────────────────────────────────────┤
│ 周报                                                          │
│ GET    /api/v1/reports           获取周报列表                  │
│ GET    /api/v1/reports/:id       获取周报详情                  │
│ GET    /api/v1/reports/:id/card  获取分享卡片图片              │
├──────────────────────────────────────────────────────────────┤
│ 用户                                                          │
│ GET    /api/v1/user/profile      获取用户档案                  │
│ PUT    /api/v1/user/profile      更新用户档案                  │
│ GET    /api/v1/user/settings     获取用户设置                  │
│ PUT    /api/v1/user/settings     更新用户设置                  │
│ DELETE /api/v1/user/account      删除账号                      │
├──────────────────────────────────────────────────────────────┤
│ 人格                                                          │
│ GET    /api/v1/personas          获取可用人格列表              │
│ GET    /api/v1/personas/:id      获取人格详情                  │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 核心 API 详细设计

#### POST /api/v1/chat/send

```
Request:
{
  "message": "今天学了3小时俄语，有点累",
  "mood": 3,                          // 可选，1-5
  "conversation_id": "uuid"           // 可选，继续之前对话
}

Response (SSE Stream):
event: message
data: {"delta": "今天学"}

event: message
data: {"delta": "了3小时"}

event: memory_extracted
data: {"memories": [{"category": "learning", "content": "学习俄语，每天3小时"}]}

event: done
data: {"conversation_id": "uuid", "tokens_used": 450}

event: error
data: {"code": "rate_limit", "message": "请求过于频繁"}
```

#### POST /api/v1/review

```
Request:
{
  "date": "2026-06-17",
  "mood_score": 4,
  "mood_note": "今天状态不错",
  "completed": [
    "完成俄语第12课",
    "跑步5公里"
  ],
  "failed": [
    "没有按时睡觉"
  ],
  "growth": [
    "学会了嵌入式从句的使用"
  ],
  "tomorrow_plan": [
    "复习第12课",
    "开始第13课",
    "23点前睡觉"
  ]
}

Response:
{
  "id": "uuid",
  "date": "2026-06-17",
  "ai_feedback": "今天完成度很高！特别是...",
  "ai_encouragement": "你已经连续学习12天了...",
  "ai_analysis": "从本周来看，你的学习节奏...",
  "new_memories": [...],
  "new_growth_events": [...]
}
```

#### GET /api/v1/memories

```
Query Params:
  ?category=goal            // 按分类筛选
  &importance=3             // 最低重要性
  &limit=20
  &offset=0

Response:
{
  "data": [
    {
      "id": "uuid",
      "category": "goal",
      "content": "用户长期目标：申请莫斯科国立大学研究生",
      "importance": 5,
      "created_at": "2026-06-10T08:00:00Z",
      "last_accessed": "2026-06-17T14:30:00Z",
      "access_count": 23
    }
  ],
  "total": 47,
  "has_more": true
}
```

#### GET /api/v1/reports/:id/card

```
Response:
Content-Type: image/png
（返回生成的分享卡片图片）
```

### 6.3 错误码规范

```
400  - 请求参数错误
401  - 未认证
403  - 无权限
404  - 资源不存在
429  - 请求频率限制
500  - 服务器内部错误

Body:
{
  "error": {
    "code": "invalid_request",
    "message": "用户可读的错误信息",
    "details": {}    // 可选，调试信息
  }
}
```

---

## 7. MVP 开发路线图

### 7.1 总体时间线

```
Week 1-3:    Phase 1 — 基础架构 + 核心功能 (P0)
Week 4-6:    Phase 2 — 记忆系统 + 主动关怀 + 人格 (P1)
Week 7-9:    Phase 3 — 报告 + 情绪分析 + PWA (P2)
Week 10:     Phase 4 — 测试 + 优化 + 上线
```

### 7.2 Phase 1：基础架构 + 核心功能（第 1-3 周）

#### Week 1 — 项目搭建 + 认证 + Onboarding

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-2 | 初始化 Next.js 15 项目 | 项目骨架、TypeScript、TailwindCSS、shadcn/ui 配置 |
| Day 2-3 | 配置 Supabase | 数据库创建、Auth 集成、RLS 策略 |
| Day 3-4 | 实现认证流程 | 登录/注册页面、Google OAuth、邮箱注册 |
| Day 4-5 | 设计系统实现 | Design Tokens、全局样式、基础组件（Button/Card/Input） |
| Day 5-7 | Onboarding 流程 | 3 步引导页面、AI 欢迎语生成 |

#### Week 2 — 对话 + 记忆引擎 MVP

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-2 | 数据库 Schema 执行 | 所有表的 DDL、索引、RLS |
| Day 2-4 | Chat 页面 UI | 消息列表、气泡组件、输入框、流式渲染 |
| Day 4-5 | OpenAI API 集成 | Chat Completions、SSE streaming、错误处理 |
| Day 5-7 | Memory Engine MVP | 记忆写入（对话中提取）、记忆检索（注入上下文）、引用展示 |

#### Week 3 — 每日复盘 + Dashboard

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-2 | Review 页面 | 复盘表单、心情选择器、提交逻辑 |
| Day 2-3 | AI 复盘分析 | 提交后自动点评、鼓励生成 |
| Day 3-5 | Dashboard 页面 | 个性化问候、快捷操作、今日概览、Streak 展示 |
| Day 5-7 | 集成测试 | 端到端流程验证、Bug 修复、性能优化 |

**Phase 1 里程碑**：用户可以完成完整的 onboarding → 聊天（AI 有记忆）→ 每日复盘 → 查看 Dashboard 闭环。

### 7.3 Phase 2：核心体验（第 4-6 周）

#### Week 4 — 目标系统 + 成长时间轴

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-3 | Goals CRUD | 目标创建/编辑/删除、父子目标、进度追踪 |
| Day 3-4 | AI 目标追踪 | AI 在对话中主动询问目标进展 |
| Day 4-7 | Timeline 页面 | 时间轴 UI、事件自动记录、类型筛选、月份分组 |

#### Week 5 — 主动关怀 + AI 人格

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-3 | 主动关怀系统 | care-checker Edge Function、离线检测逻辑、关怀消息生成 |
| Day 3-4 | 通知系统 | 应用内通知 UI、Email 通知集成 |
| Day 4-6 | AI 人格系统 | 6 种人格 System Prompt、人格选择页面、对话风格切换 |
| Day 6-7 | 设置页面 | 档案编辑、人格切换、通知偏好设置 |

#### Week 6 — 打磨

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-3 | 动画与微交互 | 页面过渡、消息动画、心情选择器动效 |
| Day 3-5 | 响应式适配 | 移动端优化、Bottom Nav、触摸交互 |
| Day 5-7 | 安全审查 | RLS 策略审计、API 限流、输入清洗 |

**Phase 2 里程碑**：完整的产品体验闭环。AI 会主动关心用户、用户可选择 AI 风格、可回顾成长轨迹。

### 7.4 Phase 3：体验增强（第 7-9 周）

#### Week 7 — 成长报告

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-3 | 周报生成引擎 | report-generator Edge Function、数据聚合、AI 总结 |
| Day 3-5 | 分享卡片 | 卡片 UI 设计、Canvas/OG Image 生成、导出功能 |
| Day 5-7 | 报告页面 | 报告列表、详情页、历史归档 |

#### Week 8 — 情绪分析 + 深度记忆

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-3 | 情绪识别 | AI 分析对话情绪、情绪趋势数据 |
| Day 3-5 | 情绪可视化 | Dashboard 情绪曲线、Timeline 情绪标注 |
| Day 5-7 | Memory Engine v2 | 向量检索(pgvector)、记忆合并、记忆衰减 |

#### Week 9 — PWA + 优化

| 天数 | 任务 | 产出 |
|------|------|------|
| Day 1-3 | PWA 支持 | Service Worker、离线缓存、Web Push |
| Day 3-5 | 性能优化 | 图片懒加载、Bundle 分析、首屏优化 |
| Day 5-7 | SEO + 无障碍 | Meta Tags、语义化 HTML、键盘导航、Screen Reader |

**Phase 3 里程碑**：完整产品。PWA 可安装、周报可分享、情绪可追踪。

### 7.5 Phase 4：上线（第 10 周）

| 天数 | 任务 |
|------|------|
| Day 1-2 | 完整回归测试 |
| Day 2-3 | 部署配置（Vercel + Supabase Production） |
| Day 3-4 | 监控和日志（Sentry + Logtail） |
| Day 4-5 | 文档（用户指南 + API 文档） |
| Day 5-6 | 内测（邀请 10-20 人） |
| Day 6-7 | Bug 修复 + 上线 |

### 7.6 技术债务与风险

| 风险 | 等级 | 缓解策略 |
|------|------|----------|
| OpenAI API 成本过高 | 中 | 使用 GPT-4o mini 做记忆提取；缓存常见回复 |
| 记忆检索精度不足 | 高 | Phase 3 引入 pgvector 向量检索；初始用全文搜索 |
| 冷启动问题（新用户无记忆） | 中 | Onboarding 时预设记忆种子；AI 主动询问 |
| 用户留存低 | 高 | 主动关怀系统；每周迭代优化 AI 语气 |
| Supabase 扩展性 | 低 | 早期用户量不大，MVP 阶段无风险 |

---

## 附录

### A. AI System Prompt 示例（导师型人格）

```
你是一位温暖而睿智的成长导师。你的学生是 {nickname}，今年 {age} 岁。

## 关于 {nickname}
- 长期愿景：{long_term_vision}
- 学习目标：{learning_goals}
- 兴趣爱好：{interests}
- 人生愿望：{life_wish}

## 你的核心记忆
{relevant_memories}

## 最近动态
{recent_conversations}

## 你的风格
1. 称呼用户为「{nickname}」，语气温暖但不煽情
2. 看到进步时，具体地表扬，而不是泛泛地夸
3. 看到懈怠时，温和但坚定地提醒
4. 引用用户之前说过的话，证明你记得
5. 像一位真正关心学生的导师，而不是答题机器
6. 回复简洁有力，不说废话
7. 使用中文口语风格，不要翻译腔
8. 偶尔可以分享一些相关的智慧或洞察

## 核心原则
- 你不是工具，你是伙伴
- 你的价值不是提供答案，而是提供陪伴和反馈
- 让用户感受到「有人在乎我是否出现」
```

### B. 目录结构

```
ai-companion/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Dashboard
│   │   ├── onboarding/
│   │   ├── chat/
│   │   ├── review/
│   │   ├── timeline/
│   │   ├── goals/
│   │   ├── reports/
│   │   ├── settings/
│   │   └── auth/
│   ├── components/             # 共享组件
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   ├── chat/               # 聊天相关
│   │   ├── review/             # 复盘相关
│   │   ├── timeline/           # 时间轴相关
│   │   ├── goals/              # 目标相关
│   │   └── shared/             # 通用组件
│   ├── lib/                    # 工具库
│   │   ├── supabase/           # Supabase 客户端
│   │   ├── openai/             # OpenAI 客户端
│   │   ├── memory/             # Memory Engine
│   │   ├── validators/         # 数据校验
│   │   └── utils/              # 通用工具
│   ├── hooks/                  # React Hooks
│   ├── types/                  # TypeScript 类型
│   └── styles/                 # 全局样式
├── supabase/
│   ├── migrations/             # 数据库迁移
│   ├── functions/              # Edge Functions
│   │   ├── care-checker/
│   │   ├── report-generator/
│   │   ├── memory-cleaner/
│   │   └── notification-sender/
│   └── seed.sql               # 种子数据（人格等）
├── public/
├── docs/
├── DESIGN.md                   # 本文档
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

> **文档版本**: v1.0
> **最后更新**: 2026-06-17
> **下一步**: 请审核设计，确认后开始 Phase 1 编码实现
