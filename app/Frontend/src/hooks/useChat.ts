import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getToken } from '../lib/auth'
import api from '../lib/api'
import type { ChatMessage, ConversationMessage } from '../types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function makeId() {
  return Math.random().toString(36).slice(2)
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const queryClient = useQueryClient()

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])

    const assistantId = makeId()
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, assistantMsg])
    setIsStreaming(true)

    try {
      const response = await fetch(`${BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ message: text, conversation_id: conversationId }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body.getReader()
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
            const raw = line.slice(6).trim()
            if (!raw) continue
            try {
              const event = JSON.parse(raw)
              if (event.type === 'chunk' && event.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.content }
                      : m
                  )
                )
              } else if (event.type === 'done') {
                if (event.conversation_id) {
                  setConversationId(event.conversation_id)
                }
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, isStreaming: false } : m
                  )
                )
                setIsStreaming(false)
                queryClient.invalidateQueries({ queryKey: ['token-balance'] })
                queryClient.invalidateQueries({ queryKey: ['conversations'] })
              } else if (event.type === 'error') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: event.content || 'Une erreur est survenue.', isStreaming: false }
                      : m
                  )
                )
                setIsStreaming(false)
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion.'
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: msg, isStreaming: false }
            : m
        )
      )
      setIsStreaming(false)
    }
  }, [conversationId, isStreaming, queryClient])

  const loadConversation = useCallback(async (id: number) => {
    setConversationId(id)
    const res = await api.get<ConversationMessage[]>(
      `/api/v1/entities/messages?query=${encodeURIComponent(JSON.stringify({ conversation_id: id }))}`
    )
    const loaded: ChatMessage[] = res.data.map((m) => ({
      id: String(m.id),
      role: m.role,
      content: m.content,
      createdAt: new Date(m.created_at),
    }))
    setMessages(loaded)
  }, [])

  const resetConversation = useCallback(() => {
    setMessages([])
    setConversationId(null)
  }, [])

  return { messages, conversationId, isStreaming, sendMessage, loadConversation, resetConversation }
}
