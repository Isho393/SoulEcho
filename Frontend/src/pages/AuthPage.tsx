import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Eye, EyeOff, Sparkles, ArrowRight, Mail, Lock, User } from 'lucide-react'
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

function InputField({
  label, icon: Icon, type = 'text', placeholder, error, registration, autoComplete,
}: {
  label: string
  icon: React.ElementType
  type?: string
  placeholder: string
  error?: string
  registration: object
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-cream/60 text-xs font-medium uppercase tracking-wider">{label}</label>
      <div className="relative group">
        <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/25 group-focus-within:text-violet/70 transition-colors pointer-events-none" />
        <input
          type={inputType}
          {...registration}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full bg-navy-deep/60 border border-white/8 rounded-xl pl-10 pr-10 py-3 text-cream placeholder-cream/20 focus:outline-none focus:border-violet/50 focus:bg-navy-deep/80 transition-all text-sm input-glow"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/25 hover:text-cream/60 transition-colors"
            tabIndex={-1}
          >
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-rose-400 text-xs">
          {error}
        </motion.p>
      )}
    </div>
  )
}

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
      <InputField label="Email" icon={Mail} type="email" placeholder="vous@exemple.com"
        error={errors.email?.message} registration={register('email')} autoComplete="email" />
      <InputField label="Mot de passe" icon={Lock} type="password" placeholder="••••••••"
        error={errors.password?.message} registration={register('password')} autoComplete="current-password" />

      <AnimatePresence>
        {serverError && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
            <span className="text-rose-400 text-sm">{serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileTap={{ scale: 0.98 }}
        className="relative mt-1 bg-gradient-to-r from-violet to-violet-light text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 btn-glow flex items-center justify-center gap-2 shadow-lg shadow-violet/25"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Connexion…
          </span>
        ) : (
          <span className="flex items-center gap-2">Se connecter <ArrowRight size={16} /></span>
        )}
      </motion.button>

      <p className="text-center text-cream/40 text-sm">
        Pas encore de compte ?{' '}
        <button type="button" onClick={onSwitch} className="text-violet-light hover:text-violet font-medium transition-colors">
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
      setServerError(e?.response?.data?.detail || "Erreur lors de l'inscription.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <InputField label="Prénom (optionnel)" icon={User} placeholder="Votre prénom"
        error={errors.name?.message} registration={register('name')} autoComplete="name" />
      <InputField label="Email" icon={Mail} type="email" placeholder="vous@exemple.com"
        error={errors.email?.message} registration={register('email')} autoComplete="email" />
      <InputField label="Mot de passe" icon={Lock} type="password" placeholder="Minimum 8 caractères"
        error={errors.password?.message} registration={register('password')} autoComplete="new-password" />

      <AnimatePresence>
        {serverError && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
            <span className="text-rose-400 text-sm">{serverError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileTap={{ scale: 0.98 }}
        className="relative mt-1 bg-gradient-to-r from-violet to-violet-light text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60 btn-glow flex items-center justify-center gap-2 shadow-lg shadow-violet/25"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Création…
          </span>
        ) : (
          <span className="flex items-center gap-2">Créer mon compte <ArrowRight size={16} /></span>
        )}
      </motion.button>

      <p className="text-center text-cream/40 text-sm">
        Déjà un compte ?{' '}
        <button type="button" onClick={onSwitch} className="text-violet-light hover:text-violet font-medium transition-colors">
          Se connecter
        </button>
      </p>
    </form>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="min-h-screen bg-navy-deep flex overflow-hidden font-sans">
      {/* Ambient */}
      <div className="ambient-bg" />

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative p-12 overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet/20 via-navy-deep to-navy-deep" />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 40%, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-violet/10 blur-3xl pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, 15, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/3 left-1/4 w-48 h-48 rounded-full bg-violet-light/10 blur-3xl pointer-events-none"
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet to-violet-light flex items-center justify-center shadow-xl shadow-violet/40">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-cream font-display font-semibold text-xl">SoulEcho</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <h1 className="font-display text-5xl font-bold text-cream leading-tight mb-6">
              Une oreille<br />
              <span className="gradient-text italic">attentive</span>,<br />
              toujours là.
            </h1>
            <p className="text-cream/50 text-lg leading-relaxed max-w-sm">
              Parlez librement, sans jugement. SoulEcho vous accompagne dans vos moments difficiles comme dans vos victoires.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex flex-wrap gap-2 mt-8"
          >
            {['🎙 Appels vocaux', '📊 Suivi émotionnel', '🔒 100% privé', '🌍 Multilingue'].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-medium text-cream/60 border border-white/8"
                style={{ background: 'rgba(26,45,66,0.5)' }}>
                {f}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Bottom quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 text-cream/25 text-sm italic"
        >
          "Prendre soin de soi n'est pas un luxe, c'est une nécessité."
        </motion.p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-violet-light flex items-center justify-center shadow-lg shadow-violet/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-cream font-display font-semibold text-xl">SoulEcho</span>
          </div>

          {/* Card */}
          <div className="glass rounded-3xl p-8 shadow-2xl shadow-black/40">
            {/* Header */}
            <div className="mb-7">
              <h2 className="text-cream font-display text-2xl font-semibold mb-1">
                {mode === 'login' ? 'Bon retour 👋' : 'Commençons 🌱'}
              </h2>
              <p className="text-cream/40 text-sm">
                {mode === 'login' ? 'Connectez-vous à votre espace' : 'Créez votre compte gratuitement'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(8,17,26,0.6)' }}>
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === m
                      ? 'bg-gradient-to-r from-violet to-violet-light text-white shadow-md shadow-violet/30'
                      : 'text-cream/40 hover:text-cream/70'
                  }`}
                >
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, x: mode === 'login' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === 'login' ? 10 : -10 }}
                transition={{ duration: 0.2 }}
              >
                {mode === 'login'
                  ? <LoginForm onSwitch={() => setMode('register')} />
                  : <RegisterForm onSwitch={() => setMode('login')} />
                }
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="text-center text-cream/20 text-xs mt-6">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
