import { Controller, type Control } from 'react-hook-form'
import { motion } from 'motion/react'
import type { CommunicationPreference } from '../../types/api'

const STYLES: {
  value: CommunicationPreference
  label: string
  icon: string
  desc: string
  impact: string
  color: string
}[] = [
  {
    value: 'direct',
    label: 'Direct',
    icon: '⚡',
    desc: 'Concis et factuel',
    impact: "Droit au but, sans détours.",
    color: '#06b6d4',
  },
  {
    value: 'narrative',
    label: 'Narratif',
    icon: '📖',
    desc: 'Histoires & analogies',
    impact: "Récits et exemples vivants.",
    color: '#f59e0b',
  },
  {
    value: 'socratic',
    label: 'Socratique',
    icon: '🔍',
    desc: 'Questions ouvertes',
    impact: "Vous guidera vers vos propres réponses.",
    color: '#10b981',
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
              <motion.button
                key={style.value}
                type="button"
                onClick={() => field.onChange(style.value)}
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="relative text-left p-4 rounded-2xl transition-all overflow-hidden"
                style={{
                  background: isSelected ? `${style.color}12` : 'rgba(255,255,255,0.03)',
                  border: isSelected ? `1px solid ${style.color}40` : '1px solid rgba(255,255,255,0.07)',
                  boxShadow: isSelected ? `0 4px 20px ${style.color}18` : 'none',
                }}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="comm-indicator"
                    className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: style.color }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  >
                    <span className="text-white text-[10px]">✓</span>
                  </motion.div>
                )}

                <span className="text-2xl mb-3 block">{style.icon}</span>
                <p className="font-semibold text-sm mb-1" style={{ color: isSelected ? style.color : 'rgba(245,240,235,0.75)' }}>
                  {style.label}
                </p>
                <p className="text-xs mb-2" style={{ color: 'rgba(245,240,235,0.45)' }}>{style.desc}</p>
                <p className="text-xs italic" style={{ color: isSelected ? `${style.color}BB` : 'rgba(245,240,235,0.25)' }}>
                  {style.impact}
                </p>
              </motion.button>
            )
          })}
        </div>
      )}
    />
  )
}
