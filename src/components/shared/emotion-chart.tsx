'use client'

import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { EMOTION_EMOJI, EMOTION_LABELS } from '@/lib/emotion/analyzer'

interface EmotionDataPoint {
  date: string
  emotion: string
  score: number
}

interface EmotionChartProps {
  data: EmotionDataPoint[]
  days?: number
}

export function EmotionChart({ data, days = 7 }: EmotionChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    // 生成过去 N 天的数据
    const result: Array<{
      date: string
      label: string
      dominant: string
      avgScore: number
      count: number
    }> = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayData = data.filter((p) => p.date === dateStr)

      if (dayData.length > 0) {
        const avgScore = Math.round(
          dayData.reduce((s, p) => s + p.score, 0) / dayData.length
        )
        // 找到最常见的情绪
        const counts: Record<string, number> = {}
        dayData.forEach((p) => {
          counts[p.emotion] = (counts[p.emotion] || 0) + 1
        })
        let dominant = dayData[0].emotion
        let maxCount = 0
        for (const [emotion, count] of Object.entries(counts)) {
          if (count > maxCount) {
            maxCount = count
            dominant = emotion
          }
        }

        result.push({
          date: dateStr,
          label: d.getDate().toString(),
          dominant,
          avgScore,
          count: dayData.length,
        })
      } else {
        result.push({
          date: dateStr,
          label: d.getDate().toString(),
          dominant: '',
          avgScore: 0,
          count: 0,
        })
      }
    }

    return result
  }, [data, days])

  if (chartData.length === 0) return null

  const maxScore = 100
  const hasData = chartData.some((d) => d.count > 0)

  if (!hasData) {
    return (
      <Card className="border-border/60 bg-card">
        <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
          <TrendingUp className="h-6 w-6 text-muted-foreground/30" strokeWidth={1} />
          <p className="text-xs text-muted-foreground">情绪数据收集中...</p>
          <p className="text-[11px] text-muted-foreground/50">多聊几次就能看到趋势了</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-accent-gold" strokeWidth={1.5} />
          <p className="text-sm font-medium">情绪趋势</p>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-1.5" style={{ height: '80px' }}>
          {chartData.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              {/* Emoji */}
              <span className="text-sm leading-none">
                {d.dominant ? EMOTION_EMOJI[d.dominant] ?? '😐' : '·'}
              </span>
              {/* Bar */}
              <div className="w-full flex-1 rounded-t-sm bg-muted relative">
                {d.count > 0 && (
                  <div
                    className="absolute bottom-0 w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${(d.avgScore / maxScore) * 100}%`,
                      backgroundColor:
                        d.avgScore > 70
                          ? 'var(--accent-gold)'
                          : d.avgScore > 40
                            ? 'var(--accent-gold-soft)'
                            : 'var(--muted-foreground)',
                      opacity: Math.max(0.3, d.avgScore / 100),
                    }}
                  />
                )}
              </div>
              {/* Date label */}
              <span className="text-[10px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
          {Object.entries(EMOTION_LABELS).slice(0, 6).map(([key, label]) => (
            <span key={key} className="text-[11px] text-muted-foreground">
              {EMOTION_EMOJI[key] ?? ''} {label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
