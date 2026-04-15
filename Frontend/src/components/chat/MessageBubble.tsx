import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import StreamingCursor from './StreamingCursor'
import type { ChatMessage } from '../../types/api'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

function renderContent(text: string) {
  return text.split('\n').map((line, i) => (
    <span key={i}>{i > 0 && <br />}{line}</span>
  ))
}

export default function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isCurrentlyStreaming = isStreaming && !!message.isStreaming
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isCurrentlyStreaming) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [message.content, isCurrentlyStreaming])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex items-end gap-2.5 mb-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser ? (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet to-violet-light flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-md shadow-violet/30 mb-0.5">
          S
        </div>
      ) : (
        <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-cream/50 text-[10px] font-semibold shrink-0 mb-0.5">
          ✦
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className={`relative px-4 py-3 rounded-2xl text-sm leading-[1.65] ${
          isUser
            ? 'bg-gradient-to-br from-violet to-violet-light text-white rounded-br-sm shadow-lg shadow-violet/20'
            : 'text-cream/90 rounded-bl-sm border border-white/6'
        }`}
          style={!isUser ? {
            background: 'linear-gradient(135deg, rgba(26,45,66,0.95) 0%, rgba(13,27,42,0.98) 100%)',
          } : undefined}
        >
          {renderContent(message.content)}
          {!isUser && <StreamingCursor isStreaming={isCurrentlyStreaming} />}
        </div>

        {/* Timestamp / status */}
        <p className="text-cream/20 text-[10px] px-1">
          {isCurrentlyStreaming
            ? <span className="text-violet/60 animate-pulse">SoulEcho écrit…</span>
            : isUser
              ? new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : 'SoulEcho'}
        </p>
      </div>
    </motion.div>
  )
}
