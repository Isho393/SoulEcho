import { Controller, type Control } from 'react-hook-form'
import { motion } from 'motion/react'
import type { PersonalityType } from '../../types/api'

const MBTI_GROUPS = [
  {
    label: 'Analystes',
    color: '#8b5cf6',
    types: [
      { value: 'INTJ' as PersonalityType, label: 'INTJ', desc: 'Architecte', trait: 'Stratège' },
      { value: 'INTP' as PersonalityType, label: 'INTP', desc: 'Logicien',   trait: 'Analytique' },
      { value: 'ENTJ' as PersonalityType, label: 'ENTJ', desc: 'Commandant', trait: 'Leader' },
      { value: 'ENTP' as PersonalityType, label: 'ENTP', desc: 'Innovateur', trait: 'Créatif' },
    ],
  },
  {
    label: 'Diplomates',
    color: '#10b981',
    types: [
      { value: 'INFJ' as PersonalityType, label: 'INFJ', desc: 'Avocat',       trait: 'Idéaliste' },
      { value: 'INFP' as PersonalityType, label: 'INFP', desc: 'Médiateur',    trait: 'Empathique' },
      { value: 'ENFJ' as PersonalityType, label: 'ENFJ', desc: 'Protagoniste', trait: 'Charismatique' },
      { value: 'ENFP' as PersonalityType, label: 'ENFP', desc: 'Militant',     trait: 'Enthousiaste' },
    ],
  },
  {
    label: 'Sentinelles',
    color: '#06b6d4',
    types: [
      { value: 'ISTJ' as PersonalityType, label: 'ISTJ', desc: 'Logisticien', trait: 'Fiable' },
      { value: 'ISFJ' as PersonalityType, label: 'ISFJ', desc: 'Défenseur',   trait: 'Attentionné' },
      { value: 'ESTJ' as PersonalityType, label: 'ESTJ', desc: 'Directeur',   trait: 'Organisé' },
      { value: 'ESFJ' as PersonalityType, label: 'ESFJ', desc: 'Consul',      trait: 'Bienveillant' },
    ],
  },
  {
    label: 'Explorateurs',
    color: '#f59e0b',
    types: [
      { value: 'ISTP' as PersonalityType, label: 'ISTP', desc: 'Virtuose',     trait: 'Pragmatique' },
      { value: 'ISFP' as PersonalityType, label: 'ISFP', desc: 'Aventurier',   trait: 'Sensible' },
      { value: 'ESTP' as PersonalityType, label: 'ESTP', desc: 'Entrepreneur', trait: 'Audacieux' },
      { value: 'ESFP' as PersonalityType, label: 'ESFP', desc: 'Amuseur',      trait: 'Spontané' },
    ],
  },
]

const DISC_TYPES = [
  { value: 'D' as PersonalityType, label: 'D', desc: 'Dominant',       trait: 'Direct & résultats', color: '#ef4444' },
  { value: 'I' as PersonalityType, label: 'I', desc: 'Influent',       trait: 'Enthousiaste',       color: '#f59e0b' },
  { value: 'S' as PersonalityType, label: 'S', desc: 'Stable',         trait: 'Patient & fiable',   color: '#10b981' },
  { value: 'C' as PersonalityType, label: 'C', desc: 'Consciencieux',  trait: 'Précis & analytique', color: '#06b6d4' },
]

interface PersonalitySelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>
  name: string
}

export default function PersonalitySelector({ control, name }: PersonalitySelectorProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex flex-col gap-5">
          {/* MBTI groups */}
          {MBTI_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2.5">
                <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                <p className="text-cream/40 text-xs font-medium uppercase tracking-wider">{group.label}</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {group.types.map((t) => {
                  const isSelected = field.value === t.value
                  return (
                    <motion.button
                      key={t.value}
                      type="button"
                      onClick={() => field.onChange(isSelected ? undefined : t.value)}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ y: -1 }}
                      className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all text-center"
                      style={{
                        background: isSelected ? `${group.color}18` : 'rgba(255,255,255,0.03)',
                        border: isSelected ? `1px solid ${group.color}45` : '1px solid rgba(255,255,255,0.06)',
                        boxShadow: isSelected ? `0 4px 16px ${group.color}20` : 'none',
                      }}
                    >
                      <span className="font-display font-bold text-sm" style={{ color: isSelected ? group.color : 'rgba(245,240,235,0.6)' }}>
                        {t.label}
                      </span>
                      <span className="text-[10px] leading-tight" style={{ color: isSelected ? `${group.color}CC` : 'rgba(245,240,235,0.3)' }}>
                        {t.desc}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* DISC */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-2 h-2 rounded-full bg-violet" />
              <p className="text-cream/40 text-xs font-medium uppercase tracking-wider">DISC</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {DISC_TYPES.map((t) => {
                const isSelected = field.value === t.value
                return (
                  <motion.button
                    key={t.value}
                    type="button"
                    onClick={() => field.onChange(isSelected ? undefined : t.value)}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ y: -1 }}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all text-center"
                    style={{
                      background: isSelected ? `${t.color}18` : 'rgba(255,255,255,0.03)',
                      border: isSelected ? `1px solid ${t.color}45` : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className="font-display font-bold text-lg leading-none" style={{ color: isSelected ? t.color : 'rgba(245,240,235,0.6)' }}>
                      {t.label}
                    </span>
                    <span className="text-[10px] leading-tight" style={{ color: isSelected ? `${t.color}CC` : 'rgba(245,240,235,0.3)' }}>
                      {t.desc}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Selected summary */}
          {field.value && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2.5 rounded-xl text-xs text-cream/60"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
            >
              Type sélectionné : <span className="text-violet-light font-semibold">{field.value}</span>
            </motion.div>
          )}
        </div>
      )}
    />
  )
}
