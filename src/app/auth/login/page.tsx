'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/supabase/auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Heart } from 'lucide-react'

const initialState = { error: undefined, success: undefined }

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, initialState)

  return (
    <div className="flex min-h-screen items-center justify-center bg-warm-gradient px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-gold/10">
            <Heart className="h-7 w-7 text-accent-gold" strokeWidth={1.5} />
          </div>
          <h1 className="font-serif-accent text-2xl tracking-tight text-foreground">
            AI Companion
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            你的成长伙伴，一直在等你
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-border/60 p-6 card-elevated">
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                邮箱
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="hello@example.com"
                required
                autoComplete="email"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                密码
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="h-11"
              />
            </div>

            {state?.error && (
              <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            )}

            <Button type="submit" className="h-11 w-full" disabled={isPending}>
              {isPending ? '登录中...' : '登录'}
            </Button>
          </form>

          <Separator className="my-5" />

          <p className="text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              创建账号
            </Link>
          </p>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60">
          登录即表示你同意我们的服务条款和隐私政策
        </p>
      </div>
    </div>
  )
}
