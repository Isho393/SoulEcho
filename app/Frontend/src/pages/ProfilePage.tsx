import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useProfile } from '../hooks/useProfile'
import PersonalitySelector from '../components/profile/PersonalitySelector'
import CommunicationStyleSelector from '../components/profile/CommunicationStyleSelector'
import GoalsTagInput from '../components/profile/GoalsTagInput'
import GdprSection from '../components/profile/GdprSection'

const MBTI_VALUES = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'] as const
const DISC_VALUES = ['D','I','S','C'] as const

const profileSchema = z.object({
  personality_type: z.enum([...MBTI_VALUES, ...DISC_VALUES]).optional(),
  life_context: z.string().max(500, 'Maximum 500 caractères').optional(),
  goals: z.array(z.string()).max(5, 'Maximum 5 objectifs').optional(),
  communication_preference: z.enum(['direct', 'narrative', 'socratic']).optional(),
  language: z.string().min(2).max(5).optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { profile, isLoading, updateProfile, exportData, deleteAccount } = useProfile()

  const { control, register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      personality_type: undefined,
      life_context: '',
      goals: [],
      communication_preference: undefined,
      language: 'fr',
    },
  })

  const lifeContext = watch('life_context') ?? ''

  useEffect(() => {
    if (profile) {
      reset({
        personality_type: profile.personality_type,
        life_context: profile.life_context ?? '',
        goals: profile.goals ?? [],
        communication_preference: profile.communication_preference,
        language: profile.language ?? 'fr',
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
        <div className="animate-pulse text-cream/40">Chargement…</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-cream mb-6">Mon profil</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Personality */}
        <section>
          <label className="block text-cream/70 text-sm font-medium mb-2">Type de personnalité</label>
          <PersonalitySelector control={control} name="personality_type" />
        </section>

        {/* Communication style */}
        <section>
          <label className="block text-cream/70 text-sm font-medium mb-2">Style de communication</label>
          <CommunicationStyleSelector control={control} name="communication_preference" />
        </section>

        {/* Goals */}
        <section>
          <label className="block text-cream/70 text-sm font-medium mb-2">Objectifs (max 5)</label>
          <GoalsTagInput control={control} name="goals" />
          {errors.goals && <p className="text-red-400 text-xs mt-1">{errors.goals.message}</p>}
        </section>

        {/* Life context */}
        <section>
          <div className="flex justify-between items-center mb-2">
            <label className="text-cream/70 text-sm font-medium">Contexte de vie</label>
            <span className={`text-xs ${lifeContext.length > 480 ? 'text-red-400' : 'text-cream/40'}`}>
              {lifeContext.length}/500
            </span>
          </div>
          <textarea
            {...register('life_context')}
            rows={4}
            placeholder="Décrivez votre situation actuelle, vos défis, ce qui vous tient à cœur…"
            className="w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-violet resize-none"
          />
          {errors.life_context && <p className="text-red-400 text-xs mt-1">{errors.life_context.message}</p>}
        </section>

        {/* Language */}
        <section>
          <label className="block text-cream/70 text-sm font-medium mb-2">Langue préférée</label>
          <input
            {...register('language')}
            type="text"
            placeholder="fr"
            className="w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-violet"
          />
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-violet hover:bg-violet-light text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {isSubmitting ? 'Sauvegarde…' : 'Sauvegarder le profil'}
        </button>
      </form>

      {/* RGPD */}
      <div className="mt-8">
        <GdprSection onExport={exportData} onDelete={deleteAccount} />
      </div>
    </div>
  )
}
