import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useProfile } from '../hooks/useProfile'
import GdprSection from '../components/profile/GdprSection'

const profileSchema = z.object({
  life_context: z.string().max(500, 'Maximum 500 caractères').optional(),
  language: z.string().min(2).max(5).optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { profile, isLoading, updateProfile, exportData, deleteAccount } = useProfile()

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { life_context: '', language: 'fr' },
  })

  const lifeContext = watch('life_context') ?? ''

  useEffect(() => {
    if (profile) {
      reset({
        life_context: profile.life_context ?? '',
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
    <div className="h-full overflow-y-auto p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-display font-bold text-cream mb-1">Mon profil</h1>
      <p className="text-cream/40 text-sm mb-8">
        SoulEcho apprend à vous connaître au fil de vos échanges. Vous pouvez partager ici un contexte pour personnaliser votre expérience.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* Contexte de vie */}
        <section className="bg-navy-light rounded-xl p-4 border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <label className="text-cream/80 text-sm font-medium">Contexte de vie (optionnel)</label>
            <span className={`text-xs ${lifeContext.length > 480 ? 'text-red-400' : 'text-cream/30'}`}>
              {lifeContext.length}/500
            </span>
          </div>
          <textarea
            {...register('life_context')}
            rows={4}
            placeholder="Partagez votre situation, vos défis, ce qui vous tient à cœur… SoulEcho s'en souviendra."
            className="w-full bg-navy border border-white/5 rounded-lg px-3 py-2 text-cream placeholder-cream/25 focus:outline-none focus:border-violet/50 resize-none text-sm"
          />
          {errors.life_context && <p className="text-red-400 text-xs mt-1">{errors.life_context.message}</p>}
          <p className="text-cream/30 text-xs mt-2">
            Ces informations restent privées et ne sont utilisées que pour personnaliser vos conversations.
          </p>
        </section>

        {/* Langue */}
        <section className="bg-navy-light rounded-xl p-4 border border-white/5">
          <label className="block text-cream/80 text-sm font-medium mb-2">Langue préférée</label>
          <select
            {...register('language')}
            className="w-full bg-navy border border-white/5 rounded-lg px-3 py-2 text-cream focus:outline-none focus:border-violet/50 text-sm"
          >
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="de">Deutsch</option>
            <option value="pt">Português</option>
            <option value="ar">العربية</option>
          </select>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-violet hover:bg-violet-light text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-60"
        >
          {isSubmitting ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </form>

      <div className="mt-8">
        <GdprSection onExport={exportData} onDelete={deleteAccount} />
      </div>
    </div>
  )
}
