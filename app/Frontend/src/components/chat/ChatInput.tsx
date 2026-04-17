import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { ArrowUp, Mic, MicOff, Phone } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useVoice } from '../../hooks/useVoice'

interface ChatInputProps {
  onSend: (text: string) => void
  isStreaming: boolean
  onVoiceCall?: () => void
  tokenBalance?: number | null
}

export default function ChatInput({ onSend, isStreaming, onVoiceCall, tokenBalance }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { isListening, isSupported, toggle } = useVoice({
    onResult: (transcript) => {
      setValue((prev) => (prev ? `${prev} ${transcript}` : transcript))
      textareaRef.current?.focus()
    },
  })

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus()
  }, [isStreaming])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }, [value])

  // Handle suggestion events
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<string>).detail
      if (text) {
        setValue(text)
        textareaRef.current?.focus()
      }
    }
    window.addEventListener('soulecho:suggest', handler)
    return () => window.removeEventListener('soulecho:suggest', handler)
  }, [])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = value.trim().length > 0 && !isStreaming
  const isLowBalance = tokenBalance !== null && tokenBalance !== undefined && tokenBalance < 20

  return (
    <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,17,26,0.7)', backdropFilter: 'blur(20px)' }}>
      {/* Low balance warning */}
      <AnimatePresence>
        {isLowBalance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 px-3 py-2 rounded-xl text-xs text-amber-400/80 flex items-center gap-2"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
          >
            <span>⚠️</span>
            <span>Solde faible ({tokenBalance} tokens) — <a href="/tokens" className="underline hover:text-amber-300">Recharger</a></span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2 items-end max-w-3xl mx-auto">
        {/* Mic button */}
        {isSupported && (
          <motion.button
            type="button"
            onClick={toggle}
            disabled={isStreaming}
            whileTap={{ scale: 0.9 }}
            className={`p-3 rounded-2xl transition-all shrink-0 ${
              isListening
                ? 'text-rose-400 ring-1 ring-rose-400/40'
                : 'text-cream/35 hover:text-cream/65'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            style={isListening
              ? { background: 'rgba(244,63,94,0.12)' }
              : { background: 'rgba(255,255,255,0.04)' }
            }
            aria-label={isListening ? "Arrêter l'écoute" : 'Dicter un message'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </motion.button>
        )}

        {/* Textarea container */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
            placeholder={isListening ? '🎙 En écoute…' : isStreaming ? '' : 'Écrivez votre message…'}
            className="w-full rounded-2xl px-4 py-3 pr-4 text-cream placeholder-cream/22 focus:outline-none resize-none text-sm disabled:opacity-60 transition-all input-glow"
            style={{
              minHeight: '48px',
              maxHeight: '140px',
              background: 'rgba(26,45,66,0.6)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'rgba(124,58,237,0.45)'
              e.currentTarget.style.background = 'rgba(26,45,66,0.8)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.background = 'rgba(26,45,66,0.6)'
            }}
          />

          {/* Streaming indicator */}
          {isStreaming && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1.5 items-center">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          )}
        </div>

        {/* Send button */}
        <motion.button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          whileTap={{ scale: canSend ? 0.9 : 1 }}
          whileHover={{ scale: canSend ? 1.05 : 1 }}
          className={`p-3 rounded-2xl transition-all shrink-0 ${
            canSend
              ? 'bg-gradient-to-br from-violet to-violet-light text-white shadow-lg shadow-violet/30 btn-glow'
              : 'text-cream/20 cursor-not-allowed'
          }`}
          style={!canSend ? { background: 'rgba(255,255,255,0.04)' } : {}}
          aria-label="Envoyer"
        >
          <ArrowUp size={18} />
        </motion.button>

        {/* Voice call button */}
        {onVoiceCall && (
          <motion.button
            type="button"
            onClick={onVoiceCall}
            disabled={isStreaming}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            className="p-3 rounded-2xl text-cream/35 hover:text-violet hover:bg-violet/10 transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'rgba(255,255,255,0.04)' }}
            aria-label="Lancer un appel vocal"
          >
            <Phone size={18} />
          </motion.button>
        )}
      </div>

      <p className="text-cream/12 text-[11px] text-center mt-2.5 select-none">
        Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
      </p>
    </div>
  )
}
