'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { FileText, Sparkles, TrendingUp, Target, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import type { WeeklyReport } from '@/types'

export function ReportsClient({ reports }: { reports: WeeklyReport[] }) {
  const [generating, setGenerating] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const generateReport = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/v1/reports', { method: 'POST' })
      const result = await res.json()
      if (result.data) {
        toast.success('周报已生成！')
        window.location.reload()
      } else if (result.data?.message) {
        toast.info(result.data.message)
      } else {
        toast.error('生成失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:py-10">
      <section className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-serif-accent text-2xl md:text-3xl">成长报告</h1>
          <p className="text-sm text-muted-foreground">
            {reports.length > 0 ? `${reports.length} 份周报` : '记录每一周的成长'}
          </p>
        </div>
        <Button onClick={generateReport} disabled={generating} size="sm" className="gap-1.5">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          生成本周
        </Button>
      </section>

      {reports.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/50">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            <p className="text-sm font-medium text-muted-foreground">还没有周报</p>
            <p className="text-xs text-muted-foreground/60">
              每周日自动生成，也可以手动点击上方按钮生成
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card
              key={report.id}
              className="cursor-pointer border-border/60 bg-card transition-all hover:border-accent-gold/30"
              onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(report.week_start), 'M月d日', { locale: zhCN })}
                      {' — '}
                      {format(new Date(report.week_end), 'M月d日', { locale: zhCN })}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        复盘 {report.streak_days} 天
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        完成率 {report.completion_rate}%
                      </Badge>
                      {report.mood_avg && (
                        <span className="text-xs text-muted-foreground">
                          😊 {report.mood_avg}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    className={`h-4 w-4 text-muted-foreground/40 transition-transform ${
                      expandedId === report.id ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {expandedId === report.id && (
                  <div className="mt-4 space-y-3 border-t border-border/40 pt-4">
                    {report.summary && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">📝 本周总结</p>
                        <p className="mt-1 text-sm text-foreground/80">{report.summary}</p>
                      </div>
                    )}

                    {(report.achievements?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">🏆 成就</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {report.achievements?.map((a, i) => (
                            <Badge key={i} variant="outline" className="text-[11px] border-success/30 text-success">
                              {a}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {(report.challenges?.length ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">💪 挑战</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {report.challenges?.map((c, i) => (
                            <Badge key={i} variant="outline" className="text-[11px] border-warning/30 text-warning">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.ai_suggestions && (
                      <div>
                        <Separator className="my-2" />
                        <p className="text-xs font-medium text-muted-foreground">🌱 下周建议</p>
                        <p className="mt-1 text-sm text-muted-foreground">{report.ai_suggestions}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
