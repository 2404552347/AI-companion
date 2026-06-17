'use server'

import { createServerSupabase } from '@/lib/supabase/server'
import { getOpenAI, FAST_MODEL } from '@/lib/openai/client'
import { isDemoMode } from '@/lib/supabase/demo'

interface OnboardingData {
  user_id: string
  persona_id: string
  nickname: string
  age: number | null
  occupation: string | null
  interests: string[]
  life_wish: string | null
  long_term_goal: string | null
  learning_goal: string | null
  work_goal: string | null
}

export async function createProfile(data: OnboardingData) {
  if (isDemoMode()) {
    return { welcome: `欢迎你，${data.nickname}！从今天起，我会陪伴你度过每一天。你设定了${data.interests.length > 0 ? data.interests.slice(0, 3).join('、') + '等目标' : '清晰的方向'}，我们一起加油。无论什么时候找我，我都在这里。` }
  }

  const supabase = await createServerSupabase()

  try {
    // 1. Create user profile
    const { error: profileError } = await supabase.from('user_profiles').insert({
      user_id: data.user_id,
      nickname: data.nickname,
      age: data.age,
      occupation: data.occupation,
      interests: data.interests,
      life_wish: data.life_wish,
    })

    if (profileError) {
      return { error: '创建档案失败: ' + profileError.message }
    }

    // 2. Create user settings with selected persona
    const { error: settingsError } = await supabase.from('user_settings').insert({
      user_id: data.user_id,
      persona_id: data.persona_id,
    })

    if (settingsError) {
      // Non-critical — profile was created
      console.error('Settings creation failed:', settingsError)
    }

    // 3. Create initial goals from onboarding
    const goalsToInsert: Array<{
      user_id: string
      title: string
      category: string
      status: string
    }> = []

    if (data.long_term_goal) {
      goalsToInsert.push({
        user_id: data.user_id,
        title: data.long_term_goal,
        category: 'long_term',
        status: 'active',
      })
    }
    if (data.learning_goal) {
      goalsToInsert.push({
        user_id: data.user_id,
        title: data.learning_goal,
        category: 'learning',
        status: 'active',
      })
    }
    if (data.work_goal) {
      goalsToInsert.push({
        user_id: data.user_id,
        title: data.work_goal,
        category: 'work',
        status: 'active',
      })
    }

    if (goalsToInsert.length > 0) {
      await supabase.from('goals').insert(goalsToInsert)
    }

    // 4. Create seed memories from onboarding
    const memoriesToInsert: Array<{
      user_id: string
      category: string
      content: string
      source: string
      importance: number
    }> = [
      {
        user_id: data.user_id,
        category: 'preference',
        content: `用户昵称是${data.nickname}`,
        source: 'onboarding',
        importance: 5,
      },
      {
        user_id: data.user_id,
        category: 'preference',
        content: `用户兴趣爱好: ${data.interests.join('、') || '未指定'}`,
        source: 'onboarding',
        importance: 4,
      },
    ]

    if (data.life_wish) {
      memoriesToInsert.push({
        user_id: data.user_id,
        category: 'goal',
        content: `用户的人生愿望: ${data.life_wish}`,
        source: 'onboarding',
        importance: 5,
      })
    }
    if (data.long_term_goal) {
      memoriesToInsert.push({
        user_id: data.user_id,
        category: 'goal',
        content: `用户长期目标: ${data.long_term_goal}`,
        source: 'onboarding',
        importance: 5,
      })
    }
    if (data.learning_goal) {
      memoriesToInsert.push({
        user_id: data.user_id,
        category: 'goal',
        content: `用户学习目标: ${data.learning_goal}`,
        source: 'onboarding',
        importance: 5,
      })
    }
    if (data.work_goal) {
      memoriesToInsert.push({
        user_id: data.user_id,
        category: 'goal',
        content: `用户工作目标: ${data.work_goal}`,
        source: 'onboarding',
        importance: 5,
      })
    }

    await supabase.from('memories').insert(memoriesToInsert)

    // 5. Create first growth event
    await supabase.from('growth_events').insert({
      user_id: data.user_id,
      event_type: 'milestone',
      title: '加入了 AI Companion，开始了成长之旅',
      description: `选择了${data.interests.length > 0 ? `关注${data.interests.slice(0, 3).join('、')}等领域` : '开启成长之路'}`,
      emotion_tag: 'excited',
      date: new Date().toISOString().split('T')[0],
    })

    // 6. Generate AI welcome message
    let welcome = ''
    try {
      const openai = getOpenAI()
      const response = await openai.chat.completions.create({
        model: FAST_MODEL,
        messages: [
          {
            role: 'system',
            content:
              '你是一个温暖的AI成长伙伴。用户刚完成注册，请生成一段40-60字的个性化欢迎语。必须自然提到用户的名字、目标或兴趣。用口语化的中文，温暖但不煽情。',
          },
          {
            role: 'user',
            content: `新用户信息: 昵称=${data.nickname}, 长期目标=${data.long_term_goal || '未设定'}, 学习目标=${data.learning_goal || '未设定'}, 兴趣爱好=${data.interests.join(', ') || '未设定'}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.8,
      })
      welcome = response.choices[0]?.message?.content?.trim() ?? ''
    } catch {
      welcome = `欢迎你，${data.nickname}。从今天起，我会陪伴你度过每一天，见证你的成长。无论遇到什么，我都在这里。`
    }

    return { welcome }
  } catch (err) {
    console.error('Onboarding error:', err)
    return { error: '创建过程中出现错误，请重试' }
  }
}
