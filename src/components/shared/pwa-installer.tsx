'use client'

import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

// 检测是否已安装为 PWA
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// 检测是否可安装
let deferredPrompt: Event & { prompt?: () => Promise<void> } | null = null

export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // SW registration failed — non-critical
      })
    }

    // 监听 beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt = e as Event & { prompt?: () => Promise<void> }
      if (!isStandalone() && !dismissed) {
        // 延迟显示，避免首次加载就弹
        setTimeout(() => setShowBanner(true), 30000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed])

  const handleInstall = async () => {
    if (deferredPrompt?.prompt) {
      await deferredPrompt.prompt()
      const choice = await (deferredPrompt as unknown as { userChoice: { outcome: string } }).userChoice
      if (choice.outcome === 'accepted') {
        setShowBanner(false)
      }
      deferredPrompt = null
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80">
      <Card className="border-accent-gold/40 bg-card/95 backdrop-blur-md shadow-lg">
        <CardContent className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-gold/10 text-lg">
            🤗
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">安装 AI Companion</p>
            <p className="text-xs text-muted-foreground">像原生应用一样使用</p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleInstall}>
              <Download className="h-3 w-3" />
              安装
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => { setShowBanner(false); setDismissed(true) }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
