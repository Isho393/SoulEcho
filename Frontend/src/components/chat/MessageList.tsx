import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import MessageBubble from './MessageBubble'
import type { ChatMessage } from '../../types/api'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming: boolean
  onSuggest?: (text: string) => void
}

const SUGGESTIONS = [
  { emoji: '💭', text: 'Comment tu vas vraiment ?' },
  { emoji: '🌊', text: "J'ai besoin de parler de quelque chose…" },
  { emoji: '🌫️', text: 'Je me sens perdu(e) en ce moment' },
  { emoji: '🔋', text: 'Je suis épuisé(e), je veux décompresser' },
]

export default function MessageList({ messages, isStreaming, onSuggest }: MessageListProps) {
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
        {/* Orb animé */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-8"
        >
          {/* Outer glow rings */}
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-[28px]"
              animate={{ scale: [1, 1.15 + i * 0.1], opacity: [0.2, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
              style={{ background: 'rgba(124,58,237,0.15)', margin: `-${i * 8}px` }}
            />
          ))}
          <div className="relative w-20 h-20 rounded-[22px] bg-gradient-to-br from-violet to-violet-light flex items-center justify-center shadow-2xl shadow-violet/40">
            <span className="text-white font-display text-4xl font-bold leading-none">S</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mb-8"
        >
          <h2 className="text-cream font-display text-2xl font-semibold mb-2">Bonjour, je suis là</h2>
          <p className="text-cream/40 text-sm max-w-[280px] leading-relaxed">
            Parlez-moi de ce qui vous pèse, de vos joies, ou de ce que vous avez en tête.
          </p>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col gap-2 w-full max-w-[340px]"
        >
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={s.text}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              onClick={() => {
                if (onSuggest) {
                  onSuggest(s.text)
                } else {
                  window.dispatchEvent(new CustomEvent('soulecho:suggest', { detail: s.text }))
                }
              }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl text-cream/50 text-sm hover:text-cream/85 transition-all group"
              style={{
                background: 'rgba(26,45,66,0.45)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.08)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'
                ;(e.currentTarget as HTMLElement).style.background = 'rgba(26,45,66,0.45)'
              }}
            >
              <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">{s.emoji}</span>
              <span className="flex-1">{s.text}</span>
              <span className="text-cream/20 group-hover:text-violet/60 transition-colors text-xs">→</span>
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
