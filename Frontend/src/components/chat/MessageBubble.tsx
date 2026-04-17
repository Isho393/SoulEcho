import { useRef, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Copy, Check } from 'lucide-react'
import StreamingCursor from './StreamingCursor'
import type { ChatMessage } from '../../types/api'

interface MessageBubbleProps {
  message: ChatMessage
  isStreaming?: boolean
}

// Minimal markdown-like renderer: bold, italic, code, line breaks
function renderContent(text: string) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Code block line
    if (line.startsWith('```') || line.endsWith('```')) {
      return <span key={i}>{i > 0 && <br />}<code className="font-mono text-violet-light/90 bg-navy-deep/60 px-1 rounded text-[0.82em]">{line.replace(/```/g, '')}</code></span>
    }
    // Inline formatting
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j} className="font-semibold text-cream">{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={j} className="font-mono text-violet-light/90 bg-navy-deep/60 px-1 rounded text-[0.82em]">{part.slice(1, -1)}</code>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={j} className="italic text-cream/80">{part.slice(1, -1)}</em>
      }
      return <span key={j}>{part}</span>
    })
    return <span key={i}>{i > 0 && <br />}{rendered}</span>
  })
}

export default function MessageBubble({ message, isStreaming = false }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isCurrentlyStreaming = isStreaming && !!message.isStreaming
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isCurrentlyStreaming) {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [message.content, isCurrentlyStreaming])

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-end gap-2.5 mb-5 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      {!isUser ? (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet to-violet-light flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-lg shadow-violet/30 mb-0.5 ring-2 ring-violet/20">
          S
        </div>
      ) : (
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-cream/60 text-[11px] font-semibold shrink-0 mb-0.5 ring-1 ring-white/10"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          ✦
        </div>
      )}

      <div className={`flex flex-col gap-1.5 max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div className={`relative px-4 py-3 rounded-2xl text-sm leading-[1.7] ${
          isUser
            ? 'bg-gradient-to-br from-violet to-violet-light text-white rounded-br-sm shadow-lg shadow-violet/25'
            : 'text-cream/88 rounded-bl-sm'
        }`}
          style={!isUser ? {
            background: 'linear-gradient(145deg, rgba(26,45,66,0.9) 0%, rgba(13,27,42,0.95) 100%)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          } : undefined}
        >
          {renderContent(message.content)}
          {!isUser && <StreamingCursor isStreaming={isCurrentlyStreaming} />}

          {/* Copy button for assistant messages */}
          {!isUser && !isCurrentlyStreaming && message.content && (
            <button
              onClick={handleCopy}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all w-6 h-6 rounded-full flex items-center justify-center text-cream/50 hover:text-cream shadow-md"
              style={{ background: 'rgba(26,45,66,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
              aria-label="Copier le message"
            >
              {copied ? <Check size={11} className="text-emerald" /> : <Copy size={11} />}
            </button>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-cream/20 text-[10px] px-1 select-none">
          {isCurrentlyStreaming ? (
            <span className="flex items-center gap-1.5">
              <span className="flex gap-1">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
              <span className="text-violet/50">SoulEcho écrit…</span>
            </span>
          ) : isUser
            ? new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            : new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          }
        </p>
      </div>
    </motion.div>
  )
}
