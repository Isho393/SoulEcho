import StreamingCursor from './StreamingCursor'
import type { ChatMessage } from '../../types/api'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

export default function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? 'bg-violet text-white rounded-br-sm'
              : 'bg-navy-light text-cream rounded-bl-sm'
          }`}
        >
          {message.content}
          {!isUser && <StreamingCursor isStreaming={isStreaming && !!message.isStreaming} />}
        </div>
        {!isUser && (
          <p className="text-cream/25 text-xs mt-1 px-1">Contenu généré par IA</p>
        )}
      </div>
    </div>
  )
}
