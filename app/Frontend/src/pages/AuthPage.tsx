import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
})

const registerSchema = loginSchema.extend({
  name: z.string().min(1).optional().or(z.literal('')),
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    try {
      await login(data.email, data.password)
      navigate('/chat', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setServerError(e?.response?.data?.detail || 'Email ou mot de passe incorrect.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="block text-cream/70 text-sm mb-1">Email</label>
        <input
          type="email"
          {...register('email')}
          className="w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-violet"
          placeholder="vous@exemple.com"
          autoComplete="email"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-cream/70 text-sm mb-1">Mot de passe</label>
        <input
          type="password"
          {...register('password')}
          className="w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-violet"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {serverError && <p className="text-red-400 text-sm">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-violet hover:bg-violet-light text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {isSubmitting ? 'Connexion…' : 'Se connecter'}
      </button>

      <p className="text-center text-cream/50 text-sm">
        Pas encore de compte ?{' '}
        <button type="button" onClick={onSwitch} className="text-violet hover:underline">
          S'inscrire
        </button>
      </p>
    </form>
  )
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null)
    try {
      await registerUser(data.email, data.password, data.name || undefined)
      navigate('/chat', { replace: true })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } }
      setServerError(e?.response?.data?.detail || 'Erreur lors de l\'inscription.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="block text-cream/70 text-sm mb-1">Nom (optionnel)</label>
        <input
          type="text"
          {...register('name')}
          className="w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-violet"
          placeholder="Votre prénom"
          autoComplete="name"
        />
        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-cream/70 text-sm mb-1">Email</label>
        <input
          type="email"
          {...register('email')}
          className="w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-violet"
          placeholder="vous@exemple.com"
          autoComplete="email"
        />
        {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-cream/70 text-sm mb-1">Mot de passe</label>
        <input
          type="password"
          {...register('password')}
          className="w-full bg-navy border border-navy-light rounded-lg px-3 py-2 text-cream placeholder-cream/30 focus:outline-none focus:border-violet"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
      </div>

      {serverError && <p className="text-red-400 text-sm">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-violet hover:bg-violet-light text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-60"
      >
        {isSubmitting ? 'Inscription…' : 'Créer un compte'}
      </button>

      <p className="text-center text-cream/50 text-sm">
        Déjà un compte ?{' '}
        <button type="button" onClick={onSwitch} className="text-violet hover:underline">
          Se connecter
        </button>
      </p>
    </form>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4 font-sans">
      <div className="w-full max-w-md bg-navy-light rounded-2xl p-8 shadow-xl">
        <h1 className="text-3xl font-display font-bold text-cream mb-2 text-center">SoulEcho</h1>
        <p className="text-cream/50 text-sm text-center mb-8">Votre compagnon émotionnel IA</p>

        <div className="flex rounded-lg bg-navy p-1 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-violet text-white' : 'text-cream/50 hover:text-cream'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-violet text-white' : 'text-cream/50 hover:text-cream'
            }`}
          >
            Inscription
          </button>
        </div>

        {mode === 'login' ? (
          <LoginForm onSwitch={() => setMode('register')} />
        ) : (
          <RegisterForm onSwitch={() => setMode('login')} />
        )}
      </div>
    </div>
  )
}
