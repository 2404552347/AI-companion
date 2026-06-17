'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createProfile } from './actions'
import type { Persona } from '@/types'

type Step = 'persona' | 'profile' | 'goals' | 'complete'

const INTEREST_OPTIONS = [
  '编程', '阅读', '写作', '音乐', '运动', '摄影',
  '旅行', '烹饪', '设计', '冥想', '外语', '绘画',
  '舞蹈', '瑜伽', '游戏', '电影', '历史', '哲学',
]

export function OnboardingClient({
  personas,
  userId,
}: {
  personas: Persona[]
  userId: string
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('persona')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Step 1: Persona
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)

  // Step 2: Profile
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('')
  const [occupation, setOccupation] = useState('')
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [lifeWish, setLifeWish] = useState('')

  // Step 3: Goals
  const [longTermGoal, setLongTermGoal] = useState('')
  const [learningGoal, setLearningGoal] = useState('')
  const [workGoal, setWorkGoal] = useState('')

  // Step 4: Complete
  const [aiWelcome, setAiWelcome] = useState('')
  const [error, setError] = useState('')

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError('')

    const result = await createProfile({
      user_id: userId,
      persona_id: selectedPersona!.id,
      nickname,
      age: age ? parseInt(age) : null,
      occupation: occupation || null,
      interests: selectedInterests,
      life_wish: lifeWish || null,
      long_term_goal: longTermGoal || null,
      learning_goal: learningGoal || null,
      work_goal: workGoal || null,
    })

    setIsSubmitting(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setAiWelcome(result.welcome ?? '')
    setStep('complete')
  }

  const canGoNext = () => {
    switch (step) {
      case 'persona':
        return selectedPersona !== null
      case 'profile':
        return nickname.trim().length > 0
      case 'goals':
        return true // Goals are optional
      default:
        return true
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-warm-gradient">
      {/* Progress Bar */}
      <div className="mx-auto flex w-full max-w-lg gap-1 px-6 pt-8">
        {(['persona', 'profile', 'goals'] as Step[]).map((s, i) => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full bg-muted transition-colors"
            style={{
              backgroundColor:
                step === 'persona'
                  ? i === 0
                    ? 'var(--accent-gold)'
                    : undefined
                  : step === 'profile'
                    ? i <= 1
                      ? 'var(--accent-gold)'
                      : undefined
                    : step === 'goals'
                      ? i <= 2
                        ? 'var(--accent-gold)'
                        : undefined
                      : undefined,
            }}
          />
        ))}
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 py-8">
        {/* Step 1: Choose Persona */}
        {step === 'persona' && (
          <>
            <div className="mb-8 space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-gold/10">
                <Heart className="h-6 w-6 text-accent-gold" strokeWidth={1.5} />
              </div>
              <h1 className="font-serif-accent text-2xl tracking-tight">选择你的 AI 伙伴风格</h1>
              <p className="text-sm text-muted-foreground">
                选择一种陪伴方式，后续可以随时在设置中更改
              </p>
            </div>

            <div className="flex-1 space-y-3">
              {personas.map((persona) => (
                <Card
                  key={persona.id}
                  className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                    selectedPersona?.id === persona.id
                      ? 'border-accent-gold bg-accent-gold/5'
                      : 'border-border/60 bg-card hover:border-accent-gold/30'
                  }`}
                  onClick={() => setSelectedPersona(persona)}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl">
                      {persona.avatar_emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{persona.display_name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {persona.description}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-[10px]">
                        {persona.tone}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Profile Details */}
        {step === 'profile' && (
          <>
            <div className="mb-8 space-y-2">
              <h1 className="font-serif-accent text-2xl tracking-tight">让我们了解你</h1>
              <p className="text-sm text-muted-foreground">
                这些信息帮助 AI 伙伴更好地记住你、理解你
              </p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">昵称 *</label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="你希望大家怎么称呼你？"
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">年龄</label>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="可选"
                    className="h-11"
                    min={1}
                    max={120}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">职业/身份</label>
                  <Input
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    placeholder="可选，如：学生、程序员"
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">兴趣爱好（可多选）</label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <Badge
                      key={interest}
                      variant={selectedInterests.includes(interest) ? 'default' : 'outline'}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">人生愿望</label>
                <Textarea
                  value={lifeWish}
                  onChange={(e) => setLifeWish(e.target.value)}
                  placeholder="你最大的愿望是什么？（可选）"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </>
        )}

        {/* Step 3: Goals */}
        {step === 'goals' && (
          <>
            <div className="mb-8 space-y-2">
              <h1 className="font-serif-accent text-2xl tracking-tight">你的目标</h1>
              <p className="text-sm text-muted-foreground">
                告诉 AI 伙伴你想去哪里，它会帮你记住方向。所有目标都可以跳过，以后随时添加。
              </p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-accent-gold" />
                  长期目标
                </label>
                <Textarea
                  value={longTermGoal}
                  onChange={(e) => setLongTermGoal(e.target.value)}
                  placeholder="5年后你想成为什么样的人？"
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-accent-gold" />
                  学习目标
                </label>
                <Textarea
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  placeholder="你想学习什么？考什么证书？掌握什么技能？"
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  <Sparkles className="mr-1.5 inline h-3.5 w-3.5 text-accent-gold" />
                  工作/事业目标
                </label>
                <Textarea
                  value={workGoal}
                  onChange={(e) => setWorkGoal(e.target.value)}
                  placeholder="工作或事业上想达到什么状态？"
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
          </>
        )}

        {/* Step 4: Complete */}
        {step === 'complete' && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent-gold/10">
              <Heart className="h-10 w-10 text-accent-gold" strokeWidth={1.5} />
            </div>
            <h1 className="font-serif-accent text-2xl tracking-tight">一切就绪</h1>
            <Card className="mt-6 border-border/60 bg-card">
              <CardContent className="p-5">
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {aiWelcome}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Navigation Buttons */}
        {step !== 'complete' && (
          <div className="mt-6 flex items-center justify-between border-t border-border/30 pt-6">
            <Button
              variant="ghost"
              onClick={() => {
                if (step === 'profile') setStep('persona')
                else if (step === 'goals') setStep('profile')
              }}
              disabled={step === 'persona'}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              上一步
            </Button>

            {step === 'goals' ? (
              <Button onClick={handleSubmit} disabled={isSubmitting || !canGoNext()} className="gap-1.5">
                {isSubmitting ? '创建中...' : '完成'}
                <Sparkles className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (step === 'persona') setStep('profile')
                  else if (step === 'profile') setStep('goals')
                }}
                disabled={!canGoNext()}
                className="gap-1.5"
              >
                下一步
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {step === 'complete' && (
          <div className="mt-6">
            <Button onClick={() => router.push('/')} className="w-full gap-1.5">
              进入主页
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
