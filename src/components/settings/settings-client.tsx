'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Settings, LogOut, User, Palette, Bell, Shield,
  ChevronRight, Loader2, Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { signOut } from '@/lib/supabase/auth-actions'
import { toast } from 'sonner'
import type { Persona, UserProfile, UserSettings } from '@/types'

interface Props {
  profile: UserProfile | null
  settings: UserSettings | null
  personas: Persona[]
  activePersona: Persona | null
}

const INTEREST_OPTIONS = [
  '编程', '阅读', '写作', '音乐', '运动', '摄影',
  '旅行', '烹饪', '设计', '冥想', '外语', '绘画',
]

export function SettingsClient({ profile, settings, personas, activePersona }: Props) {
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [currentPersona, setCurrentPersona] = useState(activePersona)

  // Persona dialog
  const [personaOpen, setPersonaOpen] = useState(false)
  const [switchingPersona, setSwitchingPersona] = useState(false)

  // Profile edit dialog
  const [profileOpen, setProfileOpen] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [editNickname, setEditNickname] = useState(profile?.nickname ?? '')
  const [editAge, setEditAge] = useState(profile?.age?.toString() ?? '')
  const [editOccupation, setEditOccupation] = useState(profile?.occupation ?? '')
  const [editInterests, setEditInterests] = useState<string[]>(profile?.interests ?? [])
  const [editLifeWish, setEditLifeWish] = useState(profile?.life_wish ?? '')

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
  }

  const switchPersona = async (persona: Persona) => {
    setSwitchingPersona(true)
    try {
      const res = await fetch('/api/v1/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona_id: persona.id }),
      })
      if (res.ok) {
        setCurrentPersona(persona)
        setPersonaOpen(false)
        toast.success(`已切换为「${persona.display_name}」风格`)
        router.refresh()
      } else {
        toast.error('切换失败，请重试')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setSwitchingPersona(false)
    }
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const res = await fetch('/api/v1/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: editNickname,
          age: editAge ? parseInt(editAge) : null,
          occupation: editOccupation || null,
          interests: editInterests,
          life_wish: editLifeWish || null,
        }),
      })
      if (res.ok) {
        setProfileOpen(false)
        toast.success('资料已更新')
        router.refresh()
      } else {
        toast.error('保存失败')
      }
    } catch {
      toast.error('网络错误')
    } finally {
      setSavingProfile(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setEditInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 md:py-10">
      <section className="flex items-center justify-between">
        <h1 className="font-serif-accent text-2xl md:text-3xl">设置</h1>
        <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground" onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          退出
        </Button>
      </section>

      {/* Profile Card */}
      <Card className="border-border/60 bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-accent-gold/20 text-accent-gold text-lg">
              {profile?.nickname?.[0] ?? '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{profile?.nickname ?? '用户'}</p>
            <p className="text-sm text-muted-foreground truncate">
              {profile?.occupation ?? '未设置职业'}
              {profile?.age ? ` · ${profile.age}岁` : ''}
            </p>
            {profile?.interests && profile.interests.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {profile.interests.slice(0, 3).map((i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">{i}</Badge>
                ))}
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => setProfileOpen(true)}>
            编辑
          </Button>
        </CardContent>
      </Card>

      {/* Active Persona */}
      <Card className="border-border/60 bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-gold/10 text-xl">
            {currentPersona?.avatar_emoji ?? '🤗'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{currentPersona?.display_name ?? '默认'}</p>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {currentPersona?.description}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPersonaOpen(true)}>
            切换
          </Button>
        </CardContent>
      </Card>

      {/* Settings Menu */}
      <Card className="border-border/60 bg-card">
        <CardContent className="divide-y divide-border/40 p-0">
          <SettingsRow icon={<User />} label="个人资料" onClick={() => setProfileOpen(true)} />
          <SettingsRow icon={<Palette />} label="外观" value="跟随系统" />
          <SettingsRow icon={<Bell />} label="通知" value="已开启" />
          <SettingsRow icon={<Shield />} label="隐私与数据" />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground/50 pt-4">AI Companion v0.2.0 — Phase 2</p>

      {/* Persona Switch Dialog */}
      <Dialog open={personaOpen} onOpenChange={setPersonaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>选择 AI 伙伴风格</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {personas.map((persona) => (
              <Card
                key={persona.id}
                className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                  persona.id === currentPersona?.id
                    ? 'border-accent-gold bg-accent-gold/5'
                    : 'border-border/60 hover:border-accent-gold/30'
                }`}
                onClick={() => switchPersona(persona)}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <span className="text-2xl">{persona.avatar_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{persona.display_name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{persona.description}</p>
                  </div>
                  {switchingPersona && persona.id === currentPersona?.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    persona.id === currentPersona?.id && <Sparkles className="h-4 w-4 text-accent-gold" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Edit Dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent showCloseButton className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>编辑资料</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">昵称</label>
              <Input value={editNickname} onChange={(e) => setEditNickname(e.target.value)} className="h-11" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">年龄</label>
                <Input type="number" value={editAge} onChange={(e) => setEditAge(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">职业</label>
                <Input value={editOccupation} onChange={(e) => setEditOccupation(e.target.value)} className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">兴趣爱好</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <Badge
                    key={interest}
                    variant={editInterests.includes(interest) ? 'default' : 'outline'}
                    className="cursor-pointer"
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
                value={editLifeWish}
                onChange={(e) => setEditLifeWish(e.target.value)}
                placeholder="你最大的愿望是什么？"
                className="min-h-[80px] resize-none"
              />
            </div>
            <Button onClick={saveProfile} disabled={savingProfile || !editNickname.trim()} className="w-full">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : '保存'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SettingsRow({ icon, label, value, onClick }: {
  icon: React.ReactNode; label: string; value?: string; onClick?: () => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-pointer" onClick={onClick}>
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs text-muted-foreground">{value}</span>}
        <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
      </div>
    </div>
  )
}
