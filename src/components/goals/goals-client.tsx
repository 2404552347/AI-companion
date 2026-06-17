'use client'

import { useState } from 'react'
import { Target, Plus, Loader2, Trash2, Check, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Goal, GoalCreate, GoalCategory, GoalStatus } from '@/types'

const CATEGORY_LABELS: Record<GoalCategory, string> = {
  long_term: '长期目标',
  learning: '学习',
  work: '工作',
  life: '生活',
  habit: '习惯',
}

const CATEGORY_COLORS: Record<GoalCategory, string> = {
  long_term: 'bg-accent-gold/10 text-accent-gold border-accent-gold/30',
  learning: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
  work: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
  life: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
  habit: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800',
}

export function GoalsClient({ initialGoals }: { initialGoals: Goal[] }) {
  const [goals, setGoals] = useState<Goal[]>(initialGoals)
  const [isCreating, setIsCreating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  // New goal form
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<GoalCategory>('learning')

  const activeGoals = goals.filter((g) => g.status === 'active')
  const completedGoals = goals.filter((g) => g.status === 'completed')
  const otherGoals = goals.filter((g) => g.status !== 'active' && g.status !== 'completed')

  const createGoal = async () => {
    if (!title.trim()) return
    setIsCreating(true)

    try {
      const res = await fetch('/api/v1/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, category }),
      })
      const result = await res.json()
      if (result.data) {
        setGoals((prev) => [result.data, ...prev])
        setTitle('')
        setDescription('')
        setDialogOpen(false)
      }
    } catch (err) {
      console.error('Create goal error:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const toggleStatus = async (goal: Goal) => {
    const newStatus: GoalStatus = goal.status === 'active' ? 'paused' : 'active'
    try {
      await fetch(`/api/v1/goals/${goal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      setGoals((prev) =>
        prev.map((g) => (g.id === goal.id ? { ...g, status: newStatus } : g))
      )
    } catch (err) {
      console.error('Update goal error:', err)
    }
  }

  const deleteGoal = async (id: string) => {
    try {
      await fetch(`/api/v1/goals/${id}`, { method: 'DELETE' })
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      console.error('Delete goal error:', err)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:py-10">
      {/* Header */}
      <section className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-serif-accent text-2xl md:text-3xl">目标</h1>
          <p className="text-sm text-muted-foreground">
            {activeGoals.length} 个进行中 · {completedGoals.length} 个已完成
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
            <Plus className="h-4 w-4" />
            新目标
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建新目标</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="目标标题"
                className="h-11"
              />
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述（可选）"
                className="min-h-[80px] resize-none"
              />
              <div className="flex gap-2">
                {(Object.keys(CATEGORY_LABELS) as GoalCategory[]).map((cat) => (
                  <Badge
                    key={cat}
                    variant={category === cat ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setCategory(cat)}
                  >
                    {CATEGORY_LABELS[cat]}
                  </Badge>
                ))}
              </div>
              <Button onClick={createGoal} disabled={isCreating || !title.trim()} className="w-full">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : '创建'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Active Goals */}
      {activeGoals.map((goal) => (
        <GoalCard
          key={goal.id}
          goal={goal}
          onToggleStatus={toggleStatus}
          onDelete={deleteGoal}
        />
      ))}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <>
          <h2 className="font-serif-accent text-lg">已完成</h2>
          {completedGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleStatus={toggleStatus}
              onDelete={deleteGoal}
            />
          ))}
        </>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="border-dashed border-border/60 bg-card/50">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Target className="h-10 w-10 text-muted-foreground/40" strokeWidth={1} />
            <div>
              <p className="text-sm font-medium text-muted-foreground">还没有目标</p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                设定一个目标，让AI伙伴陪你一起实现
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              创建第一个目标
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function GoalCard({
  goal,
  onToggleStatus,
  onDelete,
}: {
  goal: Goal
  onToggleStatus: (goal: Goal) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card
      className={cn(
        'border-border/60 bg-card transition-colors hover:border-accent-gold/20',
        goal.status === 'completed' && 'opacity-60'
      )}
    >
      <CardContent className="flex items-start gap-3 p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                'text-sm font-medium',
                goal.status === 'completed' && 'line-through'
              )}
            >
              {goal.title}
            </p>
            <Badge
              variant="outline"
              className={cn('text-[10px]', CATEGORY_COLORS[goal.category as GoalCategory])}
            >
              {CATEGORY_LABELS[goal.category as GoalCategory]}
            </Badge>
          </div>
          {goal.description && (
            <p className="mt-1 text-xs text-muted-foreground">{goal.description}</p>
          )}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent-gold transition-all"
              style={{ width: `${goal.progress}%` }}
            />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleStatus(goal)}
          >
            {goal.status === 'active' ? (
              <Pause className="h-3.5 w-3.5" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(goal.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
