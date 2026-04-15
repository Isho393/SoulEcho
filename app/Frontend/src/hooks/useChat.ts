import { useState, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getToken } from '../lib/auth'
import api from '../lib/api'
import type { ChatMessage, ConversationMessage } from '../types/api'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function makeId() {
  return Math.random().toString(36).slice(2)
}

export function useChat(onAssistantMessage?: (text: string) => void) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const queryClient = useQueryClient()

  // Use ref to avoid stale closure on isStreaming
  const isStreamingRef = useRef(false)
  const conversationIdRef = useRef<number | null>(null)
  const onAssistantMessageRef = useRef(onAssistantMessage)
  onAssistantMessageRef.current = onAssistantMessage

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreamingRef.current) return

    isStreamingRef.current = true
    setIsStreaming(true)

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])

    const assistantId = makeId()
    setMessages((prev) => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      isStreaming: true,
      createdAt: new Date(),
    }])

    try {
      const response = await fetch(`${BASE_URL}/api/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ message: text, conversation_id: conversationIdRef.current }),
      })

      if (!response.ok || !response.body) {
        throw new Error(`Erreur serveur (${response.status})`)
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
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw || raw === '[DONE]') continue

          try {
            const event = JSON.parse(raw)

            if (event.type === 'chunk' && event.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: m.content + event.content } : m
                )
              )
            } else if (event.type === 'done') {
              if (event.conversation_id) {
                conversationIdRef.current = event.conversation_id
                setConversationId(event.conversation_id)
              }
              setMessages((prev) => {
                const updated = prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m)
                const assistantMsg = updated.find((m) => m.id === assistantId)
                if (assistantMsg?.content) onAssistantMessageRef.current?.(assistantMsg.content)
                return updated
              })
              isStreamingRef.current = false
              setIsStreaming(false)
              queryClient.invalidateQueries({ queryKey: ['token-balance'] })
              queryClient.invalidateQueries({ queryKey: ['conversations'] })
            } else if (event.type === 'error') {
              const content = event.code === 402
                ? '⚠️ Solde insuffisant — rechargez vos tokens pour continuer.'
                : event.code === 429
                ? 'Je suis là, mais j\'ai besoin d\'une petite pause. Réessaie dans quelques minutes.'
                : (event.content || 'Une erreur est survenue.')
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, content, isStreaming: false } : m)
              )
              isStreamingRef.current = false
              setIsStreaming(false)
              if (event.code === 402) queryClient.invalidateQueries({ queryKey: ['token-balance'] })
            }
          } catch {
            // ignore JSON parse errors
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur de connexion.'
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: msg, isStreaming: false } : m)
      )
      isStreamingRef.current = false
      setIsStreaming(false)
    }
  }, [queryClient])

  const loadConversation = useCallback(async (id: number) => {
    if (isStreamingRef.current) return
    conversationIdRef.current = id
    setConversationId(id)
    try {
      const res = await api.get(
        `/api/v1/entities/messages?query=${encodeURIComponent(JSON.stringify({ conversation_id: id }))}`
      )
      const data = res.data
      const items: ConversationMessage[] = Array.isArray(data) ? data : (data?.items ?? [])
      const loaded: ChatMessage[] = items
        .sort((a, b) => a.id - b.id) // ASC — plus ancien en premier
        .map((m) => ({
          id: String(m.id),
          role: m.role,
          content: m.content,
          createdAt: new Date(m.created_at),
        }))
      setMessages(loaded)
    } catch {
      setMessages([])
    }
  }, [])

  const resetConversation = useCallback(() => {
    if (isStreamingRef.current) return
    setMessages([])
    conversationIdRef.current = null
    setConversationId(null)
  }, [])

  return { messages, conversationId, isStreaming, sendMessage, loadConversation, resetConversation }
}
