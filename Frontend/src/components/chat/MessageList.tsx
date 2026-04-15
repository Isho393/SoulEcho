import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import MessageBubble from './MessageBubble'
import type { ChatMessage } from '../../types/api'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
}

const SUGGESTIONS = [
  { emoji: '💭', text: 'Comment tu vas vraiment ?' },
  { emoji: '🌊', text: "J'ai besoin de parler de quelque chose…" },
  { emoji: '🌫️', text: 'Je me sens perdu(e) en ce moment' },
  { emoji: '🔋', text: 'Je suis épuisé(e), je veux décompresser' },
]

export default function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef(0)

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLengthRef.current = messages.length
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center select-none">
        {/* Logo animé */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative mb-7"
        >
          <div className="w-20 h-20 rounded-[22px] bg-gradient-to-br from-violet to-violet-light flex items-center justify-center shadow-2xl shadow-violet/40">
            <span className="text-white font-display text-4xl font-bold leading-none">S</span>
          </div>
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.15, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-[30px] bg-violet/20 -z-10"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 className="text-cream font-display text-2xl font-semibold mb-1.5">Bonjour</h2>
          <p className="text-cream/40 text-sm max-w-[260px] leading-relaxed mb-8">
            Je suis là pour vous écouter, sans jugement et sans agenda.
          </p>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-col gap-2.5 w-full max-w-[320px]"
        >
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s.text}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              onClick={() => window.dispatchEvent(new CustomEvent('soulecho:suggest', { detail: s.text }))}
              className="flex items-center gap-3 text-left px-4 py-3 rounded-2xl border border-white/6 text-cream/55 text-sm hover:text-cream/85 hover:border-violet/25 hover:bg-violet/5 transition-all group"
              style={{ background: 'rgba(26,45,66,0.4)' }}
            >
              <span className="text-base shrink-0 group-hover:scale-110 transition-transform">{s.emoji}</span>
              {s.text}
            </motion.button>
          ))}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-6 pb-2">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} isStreaming={isStreaming} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
