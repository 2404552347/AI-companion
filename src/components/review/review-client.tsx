'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { DailyLog } from '@/types'

const MOOD_EMOJIS = ['😞', '😕', '😐', '😊', '🤩']
const MOOD_LABELS = ['很差', '不太好', '一般', '不错', '很棒']

interface ReviewClientProps {
  initialLog: DailyLog | null
  today: string
}

export function ReviewClient({ initialLog, today }: ReviewClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [moodScore, setMoodScore] = useState<number | null>(initialLog?.mood_score ?? null)
  const [moodNote, setMoodNote] = useState(initialLog?.mood_note ?? '')
  const [completed, setCompleted] = useState<string[]>(initialLog?.completed ?? [])
  const [failed, setFailed] = useState<string[]>(initialLog?.failed ?? [])
  const [growth, setGrowth] = useState<string[]>(initialLog?.growth ?? [])
  const [tomorrowPlan, setTomorrowPlan] = useState<string[]>(initialLog?.tomorrow_plan ?? [])

  // AI feedback (populated after submit)
  const [aiFeedback, setAiFeedback] = useState(initialLog?.ai_feedback ?? '')
  const [aiEncouragement, setAiEncouragement] = useState(initialLog?.ai_encouragement ?? '')
  const [aiAnalysis, setAiAnalysis] = useState(initialLog?.ai_analysis ?? '')

  const [showAIFeedback, setShowAIFeedback] = useState(
    !!(initialLog?.ai_feedback)
  )

  const [newCompleted, setNewCompleted] = useState('')
  const [newFailed, setNewFailed] = useState('')
  const [newGrowth, setNewGrowth] = useState('')
  const [newPlan, setNewPlan] = useState('')

  const addItem = (
    value: string,
    setter: (fn: (prev: string[]) => string[]) => void,
    clearInput: () => void
  ) => {
    if (value.trim()) {
      setter((prev: string[]) => [...prev, value.trim()])
      clearInput()
    }
  }

  const removeItem = (index: number, setter: (fn: (prev: string[]) => string[]) => void) => {
    setter((prev: string[]) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setShowAIFeedback(false)

    try {
      const res = await fetch('/api/v1/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: today,
          mood_score: moodScore,
          mood_note: moodNote || null,
          completed: completed.length > 0 ? completed : null,
          failed: failed.length > 0 ? failed : null,
          growth: growth.length > 0 ? growth : null,
          tomorrow_plan: tomorrowPlan.length > 0 ? tomorrowPlan : null,
        }),
      })

      const result = await res.json()

      if (result.error) {
        console.error('Submit failed:', result.error)
        return
      }

      setAiFeedback(result.data?.ai_feedback ?? '')
      setAiEncouragement(result.data?.ai_encouragement ?? '')
      setAiAnalysis(result.data?.ai_analysis ?? '')
      setShowAIFeedback(true)
    } catch (err) {
      console.error('Submit error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const todayFormatted = format(new Date(), 'M月d日 EEEE', { locale: zhCN })

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:py-10">
      {/* Header */}
      <section className="space-y-1">
        <p className="text-sm text-muted-foreground">{todayFormatted}</p>
        <h1 className="font-serif-accent text-2xl md:text-3xl">每日复盘</h1>
        <p className="text-sm text-muted-foreground">
          记录今天的完成、失败、成长与明天的计划
        </p>
      </section>

      {/* Mood Picker */}
      <Card className="border-border/60 bg-card">
        <CardContent className="p-4">
          <p className="mb-3 text-sm font-medium">今天的心情</p>
          <div className="flex items-center gap-3">
            {MOOD_EMOJIS.map((emoji, i) => (
              <button
                key={i}
                onClick={() => setMoodScore(i + 1)}
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition-all',
                  moodScore === i + 1
                    ? 'scale-110 bg-accent-gold/20 ring-2 ring-accent-gold/40'
                    : 'bg-muted hover:bg-accent-gold/10'
                )}
              >
                {emoji}
              </button>
            ))}
          </div>
          {moodScore && (
            <p className="mt-2 text-xs text-muted-foreground">
              {MOOD_LABELS[moodScore - 1]}
            </p>
          )}
          <Input
            value={moodNote}
            onChange={(e) => setMoodNote(e.target.value)}
            placeholder="简单说说为什么...（可选）"
            className="mt-3 h-9 text-sm"
          />
        </CardContent>
      </Card>

      {/* Completed */}
      <ReviewSection
        icon={<CheckCircle className="h-5 w-5 text-success" strokeWidth={1.5} />}
        title="今天完成了什么？"
        items={completed}
        newValue={newCompleted}
        onNewValueChange={setNewCompleted}
        onAdd={() => addItem(newCompleted, setCompleted, () => setNewCompleted(''))}
        onRemove={(i) => removeItem(i, setCompleted)}
        placeholder="完成俄语第12课..."
      />

      {/* Failed */}
      <ReviewSection
        icon={<XCircle className="h-5 w-5 text-destructive" strokeWidth={1.5} />}
        title="今天哪些没做好？"
        subtitle="诚实面对失败，是成长的开始"
        items={failed}
        newValue={newFailed}
        onNewValueChange={setNewFailed}
        onAdd={() => addItem(newFailed, setFailed, () => setNewFailed(''))}
        onRemove={(i) => removeItem(i, setFailed)}
        placeholder="没有完成跑步计划..."
      />

      {/* Growth */}
      <ReviewSection
        icon={<TrendingUp className="h-5 w-5 text-accent-gold" strokeWidth={1.5} />}
        title="今天有什么成长？"
        subtitle="哪怕一丁点进步也值得记录"
        items={growth}
        newValue={newGrowth}
        onNewValueChange={setNewGrowth}
        onAdd={() => addItem(newGrowth, setGrowth, () => setNewGrowth(''))}
        onRemove={(i) => removeItem(i, setGrowth)}
        placeholder="学会了嵌入式从句..."
      />

      {/* Tomorrow Plan */}
      <ReviewSection
        icon={<Calendar className="h-5 w-5 text-primary" strokeWidth={1.5} />}
        title="明天的计划"
        items={tomorrowPlan}
        newValue={newPlan}
        onNewValueChange={setNewPlan}
        onAdd={() => addItem(newPlan, setTomorrowPlan, () => setNewPlan(''))}
        onRemove={(i) => removeItem(i, setTomorrowPlan)}
        placeholder="复习第12课..."
      />

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="w-full gap-2"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            AI 正在分析...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            提交复盘
          </>
        )}
      </Button>

      {/* AI Feedback */}
      {showAIFeedback && (aiFeedback || aiEncouragement) && (
        <Card className="border-accent-gold-soft/60 bg-accent-gold/5">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-gold" />
              <p className="text-sm font-medium text-accent-gold">AI 伙伴的反馈</p>
            </div>

            {aiFeedback && (
              <div>
                <p className="text-sm font-medium">📝 今日点评</p>
                <p className="mt-1 text-sm text-muted-foreground">{aiFeedback}</p>
              </div>
            )}

            {aiEncouragement && (
              <div>
                <p className="text-sm font-medium">💪 鼓励</p>
                <p className="mt-1 text-sm text-muted-foreground">{aiEncouragement}</p>
              </div>
            )}

            {aiAnalysis && (
              <div>
                <Separator className="my-3" />
                <p className="text-sm font-medium">🌱 成长分析</p>
                <p className="mt-1 text-sm text-muted-foreground">{aiAnalysis}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Reusable section component
function ReviewSection({
  icon,
  title,
  subtitle,
  items,
  newValue,
  onNewValueChange,
  onAdd,
  onRemove,
  placeholder,
}: {
  icon: React.ReactNode
  title: string
  subtitle?: string
  items: string[]
  newValue: string
  onNewValueChange: (value: string) => void
  onAdd: () => void
  onRemove: (index: number) => void
  placeholder: string
}) {
  return (
    <Card className="border-border/60 bg-card">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <p className="text-sm font-medium">{title}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        {/* Existing items */}
        {items.length > 0 && (
          <div className="space-y-1.5">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="flex-1">{item}</span>
                <button
                  onClick={() => onRemove(i)}
                  className="text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        <div className="flex gap-2">
          <Input
            value={newValue}
            onChange={(e) => onNewValueChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAdd()
              }
            }}
            placeholder={placeholder}
            className="h-9 text-sm"
          />
          <Button variant="outline" size="icon" onClick={onAdd} className="h-9 w-9 shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
