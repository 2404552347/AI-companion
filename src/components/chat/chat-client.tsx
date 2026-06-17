'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Heart, Send, Smile, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Conversation, Persona } from '@/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

interface ChatClientProps {
  initialMessages: Conversation[]
  persona: Persona | null
  userProfile: { nickname: string } | null
}

export function ChatClient({ initialMessages, persona, userProfile }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map((c) => ({
      id: c.id,
      role: c.role,
      content: c.content,
    }))
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)

    // Add user message
    const userMsgId = `user-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: userMessage },
    ])

    // Add placeholder for AI response
    const aiMsgId = `ai-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', isStreaming: true },
    ])

    try {
      const response = await fetch('/api/v1/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No reader')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.delta) {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, content: msg.content + data.delta }
                      : msg
                  )
                )
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: '抱歉，我这边出了点问题。请稍后再试。', isStreaming: false }
            : msg
        )
      )
    } finally {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === aiMsgId ? { ...msg, isStreaming: false } : msg))
      )
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-3.5rem)] max-w-2xl flex-col px-4 md:h-[calc(100vh-3.5rem)]">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-border/60 py-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-accent-gold/20 text-lg">
            {persona?.avatar_emoji ?? '🤗'}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {persona?.display_name ?? 'AI 伙伴'}
          </p>
          <p className="text-xs text-muted-foreground">在线</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-gold/10">
              <Heart className="h-8 w-8 text-accent-gold" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif-accent text-lg">
              嗨，{userProfile?.nickname ?? '朋友'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              今天想和我聊什么？
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}
          >
            {msg.role === 'assistant' && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-accent-gold/20 text-sm">
                  {persona?.avatar_emoji ?? '🤗'}
                </AvatarFallback>
              </Avatar>
            )}

            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              )}
            >
              {msg.content ? (
                <p className="whitespace-pre-wrap">
                  {msg.content}
                  {msg.isStreaming && (
                    <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-current align-middle" />
                  )}
                </p>
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>

            {msg.role === 'user' && (
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/20 text-sm">
                  {userProfile?.nickname?.[0] ?? '我'}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/60 py-3">
        <div className="flex items-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Smile className="h-5 w-5" strokeWidth={1.5} />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说点什么..."
            rows={1}
            disabled={isLoading}
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl border-border/60 bg-muted/50 text-sm"
          />

          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[11px] text-muted-foreground/50">
          AI Companion 会记住你们的对话
        </p>
      </div>
    </div>
  )
}
