import { Controller, type Control } from 'react-hook-form'
import type { PersonalityType } from '../../types/api'

const MBTI_TYPES: { value: PersonalityType; label: string; desc: string }[] = [
  { value: 'INTJ', label: 'INTJ', desc: 'Architecte — stratège indépendant' },
  { value: 'INTP', label: 'INTP', desc: 'Logicien — penseur analytique' },
  { value: 'ENTJ', label: 'ENTJ', desc: 'Commandant — leader décisif' },
  { value: 'ENTP', label: 'ENTP', desc: 'Innovateur — débatteur créatif' },
  { value: 'INFJ', label: 'INFJ', desc: 'Avocat — idéaliste perspicace' },
  { value: 'INFP', label: 'INFP', desc: 'Médiateur — rêveur empathique' },
  { value: 'ENFJ', label: 'ENFJ', desc: 'Protagoniste — leader charismatique' },
  { value: 'ENFP', label: 'ENFP', desc: 'Militant — esprit libre enthousiaste' },
  { value: 'ISTJ', label: 'ISTJ', desc: 'Logisticien — fiable et méthodique' },
  { value: 'ISFJ', label: 'ISFJ', desc: 'Défenseur — protecteur attentionné' },
  { value: 'ESTJ', label: 'ESTJ', desc: 'Directeur — organisateur efficace' },
  { value: 'ESFJ', label: 'ESFJ', desc: 'Consul — soutien social bienveillant' },
  { value: 'ISTP', label: 'ISTP', desc: 'Virtuose — artisan pragmatique' },
  { value: 'ISFP', label: 'ISFP', desc: 'Aventurier — artiste sensible' },
  { value: 'ESTP', label: 'ESTP', desc: 'Entrepreneur — dynamique et audacieux' },
  { value: 'ESFP', label: 'ESFP', desc: 'Amuseur — spontané et énergique' },
]

const DISC_TYPES: { value: PersonalityType; label: string; desc: string }[] = [
  { value: 'D', label: 'D — Dominant', desc: 'Direct, orienté résultats' },
  { value: 'I', label: 'I — Influent', desc: 'Enthousiaste, persuasif' },
  { value: 'S', label: 'S — Stable', desc: 'Patient, fiable, coopératif' },
  { value: 'C', label: 'C — Consciencieux', desc: 'Précis, analytique, prudent' },
]

const ALL_TYPES = [...MBTI_TYPES, ...DISC_TYPES]

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
        <div>
          <select
            value={field.value ?? ''}
            onChange={(e) => field.onChange(e.target.value || undefined)}
            className="w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream focus:outline-none focus:border-violet"
          >
            <option value="">Sélectionner un type de personnalité</option>
            <optgroup label="MBTI (16 types)">
              {MBTI_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} — {t.desc}
                </option>
              ))}
            </optgroup>
            <optgroup label="DISC (4 types)">
              {DISC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} — {t.desc}
                </option>
              ))}
            </optgroup>
          </select>
          {field.value && (
            <p className="text-cream/50 text-xs mt-1">
              {ALL_TYPES.find((t) => t.value === field.value)?.desc}
            </p>
          )}
        </div>
      )}
    />
  )
}
