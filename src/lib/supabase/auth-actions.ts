'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from './server'
import { isDemoMode } from './demo'

interface AuthResult {
  error?: string
  success?: string
}

// 把账号名转成隐藏邮箱
function toEmail(username: string): string {
  return `${username}@ai.local`
}

export async function login(prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  if (isDemoMode()) {
    revalidatePath('/', 'layout')
    redirect('/')
  }

  const supabase = await createServerSupabase()

  const username = formData.get('username') as string
  const password = formData.get('password') as string

  if (!username || !password) {
    return { error: '请填写账号和密码' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: toEmail(username),
    password,
  })

  if (error) {
    return { error: '账号或密码错误' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  if (isDemoMode()) {
    revalidatePath('/', 'layout')
    redirect('/onboarding')
  }

  const supabase = await createServerSupabase()

  const username = formData.get('username') as string
  const password = formData.get('password') as string
  const nickname = formData.get('nickname') as string

  if (!username || !password) {
    return { error: '请填写账号和密码' }
  }

  if (!username.match(/^[a-zA-Z0-9_-]{3,20}$/)) {
    return { error: '账号需3-20位，仅限英文、数字、下划线、横线' }
  }

  if (password.length < 6) {
    return { error: '密码至少6位' }
  }

  const { error } = await supabase.auth.signUp({
    email: toEmail(username),
    password,
    options: {
      data: { nickname: nickname || username },
    },
  })

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('unique')) {
      return { error: '此账号已被注册' }
    }
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/onboarding')
}

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}
