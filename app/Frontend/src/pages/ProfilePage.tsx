import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { Globe, FileText, Save, Brain, MessageSquare, Target } from 'lucide-react'
import { useProfile } from '../hooks/useProfile'
import GdprSection from '../components/profile/GdprSection'
import PersonalitySelector from '../components/profile/PersonalitySelector'
import CommunicationStyleSelector from '../components/profile/CommunicationStyleSelector'
import GoalsTagInput from '../components/profile/GoalsTagInput'

const profileSchema = z.object({
  life_context: z.string().max(500, 'Maximum 500 caractères').optional(),
  language: z.string().min(2).max(5).optional(),
  personality_type: z.string().optional(),
  communication_preference: z.enum(['direct', 'narrative', 'socratic']).optional(),
  goals: z.array(z.string()).optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

const LANGUAGES = [
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'en', label: '🇬🇧 English' },
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'pt', label: '🇵🇹 Português' },
  { value: 'ar', label: '🇸🇦 العربية' },
]

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
  delay = 0,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5"
      style={{
        background: 'linear-gradient(145deg, rgba(26,45,66,0.6) 0%, rgba(13,27,42,0.8) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-xl bg-violet/15 flex items-center justify-center shrink-0">
          <Icon size={15} className="text-violet-light" />
        </div>
        <div>
          <p className="text-cream/85 text-sm font-medium">{title}</p>
          <p className="text-cream/35 text-xs">{subtitle}</p>
        </div>
      </div>
      {children}
    </motion.section>
  )
}

export default function ProfilePage() {
  const { profile, isLoading, updateProfile, exportData, deleteAccount } = useProfile()

  const { register, handleSubmit, watch, reset, control, formState: { errors, isSubmitting, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      life_context: '',
      language: 'fr',
      personality_type: undefined,
      communication_preference: undefined,
      goals: [],
    },
  })

  const lifeContext = watch('life_context') ?? ''

  useEffect(() => {
    if (profile) {
      reset({
        life_context: profile.life_context ?? '',
        language: profile.language ?? 'fr',
        personality_type: profile.personality_type ?? undefined,
        communication_preference: profile.communication_preference ?? undefined,
        goals: profile.goals ?? [],
      })
    }
  }, [profile, reset])

  const onSubmit = async (data: ProfileForm) => {
    try {
      await updateProfile(data)
      toast.success('Profil sauvegardé')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet/30 border-t-violet rounded-full animate-spin" />
          <p className="text-cream/30 text-sm">Chargement…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto px-5 py-7 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <p className="text-cream/35 text-xs font-medium uppercase tracking-widest mb-1">Paramètres</p>
        <h1 className="text-cream font-display text-3xl font-semibold mb-2">Mon profil</h1>
        <p className="text-cream/40 text-sm mb-8 leading-relaxed">
          Plus SoulEcho vous connaît, plus ses réponses sont pertinentes et personnalisées.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Contexte de vie */}
        <Section icon={FileText} title="Contexte de vie" subtitle="Optionnel · Reste privé" delay={0.05}>
          <div className="flex justify-end mb-2">
            <span className={`text-xs ${lifeContext.length > 480 ? 'text-rose-400' : 'text-cream/25'}`}>
              {lifeContext.length}/500
            </span>
          </div>
          <textarea
            {...register('life_context')}
            rows={4}
            placeholder="Partagez votre situation, vos défis, ce qui vous tient à cœur… SoulEcho s'en souviendra."
            className="w-full rounded-xl px-4 py-3 text-cream placeholder-cream/20 focus:outline-none resize-none text-sm transition-all input-glow"
            style={{ background: 'rgba(8,17,26,0.5)', border: '1px solid rgba(255,255,255,0.07)' }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
          />
          {errors.life_context && <p className="text-rose-400 text-xs mt-2">{errors.life_context.message}</p>}
          <p className="text-cream/25 text-xs mt-2.5">Ces informations ne sont utilisées que pour personnaliser vos conversations.</p>
        </Section>

        {/* Personnalité */}
        <Section icon={Brain} title="Type de personnalité" subtitle="MBTI ou DISC · Optionnel" delay={0.1}>
          <PersonalitySelector control={control} name="personality_type" />
        </Section>

        {/* Style de communication */}
        <Section icon={MessageSquare} title="Style de communication" subtitle="Comment SoulEcho vous répond" delay={0.15}>
          <CommunicationStyleSelector control={control} name="communication_preference" />
        </Section>

        {/* Objectifs */}
        <Section icon={Target} title="Mes objectifs" subtitle={`Jusqu'à 5 objectifs`} delay={0.2}>
          <GoalsTagInput control={control} name="goals" />
        </Section>

        {/* Langue */}
        <Section icon={Globe} title="Langue préférée" subtitle="Langue des réponses de SoulEcho" delay={0.25}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {LANGUAGES.map(({ value, label }) => {
              const current = watch('language')
              return (
                <label key={value}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm ${
                    current === value ? 'text-cream' : 'text-cream/50 hover:text-cream/75 hover:bg-white/4'
                  }`}
                  style={{
                    border: current === value ? '1px solid rgba(124,58,237,0.4)' : '1px solid rgba(255,255,255,0.06)',
                    background: current === value ? 'rgba(124,58,237,0.12)' : 'transparent',
                  }}
                >
                  <input type="radio" {...register('language')} value={value} className="sr-only" />
                  {label}
                </label>
              )
            })}
          </div>
        </Section>

        {/* Save button */}
        <motion.button
          type="submit"
          disabled={isSubmitting || !isDirty}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all disabled:opacity-50 btn-glow shadow-lg shadow-violet/20"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #9D5CF6)', color: 'white' }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sauvegarde…
            </span>
          ) : (
            <span className="flex items-center gap-2"><Save size={15} /> Sauvegarder le profil</span>
          )}
        </motion.button>
      </form>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="mt-8"
      >
        <GdprSection onExport={exportData} onDelete={deleteAccount} />
      </motion.div>
    </div>
  )
}
