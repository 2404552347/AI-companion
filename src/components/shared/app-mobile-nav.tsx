'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, MessageCircle, BookOpen, Clock, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '首页', icon: Heart },
  { href: '/chat', label: '对话', icon: MessageCircle },
  { href: '/review', label: '复盘', icon: BookOpen },
  { href: '/timeline', label: '时间轴', icon: Clock },
  { href: '/goals', label: '目标', icon: Target },
]

export function AppMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-md md:hidden">
      <div className="flex items-center justify-around px-1 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2 px-3 text-[11px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon
                className={cn('h-5 w-5', isActive && 'text-accent-gold')}
                strokeWidth={isActive ? 2 : 1.5}
              />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
