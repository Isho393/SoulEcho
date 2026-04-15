import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { ArrowUp, Mic, MicOff, Phone } from 'lucide-react'
import { motion } from 'motion/react'
import { useVoice } from '../../hooks/useVoice'

interface ChatInputProps {
  onSend: (text: string) => void
  isStreaming: boolean
  onVoiceCall?: () => void
}

export default function ChatInput({ onSend, isStreaming, onVoiceCall }: ChatInputProps) {
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
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`
  }, [value])

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

  return (
    <div className="border-t border-white/5 px-4 py-3 bg-navy/80 backdrop-blur-sm">
      <div className="flex gap-2 items-end max-w-3xl mx-auto">
        {isSupported && (
          <motion.button
            type="button"
            onClick={toggle}
            disabled={isStreaming}
            whileTap={{ scale: 0.92 }}
            className={`p-3 rounded-2xl transition-colors shrink-0 ${
              isListening
                ? 'bg-red-500/20 text-red-400 ring-1 ring-red-400/40'
                : 'bg-navy-light text-cream/40 hover:text-cream/70 hover:bg-navy-light'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            aria-label={isListening ? 'Arrêter l\'écoute' : 'Dicter un message'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </motion.button>
        )}

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            rows={1}
            placeholder={isListening ? '🎙 En écoute…' : isStreaming ? '' : 'Écrivez votre message…'}
            className="w-full bg-navy-light border border-white/8 rounded-2xl px-4 py-3 pr-12 text-cream placeholder-cream/25 focus:outline-none focus:border-violet/50 focus:ring-1 focus:ring-violet/20 resize-none text-sm disabled:opacity-60 transition-all"
            style={{ minHeight: '46px', maxHeight: '128px' }}
          />
          {isStreaming && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-violet/60 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          )}
        </div>

        <motion.button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          whileTap={{ scale: canSend ? 0.92 : 1 }}
          whileHover={{ scale: canSend ? 1.05 : 1 }}
          className={`p-3 rounded-2xl transition-colors shrink-0 ${
            canSend
              ? 'bg-violet text-white shadow-lg shadow-violet/30'
              : 'bg-navy-light text-cream/20 cursor-not-allowed'
          }`}
          aria-label="Envoyer"
        >
          <ArrowUp size={18} />
        </motion.button>

        {onVoiceCall && (
          <motion.button
            type="button"
            onClick={onVoiceCall}
            disabled={isStreaming}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05 }}
            className="p-3 rounded-2xl bg-navy-light text-cream/40 hover:text-violet hover:bg-violet/10 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Lancer un appel vocal"
          >
            <Phone size={18} />
          </motion.button>
        )}
      </div>
      <p className="text-cream/15 text-xs text-center mt-2">Entrée pour envoyer · Maj+Entrée pour nouvelle ligne</p>
    </div>
  )
}
