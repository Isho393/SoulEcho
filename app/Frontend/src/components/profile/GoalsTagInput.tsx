import { useState } from 'react'
import { Controller, type Control } from 'react-hook-form'
import { X, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

const MAX_GOALS = 5

const SUGGESTIONS = [
  'Gérer mon stress', 'Mieux dormir', 'Améliorer ma confiance',
  'Trouver ma voie', 'Équilibre vie pro/perso', 'Surmonter une rupture',
  'Développer ma créativité', 'Prendre soin de moi',
]

interface GoalsTagInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  name: string
}

export default function GoalsTagInput({ control, name }: GoalsTagInputProps) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const tags: string[] = field.value ?? []

        const addTag = (value: string) => {
          const trimmed = value.trim()
          if (!trimmed || tags.length >= MAX_GOALS || tags.includes(trimmed)) return
          field.onChange([...tags, trimmed])
          setInput('')
        }

        const removeTag = (index: number) => {
          field.onChange(tags.filter((_, i) => i !== index))
        }

        const availableSuggestions = SUGGESTIONS.filter((s) => !tags.includes(s))

        return (
          <div className="flex flex-col gap-3">
            {/* Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addTag(input) }
                    if (e.key === 'Backspace' && !input && tags.length > 0) {
                      removeTag(tags.length - 1)
                    }
                  }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setTimeout(() => setFocused(false), 150)}
                  placeholder={tags.length >= MAX_GOALS ? `Limite de ${MAX_GOALS} atteinte` : 'Ajouter un objectif…'}
                  disabled={tags.length >= MAX_GOALS}
                  className="w-full rounded-xl px-4 py-3 text-cream placeholder-cream/20 text-sm focus:outline-none transition-all input-glow disabled:opacity-50"
                  style={{
                    background: 'rgba(8,17,26,0.5)',
                    border: focused ? '1px solid rgba(124,58,237,0.45)' : '1px solid rgba(255,255,255,0.07)',
                  }}
                />
              </div>
              <motion.button
                type="button"
                onClick={() => addTag(input)}
                disabled={tags.length >= MAX_GOALS || !input.trim()}
                whileTap={{ scale: 0.93 }}
                className="px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-1.5"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #9D5CF6)', color: 'white' }}
              >
                <Plus size={15} />
                Ajouter
              </motion.button>
            </div>

            {/* Current tags */}
            <AnimatePresence>
              {tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex flex-wrap gap-2"
                >
                  {tags.map((tag, i) => (
                    <motion.span
                      key={tag}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium"
                      style={{
                        background: 'rgba(124,58,237,0.18)',
                        border: '1px solid rgba(124,58,237,0.35)',
                        color: '#c4b5fd',
                      }}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(i)}
                        className="hover:text-white transition-colors rounded-full"
                        aria-label={`Supprimer ${tag}`}
                      >
                        <X size={12} />
                      </button>
                    </motion.span>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Suggestions */}
            {tags.length < MAX_GOALS && availableSuggestions.length > 0 && (
              <div>
                <p className="text-cream/25 text-[10px] uppercase tracking-wider mb-2">Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {availableSuggestions.slice(0, 6).map((s) => (
                    <motion.button
                      key={s}
                      type="button"
                      onClick={() => addTag(s)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="text-xs px-3 py-1.5 rounded-full transition-all text-cream/45 hover:text-cream/75"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.07)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'
                        e.currentTarget.style.background = 'rgba(124,58,237,0.08)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                      }}
                    >
                      + {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Counter */}
            <p className="text-cream/20 text-xs">{tags.length}/{MAX_GOALS} objectifs</p>
          </div>
        )
      }}
    />
  )
}
