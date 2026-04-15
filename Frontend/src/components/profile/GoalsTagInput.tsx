import { useState } from 'react'
import { Controller, type Control } from 'react-hook-form'
import { X } from 'lucide-react'

const MAX_GOALS = 5

interface GoalsTagInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  name: string
}

export default function GoalsTagInput({ control, name }: GoalsTagInputProps) {
  const [input, setInput] = useState('')

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const tags: string[] = field.value ?? []

        const addTag = () => {
          const trimmed = input.trim()
          if (!trimmed || tags.length >= MAX_GOALS) return
          field.onChange([...tags, trimmed])
          setInput('')
        }

        const removeTag = (index: number) => {
          field.onChange(tags.filter((_, i) => i !== index))
        }

        return (
          <div>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Ajouter un objectif…"
                disabled={tags.length >= MAX_GOALS}
                className="flex-1 bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-violet disabled:opacity-50"
              />
              <button
                type="button"
                onClick={addTag}
                disabled={tags.length >= MAX_GOALS || !input.trim()}
                className="bg-violet hover:bg-violet-light text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ajouter
              </button>
            </div>

            {tags.length >= MAX_GOALS && (
              <p className="text-cream/40 text-xs mb-2">Limite de {MAX_GOALS} objectifs atteinte.</p>
            )}

            <div className="flex flex-wrap gap-2">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 bg-violet/20 text-violet-light text-sm px-3 py-1 rounded-full"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(i)}
                    className="hover:text-white transition-colors"
                    aria-label={`Supprimer ${tag}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )
      }}
    />
  )
}
