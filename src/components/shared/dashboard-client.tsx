'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  MessageCircle,
  BookOpen,
  Target,
  Calendar,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Activity,
  Monitor,
  Coffee,
  Code2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmotionChart } from './emotion-chart'
import type { DashboardData } from '@/types'
import type { EmotionDataPoint } from '@/lib/emotion/analyzer'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 10) return '早上好'
  if (hour < 13) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

function getGreetingEmoji(hour: number): string {
  if (hour < 6) return '🌙'
  if (hour < 10) return '☀️'
  if (hour < 13) return '🌤️'
  if (hour < 18) return '🌿'
  if (hour < 22) return '🌆'
  return '✨'
}

export function DashboardClient({ data, emotionData }: { data: DashboardData; emotionData: EmotionDataPoint[] }) {
  const { user_profile, streak, today_log } = data
  const hour = new Date().getHours()
  const today = format(new Date(), 'M月d日 EEEE', { locale: zhCN })

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:py-10">
      {/* Greeting Section */}
      <section className="space-y-1">
        <p className="text-sm text-muted-foreground">{today}</p>
        <h1 className="font-serif-accent text-2xl md:text-3xl">
          {getGreetingEmoji(hour)} {getGreeting()},{' '}
          <span className="text-accent-gold">{user_profile.nickname}</span>
        </h1>
        {streak > 0 && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent-gold" />
            你已经连续坚持了{' '}
            <span className="font-semibold text-accent-gold">{streak}</span> 天
          </p>
        )}
      </section>

      {/* Care Message */}
      {data.care_message && (
        <Card className="border-accent-gold-soft/60 bg-accent-gold/5">
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-foreground/80">
              {data.care_message.body}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-3">
        <Link href="/chat">
          <Card className="group cursor-pointer border-border/60 bg-card transition-all hover:border-accent-gold/30 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold/10">
                <MessageCircle className="h-5 w-5 text-accent-gold" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">开始对话</p>
                <p className="text-xs text-muted-foreground">和你的 AI 伙伴聊聊</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/review">
          <Card className="group cursor-pointer border-border/60 bg-card transition-all hover:border-accent-gold/30 hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold/10">
                <BookOpen className="h-5 w-5 text-accent-gold" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {today_log ? '查看今日复盘' : '每日复盘'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {today_log ? '已完成 ✅' : '记录今天的成长'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Goals Overview */}
      {data.active_goals.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4 text-accent-gold" strokeWidth={1.5} />
              进行中的目标
            </h2>
            <Link
              href="/goals"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              查看全部
            </Link>
          </div>
          <div className="space-y-2">
            {data.active_goals.slice(0, 3).map((goal) => (
              <Card
                key={goal.id}
                className="border-border/60 bg-card transition-colors hover:border-accent-gold/20"
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{goal.title}</p>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-accent-gold transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {goal.progress}%
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recent Memories */}
      {data.recent_memories.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-accent-gold" strokeWidth={1.5} />
            关于你的记忆
          </h2>
          <div className="space-y-2">
            {data.recent_memories.slice(0, 3).map((memory) => (
              <Card key={memory.id} className="border-border/60 bg-card">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px] capitalize">
                      {memory.category}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{memory.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Recent Events */}
      {data.recent_events.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-accent-gold" strokeWidth={1.5} />
              最近的成长
            </h2>
            <Link
              href="/timeline"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              查看时间轴
            </Link>
          </div>
          <div className="space-y-2">
            {data.recent_events.map((event) => (
              <Card key={event.id} className="border-border/60 bg-card">
                <CardContent className="flex items-center gap-3 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gold/10 text-sm">
                    {event.emotion_tag === 'happy' || event.emotion_tag === 'proud'
                      ? '🎉'
                      : event.emotion_tag === 'struggling'
                        ? '💪'
                        : '📌'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.date), 'M月d日')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Today's Activity Overview */}
      {data.activity && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Activity className="h-4 w-4 text-accent-gold" strokeWidth={1.5} />
            今日活动追踪
          </h2>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  data.activity.current_status === 'working'
                    ? 'bg-success'
                    : data.activity.current_status === 'idle'
                      ? 'bg-warning'
                      : 'bg-muted-foreground'
                }`}
              />
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  data.activity.current_status === 'working'
                    ? 'bg-success'
                    : data.activity.current_status === 'idle'
                      ? 'bg-warning'
                      : data.activity.current_status === 'entertainment'
                        ? 'bg-destructive'
                        : 'bg-muted-foreground'
                }`}
              />
            </span>
            <span className="text-sm capitalize">
              {data.activity.current_status === 'working'
                ? '🟢 正在工作'
                : data.activity.current_status === 'idle'
                  ? '🟡 空闲中'
                  : data.activity.current_status === 'entertainment'
                    ? '🎮 娱乐中'
                    : '⚪ 在线'}
            </span>
          </div>

          {/* Time Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-border/60 bg-card">
              <CardContent className="p-3 text-center">
                <Monitor className="mx-auto mb-1 h-4 w-4 text-accent-gold" strokeWidth={1.5} />
                <p className="text-lg font-semibold">{data.activity.productive_min}</p>
                <p className="text-[10px] text-muted-foreground">生产力 (分钟)</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card">
              <CardContent className="p-3 text-center">
                <Coffee className="mx-auto mb-1 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-lg font-semibold">{data.activity.total_idle_min}</p>
                <p className="text-[10px] text-muted-foreground">空闲 (分钟)</p>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card">
              <CardContent className="p-3 text-center">
                <Code2 className="mx-auto mb-1 h-4 w-4 text-accent-gold" strokeWidth={1.5} />
                <p className="text-lg font-semibold">{data.activity.total_active_min}</p>
                <p className="text-[10px] text-muted-foreground">活跃 (分钟)</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Apps */}
          {data.activity.top_apps && (data.activity.top_apps as Array<{app_name: string; duration_min: number; category: string}>).length > 0 && (
            <Card className="border-border/60 bg-card">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">常用应用</p>
                {(data.activity.top_apps as Array<{app_name: string; duration_min: number; category: string}>).slice(0, 5).map((app, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{app.app_name}</span>
                    <span className="text-xs text-muted-foreground">{app.duration_min}分钟</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Hourly Activity Heatmap */}
          {data.activity.activity_curve && (data.activity.activity_curve as Array<{hour: number; score: number}>).length > 0 && (
            <Card className="border-border/60 bg-card">
              <CardContent className="p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">今日活跃曲线</p>
                <div className="flex h-8 items-end gap-[3px]">
                  {(data.activity.activity_curve as Array<{hour: number; score: number}>).map((point) => {
                    const height = Math.max(point.score / 5, 4)
                    const showLabel = point.hour % 4 === 0
                    return (
                      <div
                        key={point.hour}
                        className="group relative flex-1"
                        title={`${point.hour}:00 — 活跃度 ${point.score}%`}
                      >
                        <div
                          className="w-full rounded-t-sm transition-colors"
                          style={{
                            height: `${height}%`,
                            marginTop: `${100 - height}%`,
                            backgroundColor: point.score > 60
                              ? 'var(--accent-gold)'
                              : point.score > 30
                                ? 'var(--accent-gold-soft)'
                                : 'var(--muted)',
                          }}
                        />
                        {showLabel && (
                          <span className="absolute -bottom-4 left-0 text-[9px] text-muted-foreground">
                            {point.hour}h
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Emotion Trend Chart */}
      <EmotionChart data={emotionData} days={7} />

      {/* Empty State — New User */}
      {!data.today_log && data.active_goals.length === 0 && !data.activity && (
        <Card className="border-dashed border-border/60 bg-card/50">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            <div>
              <p className="text-sm font-medium text-muted-foreground">开始你的第一天</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                完成一次复盘，或设定一个目标，让 AI 伙伴陪你成长
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/chat">
                <Button variant="outline" size="sm">
                  开始对话
                </Button>
              </Link>
              <Link href="/review">
                <Button size="sm">今日复盘</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
