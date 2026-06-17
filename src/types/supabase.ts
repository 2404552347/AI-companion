// Supabase Database 类型定义
// 用于 createBrowserClient<Database> 和 createServerClient<Database>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          nickname: string
          age: number | null
          avatar_url: string | null
          bio: string | null
          long_term_vision: string | null
          interests: string[] | null
          life_wish: string | null
          occupation: string | null
          timezone: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nickname: string
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          long_term_vision?: string | null
          interests?: string[] | null
          life_wish?: string | null
          occupation?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nickname?: string
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          long_term_vision?: string | null
          interests?: string[] | null
          life_wish?: string | null
          occupation?: string | null
          timezone?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_profiles_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      memories: {
        Row: {
          id: string
          user_id: string
          category: string
          content: string
          source: string
          source_ref: string | null
          importance: number
          last_accessed: string | null
          access_count: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          content: string
          source: string
          source_ref?: string | null
          importance?: number
          last_accessed?: string | null
          access_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          content?: string
          source?: string
          source_ref?: string | null
          importance?: number
          last_accessed?: string | null
          access_count?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'memories_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      daily_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          completed: string[] | null
          failed: string[] | null
          growth: string[] | null
          tomorrow_plan: string[] | null
          mood_score: number | null
          mood_note: string | null
          ai_feedback: string | null
          ai_encouragement: string | null
          ai_analysis: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date: string
          completed?: string[] | null
          failed?: string[] | null
          growth?: string[] | null
          tomorrow_plan?: string[] | null
          mood_score?: number | null
          mood_note?: string | null
          ai_feedback?: string | null
          ai_encouragement?: string | null
          ai_analysis?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          completed?: string[] | null
          failed?: string[] | null
          growth?: string[] | null
          tomorrow_plan?: string[] | null
          mood_score?: number | null
          mood_note?: string | null
          ai_feedback?: string | null
          ai_encouragement?: string | null
          ai_analysis?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'daily_logs_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      goals: {
        Row: {
          id: string
          user_id: string
          parent_id: string | null
          title: string
          description: string | null
          category: string
          status: string
          progress: number
          target_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          parent_id?: string | null
          title: string
          description?: string | null
          category: string
          status?: string
          progress?: number
          target_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          parent_id?: string | null
          title?: string
          description?: string | null
          category?: string
          status?: string
          progress?: number
          target_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'goals_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'goals_parent_id_fkey'
            columns: ['parent_id']
            referencedRelation: 'goals'
            referencedColumns: ['id']
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          role: string
          content: string
          metadata: Json | null
          extracted_memories: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          content: string
          metadata?: Json | null
          extracted_memories?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          content?: string
          metadata?: Json | null
          extracted_memories?: string[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'conversations_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      growth_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          title: string
          description: string | null
          emotion_tag: string | null
          related_log_id: string | null
          related_goal_id: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          title: string
          description?: string | null
          emotion_tag?: string | null
          related_log_id?: string | null
          related_goal_id?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          title?: string
          description?: string | null
          emotion_tag?: string | null
          related_log_id?: string | null
          related_goal_id?: string | null
          date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'growth_events_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'growth_events_related_log_id_fkey'
            columns: ['related_log_id']
            referencedRelation: 'daily_logs'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'growth_events_related_goal_id_fkey'
            columns: ['related_goal_id']
            referencedRelation: 'goals'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          is_read: boolean
          action_url: string | null
          delivered_via: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          is_read?: boolean
          action_url?: string | null
          delivered_via?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          body?: string
          is_read?: boolean
          action_url?: string | null
          delivered_via?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      personas: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string
          tone: string | null
          system_prompt: string
          avatar_emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          display_name: string
          description: string
          tone?: string | null
          system_prompt: string
          avatar_emoji: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          display_name?: string
          description?: string
          tone?: string | null
          system_prompt?: string
          avatar_emoji?: string
          created_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          persona_id: string | null
          care_check_enabled: boolean
          care_check_interval: number
          email_notify_enabled: boolean
          weekly_report_day: number
          language: string
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          persona_id?: string | null
          care_check_enabled?: boolean
          care_check_interval?: number
          email_notify_enabled?: boolean
          weekly_report_day?: number
          language?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          persona_id?: string | null
          care_check_enabled?: boolean
          care_check_interval?: number
          email_notify_enabled?: boolean
          weekly_report_day?: number
          language?: string
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_settings_persona_id_fkey'
            columns: ['persona_id']
            referencedRelation: 'personas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_settings_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      weekly_reports: {
        Row: {
          id: string
          user_id: string
          week_start: string
          week_end: string
          summary: string | null
          achievements: string[] | null
          challenges: string[] | null
          growth_highlights: string[] | null
          completion_rate: number | null
          streak_days: number
          mood_avg: number | null
          ai_suggestions: string | null
          share_card_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          week_end: string
          summary?: string | null
          achievements?: string[] | null
          challenges?: string[] | null
          growth_highlights?: string[] | null
          completion_rate?: number | null
          streak_days?: number
          mood_avg?: number | null
          ai_suggestions?: string | null
          share_card_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          week_end?: string
          summary?: string | null
          achievements?: string[] | null
          challenges?: string[] | null
          growth_highlights?: string[] | null
          completion_rate?: number | null
          streak_days?: number
          mood_avg?: number | null
          ai_suggestions?: string | null
          share_card_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'weekly_reports_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
