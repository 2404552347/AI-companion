'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Clock, Filter, Sparkles, Target, BookOpen, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { GrowthEvent, GrowthEventType } from '@/types'

const EVENT_ICONS: Record<GrowthEventType, React.ReactNode> = {
  milestone: <Sparkles className="h-4 w-4" />,
  achievement: <Target className="h-4 w-4" />,
  habit_streak: <Clock className="h-4 w-4" />,
  emotion_peak: <Heart className="h-4 w-4" />,
  goal_progress: <Target className="h-4 w-4" />,
  learning: <BookOpen className="h-4 w-4" />,
}

const EVENT_LABELS: Record<GrowthEventType, string> = {
  milestone: '里程碑',
  achievement: '成就',
  habit_streak: '习惯',
  emotion_peak: '情绪',
  goal_progress: '目标进展',
  learning: '学习',
}

export function TimelineClient({ events }: { events: GrowthEvent[] }) {
  const [filter, setFilter] = useState<GrowthEventType | 'all'>('all')

  const filteredEvents = useMemo(() => {
    if (filter === 'all') return events
    return events.filter((e) => e.event_type === filter)
  }, [events, filter])

  // Group by month
  const groupedEvents = useMemo(() => {
    const groups: Record<string, GrowthEvent[]> = {}
    for (const event of filteredEvents) {
      const month = event.date.slice(0, 7) // "2026-06"
      if (!groups[month]) groups[month] = []
      groups[month].push(event)
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
  }, [filteredEvents])

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:py-10">
      {/* Header */}
      <section className="space-y-1">
        <h1 className="font-serif-accent text-2xl md:text-3xl">成长时间轴</h1>
        <p className="text-sm text-muted-foreground">
          记录你走过每一步
        </p>
      </section>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Badge
          variant={filter === 'all' ? 'default' : 'outline'}
          className="cursor-pointer shrink-0"
          onClick={() => setFilter('all')}
        >
          全部
        </Badge>
        {(Object.entries(EVENT_LABELS) as [GrowthEventType, string][]).map(([type, label]) => (
          <Badge
            key={type}
            variant={filter === type ? 'default' : 'outline'}
            className="cursor-pointer shrink-0"
            onClick={() => setFilter(type)}
          >
            {label}
          </Badge>
        ))}
      </div>

      {/* Timeline */}
      {groupedEvents.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/50">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Clock className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            <div>
              <p className="text-sm font-medium text-muted-foreground">还没有成长记录</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                完成每日复盘、达成目标后，你的成长轨迹会自动出现在这里
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {groupedEvents.map(([month, monthEvents]) => (
            <div key={month} className="space-y-3">
              <h2 className="sticky top-14 z-10 bg-background/80 py-1 font-serif-accent text-lg backdrop-blur-md">
                {format(new Date(month + '-01'), 'yyyy年M月', { locale: zhCN })}
              </h2>

              <div className="relative border-l-2 border-accent-gold/20 pl-5">
                {monthEvents.map((event, i) => (
                  <div key={event.id} className="relative mb-4 last:mb-0">
                    {/* Dot */}
                    <div
                      className={cn(
                        'absolute -left-[1.65rem] top-1.5 h-3 w-3 rounded-full border-2 border-background',
                        event.emotion_tag === 'happy' || event.emotion_tag === 'proud'
                          ? 'bg-success'
                          : event.emotion_tag === 'struggling'
                            ? 'bg-warning'
                            : 'bg-accent-gold'
                      )}
                    />

                    <Card className="border-border/60 bg-card transition-colors hover:border-accent-gold/20">
                      <CardContent className="flex items-start gap-3 p-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-gold/10 text-accent-gold">
                          {EVENT_ICONS[event.event_type as GrowthEventType] ?? '📌'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{event.title}</p>
                          {event.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {event.description}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(event.date), 'M月d日')}
                            </span>
                            <Badge variant="secondary" className="text-[10px]">
                              {EVENT_LABELS[event.event_type as GrowthEventType]}
                            </Badge>
                            {event.emotion_tag && (
                              <span className="text-xs">
                                {event.emotion_tag === 'happy'
                                  ? '😊'
                                  : event.emotion_tag === 'proud'
                                    ? '🎉'
                                    : event.emotion_tag === 'struggling'
                                      ? '💪'
                                      : event.emotion_tag === 'excited'
                                        ? '🤩'
                                        : '😐'}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
