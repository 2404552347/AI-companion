'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerSupabase } from './server'
import { isDemoMode } from './demo'

interface AuthResult {
  error?: string
  success?: string
}

export async function login(prevState: AuthResult, formData: FormData): Promise<AuthResult> {
  if (isDemoMode()) {
    revalidatePath('/', 'layout')
    redirect('/')
  }

  const supabase = await createServerSupabase()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    return { error: error.message }
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

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nickname = formData.get('nickname') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname },
    },
  })

  if (error) {
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
