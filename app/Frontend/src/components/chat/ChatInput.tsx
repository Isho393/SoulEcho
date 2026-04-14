import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (text: string) => void
  isStreaming: boolean
}

export default function ChatInput({ onSend, isStreaming }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus after streaming ends
  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus()
    }
  }, [isStreaming])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="border-t border-navy-light px-4 py-3 bg-navy">
      <div className="flex gap-2 items-end max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          rows={1}
          placeholder={isStreaming ? 'SoulEcho répond…' : 'Écrivez votre message…'}
          className="flex-1 bg-navy-light border border-navy rounded-xl px-4 py-2.5 text-cream placeholder-cream/30 focus:outline-none focus:border-violet resize-none text-sm disabled:opacity-50 max-h-32 overflow-y-auto"
          style={{ minHeight: '42px' }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isStreaming || !value.trim()}
          className="bg-violet hover:bg-violet-light text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 shrink-0"
          aria-label="Envoyer"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
