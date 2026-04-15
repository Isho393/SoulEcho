import { Controller, type Control } from 'react-hook-form'
import type { CommunicationPreference } from '../../types/api'

const STYLES: { value: CommunicationPreference; label: string; desc: string; impact: string }[] = [
  {
    value: 'direct',
    label: 'Direct',
    desc: 'Réponses concises et factuelles',
    impact: "L'IA ira droit au but, sans détours ni métaphores.",
  },
  {
    value: 'narrative',
    label: 'Narratif',
    desc: 'Réponses riches en histoires et analogies',
    impact: "L'IA utilisera des récits et des exemples pour illustrer ses réponses.",
  },
  {
    value: 'socratic',
    label: 'Socratique',
    desc: 'Dialogue par questions ouvertes',
    impact: "L'IA vous guidera par des questions pour vous aider à trouver vos propres réponses.",
  },
]

interface CommunicationStyleSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  name: string
}

export default function CommunicationStyleSelector({ control, name }: CommunicationStyleSelectorProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STYLES.map((style) => {
            const isSelected = field.value === style.value
            return (
              <button
                key={style.value}
                type="button"
                onClick={() => field.onChange(style.value)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-violet bg-violet/10 text-cream'
                    : 'border-navy-light bg-navy hover:border-violet/50 text-cream/70'
                }`}
              >
                <p className="font-medium text-sm mb-1">{style.label}</p>
                <p className="text-xs text-cream/60 mb-2">{style.desc}</p>
                <p className="text-xs text-violet/80 italic">{style.impact}</p>
              </button>
            )
          })}
        </div>
      )}
    />
  )
}
