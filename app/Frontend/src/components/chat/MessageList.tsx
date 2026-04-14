import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import type { ChatMessage } from '../../types/api'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
}

export default function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-3xl mb-3">✨</p>
        <h2 className="text-cream font-display text-xl font-semibold mb-2">Bienvenue sur SoulEcho</h2>
        <p className="text-cream/40 text-sm max-w-xs">
          Je suis votre compagnon émotionnel IA. Partagez ce que vous ressentez, je suis là pour vous écouter.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isStreaming={isStreaming}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
