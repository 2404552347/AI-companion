'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, Heart, Sparkles, Target, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import type { Notification } from '@/types'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  care_check: <Heart className="h-3.5 w-3.5 text-accent-gold" strokeWidth={1.5} />,
  streak_alert: <Sparkles className="h-3.5 w-3.5 text-accent-gold" strokeWidth={1.5} />,
  weekly_report: <Target className="h-3.5 w-3.5 text-success" strokeWidth={1.5} />,
  goal_reminder: <Target className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />,
  system: <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />,
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/notifications?limit=20')
      if (!res.ok) return
      const result = await res.json()
      const data = (result.data ?? []) as Notification[]
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications()
    // 每分钟轮询一次
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/v1/notifications/${id}/read`, { method: 'PATCH' })
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'PATCH' })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {}
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return '刚刚'
    if (min < 60) return `${min}分钟前`
    const hours = Math.floor(min / 60)
    if (hours < 24) return `${hours}小时前`
    return format(new Date(dateStr), 'M月d日', { locale: zhCN })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors">
        <Bell className="h-4 w-4" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-gold px-1 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
          <p className="text-sm font-medium">通知</p>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              全部已读
            </button>
          )}
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30" strokeWidth={1} />
              <p className="text-xs text-muted-foreground">暂无通知</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={cn(
                  'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                  !n.is_read && 'bg-accent-gold/5'
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {TYPE_ICONS[n.type] ?? TYPE_ICONS.system}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {!n.is_read && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent-gold" />
                    )}
                    <p className="truncate text-sm font-medium">{n.title}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {n.body}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">
                    {timeAgo(n.created_at)}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
