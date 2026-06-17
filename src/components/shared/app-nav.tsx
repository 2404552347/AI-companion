'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, MessageCircle, BookOpen, Clock, Target, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBell } from './notification-bell'

const navItems = [
  { href: '/', label: '首页', icon: Heart },
  { href: '/chat', label: '对话', icon: MessageCircle },
  { href: '/review', label: '复盘', icon: BookOpen },
  { href: '/timeline', label: '时间轴', icon: Clock },
  { href: '/goals', label: '目标', icon: Target },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/60 bg-background/80 backdrop-blur-md md:block">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-accent-gold" strokeWidth={1.5} />
          <span className="font-serif-accent text-sm tracking-tight">Companion</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.5} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Notification & Settings */}
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Link
            href="/settings"
            className={cn(
              'rounded-lg p-1.5 transition-colors hover:bg-muted',
              pathname === '/settings' && 'bg-primary/10 text-primary'
            )}
          >
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-accent-gold/20 text-accent-gold text-xs">
                <Settings className="h-3.5 w-3.5" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  )
}
